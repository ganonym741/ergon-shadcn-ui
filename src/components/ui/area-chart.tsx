import type * as React from 'react'
import { LineChart as LineSeries } from 'echarts/charts'
import { registerChartModules } from '@/components/ui/chart'
import { CartesianChart, type CartesianChartProps } from '@/components/ui/chart-cartesian'
registerChartModules([LineSeries])
export type AreaChartProps = CartesianChartProps
export function AreaChart(props: AreaChartProps): React.JSX.Element {
  return <CartesianChart kind="area" {...props} />
}
