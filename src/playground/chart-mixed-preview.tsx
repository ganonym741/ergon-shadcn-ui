import * as React from 'react'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { Chart, type ChartProps } from '@/components/ui/chart'

const modules = [LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent]
export default function MixedChartPreview(props: ChartProps) {
  return <Chart {...props} modules={modules} />
}
