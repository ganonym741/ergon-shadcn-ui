import * as React from 'react'
import {
  Copy,
  Check,
  Pencil,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAsyncAction } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
import { useTextStream, type TextStreamOptions } from '@/components/ui/text-stream'
export interface ChatMessageProps
  extends Omit<React.ComponentProps<'article'>, 'content' | 'id' | 'onCopy'>, TextStreamOptions {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: React.ReactNode
  author?: string
  avatar?: React.ReactNode
  status?: 'complete' | 'streaming' | 'error' | 'cancelled'
  copyText?: string
  createdAt?: string
  metadata?: React.ReactNode
  onEdit?: (text: string, options: { signal: AbortSignal }) => void | Promise<void>
  onRetry?: (options: { signal: AbortSignal }) => void | Promise<void>
  onCopy?: (text: string) => void | Promise<void>
  rating?: 'up' | 'down' | null
  onRatingChange?: (rating: 'up' | 'down' | null) => void
  branches?: { id: string; label: string }[]
  branchId?: string
  onBranchChange?: (id: string) => void
}
interface MessageContext extends ChatMessageProps {
  text: string
  editing: boolean
  setEditing: (value: boolean) => void
  busy: boolean
  run: ReturnType<typeof useAsyncAction>['run']
}
const Context = React.createContext<MessageContext | null>(null)
const useMessage = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Message parts need ChatMessage.')
  return c
}
export function ChatMessage({
  id,
  role,
  content,
  author,
  avatar,
  status = 'complete',
  textAnimation = 'typewriter',
  charactersPerSecond = 60,
  copyText,
  createdAt,
  metadata,
  onEdit,
  onRetry,
  onCopy,
  rating,
  onRatingChange,
  branches,
  branchId,
  onBranchChange,
  children,
  className,
  ...props
}: ChatMessageProps) {
  const action = useAsyncAction(),
    [editing, setEditing] = React.useState(false),
    text = copyText ?? (typeof content === 'string' ? content : ''),
    { cancel } = action
  React.useEffect(() => {
    cancel()
    setEditing(false)
  }, [id, cancel])
  return (
    <Context.Provider
      value={{
        id,
        role,
        content,
        author,
        avatar,
        status,
        textAnimation,
        charactersPerSecond,
        createdAt,
        metadata,
        onEdit,
        onRetry,
        onCopy,
        rating,
        onRatingChange,
        branches,
        branchId,
        onBranchChange,
        text,
        editing,
        setEditing,
        busy: action.busy,
        run: action.run,
      }}
    >
      <article
        {...props}
        data-slot="chat-message"
        data-role={role}
        data-status={status}
        aria-label={`${author ?? role} message`}
        className={cn(
          'group min-w-0 rounded-xl px-4 py-4',
          role === 'user' ? 'border bg-muted/40' : 'bg-background',
          className,
        )}
      >
        {children ?? (
          <>
            <ChatMessageHeader />
            <ChatMessageContent />
            <ChatMessageActions />
          </>
        )}
        {action.error && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {action.error}
          </p>
        )}
      </article>
    </Context.Provider>
  )
}
export function ChatMessageHeader() {
  const c = useMessage()
  return (
    <header className="mb-3 flex items-center gap-2">
      <span className="grid size-7 shrink-0 place-content-center rounded-lg border bg-background text-muted-foreground">
        {c.avatar ??
          (c.role === 'assistant' ? <Bot className="size-4" /> : <User className="size-4" />)}
      </span>
      <span className="text-xs font-semibold capitalize">{c.author ?? c.role}</span>
      {c.createdAt && Number.isFinite(Date.parse(c.createdAt)) && (
        <time dateTime={c.createdAt} className="text-[10px] text-muted-foreground">
          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      )}
      {c.status !== 'complete' && (
        <span
          role="status"
          className={cn(
            'ms-auto text-[10px] capitalize text-muted-foreground',
            c.status === 'error' && 'text-destructive',
          )}
        >
          {c.status === 'streaming' ? 'Writing…' : c.status}
        </span>
      )}
    </header>
  )
}
export function ChatMessageContent() {
  const c = useMessage(),
    [draft, setDraft] = React.useState(c.text)
  const { text, isRevealing } = useTextStream(typeof c.content === 'string' ? c.content : '', {
    streaming: c.status === 'streaming',
    textAnimation: c.textAnimation,
    charactersPerSecond: c.charactersPerSecond,
    streamKey: JSON.stringify([c.id, c.branchId]),
    immediate: c.editing || c.status === 'cancelled' || c.status === 'error',
  })
  React.useEffect(() => {
    if (c.editing) setDraft(c.text)
  }, [c.editing, c.text])
  return c.editing ? (
    <div className="space-y-2">
      <Textarea
        aria-label="Edit message"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={c.busy}
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={c.busy || !draft.trim()}
          onClick={() =>
            void c.run(async (signal) => {
              await c.onEdit?.(draft, { signal })
              if (!signal.aborted) c.setEditing(false)
            })
          }
        >
          Save edit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={c.busy}
          onClick={() => c.setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div
      dir="auto"
      data-revealing={isRevealing}
      aria-busy={c.status === 'streaming' || isRevealing}
      className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed"
    >
      {typeof c.content === 'string' ? text : c.content}
      {(c.status === 'streaming' || isRevealing) && (
        <span
          aria-hidden
          className="ms-1 inline-block h-4 w-1 animate-pulse rounded bg-primary align-middle"
        />
      )}
    </div>
  )
}
export function ChatMessageActions() {
  const c = useMessage(),
    [copied, setCopied] = React.useState(false),
    branch = c.branches?.findIndex((item) => item.id === c.branchId) ?? -1
  return (
    <footer className="mt-3 flex flex-wrap items-center gap-1">
      {c.text && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Copy message"
          disabled={c.busy}
          onClick={() =>
            void c.run(async () => {
              if (c.onCopy) await c.onCopy(c.text)
              else {
                if (!navigator.clipboard) throw new Error('Clipboard is unavailable.')
                await navigator.clipboard.writeText(c.text)
              }
              setCopied(true)
            })
          }
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      )}
      {c.onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Edit message"
          disabled={c.busy || c.status === 'streaming'}
          onClick={() => c.setEditing(true)}
        >
          <Pencil />
        </Button>
      )}
      {c.onRetry && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Regenerate message"
          disabled={c.busy || c.status === 'streaming'}
          onClick={() => void c.run((signal) => c.onRetry!({ signal }))}
        >
          <RotateCcw />
        </Button>
      )}
      {c.onRatingChange &&
        (['up', 'down'] as const).map((v) => (
          <Button
            key={v}
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={v === 'up' ? 'Helpful response' : 'Unhelpful response'}
            aria-pressed={c.rating === v}
            onClick={() => c.onRatingChange?.(c.rating === v ? null : v)}
            className={cn(c.rating === v && 'bg-accent text-primary')}
          >
            {v === 'up' ? <ThumbsUp /> : <ThumbsDown />}
          </Button>
        ))}
      {c.branches && c.branches.length > 1 && (
        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Previous response branch"
            disabled={!c.onBranchChange || branch <= 0}
            onClick={() => c.onBranchChange?.(c.branches![branch - 1].id)}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <span dir="ltr" className="text-[10px] tabular-nums" aria-live="polite">
            {branch < 0 ? '—' : branch + 1} / {c.branches.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Next response branch"
            disabled={!c.onBranchChange || branch < 0 || branch >= c.branches.length - 1}
            onClick={() => c.onBranchChange?.(c.branches![branch + 1].id)}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </div>
      )}
      {c.metadata && (
        <div className="w-full pt-1 text-[10px] text-muted-foreground">{c.metadata}</div>
      )}
    </footer>
  )
}
