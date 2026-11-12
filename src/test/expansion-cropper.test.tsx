import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cropImage, ImageCropper } from '@/components/ui/image-cropper'
vi.mock('react-easy-crop', () => ({
  default: ({ onCropAreaChange, onMediaLoaded }: any) => (
    <button
      type="button"
      onClick={() => {
        onMediaLoaded({ naturalWidth: 1000, naturalHeight: 600 })
        onCropAreaChange({}, { x: 0, y: 0, width: 600, height: 600 })
      }}
    >
      Set crop area
    </button>
  ),
}))
const state = vi.hoisted(() => ({
  width: 1000,
  height: 600,
  load: true,
  context: {
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    clip: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    fillStyle: '',
  },
  canvases: [] as HTMLCanvasElement[],
  create: vi.fn(() => 'blob:local-image'),
  revoke: vi.fn(),
}))
beforeEach(() => {
  state.width = 1000
  state.height = 600
  state.load = true
  state.canvases = []
  vi.clearAllMocks()
  const OriginalURL = URL
  vi.stubGlobal(
    'URL',
    class extends OriginalURL {
      static createObjectURL = state.create
      static revokeObjectURL = state.revoke
    },
  )
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = state.width
      naturalHeight = state.height
      crossOrigin = ''
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        if (state.load) queueMicrotask(() => this.onload?.())
      }
    },
  )
  const create = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(((
    tag: string,
    options?: ElementCreationOptions,
  ) => {
    const element = create(tag, options)
    if (tag === 'canvas') {
      const canvas = element as HTMLCanvasElement
      state.canvases.push(canvas)
      canvas.getContext = vi.fn(() => state.context) as any
      canvas.toBlob = vi.fn((callback: BlobCallback, type?: string) =>
        callback(new Blob(['cropped'], { type })),
      ) as any
    }
    return element
  }) as typeof document.createElement)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
describe('image cropper export/upload', () => {
  it('rotates into a bounded output canvas without a full-size intermediate', async () => {
    const blob = await cropImage(
      '/photo.png',
      { x: 0, y: 0, width: 600, height: 1000 },
      { rotation: 90, maxSize: 300, type: 'image/webp' },
    )
    expect(blob.type).toBe('image/webp')
    expect(state.canvases).toHaveLength(1)
    expect(state.canvases[0].width).toBe(180)
    expect(state.canvases[0].height).toBe(300)
    expect(state.context.scale).toHaveBeenCalledWith(0.3, 0.3)
    expect(state.context.rotate).toHaveBeenCalledWith(Math.PI / 2)
    expect(state.context.drawImage).toHaveBeenCalledWith(expect.any(Object), -500, -300)
  })
  it('caps total pixels and clips circular output', async () => {
    state.width = 10000
    state.height = 10000
    await cropImage(
      '/large.png',
      { x: 0, y: 0, width: 10000, height: 10000 },
      { maxSize: 8192, circle: true },
    )
    expect(state.canvases[0].width * state.canvases[0].height).toBeLessThanOrEqual(16000000)
    expect(state.context.ellipse).toHaveBeenCalled()
    expect(state.context.clip).toHaveBeenCalled()
  })
  it('rejects invalid/outside areas and an already aborted export', async () => {
    await expect(cropImage('/photo.png', { x: 0, y: 0, width: NaN, height: 10 })).rejects.toThrow(
      'valid crop',
    )
    await expect(cropImage('/photo.png', { x: 0, y: 0, width: 2000, height: 100 })).rejects.toThrow(
      'outside',
    )
    const controller = new AbortController()
    controller.abort()
    await expect(
      cropImage(
        '/photo.png',
        { x: 0, y: 0, width: 100, height: 100 },
        { signal: controller.signal },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
  it('cancels image loading and releases source object URLs', async () => {
    state.load = false
    const controller = new AbortController(),
      promise = cropImage(
        new Blob(['source'], { type: 'image/png' }),
        { x: 0, y: 0, width: 100, height: 100 },
        { signal: controller.signal },
      )
    controller.abort()
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    expect(state.revoke).toHaveBeenCalledWith('blob:local-image')
  })
  it('passes a real Blob and signal to a custom uploader and displays its URL', async () => {
    const user = userEvent.setup(),
      upload = vi.fn(async () => 'https://storage.example.test/cropped.png'),
      complete = vi.fn()
    render(<ImageCropper defaultImage="/photo.png" onImageUpload={upload} onUploaded={complete} />)
    await user.click(screen.getByRole('button', { name: 'Set crop area' }))
    await user.click(screen.getByRole('button', { name: 'Crop and upload' }))
    await waitFor(() =>
      expect(upload).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.objectContaining({
          area: { x: 0, y: 0, width: 600, height: 600 },
          signal: expect.any(AbortSignal),
        }),
      ),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'https://storage.example.test/cropped.png',
    )
    expect(complete).toHaveBeenCalledWith('https://storage.example.test/cropped.png')
  })
  it('rejects unsafe URLs and permits retry after an upload failure', async () => {
    const user = userEvent.setup()
    render(<ImageCropper defaultImage="/photo.png" onImageUpload={() => 'javascript:alert(1)'} />)
    await user.click(screen.getByRole('button', { name: 'Set crop area' }))
    await user.click(screen.getByRole('button', { name: 'Crop and upload' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('browser-displayable')
    expect(screen.getByRole('button', { name: 'Crop and upload' })).toBeEnabled()
  })
  it('aborts a pending upload on unmount and rejects non-image files', async () => {
    const user = userEvent.setup()
    let signal: AbortSignal | undefined
    const { unmount } = render(
      <ImageCropper
        defaultImage="/photo.png"
        onImageUpload={(_blob, details) => {
          signal = details.signal
          return new Promise(() => {})
        }}
      />,
    )
    fireEvent.change(screen.getByLabelText('Choose image file'), {
      target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('image file')
    await user.click(screen.getByRole('button', { name: 'Set crop area' }))
    await user.click(screen.getByRole('button', { name: 'Crop and upload' }))
    await waitFor(() => expect(signal).toBeDefined())
    unmount()
    expect(signal?.aborted).toBe(true)
  })
})
