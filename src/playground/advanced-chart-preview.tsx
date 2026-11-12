import * as React from 'react'
import type { ChartProps } from '@/components/ui/chart'
import type { MapDatum, ChartMapSource } from '@/components/ui/map-chart'
import type { BoxplotDatum } from '@/components/ui/boxplot-chart'
import type {
  CalendarHeatmapDatum,
  CalendarHeatmapRange,
} from '@/components/ui/calendar-heatmap-chart'
import type { ComboDatum, ComboSeries, ComboAxis } from '@/components/ui/combo-chart'
import type { SankeyNode, SankeyLink } from '@/components/ui/sankey-chart'
import type { CandlestickDatum } from '@/components/ui/candlestick-chart'
import type { PreviewProps } from './preview'
const MapChart = React.lazy(() =>
  import('@/components/ui/map-chart').then((m) => ({ default: m.MapChart })),
)
const BoxplotChart = React.lazy(() =>
  import('@/components/ui/boxplot-chart').then((m) => ({ default: m.BoxplotChart })),
)
const CalendarHeatmapChart = React.lazy(() =>
  import('@/components/ui/calendar-heatmap-chart').then((m) => ({
    default: m.CalendarHeatmapChart,
  })),
)
const ComboChart = React.lazy(() =>
  import('@/components/ui/combo-chart').then((m) => ({ default: m.ComboChart })),
)
const SankeyChart = React.lazy(() =>
  import('@/components/ui/sankey-chart').then((m) => ({ default: m.SankeyChart })),
)
const CandlestickChart = React.lazy(() =>
  import('@/components/ui/candlestick-chart').then((m) => ({ default: m.CandlestickChart })),
)
interface AdvancedPreviewProps extends PreviewProps {
  common: Omit<ChartProps, 'option'>
  presentation: { showLegend: boolean; showTooltip: boolean; showDataTable: boolean }
  revision: number
}
/**
 * Connects editable playground data and options to the advanced charts. Loads map geometry with cancellation and surfaces invalid sample configuration.
 */
export default function AdvancedChartPreview({
  id,
  config: v,
  common,
  presentation,
  revision,
  onEvent,
}: AdvancedPreviewProps) {
  const [geo, setGeo] = React.useState<ChartMapSource>(),
    [mapError, setMapError] = React.useState('')
  const emit = (type: string, value: unknown) => onEvent({ type, value, time: Date.now() })
  const { showLegend: _legend, ...simplePresentation } = presentation
  React.useEffect(() => {
    if (id !== 'map-chart') return
    const controller = new AbortController()
    setGeo(undefined)
    setMapError('')
    fetch(String(v.geoJSONURL), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Map request failed (${response.status}).`)
        const json: unknown = await response.json()
        if (
          !json ||
          typeof json !== 'object' ||
          !('type' in json) ||
          json.type !== 'FeatureCollection' ||
          !('features' in json) ||
          !Array.isArray(json.features)
        )
          throw new Error('Provide a GeoJSON FeatureCollection.')
        if (!controller.signal.aborted) setGeo(json as ChartMapSource)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setMapError(String(error))
      })
    return () => controller.abort()
  }, [id, v.geoJSONURL])
  const parsed = React.useMemo(() => {
    try {
      const list = (key: string): any[] => {
        const value: unknown = JSON.parse(String(v[key]))
        if (!Array.isArray(value)) throw new Error(`${key} must be a JSON array.`)
        return value
      }
      const rows = list('data')
      if (rows.some((d) => !d || typeof d !== 'object' || typeof d.id !== 'string'))
        throw new Error('Every data row needs a stable string id.')
      if (
        id === 'map-chart' &&
        rows.some((d) => typeof d.name !== 'string' || !Number.isFinite(d.value))
      )
        throw new Error('Map rows need a name and a finite numeric value.')
      if (
        id === 'boxplot-chart' &&
        rows.some(
          (d) =>
            !Array.isArray(d.summary) ||
            d.summary.length !== 5 ||
            d.summary.some((value: unknown) => !Number.isFinite(value)) ||
            (d.outliers !== undefined &&
              (!Array.isArray(d.outliers) ||
                d.outliers.some((value: unknown) => !Number.isFinite(value)))),
        )
      )
        throw new Error('Each boxplot summary needs five numeric values.')
      if (id === 'combo-chart' && rows.some((d) => typeof d.label !== 'string'))
        throw new Error('Combo rows need a label.')
      if (id === 'calendar-heatmap-chart' && rows.some((d) => typeof d.date !== 'string'))
        throw new Error('Calendar rows need an ISO date.')
      if (id === 'candlestick-chart' && rows.some((d) => typeof d.date !== 'string'))
        throw new Error('Candles need a date label.')
      const colors = ['map-chart', 'calendar-heatmap-chart'].includes(id) ? list('colors') : []
      if (colors.some((value) => typeof value !== 'string'))
        throw new Error('The color scale must contain color strings.')
      const links = id === 'sankey-chart' ? list('links') : []
      if (
        links.some(
          (link) =>
            !link ||
            typeof link !== 'object' ||
            typeof link.id !== 'string' ||
            typeof link.source !== 'string' ||
            typeof link.target !== 'string',
        )
      )
        throw new Error('Links need an id, source and target.')
      const series = id === 'combo-chart' ? list('series') : [],
        axes = id === 'combo-chart' ? list('axes') : []
      if (
        series.some(
          (s) => !s || typeof s.key !== 'string' || !['bar', 'line', 'area'].includes(s.type),
        ) ||
        axes.some((a) => !a || typeof a.id !== 'string')
      )
        throw new Error('Declare typed series and named value axes.')
      return {
        data: rows,
        series,
        axes,
        links,
        averages: id === 'candlestick-chart' ? list('movingAverages') : [],
        colors,
        error: '',
      }
    } catch (error) {
      return {
        data: [],
        series: [],
        axes: [],
        links: [],
        averages: [],
        colors: [],
        error: String(error),
      }
    }
  }, [id, v.data, v.series, v.axes, v.links, v.movingAverages, v.colors])
  const data = React.useMemo(
    () =>
      parsed.data.map((d: any) => {
        if (!d || typeof d !== 'object' || typeof d.id !== 'string')
          throw new Error('Every data row needs a stable string id.')
        if (id === 'map-chart' || id === 'calendar-heatmap-chart')
          return { ...d, value: Number(d.value) + revision * 3 }
        if (id === 'boxplot-chart')
          return {
            ...d,
            summary: d.summary?.map((n: number) => n + revision * 3),
            outliers: d.outliers?.map((n: number) => n + revision * 3),
          }
        if (id === 'candlestick-chart')
          return {
            ...d,
            open: d.open + revision * 2,
            close: d.close + revision * 2,
            low: d.low + revision * 2,
            high: d.high + revision * 2,
            volume: (d.volume ?? 0) + revision * 1000,
          }
        if (id === 'combo-chart')
          return Object.fromEntries(
            Object.entries(d).map(([key, value]) => [
              key,
              typeof value === 'number' ? value + revision * 2 : value,
            ]),
          )
        return d
      }),
    [id, parsed.data, revision],
  )
  if (parsed.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {parsed.error}
      </p>
    )
  if (id === 'map-chart') {
    if (mapError)
      return (
        <p role="alert" className="text-sm text-destructive">
          {mapError}
        </p>
      )
    if (!geo)
      return (
        <p role="status" className="p-8 text-sm text-muted-foreground">
          Loading map boundaries…
        </p>
      )
    return (
      <>
        <MapChart
          {...common}
          {...simplePresentation}
          colors={parsed.colors.length ? (parsed.colors as string[]) : undefined}
          min={Number(v.min)}
          max={v.autoMax ? undefined : Number(v.max)}
          mapName="ergon-playground-world"
          geoJSON={geo}
          nameProperty={String(v.nameProperty)}
          data={data as MapDatum[]}
          roam={
            v.roam === 'none'
              ? false
              : v.roam === 'pan'
                ? 'move'
                : v.roam === 'zoom'
                  ? 'scale'
                  : true
          }
          selectedMode={
            v.selectedMode === 'none' ? false : (v.selectedMode as 'single' | 'multiple')
          }
          showLabels={Boolean(v.showLabels)}
          showVisualMap={Boolean(v.showVisualMap)}
          showSelectionControl={Boolean(v.showSelectionControl)}
          showNavigation={Boolean(v.showNavigation)}
          onSelectionChange={(names) => emit('region-selection', names)}
        />
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Simulated metrics · boundaries:{' '}
            <a className="underline" href="https://www.naturalearthdata.com/">
              Natural Earth
            </a>
          </span>
        </div>
      </>
    )
  }
  if (id === 'boxplot-chart')
    return (
      <BoxplotChart
        {...common}
        {...simplePresentation}
        data={data as BoxplotDatum[]}
        horizontal={Boolean(v.horizontal)}
        showOutliers={Boolean(v.showOutliers)}
        boxColor={String(v.boxColor)}
        outlierColor={String(v.outlierColor)}
        zoom={Boolean(v.zoom)}
      />
    )
  if (id === 'calendar-heatmap-chart') {
    const range = String(v.range)
      .split(',')
      .map((s) => s.trim())
    return (
      <CalendarHeatmapChart
        {...common}
        {...simplePresentation}
        colors={parsed.colors.length ? (parsed.colors as string[]) : undefined}
        min={Number(v.min)}
        max={v.autoMax ? undefined : Number(v.max)}
        data={data as CalendarHeatmapDatum[]}
        range={(range.length === 2 ? range : range[0]) as CalendarHeatmapRange}
        orientation={v.orientation as 'horizontal' | 'vertical'}
        firstDay={Number(v.firstDay) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
        minimumCellSize={Number(v.minimumCellSize)}
        showDayLabels={Boolean(v.showDayLabels)}
        showMonthLabels={Boolean(v.showMonthLabels)}
        showVisualMap={Boolean(v.showVisualMap)}
      />
    )
  }
  if (id === 'combo-chart')
    return (
      <ComboChart
        {...common}
        {...presentation}
        data={data as ComboDatum[]}
        series={parsed.series as ComboSeries[]}
        axes={parsed.axes as ComboAxis[]}
        zoom={Boolean(v.zoom)}
        showGrid={Boolean(v.showGrid)}
        showLabels={Boolean(v.showLabels)}
      />
    )
  if (id === 'sankey-chart')
    return (
      <SankeyChart
        {...common}
        {...simplePresentation}
        nodes={data as SankeyNode[]}
        links={(parsed.links as SankeyLink[]).map((link) => ({
          ...link,
          value: link.value + revision * 5,
        }))}
        orientation={v.orientation as 'horizontal' | 'vertical'}
        nodeAlign={v.nodeAlign as 'left' | 'right' | 'justify'}
        nodeWidth={Number(v.nodeWidth)}
        nodeGap={Number(v.nodeGap)}
        draggable={Boolean(v.draggable)}
        showLabels={Boolean(v.showLabels)}
      />
    )
  return (
    <CandlestickChart
      {...common}
      {...presentation}
      data={data as CandlestickDatum[]}
      movingAverages={parsed.averages as number[]}
      showVolume={Boolean(v.showVolume)}
      zoom={Boolean(v.zoom)}
      brush={Boolean(v.brush)}
      upColor={String(v.upColor)}
      downColor={String(v.downColor)}
      onSelectionChange={(selection) =>
        emit('brush-selection', {
          ids: selection.rows.map((row) => row.id),
          indices: selection.indices,
        })
      }
    />
  )
}
