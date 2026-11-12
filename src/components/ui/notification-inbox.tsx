import * as React from 'react'
import { Bell, CheckCheck, Archive, ArchiveRestore, Trash2, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useControllableState } from '@/components/ui/util'
import { useAsyncAction, productURL } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
import { useUIConfig } from '@/components/ui/config-provider'

export interface InboxNotification {
  id: string
  title: string
  description?: string
  createdAt: string
  read?: boolean
  archived?: boolean
  category?: string
  href?: string
  action?: { label: string; id: string }
  avatar?: string
}
export interface NotificationInboxProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'defaultValue'
> {
  items?: InboxNotification[]
  defaultItems?: InboxNotification[]
  onItemsChange?: (items: InboxNotification[]) => void
  onAction?: (
    item: InboxNotification,
    action: 'read' | 'unread' | 'archive' | 'delete' | string,
    context: { signal: AbortSignal },
  ) => void | Promise<void>
  onLoadMore?: (context: { signal: AbortSignal }) => void | Promise<void>
  hasMore?: boolean
  loading?: boolean
  disabled?: boolean
  label?: string
  filter?: 'all' | 'unread' | 'archived'
  defaultFilter?: 'all' | 'unread' | 'archived'
  onFilterChange?: (filter: 'all' | 'unread' | 'archived') => void
  renderItem?: (item: InboxNotification) => React.ReactNode
}
interface InboxContext {
  items: InboxNotification[]
  visible: InboxNotification[]
  unread: number
  disabled: boolean
  busy: boolean
  filter: 'all' | 'unread' | 'archived'
  setFilter: (filter: 'all' | 'unread' | 'archived') => void
  act: (item: InboxNotification, action: string) => void
  markAll: () => void
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  label: string
  renderItem?: NotificationInboxProps['renderItem']
}
const Context = React.createContext<InboxContext | null>(null)
const useInbox = () => {
  const value = React.useContext(Context)
  if (!value) throw new Error('Inbox parts need NotificationInbox.')
  return value
}
/** Persistent-notification UI with application-injected actions and cancellable loading. */
export function NotificationInbox({
  items,
  defaultItems = [],
  onItemsChange,
  onAction,
  onLoadMore,
  hasMore = false,
  loading = false,
  disabled = false,
  label = 'Notifications',
  filter,
  defaultFilter = 'all',
  onFilterChange,
  renderItem,
  children,
  className,
  ...props
}: NotificationInboxProps) {
  const [data, setData] = useControllableState({
    value: items,
    defaultValue: defaultItems,
    onChange: onItemsChange,
  })
  const [active, setActive] = useControllableState({
    value: filter,
    defaultValue: defaultFilter,
    onChange: onFilterChange,
  })
  const action = useAsyncAction(),
    valid =
      new Set(data.map((item) => item.id)).size === data.length &&
      data.every((item) => item.id && item.title && !Number.isNaN(Date.parse(item.createdAt)))
  const act = (item: InboxNotification, kind: string) => {
    if (disabled || action.busy) return
    void action.run(async (signal) => {
      await onAction?.(item, kind, { signal })
      if (signal.aborted) return
      setData((previous) =>
        kind === 'delete'
          ? previous.filter((row) => row.id !== item.id)
          : previous.map((row) =>
              row.id !== item.id
                ? row
                : kind === 'read'
                  ? { ...row, read: true }
                  : kind === 'unread'
                    ? { ...row, read: false }
                    : kind === 'archive'
                      ? { ...row, archived: true }
                      : kind === 'restore'
                        ? { ...row, archived: false }
                        : row,
            ),
      )
    })
  }
  const unread = data.filter((item) => !item.read && !item.archived).length
  const visible = data
    .filter((item) =>
      active === 'archived' ? item.archived : !item.archived && (active !== 'unread' || !item.read),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return (
    <Context.Provider
      value={{
        items: data,
        visible,
        unread,
        disabled,
        busy: action.busy,
        filter: active,
        setFilter: setActive,
        act,
        label,
        loading,
        hasMore,
        renderItem,
        markAll: () => {
          if (disabled || action.busy) return
          void action.run(async (signal) => {
            for (const item of data.filter((row) => !row.read && !row.archived)) {
              if (signal.aborted) return
              await onAction?.(item, 'read', { signal })
              if (!signal.aborted)
                setData((previous) =>
                  previous.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
                )
            }
          })
        },
        loadMore: () => {
          if (onLoadMore && !disabled && !loading && !action.busy)
            void action.run((signal) => onLoadMore({ signal }))
        },
      }}
    >
      <section
        {...props}
        data-slot="notification-inbox"
        aria-label={label}
        aria-busy={loading || action.busy}
        className={cn('w-full min-w-0 overflow-hidden rounded-xl border bg-background', className)}
      >
        {!valid ? (
          <p role="alert" className="p-4 text-sm text-destructive">
            Notifications need unique IDs, titles and valid dates.
          </p>
        ) : (
          (children ?? (
            <>
              <NotificationInboxHeader />
              <NotificationInboxList />
            </>
          ))
        )}
        {action.error && (
          <p role="alert" className="border-t p-3 text-sm text-destructive">
            {action.error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
/** Composable inbox heading, unread badge, read-all action and view filters. */
export function NotificationInboxHeader() {
  const c = useInbox()
  return (
    <header className="space-y-3 border-b p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Bell className="size-4 text-primary" />
        <h3 className="flex-1 font-semibold">{c.label}</h3>
        <span dir="ltr" className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
          {c.unread} unread
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Mark all notifications read"
          disabled={c.disabled || c.busy || !c.unread}
          onClick={c.markAll}
        >
          <CheckCheck />
        </Button>
      </div>
      <div role="group" aria-label="Notification filter" className="flex flex-wrap gap-1">
        {(['all', 'unread', 'archived'] as const).map((filter) => (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={c.filter === filter ? 'secondary' : 'ghost'}
            aria-pressed={c.filter === filter}
            onClick={() => c.setFilter(filter)}
          >
            {filter[0].toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>
    </header>
  )
}
/** Shows real supplied notifications and an explicit application-owned pagination action. */
export function NotificationInboxList() {
  const c = useInbox()
  return (
    <div className="max-h-[32rem] overflow-auto">
      {c.visible.length ? (
        <ul className="divide-y">
          {c.visible.map((item) => (
            <NotificationInboxItem key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <p role="status" className="p-8 text-center text-sm text-muted-foreground">
          {c.loading ? 'Loading notifications…' : 'You’re all caught up.'}
        </p>
      )}
      {c.hasMore && (
        <div className="border-t p-3 text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={c.disabled || c.loading || c.busy}
            onClick={c.loadMore}
          >
            {c.loading ? <Loader2 className="animate-spin" /> : null}Load more notifications
          </Button>
        </div>
      )}
    </div>
  )
}
/** One notification, with scoped actions and inert handling of invalid links. */
export function NotificationInboxItem({ item }: { item: InboxNotification }) {
  const c = useInbox(),
    { locale } = useUIConfig(),
    href = item.href && productURL(item.href)
  return (
    <li className={cn('space-y-2 p-4', !item.read && !item.archived && 'bg-primary/5')}>
      {c.renderItem ? (
        c.renderItem(item)
      ) : (
        <>
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                !item.read ? 'bg-primary' : 'bg-muted',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium">
                {href ? (
                  <a href={href} className="underline-offset-4 hover:underline">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </p>
              {item.description && (
                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}
              <time
                dateTime={item.createdAt}
                className="mt-1 block text-[11px] text-muted-foreground"
              >
                {new Date(item.createdAt).toLocaleString(locale)}
              </time>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 ps-5">
            {item.action && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={c.disabled || c.busy}
                onClick={() => c.act(item, item.action!.id)}
              >
                {item.action.label}
              </Button>
            )}
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`Mark ${item.title} ${item.read ? 'unread' : 'read'}`}
              disabled={c.disabled || c.busy}
              onClick={() => c.act(item, item.read ? 'unread' : 'read')}
            >
              <Check />
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`${item.archived ? 'Restore' : 'Archive'} ${item.title}`}
              disabled={c.disabled || c.busy}
              onClick={() => c.act(item, item.archived ? 'restore' : 'archive')}
            >
              {item.archived ? <ArchiveRestore /> : <Archive />}
            </Button>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              aria-label={`Delete ${item.title}`}
              disabled={c.disabled || c.busy}
              onClick={() => c.act(item, 'delete')}
            >
              <Trash2 />
            </Button>
          </div>
        </>
      )}
    </li>
  )
}
