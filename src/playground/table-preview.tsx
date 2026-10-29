import * as React from 'react'
import { DataTable, type ColumnDef } from '@/components/ui/data-table'
import { TablePlus, type TablePlusParams } from '@/components/ui/table-plus'
import { EditableTablePlus } from '@/components/ui/editable-table-plus'
import { Tag } from '@/components/ui/tag'
import { makeProjects, type Project, projectColumns } from '@/docs/demo-data'
import type { PreviewProps } from './preview'
import { Button } from '@/components/ui/button'
import { Descriptions } from '@/components/ui/descriptions'
import { Plus } from 'lucide-react'
import { functionalUpdate, type ExpandedState, type OnChangeFn } from '@tanstack/react-table'
import {
  createProjectTree,
  mapProjectTree,
  filterProjectTree,
  removeProjectNodes,
  type ProjectNode,
  type RowContentMode,
} from './table-data'
export function AdvancedDataPreview({ id, config: v, onEvent }: PreviewProps) {
  const mode = (v.rowMode ?? 'Flat rows') as RowContentMode,
    nested = mode !== 'Flat rows',
    requestedRows = Number(v.rows) || 64,
    rows = nested ? Math.min(requestedRows, 200) : requestedRows
  const [data, setData] = React.useState<ProjectNode[]>(() =>
      nested
        ? createProjectTree(rows, Number(v.childCount) || 2, Number(v.childLevels) || 1)
        : makeProjects(rows),
    ),
    [expanded, setExpanded] = React.useState<ExpandedState>(() =>
      nested && v.expandFirst !== false ? { [data[0].id]: true } : {},
    )
  const emit = React.useCallback(
    (type: string, value: unknown) => onEvent({ type, value, time: Date.now() }),
    [onEvent],
  )
  const change = React.useCallback(
    (next: ProjectNode[]) => {
      setData(next)
      emit('data-change', { rows: next.length })
    },
    [emit],
  )
  const editCell = React.useCallback(
    (row: ProjectNode, columnId: string, value: unknown) => {
      setData((previous) =>
        mapProjectTree(previous, (node) =>
          node.id === row.id ? { ...node, [columnId]: value } : node,
        ),
      )
      emit('cell-edit', { id: row.id, columnId, value })
    },
    [emit],
  )
  const addChild = React.useCallback(
    (parent: ProjectNode) => {
      const child: ProjectNode = {
        id: `${parent.id}.new-${crypto.randomUUID().slice(0, 6)}`,
        name: `New task ${(parent.children?.length ?? 0) + 1}`,
        owner: parent.owner,
        status: 'Planning',
        budget: 0,
        created: parent.created,
      }
      setData((previous) =>
        mapProjectTree(previous, (node) =>
          node.id === parent.id ? { ...node, children: [...(node.children ?? []), child] } : node,
        ),
      )
      setExpanded((previous) => (previous === true ? true : { ...previous, [parent.id]: true }))
      emit('add-child', { parentId: parent.id, child })
    },
    [emit],
  )
  const onExpandedChange: OnChangeFn<ExpandedState> = (update) => {
    const next = functionalUpdate(update, expanded)
    setExpanded(next)
    emit('expanded', next)
  }
  const columns = React.useMemo<ColumnDef<ProjectNode, any>[]>(() => {
    const count = Number(v.columns) || 6,
      base = (projectColumns as ColumnDef<ProjectNode, any>[]).slice(0, count).map((column) =>
        'accessorKey' in column && column.accessorKey === 'status'
          ? {
              ...column,
              cell: ({ getValue }: any) => (
                <Tag
                  color={
                    getValue() === 'Completed'
                      ? 'green'
                      : getValue() === 'Planning'
                        ? 'purple'
                        : 'coral'
                  }
                >
                  {getValue()}
                </Tag>
              ),
            }
          : column,
      )
    if (nested) {
      const at = base.findIndex(
        (column) => 'accessorKey' in column && column.accessorKey === 'name',
      )
      if (at >= 0) base.unshift(...base.splice(at, 1))
      if (mode === 'Nested rows' || mode === 'Nested table')
        base.splice(1, 0, {
          id: '_children',
          header: 'Row actions',
          size: 120,
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) => (
            <Button
              variant="outline"
              size="xs"
              aria-label={`Add child to ${row.original.id}`}
              onClick={() => addChild(row.original)}
            >
              <Plus />
              Add child
            </Button>
          ),
        })
    }
    for (let index = 6; index < count; index++)
      base.push({
        id: `metric-${index}`,
        header: `Metric ${index - 5}`,
        accessorFn: (row) => row.budget + index * 17,
        size: 130,
        enableGlobalFilter: false,
      })
    return Boolean(v.grouped)
      ? [
          { id: 'identity', header: 'Project identity', columns: base.slice(0, 3) },
          { id: 'details', header: 'Details', columns: base.slice(3) },
        ]
      : nested
        ? base
        : base.slice(0, count)
  }, [v.columns, v.grouped, nested, mode, addChild])
  const request = React.useCallback(
    async (params: TablePlusParams, signal: AbortSignal) => {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 250)
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer)
            reject(new DOMException('Cancelled', 'AbortError'))
          },
          { once: true },
        )
      })
      if (v.error) throw new Error('The demonstration service is temporarily unavailable.')
      let filtered = filterProjectTree(data, (row) =>
        Object.entries(row)
          .filter(([key]) => key !== 'children')
          .some(([, value]) => String(value).toLowerCase().includes(params.keyword.toLowerCase())),
      )
      for (const filter of params.filters)
        filtered = filterProjectTree(filtered, (row) =>
          String(row[filter.id as keyof Project])
            .toLowerCase()
            .includes(String(filter.value).toLowerCase()),
        )
      for (const [key, value] of Object.entries(params.query))
        if (value)
          filtered = filterProjectTree(filtered, (row) =>
            String(row[key as keyof Project])
              .toLowerCase()
              .includes(String(value).toLowerCase()),
          )
      if (params.sorting.length)
        filtered.sort((a, b) => {
          for (const sort of params.sorting) {
            const left = a[sort.id as keyof Project],
              right = b[sort.id as keyof Project],
              result =
                typeof left === 'number' && typeof right === 'number'
                  ? left - right
                  : String(left).localeCompare(String(right))
            if (result) return sort.desc ? -result : result
          }
          return 0
        })
      emit('request', { ...params, matching: filtered.length })
      return {
        data: filtered.slice((params.page - 1) * params.pageSize, params.page * params.pageSize),
        total: filtered.length,
      }
    },
    [data, v.error, emit],
  )
  const customExpansion = mode === 'Row details' || mode === 'Nested table',
    spans = Boolean(v.spans) && !nested,
    virtual = Boolean(v.virtual) && !customExpansion && !spans,
    virtualForTable = virtual && !(id === 'table-plus' && v.remote)
  const options = {
    filterFromLeafRows: true,
    paginateExpandedRows: virtualForTable,
    state: { expanded },
    onExpandedChange,
  }
  const getChildren = (row: ProjectNode) => row.children
  const rowExpansion = customExpansion
    ? (row: ProjectNode) => (
        <section
          aria-label={`${mode === 'Nested table' ? 'Tasks' : 'Details'} for ${row.id}`}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold">{row.name}</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === 'Nested table'
                  ? 'A second Table renders this project’s child records.'
                  : 'Custom content rendered beneath this row.'}
              </p>
            </div>
            {mode === 'Nested table' ? (
              <Button size="sm" variant="outline" onClick={() => addChild(row)}>
                <Plus />
                Add task
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => emit('details-action', { id: row.id })}
              >
                Open project
              </Button>
            )}
          </div>
          {mode === 'Nested table' ? (
            <DataTable
              data={row.children ?? []}
              columns={columns}
              getRowId={(child) => child.id}
              getSubRows={getChildren}
              caption={`Tasks for ${row.id}`}
              selection={false}
              searchable={false}
              pagination={false}
              height={300}
              tableOptions={{ ...options, paginateExpandedRows: true }}
              onCellEdit={v.editing ? editCell : undefined}
            />
          ) : (
            <Descriptions
              columns={2}
              items={[
                { key: 'owner', label: 'Owner', children: row.owner },
                { key: 'status', label: 'Status', children: <Tag color="green">{row.status}</Tag> },
                { key: 'budget', label: 'Budget', children: '$' + row.budget.toLocaleString() },
                { key: 'created', label: 'Created', children: row.created },
              ]}
            />
          )}
        </section>
      )
    : undefined
  const tableProps = {
    getSubRows: mode === 'Nested rows' ? getChildren : undefined,
    rowExpansion,
    onCellEdit: v.editing ? editCell : undefined,
    tableOptions: options,
  }
  const wrap = (content: React.ReactNode) => (
    <div className="w-full space-y-4">
      {nested && (
        <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
          {mode === 'Nested rows'
            ? 'Expand the chevrons to explore children and grandchildren. “Add child” is a custom row action that updates this demo’s nested data.'
            : mode === 'Nested table'
              ? 'Expand a project to work with its child table, including editing and adding tasks.'
              : 'Expand any row to see custom content and actions.'}
          {v.editing && ' Click a project or task name to edit it.'}
          {customExpansion && ' Expanded content uses the standard, nonvirtual row layout.'}
          {requestedRows > 200 && ' This nested example is limited to 200 parent records.'}
        </div>
      )}
      {content}
    </div>
  )
  if (id === 'editable-table-plus')
    return (
      <EditableTablePlus
        value={data}
        onValueChange={change}
        columns={columns}
        getRowId={(row) => row.id}
        batchEditing={Boolean(v.batch)}
        transactional={Boolean(v.transactional)}
        optimistic={Boolean(v.optimistic)}
        validateRow={
          v.validate
            ? (row) =>
                row.name.trim().length < 3
                  ? 'Use at least three characters for the project name'
                  : undefined
            : undefined
        }
        createRecord={() => ({
          id: crypto.randomUUID().slice(0, 8),
          name: 'New project',
          owner: 'You',
          status: 'Planning',
          budget: 0,
          created: '2026-10-31',
        })}
        onCommit={async (next, changes, signal) => {
          await new Promise((resolve) => setTimeout(resolve, 400))
          if (signal.aborted) return
          if (v.failure)
            throw new Error('The demonstration save failed. Your edits remain available.')
          emit('commit', changes)
        }}
      />
    )
  if (id === 'table-plus')
    return wrap(
      <TablePlus
        {...tableProps}
        title="Project workspace"
        description="Illustrative records; request handlers are simulated."
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        request={v.remote ? request : undefined}
        virtual={virtualForTable}
        pagination={!virtualForTable}
        showViews={Boolean(v.views)}
        storageKey="ergonui-playground-table-plus"
        queryFields={
          v.query
            ? [
                { name: 'name', label: 'Project name' },
                { name: 'owner', label: 'Owner' },
                {
                  name: 'status',
                  label: 'Status',
                  type: 'select',
                  options: [
                    { value: 'Planning', label: 'Planning' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'In progress', label: 'In progress' },
                  ],
                },
              ]
            : undefined
        }
        batchActions={
          v.batch
            ? [
                {
                  key: 'complete',
                  label: 'Mark completed',
                  onAction: async (keys, records, signal) => {
                    await new Promise((resolve) => setTimeout(resolve, 250))
                    if (signal.aborted) return
                    change(
                      mapProjectTree(data, (row) =>
                        keys.includes(row.id) ? { ...row, status: 'Completed' } : row,
                      ),
                    )
                    emit('batch', { keys, records: records.length })
                  },
                },
                {
                  key: 'delete',
                  label: 'Delete selected',
                  destructive: true,
                  onAction: async (keys) => change(removeProjectNodes(data, new Set(keys))),
                },
              ]
            : []
        }
        onSelectedKeysChange={(keys) => emit('selected-keys', keys)}
        selection={v.selection !== false}
        loading={Boolean(v.loading)}
      />,
    )
  return wrap(
    <DataTable
      {...tableProps}
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      selection={Boolean(v.selection)}
      onDataChange={v.editing ? change : undefined}
      onSelectionChange={(selected) =>
        emit(
          'selection',
          selected.map((row) => row.id),
        )
      }
      virtual={virtualForTable}
      virtualColumns={Boolean(v.virtualColumns) && !spans && !customExpansion}
      pagination={!virtualForTable}
      density={v.density as any}
      reorderable={Boolean(v.reorder)}
      onRowOrderChange={change}
      loading={Boolean(v.loading)}
      error={v.error ? 'The demonstration data could not be loaded.' : undefined}
      onRetry={() => emit('retry', 'requested')}
      getCellProps={
        spans
          ? (row, column, index) =>
              column === 'owner' ? { rowSpan: index % 3 === 0 ? 3 : 0 } : undefined
          : undefined
      }
      summary={
        v.summary
          ? (visible) => (
              <span className="text-xs">
                Total budget:{' '}
                <strong>
                  ${visible.reduce((sum, row) => sum + row.budget, 0).toLocaleString()}
                </strong>
              </span>
            )
          : undefined
      }
    />,
  )
}
