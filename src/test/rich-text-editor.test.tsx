import * as React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RichTextEditor,
  type Editor,
  type RichTextEditorProps,
  type ImageUploadOptions,
} from '@/components/ui/rich-text-editor'
beforeAll(() => {
  Range.prototype.getBoundingClientRect = () => new DOMRect()
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList
})
const image = () => new File(['image contents'], 'photo.png', { type: 'image/png' })
async function mount(props: RichTextEditorProps = {}) {
  let instance: Editor | null = null
  const view = render(
    <RichTextEditor
      defaultValue="<p>Before</p><p>After</p>"
      {...props}
      onReady={(editor) => {
        instance = editor
      }}
    />,
  )
  await waitFor(() => expect(instance).not.toBeNull())
  return {
    ...view,
    editor: instance! as Editor,
    input: screen.getByLabelText('Upload editor images'),
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
describe('rich text image workflow', () => {
  it('continues its queue when a cancelled storage handler ignores abort', async () => {
    const pending = deferred<string>(),
      upload = vi
        .fn()
        .mockImplementationOnce(() => pending.promise)
        .mockResolvedValue('https://storage.example/next.png'),
      { editor, input } = await mount({ onImageUpload: upload })
    await userEvent.upload(input, [image(), new File(['next'], 'next.png', { type: 'image/png' })])
    await waitFor(() => expect(upload).toHaveBeenCalledOnce())
    await userEvent.click(screen.getByRole('button', { name: 'Cancel upload photo.png' }))
    await waitFor(() => expect(editor.getHTML()).toContain('next.png'))
    expect(upload).toHaveBeenCalledTimes(2)
    await act(async () => {
      pending.resolve('https://storage.example/late.png')
      await pending.promise
    })
    expect(editor.getHTML()).not.toContain('late.png')
  })
  it('inserts an uploaded URL between paragraphs and maps its position while the user edits', async () => {
    const pending = deferred<string>(),
      upload = vi.fn(() => pending.promise),
      change = vi.fn()
    const { editor, input } = await mount({ onImageUpload: upload, onContentChange: change })
    act(() => {
      editor.commands.setTextSelection(7)
    })
    await userEvent.upload(input, image())
    await waitFor(() => expect(upload).toHaveBeenCalledOnce())
    act(() => {
      editor.commands.insertContentAt(1, 'New ')
    })
    await act(async () => {
      pending.resolve('https://storage.example/photo.png')
      await pending.promise
    })
    await waitFor(() => expect(editor.getHTML()).toContain('https://storage.example/photo.png'))
    expect(editor.getJSON().content?.map((node) => node.type)).toEqual([
      'paragraph',
      'image',
      'paragraph',
    ])
    expect(editor.state.doc.child(0).textContent).toBe('New Before')
    expect(editor.state.doc.child(2).textContent).toBe('After')
    expect(change.mock.lastCall?.[0].html).toContain('<img')
    expect(screen.getByText('Image inserted')).toBeInTheDocument()
  })
  it('keeps a multi-file selection in its original order', async () => {
    const upload = vi.fn(async (file: File) => `https://storage.example/${file.name}`),
      { editor, input } = await mount({ onImageUpload: upload })
    act(() => {
      editor.commands.setTextSelection(7)
    })
    await userEvent.upload(input, [
      image(),
      new File(['second'], 'second.png', { type: 'image/png' }),
    ])
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(editor.getJSON().content?.filter((node) => node.type === 'image')).toHaveLength(2),
    )
    expect(
      editor
        .getJSON()
        .content?.filter((node) => node.type === 'image')
        .map((node) => node.attrs?.src),
    ).toEqual(['https://storage.example/photo.png', 'https://storage.example/second.png'])
  })
  it('reports progress and aborts without inserting a late response', async () => {
    const pending = deferred<string>()
    let options: ImageUploadOptions | undefined
    const { editor, input } = await mount({
      onImageUpload: async (_file, next) => {
        options = next
        next.onProgress(42)
        return pending.promise
      },
    })
    await userEvent.upload(input, image())
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('value', '42'))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel upload photo.png' }))
    expect(options?.signal.aborted).toBe(true)
    await act(async () => {
      pending.resolve('https://storage.example/late.png')
      await pending.promise
    })
    expect(editor.getHTML()).not.toContain('<img')
    expect(screen.getByText('Upload cancelled')).toBeInTheDocument()
  })
  it('shows a failed upload and allows retry at the current selection', async () => {
    const upload = vi
        .fn()
        .mockRejectedValueOnce(new Error('Storage unavailable'))
        .mockResolvedValueOnce({ src: 'https://storage.example/retried.png', alt: 'A photograph' }),
      { editor, input } = await mount({ onImageUpload: upload })
    await userEvent.upload(input, image())
    expect(await screen.findByRole('alert')).toHaveTextContent('Storage unavailable')
    await userEvent.click(screen.getByRole('button', { name: 'Retry upload photo.png' }))
    await waitFor(() => expect(editor.getHTML()).toContain('retried.png'))
    expect(editor.getHTML()).toContain('alt="A photograph"')
    expect(upload).toHaveBeenCalledTimes(2)
  })
  it('rejects invalid types, oversized files and too many files before calling storage', async () => {
    const upload = vi.fn(),
      { input } = await mount({ onImageUpload: upload, maxImageSize: 2, maxFiles: 1 })
    await userEvent
      .setup({ applyAccept: false })
      .upload(input, new File(['bad'], 'note.txt', { type: 'text/plain' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('supported image format')
    await userEvent.upload(input, image())
    expect(await screen.findByText(/Image must be smaller/)).toBeInTheDocument()
    await userEvent.upload(input, [image(), image()])
    expect(await screen.findByText('Choose up to 1 images at a time.')).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })
  it('does not accept an unsafe upload URL', async () => {
    const { editor, input } = await mount({
      onImageUpload: async () => ({ src: 'javascript:alert(1)' }),
    })
    await userEvent.upload(input, image())
    expect(await screen.findByRole('alert')).toHaveTextContent('supported image URL')
    expect(editor.getHTML()).not.toContain('<img')
  })
  it('cancels pending uploads when controlled content is replaced', async () => {
    const pending = deferred<string>(),
      upload = vi.fn((_file: File, { signal }: ImageUploadOptions) => {
        expect(signal.aborted).toBe(false)
        return pending.promise
      }),
      { editor, input, rerender } = await mount({ value: '<p>Original</p>', onImageUpload: upload })
    await userEvent.upload(input, image())
    await waitFor(() => expect(upload).toHaveBeenCalledOnce())
    rerender(<RichTextEditor value="<p>Replacement</p>" onImageUpload={upload} />)
    await waitFor(() => expect(editor.getText()).toBe('Replacement'))
    expect(upload.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => {
      pending.resolve('https://storage.example/stale.png')
      await pending.promise
    })
    expect(editor.getHTML()).toBe('<p>Replacement</p>')
  })
  it('aborts the injected request on unmount', async () => {
    const pending = deferred<string>(),
      upload = vi.fn((_file: File, _options: ImageUploadOptions) => pending.promise),
      inserted = vi.fn(),
      { input, unmount } = await mount({ onImageUpload: upload, onImageUploaded: inserted })
    await userEvent.upload(input, image())
    await waitFor(() => expect(upload).toHaveBeenCalledOnce())
    unmount()
    expect(upload.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => {
      pending.resolve('https://storage.example/stale.png')
      await pending.promise
    })
    expect(inserted).not.toHaveBeenCalled()
  })
  it('routes pasted and dropped files through the same application callback', async () => {
    const upload = vi.fn(async (file: File) => `https://storage.example/${file.name}`),
      { input, editor } = await mount({ onImageUpload: upload })
    const textbox = screen.getByRole('textbox', { name: 'Rich text editor' })
    fireEvent.paste(textbox, { clipboardData: { files: [image()], getData: () => '' } })
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(1))
    vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos: 1, inside: -1 })
    fireEvent.drop(textbox, {
      dataTransfer: {
        files: [new File(['drop'], 'drop.png', { type: 'image/png' })],
        getData: () => '',
        types: ['Files'],
      },
      clientX: 1,
      clientY: 1,
    })
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2))
    expect((input as HTMLInputElement).accept).toContain('image/png')
  })
  it('preserves a read-only document and strips unsupported active HTML on import', async () => {
    const upload = vi.fn(),
      { editor, input } = await mount({
        readOnly: true,
        onImageUpload: upload,
        defaultValue: '<p>Safe<script>alert(1)</script></p><img src="javascript:alert(1)">',
      })
    expect(editor.isEditable).toBe(false)
    expect(input).toBeDisabled()
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument()
    expect(editor.getHTML()).not.toContain('<script')
    expect(editor.getHTML()).not.toContain('javascript:')
    await userEvent.upload(input, image())
    expect(upload).not.toHaveBeenCalled()
  })
  it('supports toolbar formatting, undo and redo', async () => {
    const { editor } = await mount()
    act(() => {
      editor.commands.setTextSelection({ from: 1, to: 7 })
    })
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }))
    expect(editor.getHTML()).toContain('<strong>Before</strong>')
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(editor.getHTML()).not.toContain('<strong>')
    await userEvent.click(screen.getByRole('button', { name: 'Redo' }))
    expect(editor.getHTML()).toContain('<strong>Before</strong>')
  })
})
