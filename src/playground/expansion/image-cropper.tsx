import * as React from 'react'
import { ImageCropper, type ImageCropExport } from '@/components/ui/image-cropper'
import type { PreviewProps } from '../preview'
import { report, simulate } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    urls = React.useRef<string[]>([]),
    aspects: Record<string, number | 'original'> = {
      original: 'original',
      square: 1,
      landscape: 4 / 3,
      portrait: 3 / 4,
      wide: 16 / 9,
    }
  React.useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), [])
  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-muted-foreground">
        Use arrow keys in the crop area, or drag and zoom. Export produces a real Blob. The optional
        upload callback is simulated locally; no image is sent to a server.
      </p>
      <ImageCropper
        defaultImage={String(v.image)}
        defaultAspect={aspects[String(v.aspect)]}
        shape={v.shape as 'rectangle' | 'circle'}
        showGrid={!!v.grid}
        maxZoom={Number(v.maxZoom)}
        outputType={v.outputType as ImageCropExport['type']}
        quality={Number(v.quality) / 100}
        maxOutputSize={Number(v.maxSize)}
        disabled={!!v.disabled}
        onExport={(blob, details) =>
          report(props, 'crop-export', {
            size: blob.size,
            type: blob.type,
            area: details.area,
            rotation: details.rotation,
          })
        }
        onImageUpload={
          v.upload
            ? async (blob, { signal }) => {
                await simulate(signal, !!v.failure)
                const url = URL.createObjectURL(blob)
                urls.current.push(url)
                return url
              }
            : undefined
        }
        onUploaded={(url) => report(props, 'simulated-upload', url)}
      />
    </div>
  )
}
