import type * as React from 'react'
import { BarChart as BarSeries } from 'echarts/charts'
import { registerChartModules } from '@/components/ui/chart'
import { CartesianChart, type CartesianChartProps } from '@/components/ui/chart-cartesian'
registerChartModules([BarSeries])
export type BarChartProps = CartesianChartProps
export function BarChart(props: BarChartProps): React.JSX.Element {
  return <CartesianChart kind="bar" {...props} />
}
