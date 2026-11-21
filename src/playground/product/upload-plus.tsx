import * as React from 'react'
import {
  UploadPlus,
  type UploadTransport,
  type UploadPartReceipt,
} from '@/components/ui/upload-plus'
import type { PreviewProps } from '../preview'
import { DemoNote, simulate, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    receipts = React.useRef(new Map<string, UploadPartReceipt[]>()),
    attempts = React.useRef(new Set<string>())
  const transport = React.useMemo<UploadTransport>(
    () => ({
      getUploadedParts: async ({ id, signal }) => {
        await simulate(signal)
        return receipts.current.get(id) ?? []
      },
      uploadPart: async (chunk, context) => {
        const key = `${context.id}-${context.index}`
        for (let step = 1; step <= 3; step++) {
          await simulate(context.signal)
          context.onProgress((chunk.size * step) / 3)
        }
        if (v.failure === 'always' || (v.failure === 'once' && !attempts.current.has(key))) {
          attempts.current.add(key)
          throw new Error('Simulated interrupted chunk. Retry or resume to continue.')
        }
        const receipt = { index: context.index, token: `local-${context.id}-${context.index}` }
        receipts.current.set(context.id, [
          ...(receipts.current.get(context.id) ?? []).filter(
            (part) => part.index !== context.index,
          ),
          receipt,
        ])
        return receipt
      },
      complete: async (parts, context) => {
        await simulate(context.signal)
        if (parts.length !== Math.max(1, Math.ceil(context.file.size / (+v.chunk * 1024))))
          throw new Error('The simulated server is missing a chunk.')
        report(props, 'simulated-complete', {
          id: context.id,
          name: context.file.name,
          parts: parts.length,
        })
      },
      discard: ({ id }) => {
        receipts.current.delete(id)
      },
    }),
    [v.failure, v.chunk, props],
  )
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        This transport simulates chunk storage in memory. No bytes leave the browser and no
        permanent link is created. Add a file, pause it, then resume; completed receipts are
        retained. Choose “once” to exercise retries.
      </DemoNote>
      <UploadPlus
        transport={transport}
        accept={String(v.accept)}
        maxFiles={+v.maxFiles}
        maxFileSize={+v.maxSize * 1024 * 1024}
        chunkSize={+v.chunk * 1024}
        concurrency={+v.concurrency}
        retries={+v.retries}
        autoStart={!!v.auto}
        disabled={!!v.disabled}
        onQueueChange={(queue) =>
          report(
            props,
            'queue',
            queue.map((item) => ({
              id: item.id,
              name: item.file.name,
              status: item.status,
              loaded: item.loaded,
              parts: item.parts.length,
            })),
          )
        }
        onComplete={(item) => report(props, 'completed', item.file.name)}
        onReject={(file, reason) => report(props, 'rejected', { name: file.name, reason })}
      />
    </div>
  )
}
