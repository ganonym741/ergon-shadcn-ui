import * as React from 'react'
import { Search, MessageSquare, Pin, Pencil, Archive, Trash2, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useControllableState } from '@/components/ui/util'
import { useAsyncAction } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export interface ConversationHistoryItem {
  id: string
  title: string
  updatedAt: string
  group?: string
  pinned?: boolean
  archived?: boolean
  description?: string
}
export type ConversationHistoryAction =
  { kind: 'rename'; title: string } | { kind: 'archive' | 'restore' | 'delete' | 'pin' | 'unpin' }
export interface ConversationHistoryProps extends Omit<React.ComponentProps<'nav'>, 'onSelect'> {
  /** Controlled items. Publish successful persistence results through this prop. */
  items: ConversationHistoryItem[]
  selectedId?: string
  onSelect: (item: ConversationHistoryItem) => void
  onNew?: () => void
  onItemsChange?: (items: ConversationHistoryItem[]) => void
  /** Persist an action and update items, or use onItemsChange to publish the next list. */
  onAction?: (
    item: ConversationHistoryItem,
    action: ConversationHistoryAction,
    options: { signal: AbortSignal },
  ) => void | Promise<void>
  hasMore?: boolean
  onLoadMore?: (options: { signal: AbortSignal }) => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  label?: string
}
/** A data-driven conversation navigator with injected persistence and pagination. */
export function ConversationHistory({
  items,
  selectedId,
  onSelect,
  onNew,
  onItemsChange,
  onAction,
  hasMore = false,
  onLoadMore,
  loading = false,
  disabled = false,
  label = 'Conversation history',
  className,
  ...props
}: ConversationHistoryProps) {
  const [query, setQuery] = React.useState(''),
    [archived, setArchived] = React.useState(false),
    [editing, setEditing] = React.useState<string | null>(null),
    [draft, setDraft] = React.useState(''),
    action = useAsyncAction(),
    [source, setSource] = useControllableState({
      value: items,
      defaultValue: [],
      onChange: onItemsChange,
    })
  const matches = source
      .filter(
        (item) =>
          !!item.archived === archived &&
          `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query.toLowerCase()),
      )
      .sort(
        (a, b) =>
          Number(!!b.pinned) - Number(!!a.pinned) ||
          Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      ),
    groups = [
      ...new Set(
        matches.map((item) =>
          item.pinned ? 'Pinned' : (item.group ?? new Date(item.updatedAt).toLocaleDateString()),
        ),
      ),
    ]
  const change = (item: ConversationHistoryItem, next: ConversationHistoryAction) => {
    if (disabled || action.busy || (!onAction && !onItemsChange)) return
    void action.run(async (signal) => {
      await onAction?.(item, next, { signal })
      if (signal.aborted) return
      setSource((previous) =>
        next.kind === 'delete'
          ? previous.filter((entry) => entry.id !== item.id)
          : previous.map((entry) =>
              entry.id !== item.id
                ? entry
                : next.kind === 'rename'
                  ? { ...entry, title: next.title }
                  : next.kind === 'archive' || next.kind === 'restore'
                    ? { ...entry, archived: next.kind === 'archive' }
                    : { ...entry, pinned: next.kind === 'pin' },
            ),
      )
      setEditing(null)
    })
  }
  const valid =
      source.every(
        (item) => item.id && item.title && Number.isFinite(Date.parse(item.updatedAt)),
      ) && new Set(source.map((item) => item.id)).size === source.length,
    mutable = !!onAction || !!onItemsChange
  return (
    <nav
      {...props}
      data-slot="conversation-history"
      aria-label={label}
      className={cn('w-full min-w-0 space-y-3 rounded-xl border bg-background p-3', className)}
    >
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 text-sm font-semibold">{label}</h3>
        {onNew && (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="New conversation"
            disabled={disabled}
            onClick={onNew}
          >
            <Plus />
          </Button>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          aria-label="Search conversations"
          placeholder="Search conversations…"
          className="ps-9"
          value={query}
          onValueChange={setQuery}
        />
      </div>
      <div className="flex gap-1" role="group" aria-label="History filter">
        {['Active', 'Archived'].map((filter, index) => (
          <Button
            key={filter}
            type="button"
            variant={archived === !!index ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setArchived(!!index)}
            aria-pressed={archived === !!index}
          >
            {filter}
          </Button>
        ))}
      </div>
      {!valid ? (
        <p role="alert" className="text-xs text-destructive">
          Conversations need unique IDs, titles and valid dates.
        </p>
      ) : (
        <div className="max-h-[30rem] space-y-4 overflow-auto">
          {groups.map((group) => (
            <section key={group} aria-label={group}>
              <h4 className="mb-1 px-2 text-[10px] font-medium text-muted-foreground">{group}</h4>
              <ul className="space-y-1">
                {matches
                  .filter(
                    (item) =>
                      (item.pinned
                        ? 'Pinned'
                        : (item.group ?? new Date(item.updatedAt).toLocaleDateString())) === group,
                  )
                  .map((item) => (
                    <li
                      key={item.id}
                      className={cn(
                        'group rounded-lg border border-transparent',
                        selectedId === item.id && 'border-border bg-accent',
                      )}
                    >
                      {editing === item.id ? (
                        <form
                          className="flex items-center gap-1 p-2"
                          onSubmit={(event) => {
                            event.preventDefault()
                            if (draft.trim()) change(item, { kind: 'rename', title: draft.trim() })
                          }}
                        >
                          <Input
                            aria-label="Conversation title"
                            value={draft}
                            autoFocus
                            onValueChange={setDraft}
                            disabled={action.busy}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Save conversation title"
                            disabled={!draft.trim() || action.busy}
                          >
                            <Check />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Cancel rename"
                            disabled={action.busy}
                            onClick={() => setEditing(null)}
                          >
                            <X />
                          </Button>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onSelect(item)}
                            aria-current={selectedId === item.id ? 'page' : undefined}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate text-xs">{item.title}</span>
                            {item.pinned && <Pin className="size-3 text-muted-foreground" />}
                          </button>
                          {mutable && (
                            <div className="flex items-center gap-1 px-2 pb-1">
                              {(
                                [
                                  {
                                    kind: item.pinned ? 'unpin' : 'pin',
                                    label: item.pinned ? 'Unpin' : 'Pin',
                                    Icon: Pin,
                                  },
                                  { kind: 'rename', label: 'Rename', Icon: Pencil },
                                  {
                                    kind: item.archived ? 'restore' : 'archive',
                                    label: item.archived ? 'Restore' : 'Archive',
                                    Icon: Archive,
                                  },
                                  { kind: 'delete', label: 'Delete', Icon: Trash2 },
                                ] as const
                              ).map(({ kind, label: actionLabel, Icon }) => (
                                <Button
                                  key={kind}
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label={`${actionLabel} ${item.title}`}
                                  disabled={disabled || action.busy}
                                  onClick={() => {
                                    if (kind === 'rename') {
                                      setDraft(item.title)
                                      setEditing(item.id)
                                    } else change(item, { kind })
                                  }}
                                >
                                  <Icon />
                                </Button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          {!matches.length && (
            <p role="status" className="p-5 text-center text-xs text-muted-foreground">
              No conversations found.
            </p>
          )}
        </div>
      )}
      {hasMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={disabled || loading || action.busy || !onLoadMore}
          onClick={() => void action.run((signal) => onLoadMore?.({ signal }))}
        >
          {loading || action.busy ? 'Loading…' : 'Load more conversations'}
        </Button>
      )}
      {action.error && (
        <p role="alert" className="text-xs text-destructive">
          {action.error}
        </p>
      )}
    </nav>
  )
}
