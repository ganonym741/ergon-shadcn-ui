import * as React from 'react'
import { ArrowDown, LoaderCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage, type ChatMessageProps } from '@/components/ui/chat-message'
import { useAsyncAction, clamp } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
import type { TextStreamOptions } from '@/components/ui/text-stream'
export interface ConversationProps extends React.ComponentProps<'section'>, TextStreamOptions {
  messages: ChatMessageProps[]
  label?: string
  height?: number
  loading?: boolean
  hasEarlier?: boolean
  onLoadEarlier?: (options: { signal: AbortSignal }) => void | Promise<void>
  renderMessage?: (message: ChatMessageProps) => React.ReactNode
  emptyState?: React.ReactNode
  footer?: React.ReactNode
  autoScroll?: boolean
}
interface ConversationContext extends ConversationProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  stuck: boolean
  setStuck: (value: boolean) => void
  unread: number
  setUnread: (value: number) => void
  busy: boolean
  load: () => void
  jump: () => void
}
const Context = React.createContext<ConversationContext | null>(null)
const useConversation = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Conversation parts need Conversation.')
  return c
}
/** Bottom-following transcript that preserves a reader's position and anchors prepended history. */
export function Conversation({
  messages,
  label = 'Conversation',
  height = 520,
  loading = false,
  hasEarlier = false,
  onLoadEarlier,
  renderMessage,
  emptyState,
  footer,
  autoScroll = true,
  textAnimation = 'typewriter',
  charactersPerSecond = 60,
  children,
  className,
  ...props
}: ConversationProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null),
    [stuck, setStuck] = React.useState(true),
    [unread, setUnread] = React.useState(0),
    [announcement, setAnnouncement] = React.useState<{ id: string; text: string } | null>(null),
    previousMessages = React.useRef(messages),
    pendingAnnouncements = React.useRef(new Set<string>()),
    action = useAsyncAction(),
    stickRef = React.useRef(true),
    before = React.useRef<{ first?: string; last?: string; height: number; length: number }>({
      height: 0,
      length: 0,
    })
  React.useLayoutEffect(() => {
    stickRef.current = stuck
  }, [stuck])
  const jump = () => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
      setStuck(true)
      setUnread(0)
    }
  }
  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const prev = before.current,
      first = messages[0]?.id,
      last = messages.at(-1)?.id,
      prepend =
        prev.first !== undefined &&
        first !== prev.first &&
        messages.some((message) => message.id === prev.first)
    if (prepend) el.scrollTop += el.scrollHeight - prev.height
    else if (autoScroll && stickRef.current) el.scrollTop = el.scrollHeight
    else if (last !== prev.last && messages.length > prev.length)
      setUnread((count) => count + messages.length - prev.length)
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 72
    stickRef.current = near
    setStuck(near)
    if (near) setUnread(0)
    before.current = { first, last, height: el.scrollHeight, length: messages.length }
  }, [messages, autoScroll])
  React.useEffect(() => {
    const previous = previousMessages.current,
      oldIds = new Set(previous.map((message) => message.id)),
      last = previous.at(-1)?.id,
      start = last ? messages.findIndex((message) => message.id === last) + 1 : 0,
      currentIds = new Set(messages.map((message) => message.id))
    if (!last || start > 0)
      for (const message of messages.slice(start))
        if (!oldIds.has(message.id)) pendingAnnouncements.current.add(message.id)
    for (const id of pendingAnnouncements.current)
      if (!currentIds.has(id)) pendingAnnouncements.current.delete(id)
    const completed = messages.filter(
      (message) => pendingAnnouncements.current.has(message.id) && message.status !== 'streaming',
    )
    if (completed.length) {
      setAnnouncement({
        id: completed.at(-1)!.id,
        text: completed
          .map(
            (message) =>
              `${message.author ?? message.role}: ${message.copyText ?? (typeof message.content === 'string' ? message.content : 'New message.')}`,
          )
          .join('\n'),
      })
      for (const message of completed) pendingAnnouncements.current.delete(message.id)
    }
    previousMessages.current = messages
  }, [messages])
  React.useEffect(() => {
    const el = scrollRef.current,
      content = el?.querySelector('[data-conversation-content]')
    if (!el || !content || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (autoScroll && stickRef.current) el.scrollTop = el.scrollHeight
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 72
      stickRef.current = near
      setStuck(near)
      if (near) setUnread(0)
      before.current.height = el.scrollHeight
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [autoScroll])
  const load = () => {
    if (!action.busy && !loading && onLoadEarlier)
      void action.run((signal) => onLoadEarlier({ signal }))
  }
  const valid =
    new Set(messages.map((message) => message.id)).size === messages.length &&
    messages.every((message) => !!message.id)
  return (
    <Context.Provider
      value={{
        messages,
        label,
        height,
        loading,
        hasEarlier,
        onLoadEarlier,
        renderMessage,
        emptyState,
        footer,
        autoScroll,
        textAnimation,
        charactersPerSecond,
        scrollRef,
        stuck,
        setStuck: (value) => {
          stickRef.current = value
          setStuck(value)
        },
        unread,
        setUnread,
        busy: action.busy,
        load,
        jump,
      }}
    >
      <section
        {...props}
        data-slot="conversation"
        aria-label={label}
        className={cn(
          'relative w-full min-w-0 overflow-hidden rounded-xl border bg-background',
          className,
        )}
      >
        <div
          role="log"
          aria-live="polite"
          aria-atomic="true"
          aria-relevant="additions text"
          aria-label="Conversation updates"
          className="sr-only"
        >
          {announcement && <p key={announcement.id}>{announcement.text}</p>}
        </div>
        {!valid ? (
          <p role="alert" className="p-4 text-sm text-destructive">
            Messages need unique, stable IDs.
          </p>
        ) : (
          (children ?? (
            <>
              <ConversationMessages />
              <ConversationJumpToLatest />
              {footer && <ConversationFooter>{footer}</ConversationFooter>}
            </>
          ))
        )}
        {action.error && (
          <p role="alert" className="border-t p-3 text-xs text-destructive">
            {action.error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
export function ConversationMessages() {
  const c = useConversation()
  return (
    <div
      ref={c.scrollRef}
      tabIndex={0}
      aria-label="Message transcript"
      className="relative overflow-y-auto overscroll-contain p-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-4"
      style={{ height: clamp(c.height ?? 520, 180, 1600), overflowAnchor: 'none' }}
      onScroll={(event) => {
        const el = event.currentTarget,
          near = el.scrollHeight - el.scrollTop - el.clientHeight < 72
        c.setStuck(near)
        if (near) c.setUnread(0)
      }}
    >
      <div data-conversation-content className="space-y-3">
        {c.hasEarlier && (
          <div className="text-center">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={c.busy || c.loading || !c.onLoadEarlier}
              onClick={c.load}
            >
              {(c.busy || c.loading) && <LoaderCircle className="animate-spin" />}Load earlier
              messages
            </Button>
          </div>
        )}
        {!c.messages.length &&
          !c.loading &&
          (c.emptyState ?? (
            <div
              role="status"
              className="grid min-h-48 place-content-center gap-3 text-center text-sm text-muted-foreground"
            >
              <MessageSquare className="mx-auto size-7" />
              Start a conversation.
            </div>
          ))}
        {c.messages.map((message) => (
          <React.Fragment key={message.id}>
            {c.renderMessage?.(message) ?? (
              <ChatMessage
                textAnimation={c.textAnimation}
                charactersPerSecond={c.charactersPerSecond}
                {...message}
              />
            )}
          </React.Fragment>
        ))}
        {c.loading && (
          <p
            role="status"
            className="flex items-center justify-center gap-2 p-3 text-xs text-muted-foreground"
          >
            <LoaderCircle className="size-4 animate-spin" />
            Loading messages…
          </p>
        )}
      </div>
    </div>
  )
}
export function ConversationJumpToLatest() {
  const c = useConversation()
  return !c.stuck && c.messages.length > 0 ? (
    <div className="pointer-events-none sticky bottom-3 z-10 -mt-10 flex justify-center pb-3">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={c.jump}
        className="pointer-events-auto rounded-full border shadow-sm"
      >
        <ArrowDown />
        {c.unread ? `${c.unread} new ${c.unread === 1 ? 'message' : 'messages'}` : 'Jump to latest'}
      </Button>
    </div>
  ) : null
}
export function ConversationFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div {...props} data-slot="conversation-footer" className={cn('border-t p-3', className)} />
  )
}
