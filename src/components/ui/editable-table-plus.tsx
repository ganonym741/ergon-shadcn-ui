import * as React from 'react'
import { Plus, Trash2, Save, Undo2, Loader2 } from 'lucide-react'
import { DataTable, type DataTableProps, type ColumnDef } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
export interface RecordMutation<T> {
  type: 'insert' | 'update' | 'delete'
  id: string
  record?: T
  previous?: T
}
export interface EditableTablePlusProps<T> extends Omit<
  DataTableProps<T>,
  'data' | 'onDataChange'
> {
  value: T[]
  onValueChange: (rows: T[]) => void
  createRecord: () => T
  maxRows?: number
  transactional?: boolean
  batchEditing?: boolean
  optimistic?: boolean
  onCommit?: (rows: T[], changes: RecordMutation<T>[], signal: AbortSignal) => void | Promise<void>
  validateRow?: (row: T) => string | undefined
}
export function recordChanges<T>(
  previous: T[],
  next: T[],
  getKey: (row: T, index: number) => string,
) {
  const before = new Map(previous.map((row, index) => [getKey(row, index), row])),
    after = new Map(next.map((row, index) => [getKey(row, index), row])),
    changes: RecordMutation<T>[] = []
  after.forEach((record, id) => {
    if (!before.has(id)) changes.push({ type: 'insert', id, record })
    else if (JSON.stringify(before.get(id)) !== JSON.stringify(record))
      changes.push({ type: 'update', id, record, previous: before.get(id) })
  })
  before.forEach((record, id) => {
    if (!after.has(id)) changes.push({ type: 'delete', id, previous: record })
  })
  return changes
}
export function EditableTablePlus<T>({
  value,
  onValueChange,
  createRecord,
  maxRows = Infinity,
  columns,
  toolbar,
  transactional = false,
  batchEditing = false,
  optimistic = false,
  onCommit,
  validateRow,
  ...props
}: EditableTablePlusProps<T>) {
  const [draft, setDraft] = React.useState(value),
    [dirty, setDirty] = React.useState(false),
    [saving, setSaving] = React.useState(false),
    [error, setError] = React.useState('')
  const [bulkColumn, setBulkColumn] = React.useState(''),
    [bulkValue, setBulkValue] = React.useState(''),
    [selectedRows, setSelectedRows] = React.useState<T[]>([])
  const editable = columns.filter(
    (column) =>
      'accessorKey' in column && (column.meta as { editable?: boolean } | undefined)?.editable,
  )
  const request = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => request.current?.abort(), [])
  React.useEffect(() => {
    if (!dirty) setDraft(value)
  }, [value, dirty])
  const getKey = props.getRowId ?? ((_: T, index: number) => String(index)),
    changes = recordChanges(value, draft, getKey)
  const update = (next: T[]) => {
    if (transactional) {
      setDraft(next)
      setDirty(true)
    } else onValueChange(next)
  }
  const reset = () => {
    request.current?.abort()
    setDraft(value)
    setDirty(false)
    setSaving(false)
    setError('')
  }
  const commit = async (id?: string) => {
    const selected = id ? changes.filter((change) => change.id === id) : changes
    if (!selected.length) return
    const invalid = selected
      .filter((c) => c.record)
      .map((c) => validateRow?.(c.record!))
      .find(Boolean)
    if (invalid) {
      setError(invalid)
      return
    }
    const snapshot = value,
      next = [...value]
    for (const change of selected) {
      const at = next.findIndex((row, index) => getKey(row, index) === change.id)
      if (change.type === 'delete') {
        if (at >= 0) next.splice(at, 1)
      } else if (at >= 0) next[at] = change.record!
      else next.push(change.record!)
    }
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setSaving(true)
    setError('')
    if (optimistic) onValueChange(next)
    try {
      await onCommit?.(next, selected, controller.signal)
      if (controller.signal.aborted) return
      if (!optimistic) onValueChange(next)
      const stillDirty = recordChanges(next, draft, getKey)
      setDirty(stillDirty.length > 0)
      if (!stillDirty.length) setDraft(next)
    } catch (cause) {
      if (!controller.signal.aborted) {
        if (optimistic) onValueChange(snapshot)
        setError(cause instanceof Error ? cause.message : 'Changes could not be saved')
      }
    } finally {
      if (!controller.signal.aborted) setSaving(false)
    }
  }
  const actions: ColumnDef<T, any> = {
    id: '_actions',
    header: 'Actions',
    size: transactional ? 150 : 70,
    enableSorting: false,
    cell: ({ row }) => {
      const key = getKey(row.original, row.index),
        changed = changes.some((c) => c.id === key)
      return (
        <div className="flex gap-1">
          {transactional && (
            <>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Save row ${row.id}`}
                disabled={!changed || saving}
                onClick={() => void commit(key)}
              >
                <Save />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Cancel row ${row.id}`}
                disabled={!changed || saving}
                onClick={() => {
                  const baseline = value.find((item, index) => getKey(item, index) === key)
                  setDraft((current) =>
                    baseline
                      ? current.map((item, index) =>
                          getKey(item, index) === key ? baseline : item,
                        )
                      : current.filter((item, index) => getKey(item, index) !== key),
                  )
                }}
              >
                <Undo2 />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={saving}
            aria-label={`Delete row ${row.id}`}
            onClick={() =>
              update((transactional ? draft : value).filter((_, index) => index !== row.index))
            }
          >
            <Trash2 className="text-destructive" />
          </Button>
        </div>
      )
    },
  }
  return (
    <div className="w-full min-w-0 space-y-3">
      {batchEditing && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
          <select
            aria-label="Bulk edit column"
            value={bulkColumn}
            onChange={(event) => setBulkColumn(event.target.value)}
            className="h-8 rounded border bg-background px-2 text-xs"
          >
            <option value="">Choose a field</option>
            {editable.map((column) => {
              const key = String((column as { accessorKey: string }).accessorKey)
              return (
                <option key={key} value={key}>
                  {typeof column.header === 'string' ? column.header : key}
                </option>
              )
            })}
          </select>
          <Input
            aria-label="Bulk edit value"
            className="h-8 max-w-40"
            value={bulkValue}
            onValueChange={setBulkValue}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!bulkColumn || !selectedRows.length || saving}
            onClick={() => {
              const column = editable.find(
                  (column) =>
                    String((column as { accessorKey: string }).accessorKey) === bulkColumn,
                ),
                meta = column?.meta as
                  | { inputType?: string; validate?: (value: unknown) => string | undefined }
                  | undefined,
                nextValue = meta?.inputType === 'number' ? Number(bulkValue) : bulkValue,
                message = meta?.validate?.(nextValue)
              if (message) {
                setError(message)
                return
              }
              const keys = new Set(
                selectedRows.map((row, index) => props.getRowId?.(row, index) ?? row),
              )
              update(
                (transactional ? draft : value).map((row, index) =>
                  keys.has(props.getRowId?.(row, index) ?? row)
                    ? { ...row, [bulkColumn]: nextValue }
                    : row,
                ),
              )
            }}
          >
            Apply to selected ({selectedRows.length})
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <DataTable
        {...props}
        onSelectionChange={(rows) => {
          setSelectedRows(rows)
          props.onSelectionChange?.(rows)
        }}
        loading={saving || props.loading}
        data={transactional ? draft : value}
        columns={[...columns, actions]}
        onDataChange={update}
        toolbar={
          <>
            {toolbar}
            <Button
              size="sm"
              variant="outline"
              disabled={saving || (transactional ? draft : value).length >= maxRows}
              onClick={() => update([...(transactional ? draft : value), createRecord()])}
            >
              <Plus />
              Add row
            </Button>
            {transactional && (
              <>
                <Button
                  size="sm"
                  disabled={!changes.length || saving}
                  onClick={() => void commit()}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save />}Save all
                  {changes.length ? ` (${changes.length})` : ''}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!changes.length || saving}
                  onClick={reset}
                >
                  Cancel changes
                </Button>
              </>
            )}
          </>
        }
      />
    </div>
  )
}
