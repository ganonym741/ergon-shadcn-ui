import * as React from 'react'
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  VisibilityState,
  ColumnPinningState,
  ColumnSizingState,
} from '@tanstack/react-table'
import { RefreshCw, Save, Trash2, Loader2 } from 'lucide-react'
import { DataTable, type DataTableProps } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QueryFilter, type FormPlusField } from '@/components/ui/form-plus'
import { readTableView } from '@/lib/table-view'
import { useDebouncedValue } from '@/components/ui/util'
export interface TablePlusParams {
  page: number
  pageSize: number
  keyword: string
  sorting: SortingState
  filters: ColumnFiltersState
  query: Record<string, unknown>
}
export interface SavedTableView {
  name: string
  sorting: SortingState
  filters: ColumnFiltersState
  query: Record<string, unknown>
  keyword: string
  columns?: {
    visibility: VisibilityState
    order: string[]
    pinning: ColumnPinningState
    sizing: ColumnSizingState
  }
}
export interface TableBatchAction<T> {
  key: string
  label: string
  destructive?: boolean
  onAction: (keys: string[], records: T[], signal: AbortSignal) => void | Promise<void>
}
export interface TablePlusProps<T> extends Omit<DataTableProps<T>, 'data'> {
  data?: T[]
  title?: string
  description?: string
  request?: (params: TablePlusParams, signal: AbortSignal) => Promise<{ data: T[]; total: number }>
  onCreate?: () => void
  createLabel?: string
  queryFields?: FormPlusField[]
  views?: SavedTableView[]
  loadViews?: (signal: AbortSignal) => Promise<SavedTableView[]>
  saveView?: (view: SavedTableView, signal: AbortSignal) => Promise<void>
  deleteView?: (name: string, signal: AbortSignal) => Promise<void>
  showViews?: boolean
  batchActions?: TableBatchAction<T>[]
  onSelectedKeysChange?: (keys: string[]) => void
}
const emptyData: never[] = []
export function TablePlus<T>({
  data = emptyData,
  title,
  description,
  request,
  onCreate,
  createLabel = 'New record',
  toolbar,
  queryFields,
  views: providedViews,
  loadViews,
  saveView,
  deleteView,
  showViews = false,
  batchActions = [],
  onSelectedKeysChange,
  ...props
}: TablePlusProps<T>) {
  const [initialView] = React.useState(() => readTableView(props.storageKey))
  const [pagination, setPagination] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: props.pageSize ?? 10,
    }),
    [sorting, setSorting] = React.useState<SortingState>([]),
    [filters, setFilters] = React.useState<ColumnFiltersState>([]),
    [keyword, setKeyword] = React.useState(''),
    [query, setQuery] = React.useState<Record<string, unknown>>({}),
    [selection, setSelection] = React.useState<RowSelectionState>({}),
    [visibility, setVisibility] = React.useState<VisibilityState>(initialView.visibility ?? {}),
    [order, setOrder] = React.useState<string[]>(initialView.order ?? []),
    [pinning, setPinning] = React.useState<ColumnPinningState>(
      initialView.pinning ?? { left: [], right: [] },
    ),
    [sizing, setSizing] = React.useState<ColumnSizingState>(initialView.sizing ?? {}),
    [result, setResult] = React.useState<{ data: T[]; total: number }>({ data: [], total: 0 }),
    [loading, setLoading] = React.useState(false),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(''),
    [revision, refresh] = React.useReducer((n) => n + 1, 0),
    [viewName, setViewName] = React.useState(''),
    [views, setViews] = React.useState<SavedTableView[]>(providedViews ?? [])
  const debounced = useDebouncedValue(keyword),
    cache = React.useRef(new Map<string, T>()),
    operation = React.useRef<AbortController | null>(null),
    key = props.storageKey ?? 'ergonui-table-plus'
  React.useEffect(() => () => operation.current?.abort(), [])
  React.useEffect(() => {
    if (providedViews) setViews(providedViews)
  }, [providedViews])
  React.useEffect(() => {
    if (!showViews) return
    const controller = new AbortController()
    if (loadViews)
      loadViews(controller.signal)
        .then((next) => {
          if (!controller.signal.aborted) setViews(next)
        })
        .catch((cause) => {
          if (!controller.signal.aborted) setError(String(cause))
        })
    else if (!providedViews)
      try {
        const saved = JSON.parse(localStorage.getItem(key + ':views') ?? '[]')
        if (Array.isArray(saved)) setViews(saved)
      } catch {
        // Use the current views when saved browser state is unavailable or malformed.
      }
    return () => controller.abort()
  }, [loadViews, providedViews, key, showViews])
  React.useEffect(() => {
    if (!request) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    request(
      {
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        keyword: debounced,
        sorting,
        filters,
        query,
      },
      controller.signal,
    )
      .then((response) => {
        if (!controller.signal.aborted) setResult(response)
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'Could not load data')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [request, pagination, sorting, filters, query, debounced, revision])
  const filtered = React.useMemo(
    () =>
      request
        ? result.data
        : data.filter((record) =>
            Object.entries(query).every(
              ([key, value]) =>
                value === undefined ||
                value === null ||
                value === '' ||
                String((record as Record<string, unknown>)[key] ?? '')
                  .toLowerCase()
                  .includes(String(value).toLowerCase()),
            ),
          ),
    [data, query, request, result.data],
  )
  const cacheRows = (records: T[], parent?: string) =>
    records.forEach((record, index) => {
      const id =
        props.getRowId?.(record, index) ??
        (parent === undefined ? String(index) : `${parent}.${index}`)
      cache.current.set(id, record)
      const children = props.getSubRows?.(record)
      if (children?.length) cacheRows(children, id)
    })
  cacheRows(filtered)
  const keys = Object.keys(selection).filter((key) => selection[key])
  const callback = React.useRef(onSelectedKeysChange)
  callback.current = onSelectedKeysChange
  React.useEffect(
    () => callback.current?.(Object.keys(selection).filter((key) => selection[key])),
    [selection],
  )
  const run = async (task: (signal: AbortSignal) => Promise<void>) => {
    operation.current?.abort()
    const controller = new AbortController()
    operation.current = controller
    setBusy(true)
    setError('')
    try {
      await task(controller.signal)
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Operation failed')
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  const applyView = (name: string) => {
    const view = views.find((view) => view.name === name)
    if (!view) return
    setSorting(view.sorting)
    setFilters(view.filters)
    setKeyword(view.keyword)
    setQuery(view.query)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
    if (view.columns) {
      setVisibility(view.columns.visibility)
      setOrder(view.columns.order)
      setPinning(view.columns.pinning)
      setSizing(view.columns.sizing)
    }
  }
  const storeView = () => {
    if (!viewName.trim()) return
    const view: SavedTableView = {
      name: viewName.trim(),
      sorting,
      filters,
      keyword,
      query,
      columns: { visibility, order, pinning, sizing },
    }
    void run(async (signal) => {
      await saveView?.(view, signal)
      if (signal.aborted) return
      const next = [...views.filter((v) => v.name !== view.name), view]
      setViews(next)
      if (!saveView)
        try {
          localStorage.setItem(key + ':views', JSON.stringify(next))
        } catch {
          // The in-memory view change still applies if browser storage is unavailable.
        }
      setViewName('')
    })
  }
  const tableState = {
    sorting,
    columnFilters: filters,
    globalFilter: keyword,
    rowSelection: selection,
    columnVisibility: visibility,
    columnOrder: order,
    columnPinning: pinning,
    columnSizing: sizing,
    pagination,
  }
  return (
    <section className="space-y-4">
      {(title || onCreate || request) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex gap-2">
            {request && (
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="Reload records"
                onClick={refresh}
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} />
              </Button>
            )}
            {onCreate && (
              <Button size="sm" onClick={onCreate}>
                {createLabel}
              </Button>
            )}
          </div>
        </div>
      )}
      {queryFields?.length ? (
        <QueryFilter
          fields={queryFields}
          columns={3}
          onSubmit={async (values) => {
            setQuery(values)
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          }}
        />
      ) : null}
      {showViews && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
          <select
            aria-label="Saved table views"
            defaultValue=""
            className="h-8 min-w-36 rounded border bg-background px-2 text-xs"
            onChange={(e) => applyView(e.target.value)}
          >
            <option value="">Choose a saved view</option>
            {views.map((view) => (
              <option key={view.name} value={view.name}>
                {view.name}
              </option>
            ))}
          </select>
          <Input
            className="h-8 max-w-40"
            aria-label="New table view name"
            placeholder="Name this view…"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!viewName.trim() || busy}
            onClick={storeView}
          >
            <Save />
            Save view
          </Button>
          {views.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                const view = views.at(-1)!
                void run(async (signal) => {
                  await deleteView?.(view.name, signal)
                  if (signal.aborted) return
                  const next = views.filter((v) => v.name !== view.name)
                  setViews(next)
                  if (!deleteView)
                    try {
                      localStorage.setItem(key + ':views', JSON.stringify(next))
                    } catch {
                      // The in-memory view change still applies if browser storage is unavailable.
                    }
                })
              }}
            >
              <Trash2 />
              Remove last view
            </Button>
          )}
        </div>
      )}
      {keys.length > 0 && batchActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <span className="mr-2 text-xs">{keys.length} selected across pages</span>
          {batchActions.map((action) => (
            <Button
              key={action.key}
              size="sm"
              disabled={busy}
              variant={action.destructive ? 'destructive' : 'outline'}
              onClick={() =>
                void run(async (signal) => {
                  await action.onAction(
                    keys,
                    keys.flatMap((key) =>
                      cache.current.has(key) ? [cache.current.get(key)!] : [],
                    ),
                    signal,
                  )
                  if (!signal.aborted) {
                    setSelection({})
                    refresh()
                  }
                })
              }
            >
              {busy && <Loader2 className="animate-spin" />}
              {action.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setSelection({})}>
            Clear
          </Button>
        </div>
      )}
      {error && !request && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DataTable
        {...props}
        data={filtered}
        toolbar={toolbar}
        loading={loading || props.loading}
        error={error || props.error}
        onRetry={refresh}
        onSelectionChange={props.onSelectionChange}
        tableOptions={{
          ...props.tableOptions,
          manualPagination: !!request,
          manualSorting: !!request,
          manualFiltering: !!request,
          enableGrouping: !request,
          rowCount: request ? result.total : undefined,
          autoResetPageIndex: false,
          onPaginationChange: setPagination,
          onSortingChange: (update) => {
            setSorting(update)
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          },
          onColumnFiltersChange: (update) => {
            setFilters(update)
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          },
          onGlobalFilterChange: (update) => {
            setKeyword(update)
            setPagination((p) => ({ ...p, pageIndex: 0 }))
          },
          onRowSelectionChange: setSelection,
          onColumnVisibilityChange: setVisibility,
          onColumnOrderChange: setOrder,
          onColumnPinningChange: setPinning,
          onColumnSizingChange: setSizing,
          state: { ...tableState, ...props.tableOptions?.state },
        }}
      />
    </section>
  )
}
