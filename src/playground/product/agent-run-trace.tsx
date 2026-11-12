import { AgentRunTrace, type AgentTraceStep } from '@/components/ui/agent-run-trace'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { traceData } from '../product-data'
import { DemoNote, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  const steps = parseData(v, 'data', traceData) as AgentTraceStep[],
    expanded: string[] = [],
    pending = [...steps]
  while (pending.length && expanded.length < 2000) {
    const step = pending.pop()
    if (!step?.id) continue
    expanded.push(step.id)
    if (Array.isArray(step.children)) pending.push(...step.children)
  }
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        A simulated public activity log with nested steps and tool records. Summaries are supplied
        by the application; this UI does not expose or generate private model reasoning.
      </DemoNote>
      <AgentRunTrace
        steps={steps}
        defaultExpandedIds={v.expanded ? expanded : []}
        searchable={!!v.search}
        onExpandedIdsChange={(ids) => report(props, 'expanded-steps', ids)}
        onStepSelect={(step) => report(props, 'step-selected', step.id)}
        renderStep={
          v.custom
            ? (step) =>
                step.toolCall ? undefined : (
                  <div className="ms-4 rounded-lg border border-dashed bg-primary/5 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-primary">
                      Published {step.kind ?? 'activity'} summary
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {step.summary ?? 'The application can render step metadata here.'}
                    </p>
                  </div>
                )
            : undefined
        }
      />
    </div>
  )
}
