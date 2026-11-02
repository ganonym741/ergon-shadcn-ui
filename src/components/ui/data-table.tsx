import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type ExpandedState,
  type GroupingState,
  type ColumnPinningState,
  type ColumnSizingState,
  type PaginationState,
  type TableOptions,
  type Column,
  type Row,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Download,
  Pin,
  PinOff,
  Search,
  X,
  Loader2,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useUIConfig } from '@/components/ui/config-provider'
import { cn } from '@/lib/utils'
import { downloadCSV } from '@/lib/data-utils'
import { readTableView } from '@/lib/table-view'
import { planCellSpans, type CellSpan } from '@/lib/cell-spans'
export type { ColumnDef } from '@tanstack/react-table'
export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  getRowId?: (row: T, index: number) => string
  getSubRows?: (row: T) => T[] | undefined
  selection?: boolean
  searchable?: boolean
  toolbar?: React.ReactNode
  pagination?: boolean
  pageSize?: number
  virtual?: boolean
  virtualColumns?: boolean
  height?: number
  loading?: boolean
  error?: string
  onRetry?: () => void
  className?: string
  density?: 'comfortable' | 'compact'
  onDataChange?: (rows: T[]) => void
  onCellEdit?: (row: T, columnId: string, value: unknown) => void
  onSelectionChange?: (rows: T[]) => void
  rowExpansion?: (row: T) => React.ReactNode
  getCellProps?: (row: T, columnId: string, index: number) => Partial<CellSpan> | undefined
  tableOptions?: Partial<Omit<TableOptions<T>, 'data' | 'columns' | 'getCoreRowModel'>>
  exportName?: string
  caption?: string
  storageKey?: string
  reorderable?: boolean
  onRowOrderChange?: (rows: T[]) => void
  summary?: (rows: T[]) => React.ReactNode
}
export interface EditableColumnMeta {
  editable?: boolean
  inputType?: 'text' | 'number' | 'date' | 'email'
  validate?: (value: unknown) => string | undefined
}
export function DataTable<T>({
  data,
  columns,
  getRowId,
  getSubRows,
  selection = true,
  searchable = true,
  toolbar,
  pagination = true,
  pageSize = 10,
  virtual = false,
  virtualColumns = false,
  height = 420,
  loading,
  error,
  onRetry,
  className,
  density,
  onDataChange,
  onCellEdit,
  onSelectionChange,
  rowExpansion,
  getCellProps,
  tableOptions,
  exportName = 'data.csv',
  caption = 'Data table',
  storageKey,
  reorderable = false,
  onRowOrderChange,
  summary,
}: DataTableProps<T>) {
  const config = useUIConfig(),
    tableId = React.useId(),
    [saved] = React.useState(() => readTableView(storageKey))
  const [sorting, setSorting] = React.useState<SortingState>(
      tableOptions?.initialState?.sorting ?? [],
    ),
    [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
      tableOptions?.initialState?.columnFilters ?? [],
    ),
    [globalFilter, setGlobalFilter] = React.useState(
      tableOptions?.initialState?.globalFilter ?? '',
    ),
    [visibility, setVisibility] = React.useState<VisibilityState>(saved.visibility ?? {}),
    [selected, setSelected] = React.useState<RowSelectionState>({}),
    [expanded, setExpanded] = React.useState<ExpandedState>(
      tableOptions?.initialState?.expanded ?? {},
    ),
    [grouping, setGrouping] = React.useState<GroupingState>(
      tableOptions?.initialState?.grouping ?? [],
    ),
    [pinning, setPinning] = React.useState<ColumnPinningState>(
      saved.pinning ?? { left: [], right: [] },
    ),
    [order, setOrder] = React.useState<string[]>(saved.order ?? []),
    [sizing, setSizing] = React.useState<ColumnSizingState>(saved.sizing ?? {}),
    [pages, setPages] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize,
      ...tableOptions?.initialState?.pagination,
    }),
    [edit, setEdit] = React.useState<{
      row: string
      column: string
      value: string
      error?: string
    }>(),
    [viewport, setViewport] = React.useState({ width: 800, left: 0 })
  const ref = React.useRef<HTMLDivElement>(null),
    committed = React.useRef(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const resize = () => setViewport((p) => ({ ...p, width: el.clientWidth || 800 }))
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()
    return () => observer.disconnect()
  }, [])
  const reorder = React.useCallback(
    (from: number, to: number) => {
      const callback = onRowOrderChange ?? onDataChange
      if (!callback || from === to || from < 0 || to < 0 || to >= data.length) return
      const next = [...data],
        moved = next.splice(from, 1)[0]
      next.splice(to, 0, moved)
      callback(next)
    },
    [data, onRowOrderChange, onDataChange],
  )
  const defs = React.useMemo<ColumnDef<T, any>[]>(
    () => [
      ...(reorderable
        ? [
            {
              id: '_reorder',
              size: 36,
              minSize: 36,
              maxSize: 36,
              enableSorting: false,
              enableHiding: false,
              enableResizing: false,
              header: () => null,
              cell: ({ row, table }: any) => {
                const can =
                  !row.depth &&
                  !table.getState().sorting.length &&
                  !table.getState().grouping.length &&
                  !!(onRowOrderChange ?? onDataChange)
                return (
                  <button
                    type="button"
                    draggable={can}
                    disabled={!can}
                    aria-label={`Move row ${row.id}; Alt Arrow Up or Down`}
                    title="Drag, or use Alt + Arrow Up/Down"
                    className="text-muted-foreground disabled:opacity-30"
                    onDragStart={(e) => e.dataTransfer.setData('application/x-ergon-row', row.id)}
                    onKeyDown={(e) => {
                      if (e.altKey && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.preventDefault()
                        reorder(row.index, row.index + (e.key === 'ArrowUp' ? -1 : 1))
                      }
                    }}
                  >
                    <GripVertical size={15} />
                  </button>
                )
              },
            },
          ]
        : []),
      ...(selection
        ? [
            {
              id: '_select',
              size: 44,
              minSize: 44,
              maxSize: 44,
              enableSorting: false,
              enableHiding: false,
              enableResizing: false,
              header: ({ table }: any) => (
                <Checkbox
                  aria-label="Select all rows on this page"
                  checked={
                    table.getIsAllPageRowsSelected()
                      ? true
                      : table.getIsSomePageRowsSelected()
                        ? 'indeterminate'
                        : false
                  }
                  onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
                />
              ),
              cell: ({ row }: any) => (
                <Checkbox
                  aria-label={`Select row ${row.id}`}
                  checked={row.getIsSelected()}
                  disabled={!row.getCanSelect()}
                  onCheckedChange={(v) => row.toggleSelected(!!v)}
                />
              ),
            },
          ]
        : []),
      ...columns,
    ],
    [columns, selection, reorderable, reorder, onDataChange, onRowOrderChange],
  )
  const table = useReactTable({
    data,
    columns: defs,
    getRowId,
    getSubRows,
    getRowCanExpand: rowExpansion ? () => true : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setSelected,
    onExpandedChange: setExpanded,
    onGroupingChange: setGrouping,
    onColumnPinningChange: setPinning,
    onColumnOrderChange: setOrder,
    onColumnSizingChange: setSizing,
    onPaginationChange: setPages,
    autoResetAll: false,
    autoResetPageIndex: false,
    autoResetExpanded: false,
    columnResizeMode: 'onChange',
    enableRowSelection: selection,
    defaultColumn: { size: 180, minSize: 70, maxSize: 1000 },
    ...tableOptions,
    // Without client pagination, TanStack must flatten expanded rows in this stage.
    paginateExpandedRows:
      !pagination || tableOptions?.manualPagination
        ? true
        : (tableOptions?.paginateExpandedRows ?? true),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility: visibility,
      rowSelection: selected,
      expanded,
      grouping,
      columnPinning: pinning,
      columnOrder: order,
      columnSizing: sizing,
      pagination: pages,
      ...tableOptions?.state,
    },
  })
  const callback = React.useRef(onSelectionChange)
  callback.current = onSelectionChange
  React.useEffect(
    () => callback.current?.(table.getSelectedRowModel().flatRows.map((row) => row.original)),
    [selected, data, tableOptions?.state?.rowSelection],
  )
  React.useEffect(() => {
    if (!tableOptions?.manualPagination)
      setPages((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
  }, [globalFilter, columnFilters, sorting, grouping, data])
  React.useEffect(() => {
    if (storageKey)
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            visibility: table.getState().columnVisibility,
            order: table.getState().columnOrder,
            pinning: table.getState().columnPinning,
            sizing: table.getState().columnSizing,
          }),
        )
      } catch {
        // Keep the current table state when browser storage is unavailable.
      }
  }, [
    storageKey,
    table.getState().columnVisibility,
    table.getState().columnOrder,
    table.getState().columnPinning,
    table.getState().columnSizing,
  ])
  const rows = table.getRowModel().rows,
    leaf = table.getVisibleLeafColumns(),
    rowHeight = (density ?? config.density) === 'compact' ? 36 : 48,
    native = !!getCellProps || (!virtual && !virtualColumns),
    virtualRows = virtual && !getCellProps && !rowExpansion,
    virtualCols = virtualColumns && !getCellProps,
    grid = !native
  const rowList = useVirtualizer({
      count: rows.length,
      getScrollElement: () => ref.current,
      estimateSize: () => rowHeight,
      overscan: 8,
      enabled: virtualRows,
    }),
    columnList = useVirtualizer({
      count: leaf.length,
      getScrollElement: () => ref.current,
      horizontal: true,
      isRtl: config.direction === 'rtl',
      estimateSize: (index) => leaf[index].getSize(),
      overscan: 2,
      enabled: virtualCols,
    })
  const virtualIndices = new Set(columnList.getVirtualItems().map((item) => item.index)),
    starts: number[] = []
  leaf.reduce((total, column, index) => {
    starts[index] = total
    return total + column.getSize()
  }, 0)
  const shown = leaf
    .map((column, index) => ({ column, index }))
    .filter(
      ({ column, index }) => !virtualCols || virtualIndices.has(index) || !!column.getIsPinned(),
    )
  const spanPlan = React.useMemo(
    () =>
      getCellProps
        ? planCellSpans(
            rows.map((row) => row.original),
            leaf.map((column) => column.id),
            getCellProps,
          )
        : undefined,
    [rows, leaf, getCellProps],
  )
  const pinStyle = (column: Column<T>, index?: number): React.CSSProperties => {
    const pin = column.getIsPinned(),
      size = column.getSize()
    if (grid) {
      let start = starts[index ?? leaf.indexOf(column)] ?? 0
      if (pin === 'left') start = viewport.left + column.getStart('left')
      if (pin === 'right') start = viewport.left + viewport.width - column.getAfter('right') - size
      return {
        position: 'absolute',
        insetInlineStart: start,
        top: 0,
        width: size,
        height: '100%',
        zIndex: pin ? 3 : undefined,
        background: pin ? 'var(--background)' : undefined,
      }
    }
    return {
      width: size,
      minWidth: size,
      position: pin ? 'sticky' : undefined,
      insetInlineStart: pin === 'left' ? column.getStart('left') : undefined,
      insetInlineEnd: pin === 'right' ? column.getAfter('right') : undefined,
      zIndex: pin ? 2 : undefined,
      background: pin ? 'var(--background)' : undefined,
    }
  }
  const begin = (row: Row<T>, columnId: string, value: unknown) => {
    committed.current = false
    setEdit({ row: row.id, column: columnId, value: String(value ?? '') })
  }
  const commit = () => {
    if (!edit || committed.current) return
    const row = table.getCoreRowModel().flatRows.find((r) => r.id === edit.row),
      column = table.getColumn(edit.column)
    if (!row || !column) return
    const meta = column.columnDef.meta as EditableColumnMeta | undefined,
      value = meta?.inputType === 'number' ? Number(edit.value) : edit.value,
      message = meta?.validate?.(value)
    if (message) {
      setEdit({ ...edit, error: message })
      return
    }
    committed.current = true
    if (onCellEdit) onCellEdit(row.original, edit.column, value)
    else {
      const key = (column.columnDef as { accessorKey?: string }).accessorKey
      if (key && row.depth === 0)
        onDataChange?.(
          data.map((item) => (item === row.original ? { ...item, [key]: value } : item)),
        )
    }
    setEdit(undefined)
  }
  const moveColumn = (id: string, delta: number) => {
    const all = table.getAllLeafColumns().map((c) => c.id),
      at = all.indexOf(id),
      to = Math.max(0, Math.min(all.length - 1, at + delta))
    all.splice(at, 1)
    all.splice(to, 0, id)
    table.setColumnOrder(all)
  }
  const exportData = () => {
    const cols = leaf.filter((c) => !c.id.startsWith('_')),
      checked = table.getFilteredSelectedRowModel().rows,
      exportRows = checked.length ? checked : table.getFilteredRowModel().rows
    downloadCSV(
      exportName,
      cols.map((c) => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)),
      exportRows.map((row) => cols.map((column) => row.getValue(column.id))),
    )
  }
  const renderRow = (row: Row<T>, index: number, start?: number) => (
    <React.Fragment key={row.id}>
      <tr
        data-row-id={row.id}
        aria-rowindex={
          index +
          table.getHeaderGroups().length +
          1 +
          (pagination
            ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize
            : 0)
        }
        aria-selected={row.getIsSelected()}
        className={cn(
          'border-b bg-background text-sm hover:bg-muted/40',
          row.getIsSelected() && '!bg-primary/5',
          grid && 'relative block',
        )}
        style={
          grid
            ? {
                height: rowHeight,
                ...(virtualRows
                  ? { position: 'absolute', transform: `translateY(${start}px)`, width: '100%' }
                  : {}),
              }
            : undefined
        }
        onDragOver={(e) => {
          if (reorderable && e.dataTransfer.types.includes('application/x-ergon-row'))
            e.preventDefault()
        }}
        onDrop={(e) => {
          const source = e.dataTransfer.getData('application/x-ergon-row'),
            original = table.getCoreRowModel().rows.find((r) => r.id === source)
          if (
            original &&
            reorderable &&
            !row.depth &&
            !table.getState().sorting.length &&
            !table.getState().grouping.length
          ) {
            e.preventDefault()
            reorder(original.index, row.index)
          }
        }}
      >
        {shown.map(({ column, index: columnIndex }) => {
          const cell = row.getVisibleCells().find((c) => c.column.id === column.id)
          if (!cell) return null
          const span = spanPlan?.get(`${index}:${columnIndex}`)
          if (span === null) return null
          const meta = column.columnDef.meta as EditableColumnMeta | undefined,
            editable = meta?.editable && (!!onCellEdit || (!!onDataChange && row.depth === 0)),
            editing = edit?.row === row.id && edit.column === column.id,
            first = leaf.find((c) => !c.id.startsWith('_'))?.id === column.id
          return (
            <td
              key={cell.id}
              aria-colindex={columnIndex + 1}
              rowSpan={span?.rowSpan}
              colSpan={span?.colSpan}
              className={cn('px-3 py-2 align-middle', grid && 'flex items-center gap-1')}
              style={{
                ...pinStyle(column, columnIndex),
                height: grid ? '100%' : rowHeight,
                paddingInlineStart: first ? 12 + row.depth * 18 : undefined,
                ...(span && span.colSpan > 1
                  ? {
                      width: leaf
                        .slice(columnIndex, columnIndex + span.colSpan)
                        .reduce((sum, c) => sum + c.getSize(), 0),
                    }
                  : {}),
              }}
              onDoubleClick={() => {
                if (editable) begin(row, column.id, cell.getValue())
              }}
            >
              {first && row.getCanExpand() && (
                <button
                  type="button"
                  className="mr-1 inline-flex align-middle"
                  aria-label={`${row.getIsExpanded() ? 'Collapse' : 'Expand'} row ${row.id}`}
                  onClick={row.getToggleExpandedHandler()}
                >
                  <ChevronRight size={14} className={row.getIsExpanded() ? 'rotate-90' : ''} />
                </button>
              )}
              {cell.getIsPlaceholder() ? null : editing ? (
                <div className="relative w-full">
                  <Input
                    autoFocus
                    aria-label={`Edit ${column.id}`}
                    type={meta?.inputType ?? 'text'}
                    className="h-7"
                    value={edit.value}
                    onChange={(e) => setEdit({ ...edit, value: e.target.value, error: undefined })}
                    onBlur={commit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit()
                      if (e.key === 'Escape') {
                        committed.current = true
                        setEdit(undefined)
                      }
                    }}
                  />
                  {edit.error && (
                    <span
                      role="alert"
                      className="absolute left-0 top-full z-20 rounded bg-destructive px-2 py-1 text-xs text-white"
                    >
                      {edit.error}
                    </span>
                  )}
                </div>
              ) : cell.getIsGrouped() ? (
                <button
                  type="button"
                  className="font-medium"
                  onClick={row.getToggleExpandedHandler()}
                >
                  {flexRender(column.columnDef.cell, cell.getContext())} ({row.subRows.length})
                </button>
              ) : editable ? (
                <button
                  type="button"
                  className="max-w-full truncate text-left hover:underline"
                  title="Click to edit"
                  onClick={() => begin(row, column.id, cell.getValue())}
                >
                  {flexRender(column.columnDef.cell, cell.getContext())}
                </button>
              ) : (
                <span className="block max-w-full truncate">
                  {flexRender(
                    row.getIsGrouped() && cell.getIsAggregated()
                      ? (column.columnDef.aggregatedCell ?? column.columnDef.cell)
                      : column.columnDef.cell,
                    cell.getContext(),
                  )}
                </span>
              )}
            </td>
          )
        })}
      </tr>
      {rowExpansion && row.getIsExpanded() && (
        <tr className={grid ? 'block' : 'bg-muted/20'}>
          <td className="p-5" colSpan={leaf.length}>
            {rowExpansion(row.original)}
          </td>
        </tr>
      )}
    </React.Fragment>
  )
  return (
    <div className={cn('w-full min-w-0 space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {searchable && (
          <div className="relative min-w-36 flex-1 sm:max-w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search all rows"
              placeholder="Search records…"
              className="pl-9"
              value={String(table.getState().globalFilter ?? '')}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
            />
          </div>
        )}
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {Object.values(table.getState().rowSelection).filter(Boolean).length > 0 && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {Object.values(table.getState().rowSelection).filter(Boolean).length} selected
            </span>
          )}
          <Button size="sm" variant="outline" onClick={exportData}>
            <Download />
            Export
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" aria-label="Configure columns">
                <SlidersHorizontal />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <h4 className="text-sm font-semibold">Customize your view</h4>
              <Button
                size="xs"
                variant="ghost"
                className="my-2"
                onClick={() => {
                  table.setColumnVisibility({})
                  table.setColumnOrder([])
                  table.setColumnPinning({ left: [], right: [] })
                  table.setColumnSizing({})
                }}
              >
                Reset column view
              </Button>
              <div className="max-h-80 space-y-3 overflow-auto">
                {table
                  .getAllLeafColumns()
                  .filter((c) => !c.id.startsWith('_'))
                  .map((column) => (
                    <div key={column.id} className="space-y-2 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${tableId}-${column.id}`}
                          checked={column.getIsVisible()}
                          onCheckedChange={(v) => column.toggleVisibility(!!v)}
                        />
                        <label className="flex-1 text-sm" htmlFor={`${tableId}-${column.id}`}>
                          {typeof column.columnDef.header === 'string'
                            ? column.columnDef.header
                            : column.id}
                        </label>
                        <button
                          type="button"
                          aria-label={`Move ${column.id} left`}
                          onClick={() => moveColumn(column.id, -1)}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${column.id} right`}
                          onClick={() => moveColumn(column.id, 1)}
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Pin ${column.id}`}
                          onClick={() => column.pin(column.getIsPinned() ? false : 'left')}
                        >
                          {column.getIsPinned() ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                      </div>
                      {column.getCanFilter() && (
                        <Input
                          aria-label={`Filter ${column.id}`}
                          placeholder={`Filter ${column.id}…`}
                          value={String(column.getFilterValue() ?? '')}
                          onChange={(e) => column.setFilterValue(e.target.value)}
                          className="h-7"
                        />
                      )}
                      {column.getCanGroup() && (
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            aria-label={`Group by ${column.id}`}
                            checked={column.getIsGrouped()}
                            onChange={() => column.toggleGrouping()}
                          />
                          Group by this column
                        </label>
                      )}
                    </div>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {(table.getState().columnFilters.length > 0 || table.getState().grouping.length > 0) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {table.getState().columnFilters.map((filter) => (
            <button
              type="button"
              key={filter.id}
              onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}
              className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1"
            >
              {filter.id}: {String(filter.value)}
              <X size={12} />
            </button>
          ))}
          {table.getState().grouping.map((id) => (
            <button
              type="button"
              key={id}
              onClick={() => table.getColumn(id)?.toggleGrouping()}
              className="rounded-full bg-primary/10 px-3 py-1 text-primary"
            >
              Grouped: {id} ×
            </button>
          ))}
        </div>
      )}
      <div
        ref={ref}
        role="region"
        aria-label={`${caption} viewport`}
        aria-busy={loading}
        tabIndex={0}
        className="relative overflow-auto rounded-lg border outline-ring"
        style={{ maxHeight: height }}
        data-render-mode={grid ? 'virtual' : 'native'}
        onScroll={(e) => {
          const left = Math.abs(e.currentTarget.scrollLeft)
          setViewport((previous) => ({ ...previous, left }))
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          const element = e.currentTarget
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            element.scrollTop += rowHeight
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            element.scrollTop -= rowHeight
          }
          if (e.key === 'ArrowRight') {
            e.preventDefault()
            element.scrollLeft += 140
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            element.scrollLeft -= 140
          }
          if (e.key === 'End' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            element.scrollTop = element.scrollHeight
          }
          if (e.key === 'Home' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            element.scrollTop = 0
          }
        }}
      >
        <table
          aria-label={caption}
          aria-rowcount={
            (tableOptions?.rowCount ?? table.getFilteredRowModel().flatRows.length) +
            table.getHeaderGroups().length
          }
          aria-colcount={leaf.length}
          className={cn('text-left', grid ? 'grid' : 'border-collapse')}
          style={{ width: table.getTotalSize(), minWidth: '100%', tableLayout: 'fixed' }}
        >
          {native && (
            <colgroup>
              {leaf.map((column) => (
                <col key={column.id} style={{ width: column.getSize() }} />
              ))}
            </colgroup>
          )}
          <thead className={cn('sticky top-0 z-20 bg-muted', grid && 'grid')}>
            {table.getHeaderGroups().map((group) => {
              let offset = 0
              return (
                <tr
                  key={group.id}
                  className={grid ? 'relative block' : ''}
                  style={grid ? { height: 42 } : undefined}
                >
                  {group.headers.map((header) => {
                    const start = offset
                    offset += header.getSize()
                    const leafIndex = leaf.findIndex((c) => c.id === header.column.id)
                    const pinned = !!header.column.getIsPinned()
                    if (
                      virtualCols &&
                      !pinned &&
                      (offset < viewport.left - 200 || start > viewport.left + viewport.width + 200)
                    )
                      return null
                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        aria-colspan={header.colSpan}
                        aria-sort={
                          header.column.getIsSorted() === 'asc'
                            ? 'ascending'
                            : header.column.getIsSorted() === 'desc'
                              ? 'descending'
                              : 'none'
                        }
                        className={cn(
                          'relative border-b px-3 py-3 text-xs font-medium text-muted-foreground',
                          grid && 'flex items-center',
                        )}
                        style={
                          grid
                            ? {
                                ...(pinned && leafIndex >= 0
                                  ? pinStyle(header.column, leafIndex)
                                  : {
                                      position: 'absolute',
                                      insetInlineStart: start,
                                      top: 0,
                                      width: header.getSize(),
                                      height: '100%',
                                    }),
                              }
                            : pinStyle(header.column)
                        }
                        draggable={!header.column.id.startsWith('_')}
                        onDragStart={(e) =>
                          e.dataTransfer.setData('application/x-ergon-column', header.column.id)
                        }
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const source = e.dataTransfer.getData('application/x-ergon-column'),
                            all = table.getAllLeafColumns().map((c) => c.id),
                            from = all.indexOf(source),
                            to = all.indexOf(header.column.id)
                          if (
                            from < 0 ||
                            to < 0 ||
                            source.startsWith('_') ||
                            header.column.id.startsWith('_')
                          )
                            return
                          e.preventDefault()
                          all.splice(from, 1)
                          all.splice(to, 0, source)
                          table.setColumnOrder(all)
                        }}
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            type="button"
                            title="Shift-click to sort by multiple columns"
                            className="flex items-center gap-2"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp size={12} />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown size={12} />
                            ) : (
                              <ArrowUpDown size={12} className="opacity-50" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                        {header.column.getCanResize() && (
                          <div
                            role="separator"
                            aria-valuenow={header.column.getSize()}
                            aria-valuemin={header.column.columnDef.minSize ?? 70}
                            aria-valuemax={header.column.columnDef.maxSize ?? 1000}
                            aria-label={`Resize ${header.column.id}`}
                            aria-orientation="vertical"
                            tabIndex={0}
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-primary focus:bg-primary"
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onDoubleClick={() => header.column.resetSize()}
                            onKeyDown={(e) => {
                              if (['ArrowRight', 'ArrowLeft'].includes(e.key)) {
                                e.preventDefault()
                                table.setColumnSizing((old) => ({
                                  ...old,
                                  [header.column.id]: Math.max(
                                    header.column.columnDef.minSize ?? 70,
                                    header.column.getSize() + (e.key === 'ArrowRight' ? 10 : -10),
                                  ),
                                }))
                              }
                            }}
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              )
            })}
          </thead>
          <tbody
            className={grid ? 'relative grid' : ''}
            style={virtualRows ? { height: rowList.getTotalSize() } : undefined}
          >
            {virtualRows
              ? rowList
                  .getVirtualItems()
                  .map((item) => renderRow(rows[item.index], item.index, item.start))
              : rows.map((row, index) => renderRow(row, index))}
          </tbody>
          {summary && (
            <tfoot className={cn('sticky bottom-0 z-10 bg-muted', grid && 'block')}>
              <tr className={grid ? 'block' : ''}>
                <td colSpan={leaf.length} className={cn('px-3 py-3 text-sm', grid && 'block')}>
                  {summary(table.getFilteredRowModel().rows.map((row) => row.original))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {loading ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            Loading records…
          </div>
        ) : error ? (
          <div role="alert" className="p-8 text-center text-sm text-destructive">
            {error}
            {onRetry && (
              <Button size="sm" variant="outline" className="ml-3" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        ) : !rows.length ? (
          <div className="p-12 text-center">
            <Search className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No records found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {tableOptions?.rowCount ?? table.getFilteredRowModel().rows.length} records
          {virtualRows ? ' · virtual scrolling' : ''}
          {virtualCols ? ' · virtual columns' : ''}
          {onDataChange || onCellEdit ? ' · click a value to edit' : ''}
          {getCellProps ? ' · merged cells' : ''}
        </span>
        {pagination && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                aria-label="Rows per page"
                className="rounded border bg-background px-2 py-1"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[...new Set([10, 20, 50, 100, table.getState().pagination.pageSize])]
                  .sort((a, b) => a - b)
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </label>
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {Math.max(1, table.getPageCount())}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="First page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.firstPage()}
              >
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="Previous page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="Next page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                aria-label="Last page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.lastPage()}
              >
                <ChevronsRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
