import type * as React from 'react'
import { RadarChart as RadarSeriesModule } from 'echarts/charts'
import { RadarComponent, TooltipComponent, LegendComponent } from 'echarts/components'
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
registerChartModules([RadarSeriesModule, RadarComponent, TooltipComponent, LegendComponent])
export interface RadarIndicator {
  name: string
  max?: number
  min?: number
}
export interface RadarSeries {
  id: string
  name: string
  values: number[]
  color?: string
}
export interface RadarChartProps extends Omit<ChartProps, 'option'> {
  indicators: RadarIndicator[]
  series: RadarSeries[]
  shape?: 'polygon' | 'circle'
  filled?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
export function RadarChart({
  indicators,
  series,
  shape = 'polygon',
  filled = true,
  showLegend = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: RadarChartProps): React.JSX.Element {
  return (
    <Chart
      empty={!indicators.length || !series.length}
      {...props}
      option={mergeChartOptions(
        {
          tooltip: { show: showTooltip },
          legend: { show: false, data: series.map((item) => item.name) },
          radar: {
            indicator: indicators,
            shape,
            radius: '63%',
            splitArea: { show: false },
            splitLine: { lineStyle: { opacity: 0.3 } },
          },
          series: [
            {
              type: 'radar',
              data: series.map((item) => ({
                id: item.id,
                name: item.name,
                value: item.values,
                lineStyle: { color: item.color, width: 2 },
                itemStyle: { color: item.color },
                areaStyle: { opacity: filled ? 0.12 : 0 },
              })),
            },
          ],
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
              columns={['Series', ...indicators.map((item) => item.name)]}
              rows={series.map((item) => ({ id: item.id, cells: [item.name, ...item.values] }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
