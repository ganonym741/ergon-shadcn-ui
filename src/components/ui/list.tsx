import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
export interface ListProps<T> {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T, index: number) => React.ReactNode
  empty?: React.ReactNode
  className?: string
  grid?: boolean
  virtual?: boolean
  height?: number
  estimateSize?: number
  hasMore?: boolean
  loading?: boolean
  onLoadMore?: () => void | Promise<void>
}
export function List<T>({
  items,
  getKey,
  renderItem,
  empty = 'No items to display',
  className,
  grid,
  virtual,
  height = 400,
  estimateSize = 80,
  hasMore,
  loading,
  onLoadMore,
}: ListProps<T>) {
  const root = React.useRef<HTMLDivElement>(null),
    sentinel = React.useRef<HTMLDivElement>(null),
    [width, setWidth] = React.useState(0),
    [pending, setPending] = React.useState(false),
    columns = grid && width >= 540 ? 2 : 1
  React.useEffect(() => {
    if (!root.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])
  const load = React.useCallback(async () => {
    if (!hasMore || loading || pending || !onLoadMore) return
    setPending(true)
    try {
      await onLoadMore()
    } finally {
      setPending(false)
    }
  }, [hasMore, loading, pending, onLoadMore])
  React.useEffect(() => {
    if (!sentinel.current || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void load()
      },
      { root: virtual ? root.current : null, rootMargin: '100px' },
    )
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [load, hasMore, virtual])
  const list = useVirtualizer({
    count: Math.ceil(items.length / columns),
    getScrollElement: () => root.current,
    estimateSize: () => estimateSize,
    overscan: 4,
    enabled: !!virtual,
    initialRect: { width: 600, height },
  })
  const item = (record: T, index: number) => (
    <div
      role="listitem"
      key={getKey(record)}
      aria-posinset={index + 1}
      aria-setsize={items.length}
      className={cn('p-4', grid ? 'rounded-lg border' : 'border-b last:border-0')}
    >
      {renderItem(record, index)}
    </div>
  )
  return (
    <div
      ref={root}
      tabIndex={virtual ? 0 : undefined}
      aria-label={virtual ? 'Scrollable collection' : undefined}
      className={cn(virtual && 'overflow-auto', className)}
      style={virtual ? { height } : undefined}
      onScroll={() => {
        const el = root.current
        if (virtual && el && el.scrollHeight - el.scrollTop - el.clientHeight < 100) void load()
      }}
    >
      {items.length ? (
        <div
          role="list"
          aria-busy={loading || pending}
          className={cn('relative', !grid && 'rounded-lg border', grid && !virtual && 'grid gap-3')}
          style={
            virtual
              ? { height: list.getTotalSize() }
              : grid
                ? { gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }
                : undefined
          }
        >
          {virtual
            ? list.getVirtualItems().map((row) => (
                <div
                  key={row.key}
                  data-index={row.index}
                  ref={list.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${row.start}px)`,
                    display: grid ? 'grid' : 'block',
                    gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`,
                    gap: 12,
                  }}
                  role="presentation"
                >
                  {items
                    .slice(row.index * columns, (row.index + 1) * columns)
                    .map((record, i) => item(record, row.index * columns + i))}
                </div>
              ))
            : items.map(item)}
        </div>
      ) : (
        <div className="p-10 text-center text-sm text-muted-foreground">{empty}</div>
      )}
      <div ref={sentinel}>
        {(loading || pending) && (
          <p role="status" className="p-3 text-center text-xs">
            Loading more…
          </p>
        )}
        {hasMore && (
          <button
            type="button"
            disabled={loading || pending}
            onClick={() => void load()}
            className="w-full p-3 text-xs text-primary"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  )
}
