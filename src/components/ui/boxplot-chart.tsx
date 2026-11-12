import * as React from 'react'
import { BoxplotChart as BoxplotSeries, ScatterChart as ScatterSeries } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import {
  Chart,
  ChartCanvas,
  ChartDataTable,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
registerChartModules([BoxplotSeries, ScatterSeries, GridComponent, TooltipComponent])
export interface BoxplotStatistics {
  /** Lower whisker, first quartile, median, third quartile, upper whisker. */
  summary: [number, number, number, number, number]
  outliers: number[]
}
export interface BoxplotDatum extends Omit<BoxplotStatistics, 'outliers'> {
  id: string
  label: string
  outliers?: number[]
}
/**
 * Calculates interpolated quartiles, Tukey whiskers, and outliers without mutating observations. Rejects empty or nonfinite input and negative whisker multipliers.
 */
export function calculateBoxplotStatistics(
  values: readonly number[],
  whiskerIQR = 1.5,
): BoxplotStatistics {
  if (
    !values.length ||
    values.some((v) => !Number.isFinite(v)) ||
    !Number.isFinite(whiskerIQR) ||
    whiskerIQR < 0
  )
    throw new Error('Supply finite observations and a nonnegative whisker multiplier.')
  const sorted = [...values].sort((a, b) => a - b)
  const quantile = (p: number) => {
    const position = (sorted.length - 1) * p,
      index = Math.floor(position),
      fraction = position - index
    return (
      sorted[index] * (1 - fraction) + sorted[Math.min(index + 1, sorted.length - 1)] * fraction
    )
  }
  const q1 = quantile(0.25),
    median = quantile(0.5),
    q3 = quantile(0.75),
    spread = (q3 - q1) * whiskerIQR,
    lower = q1 - spread,
    upper = q3 + spread
  const inside = sorted.filter((v) => v >= lower && v <= upper)
  return {
    summary: [Math.min(q1, inside[0] ?? q1), q1, median, q3, Math.max(q3, inside.at(-1) ?? q3)],
    outliers: sorted.filter((v) => v < lower || v > upper),
  }
}
export interface BoxplotChartProps extends Omit<ChartProps, 'option'> {
  data: BoxplotDatum[]
  horizontal?: boolean
  showOutliers?: boolean
  boxColor?: string
  outlierColor?: string
  zoom?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
/**
 * Displays five-number summaries and optional outliers with configurable orientation, lazy zoom, and an accessible statistics table.
 */
export function BoxplotChart({
  data,
  horizontal = false,
  showOutliers = true,
  boxColor = '#b93e28',
  outlierColor = '#5579bd',
  zoom = false,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: BoxplotChartProps): React.JSX.Element {
  const invalid = data.some(
    (d) =>
      !Array.isArray(d.summary) ||
      d.summary.length !== 5 ||
      d.summary.some((v, i, a) => !Number.isFinite(v) || (i > 0 && v < a[i - 1])) ||
      d.outliers?.some((v) => !Number.isFinite(v)),
  )
    ? 'Boxplot summaries must contain five ordered, finite values.'
    : undefined
  const built = React.useMemo<EChartsOption>(
    () =>
      invalid
        ? {}
        : {
            grid: { top: 20, left: 12, right: 24, bottom: zoom ? 72 : 28, containLabel: true },
            tooltip: { show: showTooltip, trigger: 'item' },
            xAxis: horizontal
              ? { type: 'value' }
              : {
                  type: 'category',
                  data: data.map((d) => d.label),
                  axisLabel: { hideOverlap: true },
                },
            yAxis: horizontal
              ? { type: 'category', data: data.map((d) => d.label) }
              : { type: 'value' },
            ...(zoom
              ? {
                  dataZoom: [
                    { type: 'inside', ...(horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 }) },
                    {
                      type: 'slider',
                      height: 20,
                      bottom: 8,
                      ...(horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 }),
                    },
                  ],
                }
              : {}),
            series: [
              {
                id: 'distribution',
                name: 'Distribution',
                type: 'boxplot',
                data: data.map((d) => ({ id: d.id, name: d.label, value: d.summary })),
                boxWidth: [12, 48],
                itemStyle: { color: 'transparent', borderColor: boxColor, borderWidth: 1.5 },
              },
              ...(showOutliers
                ? [
                    {
                      id: 'outliers',
                      name: 'Outliers',
                      type: 'scatter' as const,
                      symbolSize: 7,
                      itemStyle: { color: outlierColor, opacity: 0.75 },
                      data: data.flatMap((d, i) =>
                        (d.outliers ?? []).map((v, j) => ({
                          id: `${d.id}-${j}`,
                          name: `${d.label}: ${v}`,
                          value: horizontal ? [v, i] : [i, v],
                        })),
                      ),
                    },
                  ]
                : []),
            ],
          },
    [invalid, data, horizontal, showOutliers, showTooltip, zoom, boxColor, outlierColor],
  )
  const chartOption = React.useMemo(() => mergeChartOptions(built, option), [built, option])
  return (
    <Chart
      empty={!data.length}
      {...props}
      error={props.error ?? invalid}
      features={{ ...props.features, dataZoom: zoom || props.features?.dataZoom }}
      option={chartOption}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showDataTable && (
            <ChartDataTable
              columns={[
                'Group',
                'Lower whisker',
                'Q1',
                'Median',
                'Q3',
                'Upper whisker',
                'Outliers',
              ]}
              rows={data.map((d) => ({
                id: d.id,
                cells: [d.label, ...d.summary, (d.outliers ?? []).join(', ')],
              }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
