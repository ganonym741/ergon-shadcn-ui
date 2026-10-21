import * as React from 'react'
import { Upload, type UploadProps } from '@/components/ui/upload'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
export function ImageCropUpload({
  aspect = 1,
  beforeUpload,
  ...props
}: UploadProps & { aspect?: number }) {
  const [crop, setCrop] = React.useState<{
      file: File
      url: string
      width: number
      height: number
      resolve: (file: File | false) => void
    }>(),
    [x, setX] = React.useState(50),
    [y, setY] = React.useState(50),
    [scale, setScale] = React.useState(100),
    [error, setError] = React.useState('')
  const image = React.useRef<HTMLImageElement>(null),
    latest = React.useRef(crop)
  latest.current = crop
  React.useEffect(
    () => () => {
      if (latest.current) {
        latest.current.resolve(false)
        URL.revokeObjectURL(latest.current.url)
      }
    },
    [],
  )
  const close = (file: File | false) => {
    if (crop) {
      crop.resolve(file)
      URL.revokeObjectURL(crop.url)
      setCrop(undefined)
    }
  }
  const before = async (file: File) => {
    const transformed = (await beforeUpload?.(file)) ?? file
    if (transformed === false || !transformed.type.startsWith('image/')) return transformed
    const url = URL.createObjectURL(transformed),
      bitmap = await createImageBitmap(transformed),
      width = bitmap.width,
      height = bitmap.height
    bitmap.close()
    setX(50)
    setY(50)
    setScale(100)
    return new Promise<File | false>((resolve) =>
      setCrop({ file: transformed, url, width, height, resolve }),
    )
  }
  const width = crop ? (Math.min(crop.width, crop.height * aspect) * scale) / 100 : 0,
    height = width / aspect,
    left = crop ? ((crop.width - width) * x) / 100 : 0,
    top = crop ? ((crop.height - height) * y) / 100 : 0
  return (
    <>
      <Upload {...props} disabled={props.disabled || !!crop} beforeUpload={before} />
      <Dialog
        open={!!crop}
        onOpenChange={(open) => {
          if (!open) close(false)
        }}
      >
        <DialogContent>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>Choose the area to include in your upload.</DialogDescription>
          {crop && (
            <div
              className="relative mx-auto overflow-hidden rounded-lg"
              style={{ maxWidth: Math.min(450, (288 * crop.width) / crop.height) }}
            >
              <img
                ref={image}
                src={crop.url}
                alt="Crop preview"
                className="max-h-72 w-full object-contain"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_999px_#0006]"
                style={{
                  width: `${(width / crop.width) * 100}%`,
                  height: `${(height / crop.height) * 100}%`,
                  left: `${(left / crop.width) * 100}%`,
                  top: `${(top / crop.height) * 100}%`,
                }}
              />
            </div>
          )}
          {[
            ['Horizontal position', x, setX],
            ['Vertical position', y, setY],
            ['Crop size', scale, setScale],
          ].map(([label, value, set]) => (
            <label key={String(label)} className="flex items-center gap-3 text-xs">
              <span className="w-28">{String(label)}</span>
              <input
                aria-label={String(label)}
                type="range"
                min={label === 'Crop size' ? 10 : 0}
                max={100}
                value={value as number}
                onChange={(event) =>
                  (set as React.Dispatch<React.SetStateAction<number>>)(Number(event.target.value))
                }
                className="flex-1"
              />
            </label>
          ))}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                try {
                  if (!crop || !image.current) return
                  const canvas = document.createElement('canvas')
                  canvas.width = width
                  canvas.height = height
                  canvas
                    .getContext('2d')!
                    .drawImage(image.current, left, top, width, height, 0, 0, width, height)
                  canvas.toBlob(
                    (blob) => {
                      if (!blob) {
                        setError('Could not crop this image')
                        return
                      }
                      close(new File([blob], crop.file.name, { type: blob.type }))
                    },
                    crop.file.type === 'image/png' ? 'image/png' : 'image/jpeg',
                    0.92,
                  )
                } catch (error) {
                  setError(String(error))
                }
              }}
            >
              Use crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
