import type * as React from 'react'
import { GaugeChart as GaugeSeries } from 'echarts/charts'
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
registerChartModules([GaugeSeries, TooltipComponent])
export interface GaugeChartProps extends Omit<ChartProps, 'option'> {
  value: number
  min?: number
  max?: number
  name?: string
  unit?: string
  showPointer?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  name = 'Progress',
  unit = '%',
  showPointer = false,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: GaugeChartProps): React.JSX.Element {
  return (
    <Chart
      {...props}
      option={mergeChartOptions(
        {
          tooltip: { show: showTooltip },
          series: [
            {
              type: 'gauge',
              min,
              max,
              startAngle: 210,
              endAngle: -30,
              radius: '86%',
              center: ['50%', '58%'],
              progress: { show: true, roundCap: true, width: 16 },
              axisLine: { roundCap: true, lineStyle: { width: 16 } },
              pointer: { show: showPointer, length: '55%', width: 4 },
              axisTick: { show: false },
              splitLine: { show: false },
              axisLabel: { distance: 24, fontSize: 11 },
              title: { offsetCenter: [0, '46%'], fontSize: 13 },
              detail: {
                valueAnimation: true,
                formatter: `{value}${unit}`,
                fontSize: 38,
                fontWeight: 600,
                offsetCenter: [0, '12%'],
              },
              data: [{ value, name }],
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
              columns={['Measure', 'Value', 'Minimum', 'Maximum']}
              rows={[{ id: 'gauge', cells: [name, `${value}${unit}`, min, max] }]}
            />
          )}
        </>
      )}
    </Chart>
  )
}
