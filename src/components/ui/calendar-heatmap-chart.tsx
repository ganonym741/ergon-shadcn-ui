import * as React from 'react'
import { HeatmapChart as HeatmapSeries } from 'echarts/charts'
import { CalendarComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import {
  Chart,
  ChartCanvas,
  ChartDataTable,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
import { useUIConfig } from '@/components/ui/config-provider'
registerChartModules([HeatmapSeries, CalendarComponent, TooltipComponent, VisualMapComponent])
export interface CalendarHeatmapDatum {
  id: string
  date: string
  value: number
}
export type CalendarHeatmapRange = string | number | [string, string]
/**
 * Checks that a date key names a real YYYY-MM-DD calendar day without converting it to the application time zone.
 */
const isoDay = (value: string): number => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN
  const time = Date.parse(value + 'T00:00:00Z')
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : NaN
}
/**
 * Expands a calendar year, month, day, or ordered ISO date pair into inclusive start and end keys. Throws for invalid dates or reversed ranges.
 */
export function calendarDateExtent(range: CalendarHeatmapRange): [string, string] {
  const value = String(range)
  let dates: [string, string]
  if (Array.isArray(range)) dates = range
  else if (/^\d{4}$/.test(value)) dates = [`${value}-01-01`, `${value}-12-31`]
  else if (/^\d{4}-\d{2}$/.test(value)) {
    const month = Number(value.slice(5))
    if (month < 1 || month > 12) throw new Error('Invalid calendar month.')
    const last = new Date(value + '-01T00:00:00Z')
    last.setUTCMonth(last.getUTCMonth() + 1, 0)
    dates = [value + '-01', last.toISOString().slice(0, 10)]
  } else dates = [value, value]
  if (
    !Number.isFinite(isoDay(dates[0])) ||
    !Number.isFinite(isoDay(dates[1])) ||
    dates[0] > dates[1]
  )
    throw new Error('Use a calendar year, month, date, or ordered pair of ISO dates.')
  return dates
}
export interface CalendarHeatmapChartProps extends Omit<ChartProps, 'option'> {
  data: CalendarHeatmapDatum[]
  range: CalendarHeatmapRange
  orientation?: 'horizontal' | 'vertical'
  firstDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  minimumCellSize?: number
  min?: number
  max?: number
  colors?: string[]
  showDayLabels?: boolean
  showMonthLabels?: boolean
  showVisualMap?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
const calendarColors = ['#f0f2ed', '#b3d4bd', '#589c76', '#216645']
/**
 * Displays one aggregated value per calendar day within the requested range. Validates date keys and keeps minimum-size cells scrollable on narrow screens.
 */
export function CalendarHeatmapChart({
  data,
  range,
  orientation = 'horizontal',
  firstDay = 1,
  minimumCellSize = 12,
  min = 0,
  max,
  colors = calendarColors,
  showDayLabels = true,
  showMonthLabels = true,
  showVisualMap = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: CalendarHeatmapChartProps): React.JSX.Element {
  const { locale } = useUIConfig()
  let extent: [string, string] = ['2026-01-01', '2026-12-31'],
    invalid: string | undefined
  try {
    extent = calendarDateExtent(range)
    if (
      data.some((d) => !Number.isFinite(isoDay(d.date)) || !Number.isFinite(d.value)) ||
      new Set(data.map((d) => d.date)).size !== data.length
    )
      throw new Error('Supply one finite value per ISO calendar date.')
  } catch (error) {
    invalid = error instanceof Error ? error.message : String(error)
  }
  const visible = data.filter((d) => d.date >= extent[0] && d.date <= extent[1]),
    upper = max ?? visible.reduce((high, d) => Math.max(high, d.value), min + 1)
  const weeks = Math.ceil(((isoDay(extent[1]) - isoDay(extent[0])) / 86400000 + 7) / 7)
  if (!Number.isFinite(min) || !Number.isFinite(upper) || upper <= min)
    invalid = 'Color maximum must exceed its finite minimum.'
  if (!Number.isFinite(minimumCellSize) || minimumCellSize <= 0)
    invalid = 'Minimum cell size must be positive.'
  const cellMinimum = Number.isFinite(minimumCellSize) && minimumCellSize > 0 ? minimumCellSize : 12
  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2023, 0, 1 + i)),
    ),
  )
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2024, i, 1)),
    ),
  )
  const built: EChartsOption = invalid
    ? {}
    : {
        tooltip: {
          show: showTooltip,
          formatter: (params) => {
            const item = Array.isArray(params) ? params[0] : params
            return Array.isArray(item.value) ? `${item.value[0]}: ${item.value[1]}` : ''
          },
        },
        visualMap: {
          show: showVisualMap,
          min,
          max: upper,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          inRange: { color: colors },
        },
        calendar: {
          range: extent,
          orient: orientation,
          left: showDayLabels ? 48 : 16,
          right: 16,
          top: showMonthLabels ? 40 : 16,
          bottom: showVisualMap ? 64 : 20,
          cellSize: 'auto',
          yearLabel: { show: false },
          dayLabel: { show: showDayLabels, firstDay, nameMap: dayNames, fontSize: 10 },
          monthLabel: { show: showMonthLabels, nameMap: monthNames, fontSize: 11 },
          itemStyle: { borderWidth: 2, borderColor: 'transparent', color: colors[0] },
          splitLine: { show: false },
        },
        series: [
          {
            id: 'activity',
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: visible.map((d) => ({ id: d.id, name: d.date, value: [d.date, d.value] })),
            itemStyle: { borderRadius: 3 },
          },
        ],
      }
  return (
    <Chart
      empty={!visible.length}
      {...props}
      error={props.error ?? invalid}
      option={mergeChartOptions(built, option)}
    >
      {children ?? (
        <>
          <div
            role="region"
            aria-label="Scrollable calendar chart"
            tabIndex={0}
            className="overflow-auto rounded focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ChartCanvas
              style={
                orientation === 'horizontal'
                  ? { minWidth: weeks * cellMinimum + 80 }
                  : { minHeight: weeks * cellMinimum + 104 }
              }
            />
          </div>
          {showDataTable && (
            <ChartDataTable
              columns={['Date', 'Value']}
              rows={visible.map((d) => ({ id: d.id, cells: [d.date, d.value] }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
