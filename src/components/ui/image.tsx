import * as React from 'react'
import { ZoomIn, ZoomOut, Download, RotateCw, ImageOff, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
export async function downloadImage(src: string) {
  const response = await fetch(src)
  if (!response.ok) throw new Error('The original image could not be downloaded')
  const url = URL.createObjectURL(await response.blob()),
    link = document.createElement('a')
  link.href = url
  link.download = src.split('/').at(-1)?.split('?')[0] || 'image'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
function LoadedImage({
  src,
  alt,
  className,
  onLoad,
  onError,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [status, setStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading')
  React.useEffect(() => setStatus('loading'), [src])
  return (
    <span className={cn('relative block overflow-hidden rounded-lg', className)}>
      {status === 'error' ? (
        <span
          role="img"
          aria-label={`${alt ?? 'Image'} unavailable`}
          className="flex min-h-36 items-center justify-center gap-2 bg-muted p-5 text-xs text-muted-foreground"
        >
          <ImageOff size={20} />
          Image unavailable
        </span>
      ) : (
        <>
          <img
            {...props}
            src={src}
            alt={alt}
            onLoad={(e) => {
              setStatus('loaded')
              onLoad?.(e)
            }}
            onError={(e) => {
              setStatus('error')
              onError?.(e)
            }}
            className="h-auto max-w-full object-cover"
          />
          {status === 'loading' && (
            <span
              role="status"
              aria-label="Loading image"
              className="absolute inset-0 flex items-center justify-center bg-muted/40"
            >
              <Loader2 className="size-5 animate-spin" />
            </span>
          )}
        </>
      )}
    </span>
  )
}
export function Image({
  src = '',
  alt = '',
  className,
  preview = true,
  downloadable = true,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { preview?: boolean; downloadable?: boolean }) {
  const [zoom, setZoom] = React.useState(1),
    [error, setError] = React.useState(''),
    img = <LoadedImage {...props} src={src} alt={alt} className={className} />
  if (!preview) return img
  return (
    <Dialog
      onOpenChange={() => {
        setZoom(1)
        setError('')
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Preview ${alt || 'image'}`}
          className="overflow-hidden rounded-lg"
        >
          {img}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogTitle>{alt || 'Image preview'}</DialogTitle>
        <DialogDescription className="sr-only">Zoom or download the image.</DialogDescription>
        <div className="max-h-[65vh] overflow-auto">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
            <LoadedImage src={src} alt={alt} />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          >
            <ZoomIn />
          </Button>
          {downloadable && (
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Download image"
              onClick={() => downloadImage(src).catch((error) => setError(String(error)))}
            >
              <Download />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
export interface GalleryImage {
  src: string
  alt: string
}
export function ImageGallery({
  images,
  className,
  preview = true,
  downloadable = true,
}: {
  images: GalleryImage[]
  className?: string
  preview?: boolean
  downloadable?: boolean
}) {
  const [active, setActive] = React.useState<number | null>(null),
    [zoom, setZoom] = React.useState(1),
    [rotation, setRotation] = React.useState(0),
    [error, setError] = React.useState('')
  const navigate = (delta: number) => {
      setActive((index) => (index === null ? 0 : (index + delta + images.length) % images.length))
      setZoom(1)
      setRotation(0)
      setError('')
    },
    image = active === null ? undefined : images[active]
  return (
    <>
      <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
        {images.map((item, index) =>
          preview ? (
            <button
              key={index}
              type="button"
              aria-label={`Preview ${item.alt}`}
              onClick={() => {
                setActive(index)
                setZoom(1)
                setRotation(0)
              }}
            >
              <LoadedImage {...item} className="aspect-[4/3] border" />
            </button>
          ) : (
            <LoadedImage key={index} {...item} className="aspect-[4/3] border" />
          ),
        )}
      </div>
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null)
        }}
      >
        <DialogContent
          className="sm:max-w-4xl"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              navigate(-1)
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              navigate(1)
            }
          }}
        >
          <DialogTitle>
            {image?.alt ?? 'Gallery'}{' '}
            <span className="text-xs text-muted-foreground">
              {active === null ? 0 : active + 1} / {images.length}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Use arrow keys to browse images.
          </DialogDescription>
          <div className="flex h-[55vh] items-center justify-center overflow-auto">
            <div style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}>
              {image && <LoadedImage {...image} className="max-h-[55vh]" />}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={images.length < 2}
            >
              Previous
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            >
              <ZoomIn />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Rotate image"
              onClick={() => setRotation((r) => r + 90)}
            >
              <RotateCw />
            </Button>
            {downloadable && image && (
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="Download image"
                onClick={() => downloadImage(image.src).catch((error) => setError(String(error)))}
              >
                <Download />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(1)}
              disabled={images.length < 2}
            >
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
