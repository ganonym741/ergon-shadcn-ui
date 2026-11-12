import * as React from 'react'
import { PromptComposer } from '@/components/ui/prompt-composer'
import type { PreviewProps } from '../preview'
import { DemoNote, simulate, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [submitted, setSubmitted] = React.useState(''),
    [status, setStatus] = React.useState(v.status as 'idle' | 'streaming' | 'submitting'),
    urls = React.useRef(new Set<string>()),
    committedUrls = React.useRef(new Set<string>())
  React.useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), [])
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3">
      <DemoNote>
        Submission is simulated. Attachments stay in your browser; the optional upload callback
        creates temporary blob URLs instead of sending data to storage. Applications can replace
        this callback with their own uploader.
      </DemoNote>
      <PromptComposer
        defaultValue={String(v.value)}
        placeholder={String(v.placeholder)}
        status={status}
        disabled={!!v.disabled}
        accept={String(v.accept)}
        maxFiles={+v.maxFiles}
        maxFileSize={+v.maxSize * 1024 * 1024}
        maxLength={+v.maxLength}
        submitOnEnter={!!v.enter}
        onAttachmentUpload={
          v.upload
            ? async (file, { signal }) => {
                await simulate(signal, !!v.failure)
                const url = URL.createObjectURL(file)
                urls.current.add(url)
                report(props, 'local-upload', { name: file.name, bytes: file.size })
                return { url }
              }
            : undefined
        }
        onRejectFile={(file, reason) => report(props, 'rejected', { name: file.name, reason })}
        onAttachmentsChange={(items) => {
          const current = new Set(items.flatMap((item) => (item.url ? [item.url] : [])))
          for (const url of committedUrls.current) {
            if (!current.has(url)) {
              URL.revokeObjectURL(url)
              urls.current.delete(url)
            }
          }
          committedUrls.current = current
          report(
            props,
            'attachments',
            items.map((item) => ({ name: item.name, status: item.status })),
          )
        }}
        onStop={() => {
          setStatus('idle')
          report(props, 'stop', 'Stopped the local simulation')
        }}
        onSubmit={async (prompt, { signal }) => {
          await simulate(signal, !!v.failure)
          if (!signal.aborted) {
            setSubmitted(
              `${prompt.text || '(attachments only)'} · ${prompt.attachments.length} attachments`,
            )
            report(props, 'submitted', {
              text: prompt.text,
              attachments: prompt.attachments.map((item) => ({ name: item.name, size: item.size })),
            })
          }
        }}
      />
      {submitted && (
        <p role="status" className="rounded-lg border p-3 text-xs text-muted-foreground">
          Last local submission: {submitted}
        </p>
      )}
    </div>
  )
}
