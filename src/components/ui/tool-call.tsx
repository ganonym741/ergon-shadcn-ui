import * as React from 'react'
import { Wrench, LoaderCircle, CheckCircle2, AlertCircle, RotateCcw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JsonViewer } from '@/components/ui/json-viewer'
import { useAsyncAction } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled'
export interface ToolCallData {
  id: string
  name: string
  description?: string
  input: unknown
  output?: unknown
  error?: string
  status: ToolCallStatus
  durationMs?: number
}
export interface ToolCallProps extends React.ComponentProps<'section'> {
  call: ToolCallData
  defaultExpanded?: boolean
  onRetry?: (call: ToolCallData, options: { signal: AbortSignal }) => void | Promise<void>
  onCancel?: (call: ToolCallData) => void | Promise<void>
}
const Context = React.createContext<
  | (ToolCallProps & {
      busy: boolean
      run: ReturnType<typeof useAsyncAction>['run']
      cancel: () => void
      cancelling: boolean
      cancelRun: ReturnType<typeof useAsyncAction>['run']
    })
  | null
>(null)
const useTool = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Tool call parts need ToolCall.')
  return c
}
/** Renders application-reported tool execution; opening a card never executes a tool. */
export function ToolCall({
  call,
  defaultExpanded = false,
  onRetry,
  onCancel,
  children,
  className,
  ...props
}: ToolCallProps) {
  const action = useAsyncAction(),
    cancellation = useAsyncAction(),
    { cancel } = action,
    cancelCancellation = cancellation.cancel
  React.useEffect(
    () => () => {
      cancel()
      cancelCancellation()
    },
    [call.id, cancel, cancelCancellation],
  )
  return (
    <Context.Provider
      value={{
        call,
        onRetry,
        onCancel,
        busy: action.busy,
        run: action.run,
        cancel,
        cancelling: cancellation.busy,
        cancelRun: cancellation.run,
      }}
    >
      <section
        {...props}
        data-slot="tool-call"
        className={cn('w-full min-w-0 overflow-hidden rounded-xl border bg-background', className)}
        aria-label={`Tool ${call.name}`}
      >
        <details open={defaultExpanded}>
          <summary className="cursor-pointer list-none">
            <ToolCallHeader />
          </summary>
          {children ?? <ToolCallContent />}
        </details>
        {(action.error || cancellation.error) && (
          <p role="alert" className="border-t p-3 text-xs text-destructive">
            {action.error || cancellation.error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
export function ToolCallHeader() {
  const { call } = useTool(),
    Icon =
      call.status === 'running'
        ? LoaderCircle
        : call.status === 'success'
          ? CheckCircle2
          : call.status === 'error'
            ? AlertCircle
            : Wrench
  return (
    <div className="flex items-center gap-2 p-3">
      <span
        className={cn('rounded-lg bg-muted p-2', call.status === 'error' && 'text-destructive')}
      >
        <Icon className={cn('size-4', call.status === 'running' && 'animate-spin')} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{call.name}</p>
        <p className="text-[11px] text-muted-foreground">{call.description ?? 'Tool execution'}</p>
      </div>
      <span role="status" className="rounded-full border px-2 py-0.5 text-[10px] capitalize">
        {call.status}
      </span>
      {Number.isFinite(call.durationMs) && (
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {Math.max(0, call.durationMs!)} ms
        </span>
      )}
    </div>
  )
}
export function ToolCallContent() {
  const c = useTool()
  return (
    <div className="space-y-3 border-t p-3">
      <JsonViewer value={c.call.input} name="input" label="Tool input" defaultExpandDepth={2} />
      {c.call.output !== undefined && (
        <JsonViewer
          value={c.call.output}
          name="output"
          label="Tool output"
          defaultExpandDepth={2}
        />
      )}{' '}
      {c.call.error && (
        <p role="alert" className="break-words text-xs text-destructive">
          {c.call.error}
        </p>
      )}
      <div className="flex gap-2">
        {c.onRetry && (c.call.status === 'error' || c.call.status === 'cancelled') && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={c.busy}
            onClick={() => void c.run((signal) => c.onRetry!(c.call, { signal }))}
          >
            <RotateCcw />
            Retry tool
          </Button>
        )}
        {c.onCancel && (c.call.status === 'pending' || c.call.status === 'running') && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={c.cancelling}
            onClick={() => {
              c.cancel()
              void c.cancelRun(() => c.onCancel!(c.call))
            }}
          >
            <Square />
            Cancel tool
          </Button>
        )}
      </div>
    </div>
  )
}
