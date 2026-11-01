import type * as React from 'react'
import { PieChart as PieSeries } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
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
registerChartModules([PieSeries, TooltipComponent, LegendComponent, LabelLayout])
export interface ChartValue {
  id: string
  name: string
  value: number
  color?: string
}
export interface PieChartProps extends Omit<ChartProps, 'option'> {
  data: ChartValue[]
  donut?: boolean
  rose?: boolean
  showLegend?: boolean
  showLabels?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
export function PieChart({
  data,
  donut = true,
  rose = false,
  showLegend = true,
  showLabels = false,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: PieChartProps): React.JSX.Element {
  return (
    <Chart
      empty={!data.length}
      {...props}
      option={mergeChartOptions(
        {
          tooltip: { show: showTooltip, trigger: 'item' },
          legend: { show: false, data: data.map((item) => item.name) },
          series: [
            {
              type: 'pie',
              radius: donut ? ['48%', '76%'] : ['0%', '76%'],
              roseType: rose ? 'radius' : undefined,
              padAngle: 3,
              itemStyle: { borderRadius: 5 },
              label: { show: showLabels },
              data: data.map((item) => ({
                id: item.id,
                name: item.name,
                value: item.value,
                itemStyle: { color: item.color },
              })),
              emphasis: { scaleSize: 6 },
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
            <ChartLegend items={data.map((item) => ({ name: item.name, color: item.color }))} />
          )}
          {showDataTable && (
            <ChartDataTable
              columns={['Category', 'Value']}
              rows={data.map((item) => ({ id: item.id, cells: [item.name, item.value] }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
