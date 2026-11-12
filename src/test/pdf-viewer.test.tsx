import * as React from 'react'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PDFViewer } from '@/components/ui/pdf-viewer'
const mocks = vi.hoisted(() => ({
  tasks: [] as {
    promise: Promise<never>
    destroy: ReturnType<typeof vi.fn>
    onPassword?: (update: (password: string) => void, reason: number) => void
  }[],
  load: vi.fn(),
  layers: [] as any[],
}))
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  PasswordResponses: { INCORRECT_PASSWORD: 2 },
  getDocument: mocks.load,
  TextLayer: class {
    constructor(options: unknown) {
      mocks.layers.push(options)
    }
    render() {
      return Promise.resolve()
    }
    cancel() {}
  },
}))
beforeEach(() => {
  mocks.tasks.length = 0
  mocks.layers.length = 0
  mocks.load.mockReset()
  mocks.load.mockImplementation(() => {
    const task = { promise: new Promise<never>(() => {}), destroy: vi.fn(async () => {}) }
    mocks.tasks.push(task)
    return task
  })
})
afterEach(() => vi.restoreAllMocks())
function mockPage(rotate = 0) {
  return {
    rotate,
    getViewport: vi.fn(({ scale, rotation }: { scale: number; rotation: number }) => ({
      width: 600 * scale,
      height: 800 * scale,
      scale,
      userUnit: 1,
      rotation,
    })),
    getTextContent: vi.fn(async () => ({ items: [{ str: 'PDF sample text' }] })),
    render: vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() })),
  }
}
function mockDocument(getPage: (page: number) => Promise<ReturnType<typeof mockPage>>) {
  const document = { numPages: 2, fingerprints: ['sample'], getPage: vi.fn(getPage) }
  mocks.load.mockImplementation(() => ({
    promise: Promise.resolve(document),
    destroy: vi.fn(async () => {}),
  }))
  return document
}
describe('PDF viewer integration boundary', () => {
  it('searches adjacent fragments of a word without adding artificial spaces', async () => {
    const page = mockPage()
    page.getTextContent.mockResolvedValue({
      items: [{ str: 'Jo' }, { str: 'hns' }, { str: ' ' }, { str: 'report' }],
    })
    mockDocument(async () => page)
    render(<PDFViewer source="/document.pdf" workerSrc="/worker.mjs" />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next PDF page' })).toBeEnabled())
    fireEvent.change(screen.getByLabelText('Search PDF text'), { target: { value: 'Johns' } })
    expect(await screen.findByRole('button', { name: /Page 1.*match/ })).toHaveTextContent(
      'Johns report',
    )
  })

  it('loads and downloads application-owned blob URLs without revoking them', async () => {
    mockDocument(async () => mockPage())
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {}),
      revoke = vi.spyOn(URL, 'revokeObjectURL')
    const view = render(
      <PDFViewer source="blob:https://ergon.test/document" workerSrc="/worker.mjs" />,
    )
    await waitFor(() =>
      expect(mocks.load).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'blob:https://ergon.test/document' }),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }))
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    view.unmount()
    expect(revoke).not.toHaveBeenCalled()
  })

  it('rejects credential headers over HTTP before passing them to PDF.js', async () => {
    const view = render(
      <PDFViewer
        source="http://example.test/document.pdf"
        workerSrc="/worker.mjs"
        documentOptions={{ httpHeaders: { Authorization: 'test-only' } }}
      />,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('require an HTTPS source')
    expect(mocks.load).not.toHaveBeenCalled()
    view.rerender(
      <PDFViewer
        source="https://example.test/document.pdf"
        workerSrc="/worker.mjs"
        documentOptions={{ httpHeaders: { Authorization: 'test-only' } }}
      />,
    )
    await waitFor(() =>
      expect(mocks.load).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://example.test/document.pdf' }),
      ),
    )
  })
  it('does not reload equivalent inline options but reloads changed contents', async () => {
    const page = mockPage()
    mockDocument(async () => page)
    function Harness() {
      const [loaded, setLoaded] = React.useState(0),
        [url, setURL] = React.useState('/cmaps/')
      return (
        <>
          <button onClick={() => setURL('/other/')}>Change resources</button>
          <output>{loaded}</output>
          <PDFViewer
            source="/document.pdf"
            workerSrc="/worker.mjs"
            documentOptions={{ cMapUrl: url, disableFontFace: true }}
            onDocumentLoad={() => setLoaded((n) => n + 1)}
          />
        </>
      )
    }
    render(<Harness />)
    await waitFor(() => expect(screen.getByText('1', { selector: 'output' })).toBeInTheDocument())
    expect(mocks.load).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Change resources' }))
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2))
    expect(mocks.load.mock.lastCall![0].cMapUrl).toBe('/other/')
  })

  it('does not create a stale text layer after a page change during text extraction', async () => {
    let finish!: (value: { items: { str: string }[] }) => void
    const pending = new Promise<{ items: { str: string }[] }>((resolve) => {
      finish = resolve
    })
    const first = mockPage(),
      second = mockPage()
    first.getTextContent.mockImplementation(() => pending)
    mockDocument(async (number) => (number === 1 ? first : second))
    const view = render(<PDFViewer source="/document.pdf" workerSrc="/worker.mjs" page={1} />)
    await waitFor(() => expect(first.getTextContent).toHaveBeenCalled())
    view.rerender(<PDFViewer source="/document.pdf" workerSrc="/worker.mjs" page={2} />)
    await waitFor(() => expect(mocks.layers).toHaveLength(1))
    await act(async () => finish({ items: [{ str: 'obsolete page' }] }))
    expect(mocks.layers).toHaveLength(1)
    expect(mocks.layers[0].textContentSource.items[0].str).toBe('PDF sample text')
  })

  it('adds viewer rotation to intrinsic page rotation for render and fit width', async () => {
    const user = userEvent.setup(),
      page = mockPage(90)
    mockDocument(async () => page)
    render(<PDFViewer source="/document.pdf" workerSrc="/worker.mjs" />)
    await waitFor(() => expect(page.getViewport).toHaveBeenCalledWith({ scale: 1, rotation: 90 }))
    await user.click(screen.getByRole('button', { name: 'Rotate PDF clockwise' }))
    await waitFor(() => expect(page.getViewport).toHaveBeenCalledWith({ scale: 1, rotation: 180 }))
    const beforeFit = page.getViewport.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Fit PDF width' }))
    await waitFor(() => expect(page.getViewport.mock.calls.length).toBeGreaterThan(beforeFit))
    expect(page.getViewport.mock.calls.slice(beforeFit)).toContainEqual([
      { scale: 1, rotation: 180 },
    ])
  })

  it('shows a search failure without replacing the loaded document', async () => {
    const page = mockPage()
    page.getTextContent.mockRejectedValue(new Error('Search unavailable'))
    mockDocument(async () => page)
    render(<PDFViewer source="/document.pdf" workerSrc="/worker.mjs" textLayer={false} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next PDF page' })).toBeEnabled())
    fireEvent.change(screen.getByLabelText('Search PDF text'), { target: { value: 'sample' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Search unavailable')
    expect(screen.getByRole('button', { name: 'Next PDF page' })).toBeEnabled()
    expect(screen.getByRole('img', { name: 'Rendered PDF page 1' })).toBeInTheDocument()
  })
  it('submits password attempts, reports rejected passwords and destroys an abandoned loading task', async () => {
    const user = userEvent.setup(),
      view = render(<PDFViewer source="/protected.pdf" workerSrc="/worker.mjs" />)
    await waitFor(() => expect(mocks.tasks).toHaveLength(1))
    const update = vi.fn()
    act(() => mocks.tasks[0].onPassword!(update, 1))
    await user.type(screen.getByLabelText('PDF password'), 'first attempt')
    await user.click(screen.getByRole('button', { name: 'Unlock PDF' }))
    expect(update).toHaveBeenCalledWith('first attempt')
    act(() => mocks.tasks[0].onPassword!(update, 2))
    expect(screen.getByRole('alert')).toHaveTextContent('Incorrect password')
    expect(screen.getByLabelText('PDF password')).toHaveValue('')
    await user.type(screen.getByLabelText('PDF password'), 'second attempt')
    await user.click(screen.getByRole('button', { name: 'Unlock PDF' }))
    expect(update).toHaveBeenLastCalledWith('second attempt')
    view.unmount()
    expect(mocks.tasks[0].destroy).toHaveBeenCalledTimes(1)
  })
  it('copies byte sources before passing them to the PDF worker transfer boundary', async () => {
    const source = new Uint8Array([37, 80, 68, 70]),
      view = render(<PDFViewer source={source} workerSrc="/worker.mjs" />)
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1))
    const options = mocks.load.mock.calls[0][0]
    expect(options.data).not.toBe(source)
    expect([...options.data]).toEqual([...source])
    view.unmount()
  })
})
