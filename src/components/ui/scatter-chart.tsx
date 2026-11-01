import type * as React from 'react'
import { ScatterChart as ScatterSeriesModule } from 'echarts/charts'
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
registerChartModules([ScatterSeriesModule, GridComponent, TooltipComponent, LegendComponent])
export interface ScatterPoint {
  id: string
  name?: string
  x: number
  y: number
  size?: number
}
export interface ScatterSeries {
  id: string
  name: string
  data: ScatterPoint[]
  color?: string
}
export interface ScatterChartProps extends Omit<ChartProps, 'option'> {
  series: ScatterSeries[]
  zoom?: boolean
  showLegend?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
export function ScatterChart({
  series,
  zoom = false,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: ScatterChartProps): React.JSX.Element {
  const axis = {
    type: 'value' as const,
    splitLine: { show: showGrid, lineStyle: { type: 'dashed' as const, opacity: 0.35 } },
  }
  return (
    <Chart
      empty={!series.some((item) => item.data.length)}
      {...props}
      features={{ ...props.features, dataZoom: zoom || props.features?.dataZoom }}
      option={mergeChartOptions(
        {
          grid: { top: 24, right: 28, bottom: zoom ? 72 : 28, left: 12, containLabel: true },
          tooltip: { show: showTooltip, trigger: 'item' },
          legend: { show: false, data: series.map((item) => item.name) },
          xAxis: axis,
          yAxis: axis,
          ...(zoom
            ? { dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 10 }] }
            : {}),
          series: series.map((item) => ({
            id: item.id,
            name: item.name,
            type: 'scatter',
            itemStyle: { color: item.color, opacity: 0.8 },
            data: item.data.map((point) => ({
              id: point.id,
              name: point.name ?? point.id,
              value: [point.x, point.y],
              symbolSize: point.size ?? 12,
            })),
          })),
        },
        option,
      )}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showLegend && (
            <ChartLegend items={series.map((item) => ({ name: item.name, color: item.color }))} />
          )}
          {showDataTable && (
            <ChartDataTable
              columns={['Series', 'Point', 'X', 'Y']}
              rows={series.flatMap((item) =>
                item.data.map((point) => ({
                  id: `${item.id}:${point.id}`,
                  cells: [item.name, point.name ?? point.id, point.x, point.y],
                })),
              )}
            />
          )}
        </>
      )}
    </Chart>
  )
}
