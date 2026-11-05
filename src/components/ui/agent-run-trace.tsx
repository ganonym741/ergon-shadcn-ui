import * as React from 'react'
import { ChevronRight, Check, LoaderCircle, AlertCircle, Workflow } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ToolCall, type ToolCallData, type ToolCallStatus } from '@/components/ui/tool-call'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'
export interface AgentTraceStep {
  id: string
  title: string
  kind?: 'agent' | 'model' | 'tool' | 'retrieval' | 'checkpoint'
  status: ToolCallStatus
  summary?: string
  durationMs?: number
  toolCall?: ToolCallData
  children?: AgentTraceStep[]
}
export interface AgentRunTraceProps extends React.ComponentProps<'section'> {
  steps: AgentTraceStep[]
  label?: string
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedIdsChange?: (ids: string[]) => void
  searchable?: boolean
  renderStep?: (step: AgentTraceStep) => React.ReactNode
  onStepSelect?: (step: AgentTraceStep) => void
}
/** Validates bounded trees and rejects duplicate IDs or cyclic application data. */
export function validateAgentTrace(steps: AgentTraceStep[]): string | undefined {
  const seen = new Set<string>()
  let count = 0
  const walk = (list: AgentTraceStep[], depth: number): string | undefined => {
    if (depth > 16) return 'Trace nesting exceeds 16 levels.'
    for (const step of list) {
      if (++count > 2000) return 'Trace exceeds 2,000 steps.'
      if (!step.id || seen.has(step.id))
        return 'Trace steps need unique IDs and cannot contain cycles.'
      seen.add(step.id)
      const issue = walk(step.children ?? [], depth + 1)
      if (issue) return issue
    }
  }
  return walk(steps, 0)
}
/** Displays application-published summaries and tool records, rather than private model reasoning. */
export function AgentRunTrace({
  steps,
  label = 'Agent run',
  expandedIds,
  defaultExpandedIds = [],
  onExpandedIdsChange,
  searchable = true,
  renderStep,
  onStepSelect,
  className,
  ...props
}: AgentRunTraceProps) {
  const [expanded, setExpanded] = useControllableState({
      value: expandedIds,
      defaultValue: defaultExpandedIds,
      onChange: onExpandedIdsChange,
    }),
    [query, setQuery] = React.useState(''),
    error = validateAgentTrace(steps),
    needle = searchable ? query.toLowerCase().trim() : ''
  const matches = (step: AgentTraceStep): boolean =>
    `${step.title} ${step.summary ?? ''} ${step.kind ?? ''} ${step.status}`
      .toLowerCase()
      .includes(needle) || (step.children ?? []).some(matches)
  const render = (items: AgentTraceStep[], depth = 0): React.ReactNode => (
    <ol className={cn('space-y-2', depth > 0 && 'ms-4 border-s ps-3')}>
      {items
        .filter((step) => !needle || matches(step))
        .map((step) => {
          const open = !!needle || expanded.includes(step.id),
            nested = !!step.children?.length || !!step.summary || !!step.toolCall || !!renderStep,
            Icon =
              step.status === 'running'
                ? LoaderCircle
                : step.status === 'success'
                  ? Check
                  : step.status === 'error'
                    ? AlertCircle
                    : Workflow
          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                aria-expanded={nested ? open : undefined}
                onClick={() => {
                  if (nested)
                    setExpanded(
                      expanded.includes(step.id)
                        ? expanded.filter((id) => id !== step.id)
                        : [...expanded, step.id],
                    )
                  onStepSelect?.(step)
                }}
                className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2 text-start outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight
                  aria-hidden
                  className={cn(
                    'size-3 shrink-0 transition-transform rtl:rotate-180',
                    open && 'rotate-90 rtl:rotate-90',
                    !nested && 'invisible',
                  )}
                />
                <Icon
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground',
                    step.status === 'running' && 'animate-spin',
                    step.status === 'error' && 'text-destructive',
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{step.title}</span>
                <span className="text-[10px] capitalize text-muted-foreground">{step.status}</span>
                {Number.isFinite(step.durationMs) && (
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {Math.max(0, step.durationMs!)} ms
                  </span>
                )}
              </button>
              {open && (
                <div className="space-y-3 py-2">
                  {renderStep?.(step) ?? (
                    <>
                      {step.summary && (
                        <p className="px-4 text-xs leading-relaxed text-muted-foreground">
                          {step.summary}
                        </p>
                      )}
                      {step.toolCall && (
                        <div className="ps-4">
                          <ToolCall call={step.toolCall} />
                        </div>
                      )}
                    </>
                  )}
                  {step.children && render(step.children, depth + 1)}
                </div>
              )}
            </li>
          )
        })}
    </ol>
  )
  return (
    <section
      {...props}
      data-slot="agent-run-trace"
      aria-label={label}
      className={cn('w-full min-w-0 space-y-3', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        {searchable && (
          <Input
            aria-label="Search trace"
            placeholder="Search steps…"
            value={query}
            onValueChange={setQuery}
            className="w-full sm:w-52"
          />
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <>
          {render(steps)}
          {!steps.some(matches) && (
            <p role="status" className="p-4 text-center text-sm text-muted-foreground">
              No matching steps.
            </p>
          )}
        </>
      )}
    </section>
  )
}
