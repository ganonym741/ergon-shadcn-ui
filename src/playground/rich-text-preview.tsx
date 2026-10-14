import * as React from 'react'
import {
  RichTextEditor,
  type RichTextContent,
  type RichTextImageUploader,
} from '@/components/ui/rich-text-editor'
import { Button } from '@/components/ui/button'
import type { PreviewProps } from './preview'
export default function RichTextPreview({ config: v, onEvent }: PreviewProps) {
  const [html, setHTML] = React.useState(String(v.initialHTML)),
    [output, setOutput] = React.useState<'html' | 'json'>('html'),
    [content, setContent] = React.useState<RichTextContent | null>(null),
    urls = React.useRef<string[]>([]),
    failedOnce = React.useRef(new Set<string>())
  React.useEffect(
    () => () => {
      const expired = [...urls.current]
      // Allow Tiptap's deferred view cleanup to finish before revoking demo URLs.
      setTimeout(() => expired.forEach((url) => URL.revokeObjectURL(url)), 100)
    },
    [],
  )
  const upload: RichTextImageUploader = async (file, { signal, onProgress }) => {
    onEvent({
      type: 'image-upload-start',
      value: { name: file.name, destination: v.uploadMode },
      time: Date.now(),
    })
    if (v.uploadMode === 'Custom endpoint') {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(String(v.uploadEndpoint), { method: 'POST', body, signal })
      if (!response.ok) throw new Error(`Upload failed (${response.status})`)
      const result = await response.json()
      const src = result.url ?? result.src
      if (typeof src !== 'string')
        throw new Error('Endpoint must return { url: string } or { src: string }.')
      return { src, alt: file.name }
    }
    for (let step = 1; step <= 5; step++) {
      await new Promise<void>((resolve, reject) => {
        if (signal.aborted) {
          reject(new DOMException('Cancelled', 'AbortError'))
          return
        }
        const abort = () => {
          clearTimeout(timer)
          reject(new DOMException('Cancelled', 'AbortError'))
        }
        const timer = setTimeout(
          () => {
            signal.removeEventListener('abort', abort)
            resolve()
          },
          Number(v.uploadDelay) / 5,
        )
        signal.addEventListener('abort', abort, { once: true })
      })
      onProgress(step * 20)
    }
    const key = `${file.name}-${file.size}-${file.lastModified}`
    if (v.failure && !failedOnce.current.has(key)) {
      failedOnce.current.add(key)
      throw new Error('Simulated first upload failure. Retry to insert the image.')
    }
    const src = URL.createObjectURL(file)
    urls.current.push(src)
    return { src, alt: file.name }
  }
  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="rounded-lg border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Images belong inside the story.</strong> Place the
        cursor between words or paragraphs, then choose Insert image → Upload images. You can also
        paste or drop image files.
        <br />
        {v.uploadMode === 'Local preview'
          ? 'Local preview uses temporary browser URLs. Images are not uploaded or persisted.'
          : v.uploadMode === 'Custom endpoint'
            ? `Files POST to ${String(v.uploadEndpoint)} as multipart field “file”. Return { "url": "https://your-storage/image.png" }. Configure storage and authentication in your application’s onImageUpload callback.`
            : 'File uploads are disabled. You can insert images from a URL.'}
      </div>
      <RichTextEditor
        value={html}
        onValueChange={setHTML}
        onContentChange={(next) => {
          setContent(next)
          onEvent({
            type: 'content-change',
            value: { characters: next.text.length, html: next.html },
            time: Date.now(),
          })
        }}
        label={String(v.label)}
        placeholder={String(v.placeholder)}
        toolbar={Boolean(v.toolbar)}
        disabled={Boolean(v.disabled)}
        readOnly={Boolean(v.readOnly)}
        minHeight={Number(v.minHeight)}
        maxHeight={Number(v.maxHeight)}
        imageAccept={String(v.imageAccept)}
        maxImageSize={Number(v.maxImageMB) * 1024 * 1024}
        maxFiles={Number(v.maxFiles)}
        onImageUpload={v.uploadMode === 'Images by URL only' ? undefined : upload}
        onImageUploaded={(image, file) =>
          onEvent({
            type: 'image-uploaded',
            value: { name: file.name, src: image.src },
            time: Date.now(),
          })
        }
        onImageUploadError={(error, file) =>
          onEvent({
            type: 'image-upload-error',
            value: { name: file.name, message: error.message },
            time: Date.now(),
          })
        }
      />
      {v.showOutput && (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
            <span className="text-xs font-medium">Document output</span>
            <div className="flex gap-1">
              <Button
                size="xs"
                variant={output === 'html' ? 'soft' : 'ghost'}
                aria-pressed={output === 'html'}
                onClick={() => setOutput('html')}
              >
                HTML
              </Button>
              <Button
                size="xs"
                variant={output === 'json' ? 'soft' : 'ghost'}
                aria-pressed={output === 'json'}
                onClick={() => setOutput('json')}
              >
                JSON
              </Button>
            </div>
          </div>
          <pre
            aria-label="Editor document output"
            tabIndex={0}
            className="max-h-56 overflow-auto whitespace-pre-wrap break-all bg-muted/20 p-4 text-[11px] leading-relaxed"
          >
            {output === 'html'
              ? html
              : content
                ? JSON.stringify(content.json, null, 2)
                : 'Edit the document to inspect its JSON.'}
          </pre>
        </div>
      )}
    </div>
  )
}
