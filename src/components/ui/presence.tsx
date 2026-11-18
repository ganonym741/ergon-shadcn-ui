import * as React from 'react'
import { Users, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { useUIConfig } from '@/components/ui/config-provider'
import { clamp, productURL } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'

export interface PresenceUser {
  id: string
  name: string
  avatar?: string
  color?: string
  status?: 'online' | 'away' | 'offline'
  typing?: boolean
  cursor?: { x: number; y: number }
  lastSeen?: number
}
export interface PresenceProps extends React.ComponentProps<'section'> {
  users: PresenceUser[]
  currentUserId?: string
  connection?: 'online' | 'reconnecting' | 'offline'
  maxVisible?: number
  staleAfter?: number
  onCursorChange?: (point: { x: number; y: number } | null) => void
  renderAvatar?: (user: PresenceUser) => React.ReactNode
  label?: string
}
interface PresenceContext extends Pick<
  PresenceProps,
  'currentUserId' | 'onCursorChange' | 'renderAvatar'
> {
  users: PresenceUser[]
  maxVisible: number
  connection: 'online' | 'reconnecting' | 'offline'
}
const Context = React.createContext<PresenceContext | null>(null)
const usePresence = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Presence parts need Presence.')
  return c
}
/** Presents application-supplied presence; no hosted service or transport is assumed. */
export function Presence({
  users,
  currentUserId,
  connection = 'online',
  maxVisible = 5,
  staleAfter = 30000,
  onCursorChange,
  renderAvatar,
  label = 'Team presence',
  className,
  children,
  ...props
}: PresenceProps) {
  const [now, setNow] = React.useState(Date.now)
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), clamp(staleAfter, 1000, 10000))
    return () => clearInterval(timer)
  }, [staleAfter])
  const valid =
    users.every((user) => user.id && user.name) &&
    new Set(users.map((user) => user.id)).size === users.length
  const active = users.filter(
    (user) =>
      user.status !== 'offline' &&
      (user.lastSeen === undefined ||
        (Number.isFinite(user.lastSeen) && now - user.lastSeen <= clamp(staleAfter, 0, 86400000))),
  )
  return (
    <Context.Provider
      value={{
        users: active,
        currentUserId,
        connection,
        maxVisible: Math.floor(clamp(maxVisible, 1, 30)),
        onCursorChange,
        renderAvatar,
      }}
    >
      <section
        {...props}
        data-slot="presence"
        aria-label={label}
        className={cn('w-full min-w-0 space-y-3', className)}
      >
        {!valid ? (
          <p role="alert" className="text-sm text-destructive">
            Presence users need unique IDs and names.
          </p>
        ) : (
          (children ?? (
            <>
              <PresenceAvatars />
              <PresenceCanvas />
              <PresenceTyping />
            </>
          ))
        )}
      </section>
    </Context.Provider>
  )
}
/** Online participants, overflow count and reconnect status, with native-name tooltips. */
export function PresenceAvatars() {
  const c = usePresence()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Users className="size-4 text-muted-foreground" />
      <ul aria-label="Online participants" className="flex -space-x-2 rtl:space-x-reverse">
        {c.users.slice(0, c.maxVisible).map((user) => (
          <li
            key={user.id}
            title={`${user.name}${user.id === c.currentUserId ? ' (you)' : ''}${user.status === 'away' ? ' · away' : ''}`}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
            aria-label={`${user.name}${user.status === 'away' ? ', away' : ''}`}
          >
            {c.renderAvatar ? (
              c.renderAvatar(user)
            ) : user.avatar && productURL(user.avatar, true) ? (
              <img src={user.avatar} alt="" className="size-full rounded-full object-cover" />
            ) : (
              user.name
                .split(/\s+/)
                .map((part) => part[0])
                .slice(0, 2)
                .join('')
            )}
            <span
              aria-hidden
              className={cn(
                'absolute bottom-0 end-0 size-2.5 rounded-full border border-background',
                user.status === 'away' ? 'bg-amber-500' : 'bg-emerald-600',
              )}
            />
          </li>
        ))}
      </ul>
      {c.users.length > c.maxVisible && (
        <span className="text-xs text-muted-foreground">+{c.users.length - c.maxVisible} more</span>
      )}
      <span
        role="status"
        className="ms-auto flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        {c.connection === 'online' ? (
          <Wifi className="size-3.5" />
        ) : c.connection === 'offline' ? (
          <WifiOff className="size-3.5" />
        ) : (
          <Loader2 className="size-3.5 animate-spin" />
        )}
        {c.connection}
      </span>
    </div>
  )
}
/** Coordinate-normalized cursor surface. The application publishes and receives presence events. */
export function PresenceCanvas({ className, children, ...props }: React.ComponentProps<'div'>) {
  const c = usePresence(),
    frame = React.useRef<number | null>(null),
    pending = React.useRef<{ x: number; y: number } | null>(null),
    publish = React.useRef(c.onCursorChange),
    config = useUIConfig()
  React.useLayoutEffect(() => {
    publish.current = c.onCursorChange
  }, [c.onCursorChange])
  React.useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      publish.current?.(null)
    },
    [],
  )
  return (
    <div
      {...props}
      dir="ltr"
      data-slot="presence-canvas"
      className={cn(
        'relative min-h-48 overflow-hidden rounded-xl border bg-muted/20 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px]',
        className,
      )}
      onPointerMove={(event) => {
        props.onPointerMove?.(event)
        if (event.defaultPrevented || c.connection !== 'online') return
        const box = event.currentTarget.getBoundingClientRect()
        pending.current = {
          x: clamp((event.clientX - box.left) / box.width, 0, 1),
          y: clamp((event.clientY - box.top) / box.height, 0, 1),
        }
        if (frame.current === null)
          frame.current = requestAnimationFrame(() => {
            frame.current = null
            c.onCursorChange?.(pending.current)
          })
      }}
      onPointerLeave={(event) => {
        props.onPointerLeave?.(event)
        if (frame.current !== null) cancelAnimationFrame(frame.current)
        frame.current = null
        c.onCursorChange?.(null)
      }}
    >
      <div dir={config.direction}>
        {children ?? (
          <p className="p-5 text-xs text-muted-foreground">
            Move your pointer here. Remote cursors are supplied by your application.
          </p>
        )}
      </div>
      {c.users
        .filter((user) => user.id !== c.currentUserId && user.cursor)
        .map((user) => (
          <div
            key={user.id}
            data-slot="presence-cursor"
            data-user-id={user.id}
            aria-hidden="true"
            className="pointer-events-none absolute z-10 max-w-32 motion-safe:transition-[left,top]"
            style={{
              left: `${clamp(user.cursor!.x, 0, 1) * 100}%`,
              top: `${clamp(user.cursor!.y, 0, 1) * 100}%`,
              color: /^#[\da-f]{6}$/i.test(user.color ?? '') ? user.color : '#5579bd',
            }}
          >
            <svg
              aria-hidden
              width="18"
              height="22"
              viewBox="0 0 18 22"
              style={{
                transformOrigin: 'top left',
                transform: `scale(${user.cursor!.x > 0.95 ? -1 : 1},${user.cursor!.y > 0.9 ? -1 : 1})`,
              }}
            >
              <path
                d="M1 1v17l5-4 4 7 3-2-4-6 7-2Z"
                fill="currentColor"
                stroke="var(--background)"
              />
            </svg>
            <span
              className="absolute block max-w-32 truncate whitespace-nowrap rounded-md border bg-background px-2 py-1 text-[11px] text-foreground shadow-sm"
              style={{
                top: user.cursor!.y > 0.75 ? '-2rem' : '1.5rem',
                ...(user.cursor!.x > 0.7 ? { right: '.25rem' } : { left: '.75rem' }),
              }}
            >
              {user.name}
            </span>
          </div>
        ))}
    </div>
  )
}
/** Announces supplied typing state without pretending to establish a realtime connection. */
export function PresenceTyping() {
  const c = usePresence(),
    names = c.users
      .filter((user) => user.typing && user.id !== c.currentUserId)
      .map((user) => user.name)
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
      {names.length
        ? `${names.slice(0, 3).join(', ')}${names.length > 3 ? ' and others' : ''} ${names.length === 1 ? 'is' : 'are'} typing…`
        : 'No one is typing.'}
    </p>
  )
}
