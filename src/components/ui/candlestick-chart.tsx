import * as React from 'react'
import {
  CandlestickChart as CandlestickSeries,
  BarChart as BarSeries,
  LineChart as LineSeries,
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AxisPointerComponent,
} from 'echarts/components'
import {
  Chart,
  ChartCanvas,
  ChartLegend,
  ChartDataTable,
  useChart,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
  type ChartHandle,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
registerChartModules([
  CandlestickSeries,
  BarSeries,
  LineSeries,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AxisPointerComponent,
])
export interface CandlestickDatum {
  id: string
  date: string
  open: number
  close: number
  low: number
  high: number
  volume?: number
}
export interface CandlestickSelection {
  indices: number[]
  rows: CandlestickDatum[]
}
/**
 * Computes trailing simple averages of closing prices with null warm-up entries. Requires a positive integer period and finite closing prices.
 */
export function calculateMovingAverage(
  data: readonly CandlestickDatum[],
  period: number,
): (number | null)[] {
  if (!Number.isInteger(period) || period < 1)
    throw new Error('Moving-average periods must be positive integers.')
  if (data.some((row) => !Number.isFinite(row.close)))
    throw new Error('Closing prices must be finite.')
  let sum = 0
  return data.map((row, index) => {
    sum += row.close
    if (index >= period) sum -= data[index - period].close
    return index < period - 1 ? null : sum / period
  })
}
export interface CandlestickChartProps extends Omit<ChartProps, 'option'> {
  data: CandlestickDatum[]
  movingAverages?: readonly number[]
  showVolume?: boolean
  zoom?: boolean
  brush?: boolean
  onSelectionChange?: (selection: CandlestickSelection) => void
  upColor?: string
  downColor?: string
  showLegend?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
const defaultAverages = [5, 10, 20]
/**
 * Offers pointer-brush activation and keyboard-accessible date-range selection. Applies or clears brush actions on the current chart instance.
 */
export function CandlestickChartControls({
  data,
  selection,
  ready = true,
}: {
  data: CandlestickDatum[]
  selection: CandlestickSelection
  ready?: boolean
}): React.JSX.Element {
  const { instance } = useChart(),
    [drawing, setDrawing] = React.useState(false),
    [start, setStart] = React.useState(0),
    [end, setEnd] = React.useState(Math.max(0, data.length - 1))
  React.useEffect(() => {
    setStart(0)
    setEnd(Math.max(0, data.length - 1))
  }, [data.length])
  const currentEngine = instance.current
  React.useEffect(() => setDrawing(false), [currentEngine])
  React.useEffect(() => {
    if (selection.indices.length) {
      setStart(selection.indices[0])
      setEnd(selection.indices[selection.indices.length - 1])
    }
  }, [selection.indices])
  const from = Math.min(start, Math.max(0, data.length - 1)),
    to = Math.max(from, Math.min(end, Math.max(0, data.length - 1)))
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Button
        size="sm"
        variant={drawing ? 'default' : 'outline'}
        aria-pressed={drawing}
        disabled={!ready || !data.length}
        onClick={() => {
          instance.current?.dispatchAction({
            type: 'takeGlobalCursor',
            key: 'brush',
            brushOption: { brushType: drawing ? false : 'lineX', brushMode: 'single' },
          })
          setDrawing(!drawing)
        }}
      >
        Brush range
      </Button>
      <label className="flex items-center gap-1">
        From
        <select
          aria-label="Selection start"
          className="h-8 max-w-36 rounded border bg-background px-2"
          value={from}
          disabled={!data.length}
          onChange={(e) => {
            const next = Number(e.target.value)
            setStart(next)
            setEnd(Math.max(next, to))
          }}
        >
          {data.map((d, i) => (
            <option key={d.id} value={i}>
              {d.date}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1">
        To
        <select
          aria-label="Selection end"
          className="h-8 max-w-36 rounded border bg-background px-2"
          value={to}
          disabled={!data.length}
          onChange={(e) => setEnd(Number(e.target.value))}
        >
          {data.map((d, i) => (
            <option key={d.id} value={i} disabled={i < from}>
              {d.date}
            </option>
          ))}
        </select>
      </label>
      <Button
        size="sm"
        variant="outline"
        disabled={!ready || !data.length}
        onClick={() =>
          instance.current?.dispatchAction({
            type: 'brush',
            areas: [{ brushType: 'lineX', xAxisIndex: 0, coordRange: [from, to] }],
          })
        }
      >
        Apply range
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!ready}
        onClick={() => {
          instance.current?.dispatchAction({ type: 'brush', areas: [] })
          instance.current?.dispatchAction({
            type: 'takeGlobalCursor',
            key: 'brush',
            brushOption: { brushType: false },
          })
          setDrawing(false)
        }}
      >
        Clear selection
      </Button>
      <span role="status" aria-live="polite">
        {selection.rows.length} selected
      </span>
    </div>
  )
}
/**
 * Displays validated OHLC observations with optional moving averages, linked volume and zoom, and typed brush-selection callbacks.
 */
export function CandlestickChart({
  data,
  movingAverages = defaultAverages,
  showVolume = true,
  zoom = true,
  brush = true,
  onSelectionChange,
  upColor = '#16956d',
  downColor = '#d95454',
  showLegend = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: CandlestickChartProps): React.JSX.Element {
  const [instance, setInstance] = React.useState<ReturnType<ChartHandle['getInstance']>>(null),
    [selection, setSelection] = React.useState<CandlestickSelection>({ indices: [], rows: [] })
  const brushAreas = React.useRef<unknown[]>([])
  const previousSelection = React.useRef<string>('[]')
  const invalid = data.some(
    (d) =>
      ![d.open, d.close, d.low, d.high].every(Number.isFinite) ||
      d.low > Math.min(d.open, d.close) ||
      d.high < Math.max(d.open, d.close) ||
      d.low > d.high ||
      (d.volume !== undefined && (!Number.isFinite(d.volume) || d.volume < 0)),
  )
    ? 'Candles need valid OHLC bounds and nonnegative volume.'
    : movingAverages.some((p) => !Number.isInteger(p) || p < 1) ||
        new Set(movingAverages).size !== movingAverages.length
      ? 'Moving-average periods must be unique positive integers.'
      : new Set(data.map((d) => d.id)).size !== data.length ||
          new Set(data.map((d) => d.date)).size !== data.length
        ? 'Candle IDs and date labels must be unique.'
        : undefined
  const built = React.useMemo<EChartsOption>(
    () =>
      invalid
        ? {}
        : {
            grid: [
              {
                left: 12,
                right: 24,
                top: 20,
                bottom: showVolume ? '36%' : zoom ? 64 : 28,
                containLabel: true,
              },
              ...(showVolume
                ? [{ left: 12, right: 24, top: '68%', bottom: zoom ? 64 : 28, containLabel: true }]
                : []),
            ],
            tooltip: { show: showTooltip, trigger: 'axis', axisPointer: { type: 'cross' } },
            axisPointer: { link: [{ xAxisIndex: 'all' }] },
            legend: { show: false, data: ['Price', ...movingAverages.map((p) => `MA ${p}`)] },
            xAxis: [
              {
                type: 'category',
                data: data.map((d) => d.date),
                axisLabel: { show: !showVolume, hideOverlap: true },
                axisTick: { show: false },
              },
              ...(showVolume
                ? [
                    {
                      type: 'category' as const,
                      gridIndex: 1,
                      data: data.map((d) => d.date),
                      axisTick: { show: false },
                      axisLabel: { hideOverlap: true },
                    },
                  ]
                : []),
            ],
            yAxis: [
              {
                type: 'value',
                scale: true,
                splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
              },
              ...(showVolume
                ? [
                    {
                      type: 'value' as const,
                      gridIndex: 1,
                      scale: true,
                      splitNumber: 2,
                      splitLine: { show: false },
                      axisLabel: {
                        hideOverlap: true,
                        formatter: (value: number) =>
                          new Intl.NumberFormat('en', { notation: 'compact' }).format(value),
                      },
                    },
                  ]
                : []),
            ],
            ...(zoom
              ? {
                  dataZoom: [
                    { type: 'inside', xAxisIndex: showVolume ? [0, 1] : [0] },
                    {
                      type: 'slider',
                      xAxisIndex: showVolume ? [0, 1] : [0],
                      height: 20,
                      bottom: 8,
                    },
                  ],
                }
              : {}),
            ...(brush
              ? {
                  brush: {
                    xAxisIndex: showVolume ? [0, 1] : [0],
                    brushLink: 'all',
                    brushMode: 'single',
                    outOfBrush: { colorAlpha: 0.15 },
                    throttleType: 'debounce',
                    throttleDelay: 80,
                  },
                }
              : {}),
            series: [
              {
                id: 'price',
                name: 'Price',
                type: 'candlestick',
                barMaxWidth: 18,
                data: data.map((d) => ({
                  id: d.id,
                  name: d.date,
                  value: [d.open, d.close, d.low, d.high],
                })),
                itemStyle: {
                  color: upColor,
                  color0: downColor,
                  borderColor: upColor,
                  borderColor0: downColor,
                },
              },
              ...movingAverages.map((p) => ({
                id: `ma-${p}`,
                name: `MA ${p}`,
                type: 'line' as const,
                data: calculateMovingAverage(data, p),
                showSymbol: false,
                smooth: true,
                lineStyle: { width: 1.5 },
              })),
              ...(showVolume
                ? [
                    {
                      id: 'volume',
                      name: 'Volume',
                      type: 'bar' as const,
                      xAxisIndex: 1,
                      yAxisIndex: 1,
                      data: data.map((d) => ({
                        id: d.id,
                        value: d.volume ?? 0,
                        itemStyle: {
                          color: d.close >= d.open ? upColor : downColor,
                          opacity: 0.55,
                        },
                      })),
                    },
                  ]
                : []),
            ],
          },
    [invalid, data, movingAverages, showVolume, showTooltip, zoom, brush, upColor, downColor],
  )
  const chartOption = React.useMemo(() => mergeChartOptions(built, option), [built, option])
  return (
    <Chart
      empty={!data.length}
      {...props}
      error={props.error ?? invalid}
      features={{
        ...props.features,
        dataZoom: zoom || props.features?.dataZoom,
        brush: brush || props.features?.brush,
      }}
      onReady={(chart) => {
        if (brush && brushAreas.current.length)
          chart.dispatchAction({ type: 'brush', areas: brushAreas.current })
        setInstance(chart)
        props.onReady?.(chart)
      }}
      events={{
        ...props.events,
        brushselected: (event, chart) => {
          brushAreas.current = (event.batch[0]?.areas ?? []).flatMap((value) => {
            if (
              !value ||
              typeof value !== 'object' ||
              !('coordRange' in value) ||
              !Array.isArray(value.coordRange)
            )
              return []
            // Panel IDs belong to one engine instance; retain only data coordinates.
            return [{ brushType: 'lineX', xAxisIndex: 0, coordRange: value.coordRange }]
          })
          const indices = [
            ...new Set(
              event.batch.flatMap((batch) =>
                batch.selected.filter((s) => s.seriesIndex === 0).flatMap((s) => s.dataIndex),
              ),
            ),
          ]
            .filter((i) => i >= 0 && i < data.length)
            .sort((a, b) => a - b)
          const next = { indices, rows: indices.map((i) => data[i]) }
          setSelection(next)
          const key = JSON.stringify(next.rows.map((row, index) => [next.indices[index], row.id]))
          if (key !== previousSelection.current) {
            previousSelection.current = key
            onSelectionChange?.(next)
          }
          props.events?.brushselected?.(event, chart)
        },
      }}
      option={chartOption}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showLegend && (
            <ChartLegend
              items={[
                { name: 'Price', color: upColor },
                ...movingAverages.map((p) => ({ name: `MA ${p}` })),
              ]}
            />
          )}
          {brush && (
            <CandlestickChartControls
              data={data}
              selection={selection}
              ready={Boolean(instance) && !invalid}
            />
          )}
          {showDataTable && (
            <ChartDataTable
              columns={['Date', 'Open', 'Close', 'Low', 'High', ...(showVolume ? ['Volume'] : [])]}
              rows={data.map((d) => ({
                id: d.id,
                cells: [
                  d.date,
                  d.open,
                  d.close,
                  d.low,
                  d.high,
                  ...(showVolume ? [d.volume ?? 0] : []),
                ],
              }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
