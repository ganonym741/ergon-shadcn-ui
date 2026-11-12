import * as React from 'react'
import { ShieldCheck, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { JsonViewer } from '@/components/ui/json-viewer'
import { useAsyncAction } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export type ApprovalJSON =
  null | boolean | number | string | ApprovalJSON[] | { [key: string]: ApprovalJSON }
export interface ApprovalRequestData {
  id: string
  revision: string
  title: string
  description?: string
  toolName?: string
  arguments: Record<string, ApprovalJSON>
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  expiresAt?: string
}
export interface ApprovalDecision {
  id: string
  revision: string
  decision: 'approve' | 'reject'
  arguments: Record<string, ApprovalJSON>
  reason: string
}
export interface ApprovalRequestProps extends React.ComponentProps<'section'> {
  request: ApprovalRequestData
  onDecide: (decision: ApprovalDecision, options: { signal: AbortSignal }) => void | Promise<void>
  editableArguments?: boolean
  disabled?: boolean
}
interface ApprovalContext {
  request: ApprovalRequestData
  status: ApprovalRequestData['status']
  draft: string
  setDraft: (value: string) => void
  reason: string
  setReason: (value: string) => void
  arguments: Record<string, ApprovalJSON> | null
  parseError: string
  editable: boolean
  disabled: boolean
  busy: boolean
  decide: (decision: ApprovalDecision['decision']) => void
}
const Context = React.createContext<ApprovalContext | null>(null)
const useApproval = () => {
  const value = React.useContext(Context)
  if (!value) throw new Error('Approval parts need ApprovalRequest.')
  return value
}
/** Parses bounded JSON objects; server-side authorization and schema validation are still required. */
export function parseApprovalArguments(draft: string): Record<string, ApprovalJSON> {
  if (draft.length > 200000) throw new Error('Arguments exceed the 200,000 character limit.')
  const parsed: unknown = JSON.parse(draft)
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object')
    throw new Error('Arguments must be a JSON object.')
  let count = 0
  const validate = (value: unknown, depth: number) => {
    if (++count > 20000 || depth > 32) throw new Error('Arguments exceed the inspection limit.')
    if (typeof value === 'number' && !Number.isFinite(value))
      throw new Error('JSON numbers must be finite.')
    if (value && typeof value === 'object')
      for (const child of Object.values(value)) validate(child, depth + 1)
  }
  validate(parsed, 0)
  return parsed as Record<string, ApprovalJSON>
}
/** Decisions are tied to a request ID and revision. Applications authorize and execute them on their own backend. */
export function ApprovalRequest({
  request,
  onDecide,
  editableArguments = false,
  disabled = false,
  children,
  className,
  ...props
}: ApprovalRequestProps) {
  const action = useAsyncAction(),
    [draft, setDraft] = React.useState(() => JSON.stringify(request.arguments, null, 2)),
    [reason, setReason] = React.useState(''),
    [decision, setDecision] = React.useState<ApprovalDecision['decision'] | null>(null),
    [now, setNow] = React.useState(Date.now),
    lock = React.useRef(false),
    key = JSON.stringify([request.id, request.revision]),
    latest = React.useRef(key),
    argumentsRef = React.useRef(request.arguments)
  React.useLayoutEffect(() => {
    latest.current = key
    argumentsRef.current = request.arguments
  }, [key, request.arguments])
  const { cancel } = action
  React.useEffect(() => {
    cancel()
    setDraft(JSON.stringify(argumentsRef.current, null, 2))
    setReason('')
    setDecision(null)
    lock.current = false
  }, [key, cancel])
  React.useEffect(() => {
    if (request.status !== 'pending') cancel()
  }, [request.status, cancel])
  React.useEffect(() => {
    if (!request.expiresAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [request.expiresAt])
  const expiry = request.expiresAt ? Date.parse(request.expiresAt) : Infinity,
    expired = expiry <= now || (!Number.isFinite(expiry) && !!request.expiresAt),
    status =
      request.status !== 'pending'
        ? request.status
        : decision === 'approve'
          ? 'approved'
          : decision === 'reject'
            ? 'rejected'
            : expired
              ? 'expired'
              : 'pending'
  let args: Record<string, ApprovalJSON> | null = null,
    parseError = ''
  try {
    args = parseApprovalArguments(draft)
  } catch (failure) {
    parseError = failure instanceof Error ? failure.message : 'Invalid JSON.'
  }
  const decide = (next: ApprovalDecision['decision']) => {
    if (
      lock.current ||
      disabled ||
      status !== 'pending' ||
      (next === 'approve' && !args) ||
      Date.now() >= expiry
    )
      return
    lock.current = true
    void action.run(async (signal) => {
      try {
        await onDecide(
          {
            id: request.id,
            revision: request.revision,
            decision: next,
            arguments: args ?? request.arguments,
            reason,
          },
          { signal },
        )
        if (!signal.aborted && latest.current === key) setDecision(next)
      } finally {
        if (latest.current === key) lock.current = false
      }
    })
  }
  return (
    <Context.Provider
      value={{
        request,
        status,
        draft,
        setDraft,
        reason,
        setReason,
        arguments: args,
        parseError,
        editable: editableArguments,
        disabled,
        busy: action.busy,
        decide,
      }}
    >
      <section
        {...props}
        data-slot="approval-request"
        aria-label={request.title}
        className={cn(
          'w-full min-w-0 space-y-4 rounded-xl border border-amber-500/35 bg-background p-4',
          className,
        )}
      >
        {children ?? (
          <>
            <ApprovalRequestHeader />
            <ApprovalRequestArguments />
            <ApprovalRequestActions />
          </>
        )}
        {request.expiresAt && (
          <p className="text-[10px] text-muted-foreground">
            Expires:{' '}
            {Number.isFinite(expiry)
              ? new Date(expiry).toLocaleString()
              : 'Invalid expiration date'}
          </p>
        )}
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
export function ApprovalRequestHeader() {
  const c = useApproval()
  return (
    <>
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400">
          <ShieldCheck className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{c.request.title}</h3>
          <p
            role="status"
            aria-label="Approval status"
            className="mt-1 text-xs capitalize text-muted-foreground"
          >
            {c.status}
            {c.request.toolName ? ' · ' + c.request.toolName : ''}
          </p>
        </div>
      </div>
      {c.request.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{c.request.description}</p>
      )}
    </>
  )
}
export function ApprovalRequestArguments() {
  const c = useApproval()
  return c.editable && c.status === 'pending' ? (
    <label className="block space-y-2 text-xs">
      <span className="font-medium">Review and edit arguments</span>
      <Textarea
        dir="ltr"
        aria-label="Approval arguments"
        value={c.draft}
        onChange={(event) => c.setDraft(event.target.value)}
        disabled={c.disabled || c.busy}
        rows={6}
        className="font-mono text-xs"
      />
      {c.parseError && (
        <span role="alert" className="block text-destructive">
          {c.parseError}
        </span>
      )}
    </label>
  ) : (
    <JsonViewer
      value={c.arguments ?? c.request.arguments}
      label="Requested arguments"
      defaultExpandDepth={2}
    />
  )
}
export function ApprovalRequestActions() {
  const c = useApproval()
  return c.status === 'pending' ? (
    <>
      <label className="block space-y-2 text-xs">
        <span className="font-medium">Decision note (optional)</span>
        <Textarea
          aria-label="Decision note"
          value={c.reason}
          disabled={c.disabled || c.busy}
          onChange={(event) => c.setReason(event.target.value)}
          rows={2}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={c.disabled || c.busy || !c.arguments}
          onClick={() => c.decide('approve')}
        >
          <Check />
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={c.disabled || c.busy}
          onClick={() => c.decide('reject')}
        >
          <X />
          Reject
        </Button>
      </div>
    </>
  ) : null
}
