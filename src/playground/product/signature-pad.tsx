import * as React from 'react'
import { SignaturePad, type SignatureStroke } from '@/components/ui/signature-pad'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { signatureData } from '../product-data'
import { DemoNote, report, useBlobURL } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [blob, setBlob] = React.useState<Blob | null>(null),
    url = useBlobURL(blob)
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        Draw with a pointer or touch, then undo, redo, clear, or export. The sample is an original
        decorative ink stroke. Vector strokes stay local; applications choose where exported images
        are stored.
      </DemoNote>
      <SignaturePad
        defaultValue={parseData(v, 'data', signatureData) as SignatureStroke[]}
        color={String(v.color)}
        background={String(v.background)}
        penWidth={+v.width}
        height={+v.height}
        format={v.format as 'png' | 'svg'}
        readOnly={!!v.readOnly}
        disabled={!!v.disabled}
        onValueChange={(value) => report(props, 'strokes', value)}
        onExport={
          v.export
            ? (blob, format) => {
                setBlob(blob)
                report(props, 'export', { format, bytes: blob.size })
              }
            : undefined
        }
      />
      {url && (
        <div className="space-y-2 rounded-xl border p-3">
          <p className="text-xs font-medium">Exported image</p>
          <img
            src={url}
            alt="Exported signature strokes"
            className="max-h-40 max-w-full rounded-lg border bg-white"
          />
          <a
            href={url}
            download={`signature.${v.format}`}
            className="text-xs text-primary underline"
          >
            Download image
          </a>
        </div>
      )}
    </div>
  )
}
