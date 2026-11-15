import * as React from 'react'
import Cropper from 'react-easy-crop'
import { ImagePlus, RotateCcw, Upload, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'

export interface ImageCropArea {
  x: number
  y: number
  width: number
  height: number
}
export interface ImageCropPoint {
  x: number
  y: number
}
export interface ImageCropExport {
  area: ImageCropArea
  rotation: number
  type: 'image/png' | 'image/jpeg' | 'image/webp'
  signal: AbortSignal
}
export interface ImageCropperHandle {
  getBlob: () => Promise<Blob>
}
export interface ImageCropperProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'ref'
> {
  image?: string | Blob
  defaultImage?: string | Blob
  onImageChange?: (image: string | Blob) => void
  crop?: ImageCropPoint
  defaultCrop?: ImageCropPoint
  onCropChange?: (crop: ImageCropPoint) => void
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (zoom: number) => void
  rotation?: number
  defaultRotation?: number
  onRotationChange?: (rotation: number) => void
  aspect?: number | 'original'
  defaultAspect?: number | 'original'
  onAspectChange?: (aspect: number | 'original') => void
  shape?: 'rectangle' | 'circle'
  showGrid?: boolean
  disabled?: boolean
  label?: string
  maxZoom?: number
  maxFileSize?: number
  maxOutputSize?: number
  outputType?: ImageCropExport['type']
  quality?: number
  onAreaChange?: (area: ImageCropArea) => void
  onExport?: (image: Blob, details: ImageCropExport) => void | Promise<void>
  onImageUpload?: (image: Blob, details: ImageCropExport) => string | Promise<string>
  onUploaded?: (url: string) => void
  ref?: React.Ref<ImageCropperHandle>
}
/** Exports rotated image coordinates directly into a bounded canvas, avoiding a full-size intermediate bitmap. */
export async function cropImage(
  source: string | Blob,
  area: ImageCropArea,
  {
    rotation = 0,
    type = 'image/png',
    quality = 0.92,
    maxSize = 4096,
    circle = false,
    signal,
  }: {
    rotation?: number
    type?: ImageCropExport['type']
    quality?: number
    maxSize?: number
    circle?: boolean
    signal?: AbortSignal
  } = {},
): Promise<Blob> {
  if (
    !Object.values(area).every(Number.isFinite) ||
    area.width <= 0 ||
    area.height <= 0 ||
    area.x < 0 ||
    area.y < 0 ||
    !Number.isFinite(rotation)
  )
    throw new Error('Choose a valid crop area.')
  signal?.throwIfAborted()
  const temporary = source instanceof Blob,
    src = temporary ? URL.createObjectURL(source) : source,
    image = new Image()
  image.crossOrigin = 'anonymous'
  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
          image.onload = null
          image.onerror = null
          signal?.removeEventListener('abort', abort)
        },
        abort = () => {
          cleanup()
          image.src = ''
          reject(new DOMException('Cancelled', 'AbortError'))
        }
      image.onload = () => {
        cleanup()
        resolve()
      }
      image.onerror = () => {
        cleanup()
        reject(new Error('Could not load the image. Remote images must allow cross-origin access.'))
      }
      signal?.addEventListener('abort', abort, { once: true })
      image.src = src
    })
    signal?.throwIfAborted()
    const radians = (rotation * Math.PI) / 180,
      bounds = {
        width:
          Math.abs(Math.cos(radians)) * image.naturalWidth +
          Math.abs(Math.sin(radians)) * image.naturalHeight,
        height:
          Math.abs(Math.sin(radians)) * image.naturalWidth +
          Math.abs(Math.cos(radians)) * image.naturalHeight,
      }
    if (area.x + area.width > bounds.width + 2 || area.y + area.height > bounds.height + 2)
      throw new Error('The crop area falls outside the image.')
    const limit = Number.isFinite(maxSize) ? Math.max(1, Math.min(8192, maxSize)) : 4096,
      scale = Math.min(
        1,
        limit / area.width,
        limit / area.height,
        Math.sqrt(16000000 / (area.width * area.height)),
      ),
      canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(area.width * scale))
    canvas.height = Math.max(1, Math.round(area.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas export is not available.')
    if (type === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    if (circle) {
      context.beginPath()
      context.ellipse(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        canvas.height / 2,
        0,
        0,
        Math.PI * 2,
      )
      context.clip()
    }
    context.scale(canvas.width / area.width, canvas.height / area.height)
    context.translate(-area.x, -area.y)
    context.translate(bounds.width / 2, bounds.height / 2)
    context.rotate(radians)
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
    const blob = await new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob(
          (result) =>
            result ? resolve(result) : reject(new Error('Could not export this image.')),
          type,
          Number.isFinite(quality) ? Math.min(1, Math.max(0, quality)) : 0.92,
        )
      } catch {
        reject(new Error('Export blocked. Remote images must allow cross-origin canvas access.'))
      }
    })
    signal?.throwIfAborted()
    return blob
  } finally {
    if (temporary) URL.revokeObjectURL(src)
  }
}
interface CropContext {
  src: string
  crop: ImageCropPoint
  setCrop: (point: ImageCropPoint) => void
  zoom: number
  setZoom: (zoom: number) => void
  rotation: number
  setRotation: (rotation: number) => void
  aspect: number | 'original'
  setAspect: (aspect: number | 'original') => void
  naturalAspect: number
  setNaturalAspect: (aspect: number) => void
  shape: 'rectangle' | 'circle'
  showGrid: boolean
  disabled: boolean
  maxZoom: number
  setArea: (area: ImageCropArea) => void
  setError: (error: string) => void
  exportImage: () => void
  busy: boolean
  ready: boolean
  choose: (file: File) => void
  preview: string
  uploadUrl: string
  reset: () => void
  canUpload: boolean
}
const Context = React.createContext<CropContext | null>(null)
function useCrop() {
  const c = React.useContext(Context)
  if (!c) throw new Error('Image cropper parts need ImageCropper.')
  return c
}
/** Composes an image editor with Blob export and an application-provided upload callback. No server is assumed. */
export function ImageCropper({
  image,
  defaultImage,
  onImageChange,
  crop,
  defaultCrop = { x: 0, y: 0 },
  onCropChange,
  zoom,
  defaultZoom = 1,
  onZoomChange,
  rotation,
  defaultRotation = 0,
  onRotationChange,
  aspect,
  defaultAspect = 4 / 3,
  onAspectChange,
  shape = 'rectangle',
  showGrid = true,
  disabled = false,
  label = 'Image cropper',
  maxZoom = 5,
  maxFileSize = 20 * 1024 * 1024,
  maxOutputSize = 4096,
  outputType = 'image/png',
  quality = 0.92,
  onAreaChange,
  onExport,
  onImageUpload,
  onUploaded,
  ref,
  className,
  children,
  ...props
}: ImageCropperProps) {
  const [source, setSource] = useControllableState({
      value: image,
      defaultValue: defaultImage ?? '',
      onChange: onImageChange,
    }),
    [position, setCrop] = useControllableState({
      value: crop,
      defaultValue: defaultCrop,
      onChange: onCropChange,
    }),
    [scale, setZoom] = useControllableState({
      value: zoom,
      defaultValue: defaultZoom,
      onChange: onZoomChange,
    }),
    [angle, setRotation] = useControllableState({
      value: rotation,
      defaultValue: defaultRotation,
      onChange: onRotationChange,
    }),
    [ratio, setAspect] = useControllableState({
      value: aspect,
      defaultValue: defaultAspect,
      onChange: onAspectChange,
    })
  const [src, setSrc] = React.useState(''),
    [area, setArea] = React.useState<ImageCropArea | null>(null),
    [naturalAspect, setNaturalAspect] = React.useState(1),
    [error, setError] = React.useState(''),
    [busy, setBusy] = React.useState(false),
    [exported, setExported] = React.useState<Blob | null>(null),
    [preview, setPreview] = React.useState(''),
    [uploadUrl, setUploadUrl] = React.useState(''),
    request = React.useRef<AbortController | null>(null)
  React.useEffect(() => {
    const url = source instanceof Blob ? URL.createObjectURL(source) : (source ?? '')
    setSrc(url)
    setArea(null)
    setError('')
    setExported(null)
    setUploadUrl('')
    setBusy(false)
    request.current?.abort()
    return () => {
      if (source instanceof Blob) URL.revokeObjectURL(url)
      request.current?.abort()
    }
  }, [source])
  React.useEffect(() => {
    if (!exported) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(exported)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [exported])
  const effectiveZoom = Number.isFinite(scale)
      ? Math.min(
          Number.isFinite(maxZoom) ? Math.max(1, Math.min(20, maxZoom)) : 5,
          Math.max(1, scale),
        )
      : 1,
    effectiveAngle = Number.isFinite(angle) ? ((angle % 360) + 360) % 360 : 0
  const getBlob = async (signal?: AbortSignal) => {
    if (!src || !area) throw new Error('Choose an image and crop area first.')
    return cropImage(src, area, {
      rotation: effectiveAngle,
      type: outputType,
      quality,
      maxSize: maxOutputSize,
      circle: shape === 'circle',
      signal,
    })
  }
  React.useImperativeHandle(ref, () => ({ getBlob: () => getBlob() }))
  const exportImage = async () => {
    if (disabled || busy || !area) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    try {
      const blob = await getBlob(controller.signal),
        details = { area, rotation: effectiveAngle, type: outputType, signal: controller.signal }
      await onExport?.(blob, details)
      if (controller.signal.aborted) return
      setExported(blob)
      if (onImageUpload) {
        const url = await onImageUpload(blob, details)
        if (typeof url !== 'string' || !url.trim())
          throw new Error('The upload callback must return an image URL.')
        controller.signal.throwIfAborted()
        const parsed = new URL(url, window.location.href)
        if (!['http:', 'https:', 'blob:'].includes(parsed.protocol))
          throw new Error('The upload callback must return a browser-displayable image URL.')
        setUploadUrl(url)
        onUploaded?.(url)
      }
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  const choose = (file: File) => {
    if (disabled || busy) return
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }
    if (file.size > (Number.isFinite(maxFileSize) ? Math.max(1, maxFileSize) : 20 * 1024 * 1024)) {
      setError('This image exceeds the configured file-size limit.')
      return
    }
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setSource(file)
  }
  return (
    <Context.Provider
      value={{
        src,
        crop: position,
        setCrop,
        zoom: effectiveZoom,
        setZoom,
        rotation: effectiveAngle,
        setRotation,
        aspect: ratio,
        setAspect,
        naturalAspect,
        setNaturalAspect,
        shape,
        showGrid,
        disabled: disabled || busy,
        maxZoom: Number.isFinite(maxZoom) ? Math.max(1, Math.min(20, maxZoom)) : 5,
        setArea: (next) => {
          setArea(next)
          onAreaChange?.(next)
        },
        setError,
        exportImage: () => void exportImage(),
        busy,
        ready: !!area,
        choose,
        preview,
        uploadUrl,
        reset: () => {
          setCrop({ x: 0, y: 0 })
          setZoom(1)
          setRotation(0)
        },
        canUpload: !!onImageUpload,
      }}
    >
      <section
        {...props}
        aria-label={label}
        data-slot="image-cropper"
        aria-busy={busy}
        className={cn('w-full min-w-0 space-y-4', className)}
      >
        {children ?? (
          <>
            <ImageCropperViewport />
            <ImageCropperControls />
            <ImageCropperPreview />
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
/** Displays the actual pointer/touch/keyboard crop surface and handles unavailable remote images. */
export function ImageCropperViewport({ className, ...props }: React.ComponentProps<'div'>) {
  const c = useCrop()
  return (
    <div
      {...props}
      aria-label="Crop image; use arrow keys to reposition"
      role="group"
      inert={c.disabled || undefined}
      className={cn(
        'relative h-80 overflow-hidden rounded-xl border bg-muted',
        c.disabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {c.src ? (
        <Cropper
          key={c.src}
          image={c.src}
          crop={c.crop}
          zoom={c.zoom}
          rotation={c.rotation}
          aspect={
            c.shape === 'circle'
              ? 1
              : c.aspect === 'original'
                ? c.naturalAspect
                : Number.isFinite(c.aspect) && c.aspect > 0
                  ? c.aspect
                  : 4 / 3
          }
          cropShape={c.shape === 'circle' ? 'round' : 'rect'}
          showGrid={c.showGrid}
          maxZoom={c.maxZoom}
          onCropChange={c.setCrop}
          onZoomChange={c.setZoom}
          onRotationChange={c.setRotation}
          onCropAreaChange={(_, pixels) => c.setArea(pixels)}
          onMediaLoaded={(media) => c.setNaturalAspect(media.naturalWidth / media.naturalHeight)}
          mediaProps={{
            onError: () =>
              c.setError('Could not load the image. Check its URL and cross-origin permissions.'),
          }}
          cropperProps={{ tabIndex: c.disabled ? -1 : 0, 'aria-label': 'Reposition crop' }}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <ImagePlus className="size-10" />
          <p className="text-sm">Choose an image to start cropping.</p>
        </div>
      )}
    </div>
  )
}
/** Offers labeled zoom/rotation ranges, aspect presets, file selection, reset, and export/upload actions. */
export function ImageCropperControls() {
  const c = useCrop(),
    file = React.useRef<HTMLInputElement>(null),
    id = React.useId()
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            key: 'zoom',
            label: 'Zoom',
            value: c.zoom,
            min: 1,
            max: c.maxZoom,
            step: 0.05,
            set: c.setZoom,
          },
          {
            key: 'rotation',
            label: 'Rotation',
            value: c.rotation,
            min: 0,
            max: 359,
            step: 1,
            set: c.setRotation,
          },
        ].map((control) => (
          <div key={control.key} className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor={`${id}-${control.key}`}>{control.label}</label>
              <span dir="ltr">
                {control.key === 'zoom' ? `${control.value.toFixed(2)}×` : `${control.value}°`}
              </span>
            </div>
            <input
              id={`${id}-${control.key}`}
              type="range"
              className="w-full accent-primary"
              min={control.min}
              max={control.max}
              step={control.step}
              value={control.value}
              disabled={c.disabled || !c.src}
              onChange={(event) => control.set(Number(event.target.value))}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Crop aspect ratio"
          className="h-9 rounded-md border bg-background px-2 text-sm"
          disabled={c.disabled || c.shape === 'circle'}
          value={c.shape === 'circle' ? '1' : String(c.aspect)}
          onChange={(event) =>
            c.setAspect(event.target.value === 'original' ? 'original' : Number(event.target.value))
          }
        >
          {![1, 4 / 3, 3 / 4, 16 / 9, 'original'].includes(c.aspect) && (
            <option value={String(c.aspect)}>Custom ratio</option>
          )}
          <option value="original">Original</option>
          <option value="1">Square · 1:1</option>
          <option value={4 / 3}>Landscape · 4:3</option>
          <option value={3 / 4}>Portrait · 3:4</option>
          <option value={16 / 9}>Wide · 16:9</option>
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={c.disabled}
          onClick={() => file.current?.click()}
        >
          <ImagePlus />
          Choose image
        </Button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Choose image file"
          disabled={c.disabled}
          onChange={(event) => {
            const chosen = event.target.files?.[0]
            if (chosen) c.choose(chosen)
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Reset crop"
          disabled={c.disabled || !c.src}
          onClick={c.reset}
        >
          <RotateCcw />
        </Button>
        <Button
          type="button"
          className="ms-auto"
          size="sm"
          disabled={c.disabled || !c.ready}
          onClick={c.exportImage}
        >
          {c.busy ? <Loader2 className="animate-spin" /> : c.canUpload ? <Upload /> : <Download />}
          {c.busy ? 'Processing…' : c.canUpload ? 'Crop and upload' : 'Export crop'}
        </Button>
      </div>
    </div>
  )
}
/** Shows local exported output separately from an optional application upload result. */
export function ImageCropperPreview() {
  const c = useCrop()
  return c.preview ? (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/20 p-3">
      <img src={c.preview} alt="Cropped preview" className="size-24 rounded-lg object-contain" />
      <div className="min-w-0 space-y-1 text-xs">
        <p className="font-medium">Cropped image ready</p>
        <a
          href={c.preview}
          download="cropped-image"
          className="text-primary underline underline-offset-4"
        >
          Download image
        </a>
        {c.uploadUrl && (
          <p role="status" className="break-all text-muted-foreground">
            Uploaded: {c.uploadUrl}
          </p>
        )}
      </div>
    </div>
  ) : null
}
