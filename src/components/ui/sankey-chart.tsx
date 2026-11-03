import * as React from 'react'
import { env as chartEnvironment, format as chartFormat } from 'echarts/core'
import { SankeyChart as SankeySeries } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import {
  Chart,
  ChartCanvas,
  ChartDataTable,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
registerChartModules([SankeySeries, TooltipComponent])
export interface SankeyNode {
  id: string
  label?: string
  color?: string
}
export interface SankeyLink {
  id: string
  source: string
  target: string
  value: number
  color?: string
}
/**
 * Validates unique IDs, existing endpoints, finite nonnegative weights, and acyclic flows. Returns the first validation message or undefined.
 */
export function validateSankeyData(
  nodes: readonly SankeyNode[],
  links: readonly SankeyLink[],
): string | undefined {
  const ids = new Set(nodes.map((n) => n.id))
  if (ids.size !== nodes.length || new Set(links.map((l) => l.id)).size !== links.length)
    return 'Node and link IDs must be unique.'
  const degrees = new Map(nodes.map((n) => [n.id, 0])),
    edges = new Map(nodes.map((n) => [n.id, [] as string[]]))
  for (const link of links) {
    if (
      !ids.has(link.source) ||
      !ids.has(link.target) ||
      !Number.isFinite(link.value) ||
      link.value < 0
    )
      return 'Links need existing node IDs and nonnegative, finite values.'
    degrees.set(link.target, degrees.get(link.target)! + 1)
    edges.get(link.source)!.push(link.target)
  }
  const queue = nodes.filter((n) => degrees.get(n.id) === 0).map((n) => n.id)
  for (let i = 0; i < queue.length; i++)
    for (const target of edges.get(queue[i])!) {
      const degree = degrees.get(target)! - 1
      degrees.set(target, degree)
      if (!degree) queue.push(target)
    }
  if (queue.length !== nodes.length) return 'Sankey flows must not contain cycles.'
}
export interface SankeyChartProps extends Omit<ChartProps, 'option'> {
  nodes: SankeyNode[]
  links: SankeyLink[]
  orientation?: 'horizontal' | 'vertical'
  nodeAlign?: 'left' | 'right' | 'justify'
  nodeWidth?: number
  nodeGap?: number
  draggable?: boolean
  showLabels?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
/**
 * Displays validated weighted flows with configurable node layout and dragging. Tooltip labels remain plain in rich-text mode and escaped in HTML mode.
 */
export function SankeyChart({
  nodes,
  links,
  orientation = 'horizontal',
  nodeAlign = 'justify',
  nodeWidth = 18,
  nodeGap = 14,
  draggable = true,
  showLabels = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: SankeyChartProps): React.JSX.Element {
  const invalid = validateSankeyData(nodes, links)
  const names = React.useMemo(() => new Map(nodes.map((n) => [n.id, n.label ?? n.id])), [nodes])
  const hasFlow = links.some((link) => link.value > 0)
  const tooltip = Array.isArray(option?.tooltip) ? option.tooltip[0] : option?.tooltip
  const htmlTooltip =
    tooltip?.renderMode === 'html' ||
    (tooltip?.renderMode === 'auto' && chartEnvironment.domSupported)
  const built = React.useMemo<EChartsOption>(
    () =>
      invalid || !hasFlow
        ? {}
        : {
            tooltip: {
              show: showTooltip,
              trigger: 'item',
              formatter: (params) => {
                const p = Array.isArray(params) ? params[0] : params
                const edge = p.data as { source?: string; target?: string }
                const name =
                  edge.source && edge.target
                    ? `${names.get(edge.source) ?? edge.source} → ${names.get(edge.target) ?? edge.target}`
                    : (names.get(p.name) ?? p.name)
                return `${htmlTooltip ? chartFormat.encodeHTML(name) : name}: ${Number(p.value).toLocaleString()}`
              },
            },
            series: [
              {
                id: 'flow',
                type: 'sankey',
                left: 12,
                right: showLabels ? 88 : 12,
                top: 16,
                bottom: 24,
                orient: orientation,
                nodeAlign,
                nodeWidth,
                nodeGap,
                draggable,
                layoutIterations: 32,
                emphasis: { focus: 'adjacency' },
                label: {
                  show: showLabels,
                  formatter: (params: { name: string }) => names.get(params.name) ?? params.name,
                  position: orientation === 'horizontal' ? 'right' : 'bottom',
                  width: 80,
                  overflow: 'truncate',
                },
                lineStyle: { color: 'source', opacity: 0.3, curveness: 0.5 },
                data: nodes.map((n) => ({
                  id: n.id,
                  name: n.label ?? n.id,
                  itemStyle: { color: n.color },
                })),
                links: links.map((l) => ({
                  ...l,
                  lineStyle: l.color ? { color: l.color } : undefined,
                })),
              },
            ],
          },
    [
      invalid,
      hasFlow,
      names,
      nodes,
      links,
      orientation,
      nodeAlign,
      nodeWidth,
      nodeGap,
      draggable,
      showLabels,
      showTooltip,
      htmlTooltip,
    ],
  )
  const chartOption = React.useMemo(() => mergeChartOptions(built, option), [built, option])
  return (
    <Chart
      empty={!nodes.length || !hasFlow}
      {...props}
      error={props.error ?? invalid}
      option={chartOption}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showDataTable && (
            <ChartDataTable
              columns={['Source', 'Destination', 'Value']}
              rows={links.map((l) => ({
                id: l.id,
                cells: [names.get(l.source) ?? l.source, names.get(l.target) ?? l.target, l.value],
              }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
