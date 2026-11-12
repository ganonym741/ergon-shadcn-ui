import * as React from 'react'
import { CustomChart as CustomSeries, type CustomSeriesOption } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { graphic, env } from 'echarts/core'
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import {
  Chart,
  ChartCanvas,
  ChartDataTable,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useControllableState } from '@/components/ui/util'
import { useUIConfig } from '@/components/ui/config-provider'

registerChartModules([CustomSeries, GridComponent, TooltipComponent])
const DAY = 86400000
export interface GanttTask {
  id: string
  title: string
  start: string
  end?: string
  type?: 'task' | 'group' | 'milestone'
  parentId?: string
  progress?: number
  dependsOn?: string[]
  color?: string
  disabled?: boolean
  data?: unknown
}
export interface GanttConflict {
  taskId: string
  dependsOnId: string
}
export interface GanttChartProps extends Omit<ChartProps, 'option'> {
  data: GanttTask[]
  option?: EChartsOption
  zoom?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  showDependencies?: boolean
  showProgress?: boolean
  editable?: boolean
  scale?: 'day' | 'week' | 'month'
  defaultScale?: 'day' | 'week' | 'month'
  onScaleChange?: (scale: 'day' | 'week' | 'month') => void
  collapsedIds?: string[]
  defaultCollapsedIds?: string[]
  onCollapsedIdsChange?: (ids: string[]) => void
  selectedTaskId?: string
  defaultSelectedTaskId?: string
  onSelectionChange?: (id: string) => void
  onTaskSelect?: (task: GanttTask) => void
  onTasksChange?: (tasks: GanttTask[]) => void
  onTaskChange?: (task: GanttTask, previous: GanttTask) => void
  range?: [string, string]
  barColor?: string
  milestoneColor?: string
  dependencyColor?: string
}
function day(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
    ? Date.parse(value)
    : NaN
}
/** Validates UTC date-only schedules, unique IDs, parent/dependency references, and both graph types. */
export function validateGanttTasks(tasks: readonly GanttTask[]): string | undefined {
  if (tasks.length > 2000) return 'Use at most 2,000 tasks per schedule.'
  const map = new Map(tasks.map((task) => [task.id, task]))
  if (map.size !== tasks.length || tasks.some((task) => !task.id))
    return 'Gantt task IDs must be unique.'
  const indegree = new Map(tasks.map((task) => [task.id, 0])),
    edges = new Map<string, string[]>()
  let edgeCount = 0
  for (const task of tasks) {
    const start = day(task.start),
      end = day(task.end ?? task.start)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start)
      return 'Task dates must be real YYYY-MM-DD dates with the end on or after the start.'
    if (task.type === 'milestone' && end !== start) return 'Milestones must occur on a single date.'
    if (
      task.progress !== undefined &&
      (!Number.isFinite(task.progress) || task.progress < 0 || task.progress > 100)
    )
      return 'Task progress must be between 0 and 100.'
    if (task.parentId && map.get(task.parentId)?.type !== 'group')
      return `Missing group parent for ${task.title}.`
    let parent = task.parentId
    const parents = new Set([task.id])
    while (parent) {
      if (parents.has(parent)) return 'Task groups must not contain cycles.'
      parents.add(parent)
      if (parents.size > 50) return 'Use at most 50 group levels.'
      parent = map.get(parent)?.parentId
    }
    if (new Set(task.dependsOn).size !== (task.dependsOn?.length ?? 0))
      return 'Dependencies must be unique.'
    for (const dependency of task.dependsOn ?? []) {
      if (!map.has(dependency)) return `Unknown dependency for ${task.title}.`
      if (++edgeCount > 10000) return 'Use at most 10,000 dependencies.'
      indegree.set(task.id, indegree.get(task.id)! + 1)
      edges.set(dependency, [...(edges.get(dependency) ?? []), task.id])
    }
  }
  const queue = tasks.filter((task) => indegree.get(task.id) === 0).map((task) => task.id)
  let visited = 0
  while (queue.length) {
    const id = queue.pop()!
    visited++
    for (const next of edges.get(id) ?? []) {
      indegree.set(next, indegree.get(next)! - 1)
      if (indegree.get(next) === 0) queue.push(next)
    }
  }
  if (visited !== tasks.length) return 'Task dependencies must not contain cycles.'
}
/** Reports finish-to-start conflicts without silently rescheduling application data. End dates are inclusive. */
export function getGanttConflicts(tasks: readonly GanttTask[]): GanttConflict[] {
  if (validateGanttTasks(tasks)) return []
  const map = new Map(tasks.map((task) => [task.id, task]))
  return tasks.flatMap((task) =>
    (task.dependsOn ?? [])
      .filter((id) => {
        const before = map.get(id)!
        return (
          day(task.start) <
          day(before.end ?? before.start) + (before.type === 'milestone' ? 0 : DAY)
        )
      })
      .map((dependsOnId) => ({ taskId: task.id, dependsOnId })),
  )
}
interface GanttRow {
  task: GanttTask
  depth: number
}
interface GanttContext {
  data: GanttTask[]
  rows: GanttRow[]
  collapsed: Set<string>
  toggle: (id: string) => void
  setCollapsed: (ids: string[]) => void
  scale: 'day' | 'week' | 'month'
  setScale: (scale: 'day' | 'week' | 'month') => void
  selected: string
  select: (task: GanttTask) => void
  editing: string
  setEditing: (id: string) => void
  editable: boolean
  save: (task: GanttTask) => void
  conflicts: GanttConflict[]
  showDataTable: boolean
}
const Context = React.createContext<GanttContext | null>(null)
function useGantt() {
  const c = React.useContext(Context)
  if (!c) throw new Error('Gantt parts need GanttChart.')
  return c
}
/** Renders grouped tasks, milestones, progress and finish-to-start links using only modular ECharts custom series. */
export function GanttChart({
  data,
  option,
  zoom = false,
  showTooltip = true,
  showDataTable = true,
  showDependencies = true,
  showProgress = true,
  editable = false,
  scale,
  defaultScale = 'week',
  onScaleChange,
  collapsedIds,
  defaultCollapsedIds = [],
  onCollapsedIdsChange,
  selectedTaskId,
  defaultSelectedTaskId = '',
  onSelectionChange,
  onTaskSelect,
  onTasksChange,
  onTaskChange,
  range,
  barColor = '#36836a',
  milestoneColor = '#b93e28',
  dependencyColor = '#8b9388',
  children,
  ...props
}: GanttChartProps) {
  const { locale } = useUIConfig(),
    [unit, setScale] = useControllableState({
      value: scale,
      defaultValue: defaultScale,
      onChange: onScaleChange,
    }),
    [collapsed, setCollapsed] = useControllableState({
      value: collapsedIds,
      defaultValue: defaultCollapsedIds,
      onChange: onCollapsedIdsChange,
    }),
    [selected, setSelected] = useControllableState({
      value: selectedTaskId,
      defaultValue: defaultSelectedTaskId,
      onChange: onSelectionChange,
    }),
    [editing, setEditing] = React.useState('')
  const invalid =
      validateGanttTasks(data) ??
      (range &&
      (!Number.isFinite(day(range[0])) ||
        !Number.isFinite(day(range[1])) ||
        day(range[1]) < day(range[0]))
        ? 'Choose a valid ordered date range.'
        : undefined),
    collapsedSet = React.useMemo(() => new Set(collapsed), [collapsed])
  const rows = React.useMemo(() => {
      const result: GanttRow[] = []
      if (invalid) return result
      const groups = new Map<string, GanttTask[]>()
      for (const task of data) {
        const key = task.parentId ?? '',
          list = groups.get(key) ?? []
        list.push(task)
        groups.set(key, list)
      }
      const walk = (parent: string, depth: number) => {
        for (const task of groups.get(parent) ?? []) {
          result.push({ task, depth })
          if (!collapsedSet.has(task.id)) walk(task.id, depth + 1)
        }
      }
      walk('', 0)
      return result
    }, [data, collapsedSet, invalid]),
    conflicts = React.useMemo(() => getGanttConflicts(data), [data])
  const toggle = (id: string) =>
      setCollapsed(
        collapsedSet.has(id) ? collapsed.filter((value) => value !== id) : [...collapsed, id],
      ),
    select = (task: GanttTask) => {
      if (task.disabled) return
      setSelected(task.id)
      onTaskSelect?.(task)
    }
  const tooltipOption = Array.isArray(option?.tooltip) ? option.tooltip[0] : option?.tooltip,
    html =
      tooltipOption?.renderMode === 'html' ||
      (tooltipOption?.renderMode === 'auto' && env.domSupported),
    escape = (value: string) =>
      html
        ? value.replace(
            /[&<>"']/g,
            (char) =>
              ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
          )
        : value
  const built = React.useMemo<EChartsOption>(() => {
    if (invalid) return {}
    const index = new Map(rows.map((row, i) => [row.task.id, i])),
      links = rows.flatMap((row, target) =>
        (row.task.dependsOn ?? [])
          .filter((id) => index.has(id))
          .map((id) => ({ source: index.get(id)!, target })),
      ),
      times = rows.flatMap((row) => [
        day(row.task.start),
        day(row.task.end ?? row.task.start) + DAY,
      ]),
      min = range ? day(range[0]) : Math.min(...times) - DAY,
      max = range ? day(range[1]) + DAY : Math.max(...times) + DAY
    const renderTask: CustomSeriesOption['renderItem'] = (_params, api) => {
      const row = Number(api.value(0)),
        task = rows[row]?.task
      if (!task) return null
      const start = api.coord([Number(api.value(1)), row]),
        end = api.coord([Number(api.value(2)), row]),
        size = api.size?.([0, 1]),
        h = Math.min(24, Math.abs(Array.isArray(size) ? size[1] : 32) * 0.62),
        color = task.color ?? (task.type === 'milestone' ? milestoneColor : barColor),
        bounds = _params.coordSys as unknown as {
          x: number
          y: number
          width: number
          height: number
        },
        opacity = task.disabled ? 0.4 : 1
      if (task.type === 'milestone')
        return {
          type: 'polygon',
          shape: {
            points: [
              [start[0], start[1] - 7],
              [start[0] + 7, start[1]],
              [start[0], start[1] + 7],
              [start[0] - 7, start[1]],
            ],
          },
          style: {
            fill: color,
            opacity,
            stroke: selected === task.id ? '#272b25' : undefined,
            lineWidth: 2,
          },
        }
      const rect = {
          x: start[0],
          y: start[1] - h / 2,
          width: Math.max(2, end[0] - start[0]),
          height: task.type === 'group' ? 8 : h,
        },
        shape = graphic.clipRectByRect(rect, bounds)
      if (!shape) return null
      const progress = graphic.clipRectByRect(
        { ...rect, width: (rect.width * (task.progress ?? 0)) / 100 },
        bounds,
      )
      return {
        type: 'group',
        children: [
          {
            type: 'rect',
            shape: { ...shape, r: task.type === 'group' ? 1 : 5 },
            style: {
              fill: color,
              opacity: task.type === 'group' ? 0.6 : opacity * (showProgress ? 0.25 : 0.8),
              stroke: selected === task.id ? color : 'transparent',
              lineWidth: 2,
            },
          },
          ...(showProgress && progress && task.type !== 'group'
            ? [
                {
                  type: 'rect' as const,
                  shape: { ...progress, r: 5 },
                  style: { fill: color, opacity },
                },
              ]
            : []),
          ...(task.type === 'group'
            ? [
                {
                  type: 'rect' as const,
                  shape: { x: start[0], y: rect.y, width: 3, height: 15 },
                  style: { fill: color, opacity },
                },
                {
                  type: 'rect' as const,
                  shape: { x: end[0] - 3, y: rect.y, width: 3, height: 15 },
                  style: { fill: color, opacity },
                },
              ]
            : []),
        ],
      }
    }
    const renderLink: CustomSeriesOption['renderItem'] = (_params, api) => {
      const source = api.coord([Number(api.value(0)), Number(api.value(1))]),
        target = api.coord([Number(api.value(2)), Number(api.value(3))]),
        bend = source[0] + 10
      return {
        type: 'group',
        silent: true,
        children: [
          {
            type: 'polyline',
            shape: {
              points: [
                source,
                [bend, source[1]],
                [bend, (source[1] + target[1]) / 2],
                [target[0] - 10, (source[1] + target[1]) / 2],
                [target[0] - 10, target[1]],
                target,
              ],
            },
            style: { stroke: dependencyColor, lineWidth: 1, fill: 'none', opacity: 0.7 },
          },
          {
            type: 'polygon',
            shape: {
              points: [target, [target[0] - 5, target[1] - 3], [target[0] - 5, target[1] + 3]],
            },
            style: { fill: dependencyColor, opacity: 0.7 },
          },
        ],
      }
    }
    return {
      useUTC: true,
      grid: { top: 32, left: 12, right: 24, bottom: zoom ? 65 : 20, containLabel: true },
      tooltip: {
        show: showTooltip,
        renderMode: 'richText',
        formatter: (raw: unknown) => {
          const p = raw as { dataIndex: number; seriesIndex: number },
            task = rows[p.dataIndex]?.task
          if (!task || p.seriesIndex !== 0) return ''
          return [
            task.title,
            `${task.start}${task.type !== 'milestone' ? ` – ${task.end ?? task.start}` : ''}`,
            `${task.progress ?? 0}% complete`,
          ]
            .map(escape)
            .join(html ? '<br/>' : '\n')
        },
      },
      xAxis: {
        type: 'time',
        position: 'top',
        min: Number.isFinite(min) ? min : undefined,
        max: Number.isFinite(max) ? max : undefined,
        minInterval: unit === 'day' ? DAY : unit === 'week' ? 7 * DAY : 28 * DAY,
        axisLabel: {
          hideOverlap: true,
          formatter: (value: number) =>
            new Date(value).toLocaleDateString(locale, {
              timeZone: 'UTC',
              month: 'short',
              day: unit === 'month' ? undefined : 'numeric',
              year: unit === 'month' ? 'numeric' : undefined,
            }),
        },
        splitLine: { show: true },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: rows.map(
          ({ task, depth }) =>
            `${'  '.repeat(depth)}${task.type === 'group' ? (collapsedSet.has(task.id) ? '▸ ' : '▾ ') : task.type === 'milestone' ? '◆ ' : ''}${task.title}`,
        ),
        axisLabel: { width: 150, overflow: 'truncate' },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: true },
      },
      ...(zoom
        ? {
            dataZoom: [
              { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
              { type: 'slider', xAxisIndex: 0, height: 18, bottom: 8, filterMode: 'weakFilter' },
            ],
          }
        : {}),
      series: [
        {
          id: 'schedule',
          name: 'Schedule',
          type: 'custom',
          renderItem: renderTask,
          clip: true,
          encode: { x: [1, 2], y: 0, tooltip: [1, 2] },
          data: rows.map(({ task }, row) => ({
            id: task.id,
            name: task.title,
            value: [
              row,
              day(task.start),
              day(task.end ?? task.start) + (task.type === 'milestone' ? 0 : DAY),
              task.progress ?? 0,
            ],
          })),
        },
        ...(showDependencies
          ? [
              {
                id: 'dependencies',
                type: 'custom' as const,
                renderItem: renderLink,
                clip: true,
                silent: true,
                tooltip: { show: false },
                encode: { x: [0, 2], y: [1, 3] },
                data: links.map((link) => [
                  day(rows[link.source].task.end ?? rows[link.source].task.start) +
                    (rows[link.source].task.type === 'milestone' ? 0 : DAY),
                  link.source,
                  day(rows[link.target].task.start),
                  link.target,
                ]),
              },
            ]
          : []),
      ],
    }
  }, [
    rows,
    invalid,
    range,
    zoom,
    showTooltip,
    showDependencies,
    showProgress,
    unit,
    collapsedSet,
    barColor,
    milestoneColor,
    dependencyColor,
    selected,
    locale,
    html,
  ])
  const chartOption = React.useMemo(() => mergeChartOptions(built, option), [built, option])
  return (
    <Context.Provider
      value={{
        data,
        rows,
        collapsed: collapsedSet,
        toggle,
        setCollapsed,
        scale: unit,
        setScale,
        selected,
        select,
        editing,
        setEditing,
        editable: editable && !!(onTasksChange || onTaskChange),
        save: (task) => {
          const previous = data.find((item) => item.id === task.id)
          if (!previous) return
          onTasksChange?.(data.map((item) => (item.id === task.id ? task : item)))
          onTaskChange?.(task, previous)
          setEditing('')
        },
        conflicts,
        showDataTable,
      }}
    >
      <Chart
        {...props}
        height={props.height ?? Math.max(260, rows.length * 36 + 90 + (zoom ? 40 : 0))}
        empty={!data.length}
        error={props.error ?? invalid}
        features={{ ...props.features, dataZoom: zoom || props.features?.dataZoom }}
        option={chartOption}
        events={{
          ...props.events,
          click: (event, instance) => {
            props.events?.click?.(event, instance)
            if (event.seriesIndex === 0 && event.dataIndex !== undefined) {
              const task = rows[event.dataIndex]?.task
              if (task) select(task)
            }
          },
        }}
      >
        {children ?? (
          <>
            <GanttChartToolbar />
            <div className="max-h-[600px] overflow-auto">
              <ChartCanvas />
            </div>
            {showDataTable && <GanttChartDataTable />}
          </>
        )}
        <GanttChartTaskEditor key={editing} />
      </Chart>
    </Context.Provider>
  )
}
/** Controls date scale, group expansion, and selection/editing without pointer-only interactions. */
export function GanttChartToolbar() {
  const c = useGantt()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Gantt date scale"
        value={c.scale}
        onChange={(event) => c.setScale(event.target.value as 'day' | 'week' | 'month')}
        className="h-9 rounded-md border bg-background px-2 text-xs"
      >
        <option value="day">Days</option>
        <option value="week">Weeks</option>
        <option value="month">Months</option>
      </select>
      <Button type="button" size="sm" variant="ghost" onClick={() => c.setCollapsed([])}>
        Expand all
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() =>
          c.setCollapsed(c.data.filter((task) => task.type === 'group').map((task) => task.id))
        }
      >
        Collapse groups
      </Button>
      <select
        aria-label="Select task"
        value={c.selected}
        className="ms-auto h-9 max-w-48 rounded-md border bg-background px-2 text-xs"
        onChange={(event) => {
          const task = c.data.find((task) => task.id === event.target.value)
          if (task) c.select(task)
        }}
      >
        <option value="">Select task…</option>
        {c.data.map((task) => (
          <option key={task.id} value={task.id} disabled={task.disabled}>
            {task.title}
          </option>
        ))}
      </select>
      {c.editable && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={
            !c.selected ||
            c.data.find((task) => task.id === c.selected)?.disabled ||
            c.data.find((task) => task.id === c.selected)?.type === 'group'
          }
          onClick={() => c.setEditing(c.selected)}
        >
          <Pencil />
          Edit task
        </Button>
      )}
      {c.conflicts.length > 0 && (
        <p role="status" className="w-full text-xs text-amber-700 dark:text-amber-400">
          {c.conflicts.length} dependency scheduling conflict{c.conflicts.length === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}
/** Presents exact dates and conflicts alongside the visualization, including group and edit controls. */
export function GanttChartDataTable() {
  const c = useGantt()
  return (
    <ChartDataTable
      caption="Schedule tasks and dependencies"
      columns={['Task', 'Start', 'End', 'Progress', 'Dependencies', 'Schedule']}
      rows={c.rows.map(({ task, depth }) => ({
        id: task.id,
        cells: [
          <span className="flex items-center gap-1" style={{ paddingInlineStart: depth * 12 }}>
            {task.type === 'group' && (
              <button
                type="button"
                aria-label={`${c.collapsed.has(task.id) ? 'Expand' : 'Collapse'} ${task.title}`}
                onClick={() => c.toggle(task.id)}
              >
                {c.collapsed.has(task.id) ? (
                  <ChevronRight className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            )}
            <button
              type="button"
              aria-pressed={c.selected === task.id}
              disabled={task.disabled}
              className="text-left hover:text-primary"
              onClick={() => c.select(task)}
            >
              {task.title}
            </button>
            {c.editable && task.type !== 'group' && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6"
                aria-label={`Edit ${task.title}`}
                disabled={task.disabled}
                onClick={() => c.setEditing(task.id)}
              >
                <Pencil className="size-3" />
              </Button>
            )}
          </span>,
          task.start,
          task.end ?? task.start,
          task.type === 'milestone' ? 'Milestone' : `${task.progress ?? 0}%`,
          task.dependsOn?.map((id) => c.data.find((item) => item.id === id)?.title).join(', ') ||
            '—',
          c.conflicts.some((conflict) => conflict.taskId === task.id)
            ? 'Dependency conflict'
            : 'On schedule',
        ],
      }))}
    />
  )
}
/** Edits date-only task schedules and progress without silently moving dependent tasks. */
export function GanttChartTaskEditor() {
  const c = useGantt(),
    original = c.data.find((task) => task.id === c.editing),
    [task, setTask] = React.useState(original),
    [error, setError] = React.useState(''),
    id = React.useId()
  return (
    <Dialog
      open={!!original && c.editable}
      onOpenChange={(open) => {
        if (!open) c.setEditing('')
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {original?.title}</DialogTitle>
          <DialogDescription>
            End dates include the full day. Dependencies are checked and remain in their current
            schedules.
          </DialogDescription>
        </DialogHeader>
        {task && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              const next = {
                  ...task,
                  title: task.title.trim(),
                  ...(task.type === 'milestone' ? { end: task.start } : {}),
                },
                problem = validateGanttTasks(
                  c.data.map((item) => (item.id === next.id ? next : item)),
                )
              if (!next.title || problem) {
                setError(problem ?? 'Add a task title.')
                return
              }
              c.save(next)
            }}
          >
            <div className="space-y-1">
              <label htmlFor={`${id}-title`} className="text-xs font-medium">
                Title
              </label>
              <Input
                id={`${id}-title`}
                value={task.title}
                onValueChange={(title) => setTask({ ...task, title })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['start', 'end'] as const)
                .filter((field) => task.type !== 'milestone' || field === 'start')
                .map((field) => (
                  <div key={field} className="space-y-1">
                    <label htmlFor={`${id}-${field}`} className="text-xs font-medium capitalize">
                      {field === 'start' ? 'Start' : 'End'}
                    </label>
                    <Input
                      id={`${id}-${field}`}
                      type="date"
                      value={task[field] ?? task.start}
                      onValueChange={(value) => setTask({ ...task, [field]: value })}
                      required
                    />
                  </div>
                ))}
            </div>
            {task.type !== 'milestone' && (
              <div className="space-y-1">
                <label htmlFor={`${id}-progress`} className="text-xs font-medium">
                  Progress · {task.progress ?? 0}%
                </label>
                <input
                  id={`${id}-progress`}
                  type="range"
                  min={0}
                  max={100}
                  value={task.progress ?? 0}
                  className="w-full accent-primary"
                  onChange={(event) => setTask({ ...task, progress: Number(event.target.value) })}
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => c.setEditing('')}>
                Cancel
              </Button>
              <Button type="submit">Save task</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
