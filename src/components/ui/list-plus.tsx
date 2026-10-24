import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { List } from '@/components/ui/list'
import { useDebouncedValue } from '@/components/ui/util'
export interface ListPlusProps<T> {
  items: T[]
  getKey: (item: T) => string
  getSearchText: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  pageSize?: number
  onSelectionChange?: (keys: string[]) => void
  grid?: boolean
  toolbar?: React.ReactNode
  virtual?: boolean
  infinite?: boolean
  request?: (
    params: { page: number; pageSize: number; query: string },
    signal: AbortSignal,
  ) => Promise<{ items: T[]; total: number }>
}
export function ListPlus<T>({
  items,
  getKey,
  getSearchText,
  renderItem,
  pageSize = 5,
  onSelectionChange,
  grid,
  toolbar,
  virtual,
  request,
  infinite,
}: ListPlusProps<T>) {
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(0)
  const [selected, setSelected] = React.useState<string[]>([])
  const [remote, setRemote] = React.useState<{ items: T[]; total: number }>({
      items: [],
      total: 0,
    }),
    [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState(''),
    [revision, reload] = React.useReducer((n) => n + 1, 0),
    query = useDebouncedValue(search)
  React.useEffect(() => {
    if (!request) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    request({ page: page + 1, pageSize, query }, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setRemote((previous) =>
            infinite && page > 0
              ? {
                  items: [
                    ...previous.items.filter(
                      (item) => !result.items.some((next) => getKey(next) === getKey(item)),
                    ),
                    ...result.items,
                  ],
                  total: result.total,
                }
              : result,
          )
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(String(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [request, page, pageSize, query, revision, infinite])
  const filtered = request
    ? remote.items
    : items.filter((item) => getSearchText(item).toLowerCase().includes(search.toLowerCase()))
  const total = request ? remote.total : filtered.length,
    pages = Math.max(1, Math.ceil(total / pageSize))
  React.useEffect(() => setPage((p) => Math.min(p, pages - 1)), [pages])
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          aria-label="Search list"
          className="max-w-xs"
          placeholder="Search items…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
        {toolbar}
        {onSelectionChange && (
          <span className="ml-auto text-xs text-muted-foreground">{selected.length} selected</span>
        )}
      </div>
      {error && (
        <div role="alert" className="text-sm text-destructive">
          {error}
          <Button size="sm" variant="ghost" onClick={reload}>
            Retry
          </Button>
        </div>
      )}
      <List
        virtual={virtual}
        loading={loading}
        hasMore={
          !!infinite &&
          (request ? remote.items.length < remote.total : (page + 1) * pageSize < filtered.length)
        }
        onLoadMore={() => {
          if (!loading) setPage((previous) => previous + 1)
        }}
        items={
          request
            ? filtered
            : infinite
              ? filtered.slice(0, (page + 1) * pageSize)
              : virtual
                ? filtered
                : filtered.slice(page * pageSize, (page + 1) * pageSize)
        }
        grid={grid}
        getKey={getKey}
        renderItem={(item) => (
          <div className="flex items-start gap-3">
            {onSelectionChange && (
              <Checkbox
                aria-label={`Select ${getKey(item)}`}
                checked={selected.includes(getKey(item))}
                onCheckedChange={(v) => {
                  const next = v
                    ? [...selected, getKey(item)]
                    : selected.filter((k) => k !== getKey(item))
                  setSelected(next)
                  onSelectionChange(next)
                }}
              />
            )}
            <div className="min-w-0 flex-1">{renderItem(item)}</div>
          </div>
        )}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} items</span>
        {!infinite && (!virtual || request) && (
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {page + 1} / {pages}
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
