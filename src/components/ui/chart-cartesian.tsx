import type * as React from 'react'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { LabelLayout } from 'echarts/features'
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
registerChartModules([GridComponent, TooltipComponent, LegendComponent, LabelLayout])
export interface ChartDatum {
  id: string
  label: string
  [key: string]: string | number | null
}
export interface ChartSeries {
  key: string
  label?: string
  color?: string
}
export interface CartesianChartProps extends Omit<ChartProps, 'option'> {
  data: ChartDatum[]
  series: ChartSeries[]
  stacked?: boolean
  horizontal?: boolean
  smooth?: boolean
  zoom?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showLabels?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
export function CartesianChart({
  kind,
  data,
  series,
  stacked = false,
  horizontal = false,
  smooth = true,
  zoom = false,
  showLegend = true,
  showGrid = true,
  showLabels = false,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: CartesianChartProps & { kind: 'line' | 'area' | 'bar' }): React.JSX.Element {
  const names = series.map((item) => ({ name: item.label ?? item.key, color: item.color }))
  const category = {
    type: 'category' as const,
    data: data.map((row) => row.label),
    boundaryGap: kind === 'bar',
    axisTick: { show: false },
    axisLine: { show: false },
    axisLabel: { hideOverlap: true },
  }
  const numeric = {
    type: 'value' as const,
    splitLine: { show: showGrid, lineStyle: { type: 'dashed' as const, opacity: 0.35 } },
  }
  const built: EChartsOption = {
    grid: { top: 24, right: 24, bottom: zoom ? 72 : 28, left: 12, containLabel: true },
    tooltip: {
      show: showTooltip,
      trigger: 'axis',
      axisPointer: { type: kind === 'bar' ? 'shadow' : 'line' },
    },
    legend: { show: false, data: names.map((item) => item.name) },
    xAxis: horizontal ? numeric : category,
    yAxis: horizontal ? category : numeric,
    ...(zoom
      ? {
          dataZoom: [
            { type: 'inside', ...(horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 }) },
            {
              type: 'slider',
              height: 20,
              bottom: 10,
              ...(horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 }),
            },
          ],
        }
      : {}),
    series: series.map((item) => ({
      id: item.key,
      name: item.label ?? item.key,
      type: kind === 'bar' ? 'bar' : 'line',
      data: data.map((row) =>
        typeof row[item.key] === 'number' && Number.isFinite(row[item.key]) ? row[item.key] : null,
      ),
      stack: stacked ? 'total' : undefined,
      smooth: kind !== 'bar' && smooth,
      symbolSize: 7,
      showSymbol: data.length <= 20,
      barMaxWidth: 48,
      itemStyle: {
        color: item.color,
        ...(kind === 'bar' ? { borderRadius: stacked ? 0 : [5, 5, 0, 0] } : {}),
      },
      lineStyle: { width: 2.5 },
      ...(kind === 'area' ? { areaStyle: { opacity: 0.15 } } : {}),
      label: { show: showLabels, position: horizontal ? 'right' : 'top' },
      emphasis: { focus: 'series' },
    })),
  }
  return (
    <Chart
      empty={!data.length || !series.length}
      {...props}
      features={{ ...props.features, dataZoom: zoom || props.features?.dataZoom }}
      option={mergeChartOptions(built, option)}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showLegend && <ChartLegend items={names} />}
          {showDataTable && (
            <ChartDataTable
              columns={['Label', ...names.map((item) => item.name)]}
              rows={data.map((row) => ({
                id: row.id,
                cells: [row.label, ...series.map((item) => row[item.key])],
              }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
