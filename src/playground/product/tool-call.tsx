import * as React from 'react'
import { ToolCall, type ToolCallData } from '@/components/ui/tool-call'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { toolData } from '../product-data'
import { DemoNote, simulate, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [call, setCall] = React.useState<ToolCallData>({
      ...(parseData(v, 'data', toolData) as ToolCallData),
      status: v.status as ToolCallData['status'],
      ...(v.status !== 'success' ? { output: undefined } : {}),
      ...(v.status === 'error' ? { error: 'Simulated provider timeout. Retry to continue.' } : {}),
    })
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        This card reports application-supplied tool data. Retry and cancellation below simulate
        state changes; opening a card never runs a real tool.
      </DemoNote>
      <ToolCall
        call={call}
        defaultExpanded={!!v.expanded}
        onRetry={
          v.actions
            ? async (_call, { signal }) => {
                setCall((current) => ({
                  ...current,
                  status: 'running',
                  output: undefined,
                  error: undefined,
                }))
                try {
                  await simulate(signal, !!v.failure)
                  if (!signal.aborted) {
                    setCall((current) => ({
                      ...current,
                      status: 'success',
                      output: { matches: [{ id: 'local-retry', title: 'A useful local result' }] },
                      durationMs: 450,
                    }))
                    report(props, 'tool-retry', call.id)
                  }
                } catch {
                  if (!signal.aborted)
                    setCall((current) => ({
                      ...current,
                      status: 'error',
                      output: undefined,
                      error: 'Simulated retry failed.',
                    }))
                }
              }
            : undefined
        }
        onCancel={
          v.actions
            ? async () => {
                setCall((current) => ({ ...current, status: 'cancelled' }))
                report(props, 'tool-cancel', call.id)
              }
            : undefined
        }
      />
    </div>
  )
}
