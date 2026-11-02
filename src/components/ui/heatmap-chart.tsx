import type * as React from 'react'
import { HeatmapChart as HeatmapSeries } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import {
  Chart,
  ChartCanvas,
  ChartDataTable,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
registerChartModules([HeatmapSeries, GridComponent, TooltipComponent, VisualMapComponent])
export interface HeatmapPoint {
  id: string
  x: string
  y: string
  value: number
}
export interface HeatmapChartProps extends Omit<ChartProps, 'option'> {
  data: HeatmapPoint[]
  xCategories: string[]
  yCategories: string[]
  min?: number
  max?: number
  showLabels?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
export function HeatmapChart({
  data,
  xCategories,
  yCategories,
  min = 0,
  max,
  showLabels = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: HeatmapChartProps): React.JSX.Element {
  const xIndex = new Map(xCategories.map((label, index) => [label, index]))
  const yIndex = new Map(yCategories.map((label, index) => [label, index]))
  const visible = data.filter((point) => xIndex.has(point.x) && yIndex.has(point.y))
  const upper = max ?? visible.reduce((value, point) => Math.max(value, point.value), min + 1)
  return (
    <Chart
      empty={!visible.length}
      {...props}
      option={mergeChartOptions(
        {
          grid: { top: 16, right: 16, bottom: 72, left: 12, containLabel: true },
          tooltip: { show: showTooltip },
          xAxis: {
            type: 'category',
            data: xCategories,
            splitArea: { show: true },
            axisTick: { show: false },
            axisLine: { show: false },
          },
          yAxis: {
            type: 'category',
            data: yCategories,
            axisTick: { show: false },
            axisLine: { show: false },
          },
          visualMap: {
            min,
            max: upper,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 0,
            inRange: { color: ['#f9eee8', '#e4a48e', '#b93e28'] },
          },
          series: [
            {
              type: 'heatmap',
              label: { show: showLabels },
              data: visible.map((point) => ({
                id: point.id,
                name: `${point.x}, ${point.y}`,
                value: [xIndex.get(point.x)!, yIndex.get(point.y)!, point.value],
              })),
              itemStyle: { borderWidth: 3, borderColor: 'transparent', borderRadius: 4 },
            },
          ],
        },
        option,
      )}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showDataTable && (
            <ChartDataTable
              columns={['X', 'Y', 'Value']}
              rows={visible.map((point) => ({
                id: point.id,
                cells: [point.x, point.y, point.value],
              }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
