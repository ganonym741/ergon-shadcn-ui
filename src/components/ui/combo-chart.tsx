import * as React from 'react'
import { BarChart as BarSeries, LineChart as LineSeries } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import {
  Chart,
  ChartCanvas,
  ChartLegend,
  ChartDataTable,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
registerChartModules([BarSeries, LineSeries, GridComponent, TooltipComponent, LegendComponent])
export interface ComboDatum {
  id: string
  label: string
  [key: string]: string | number | null
}
export interface ComboAxis {
  id: string
  label?: string
  position?: 'left' | 'right'
  unit?: string
  min?: number
  max?: number
}
export interface ComboSeries {
  key: string
  label?: string
  type: 'bar' | 'line' | 'area'
  axisId?: string
  color?: string
  stack?: string
  smooth?: boolean
}
export interface ComboChartProps extends Omit<ChartProps, 'option'> {
  data: ComboDatum[]
  series: ComboSeries[]
  axes?: ComboAxis[]
  zoom?: boolean
  showGrid?: boolean
  showLabels?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
const defaultAxes: ComboAxis[] = [{ id: 'value' }]
export function ComboChart({
  data,
  series,
  axes = defaultAxes,
  zoom = false,
  showGrid = true,
  showLabels = false,
  showLegend = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: ComboChartProps): React.JSX.Element {
  const invalid =
    !axes.length ||
    new Set(axes.map((a) => a.id)).size !== axes.length ||
    series.some((s) => s.axisId && !axes.some((a) => a.id === s.axisId))
      ? 'Each series must reference a unique, declared axis.'
      : undefined
  const built = React.useMemo<EChartsOption>(
    () =>
      invalid
        ? {}
        : {
            grid: {
              top: axes.some((a) => a.label) ? 44 : 20,
              left: 16,
              right: 24,
              bottom: zoom ? 72 : 28,
              containLabel: true,
            },
            tooltip: { show: showTooltip, trigger: 'axis', axisPointer: { type: 'cross' } },
            legend: { show: false, data: series.map((s) => s.label ?? s.key) },
            xAxis: {
              type: 'category',
              data: data.map((d) => d.label),
              boundaryGap: series.some((s) => s.type === 'bar'),
              axisTick: { show: false },
              axisLabel: { hideOverlap: true },
            },
            yAxis: axes.map((a, i) => ({
              type: 'value',
              name: a.label,
              position: a.position ?? (i % 2 ? 'right' : 'left'),
              offset:
                axes
                  .slice(0, i)
                  .filter(
                    (previous, index) =>
                      (previous.position ?? (index % 2 ? 'right' : 'left')) ===
                      (a.position ?? (i % 2 ? 'right' : 'left')),
                  ).length * 58,
              min: a.min,
              max: a.max,
              splitLine: { show: showGrid && i === 0, lineStyle: { type: 'dashed', opacity: 0.3 } },
              axisLabel: { formatter: (v: number) => `${v}${a.unit ?? ''}` },
            })),
            ...(zoom
              ? { dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 8 }] }
              : {}),
            series: series.map((s) => ({
              id: s.key,
              name: s.label ?? s.key,
              type: s.type === 'area' ? 'line' : s.type,
              yAxisIndex: s.axisId ? axes.findIndex((a) => a.id === s.axisId) : 0,
              stack: s.stack,
              smooth: s.smooth ?? false,
              barMaxWidth: 40,
              showSymbol: data.length <= 24,
              ...(s.type === 'area' ? { areaStyle: { opacity: 0.16 } } : {}),
              itemStyle: { color: s.color },
              lineStyle: { width: 2.5 },
              label: { show: showLabels },
              data: data.map((d) => ({
                id: d.id,
                name: d.label,
                value:
                  typeof d[s.key] === 'number' && Number.isFinite(d[s.key])
                    ? (d[s.key] as number)
                    : null,
              })),
            })),
          },
    [invalid, axes, data, series, zoom, showGrid, showLabels, showTooltip],
  )
  const chartOption = React.useMemo(() => mergeChartOptions(built, option), [built, option])
  return (
    <Chart
      empty={!data.length || !series.length}
      {...props}
      error={props.error ?? invalid}
      features={{ ...props.features, dataZoom: zoom || props.features?.dataZoom }}
      option={chartOption}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showLegend && (
            <ChartLegend items={series.map((s) => ({ name: s.label ?? s.key, color: s.color }))} />
          )}
          {showDataTable && (
            <ChartDataTable
              columns={['Label', ...series.map((s) => s.label ?? s.key)]}
              rows={data.map((d) => ({
                id: d.id,
                cells: [d.label, ...series.map((s) => d[s.key])],
              }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
