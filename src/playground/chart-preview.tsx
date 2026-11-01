import * as React from 'react'
import { Download, RefreshCw, ZoomIn, RotateCcw } from 'lucide-react'
import {
  Chart,
  ChartCanvas,
  ChartHeader,
  ChartTitle,
  ChartDescription,
  ChartLegend,
  ChartDataTable,
  type ChartHandle,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
import type { ChartDatum, ChartSeries } from '@/components/ui/chart-cartesian'
import type { ChartValue } from '@/components/ui/pie-chart'
import type { ScatterSeries } from '@/components/ui/scatter-chart'
import type { RadarSeries, RadarIndicator } from '@/components/ui/radar-chart'
import type { HeatmapPoint } from '@/components/ui/heatmap-chart'
import { Button } from '@/components/ui/button'
import type { PreviewProps } from './preview'
const LineChart = React.lazy(() =>
  import('@/components/ui/line-chart').then((module) => ({ default: module.LineChart })),
)
const AreaChart = React.lazy(() =>
  import('@/components/ui/area-chart').then((module) => ({ default: module.AreaChart })),
)
const BarChart = React.lazy(() =>
  import('@/components/ui/bar-chart').then((module) => ({ default: module.BarChart })),
)
const PieChart = React.lazy(() =>
  import('@/components/ui/pie-chart').then((module) => ({ default: module.PieChart })),
)
const ScatterChart = React.lazy(() =>
  import('@/components/ui/scatter-chart').then((module) => ({ default: module.ScatterChart })),
)
const RadarChart = React.lazy(() =>
  import('@/components/ui/radar-chart').then((module) => ({ default: module.RadarChart })),
)
const HeatmapChart = React.lazy(() =>
  import('@/components/ui/heatmap-chart').then((module) => ({ default: module.HeatmapChart })),
)
const GaugeChart = React.lazy(() =>
  import('@/components/ui/gauge-chart').then((module) => ({ default: module.GaugeChart })),
)
const MixedChart = React.lazy(() => import('./chart-mixed-preview'))

export default function ChartPreview({ id, config: v, onEvent }: PreviewProps) {
  const ref = React.useRef<ChartHandle>(null)
  const [revision, setRevision] = React.useState(0)
  const [actionError, setActionError] = React.useState<string>()
  const emit = (type: string, value: unknown) => onEvent({ type, value, time: Date.now() })
  const common: Omit<ChartProps, 'option'> = {
    ref,
    label: String(v.title),
    height: Number(v.height),
    renderer: v.renderer as 'svg' | 'canvas',
    theme: v.theme as 'auto' | 'light' | 'dark',
    animated: Boolean(v.animated),
    loading: Boolean(v.loading),
    empty: Boolean(v.empty),
    error: v.error ? 'Unable to load this sample. Try the Default preset.' : undefined,
    events: {
      click: (event) =>
        emit('chart-click', { name: event.name, series: event.seriesName, value: event.value }),
      legendselectchanged: (event) => emit('legend-change', event),
      datazoom: (event) => emit('zoom-change', event),
    },
    onError: (error) => emit('chart-error', error.message),
  }
  const presentation = {
    showLegend: Boolean(v.showLegend),
    showTooltip: Boolean(v.showTooltip),
    showDataTable: Boolean(v.showDataTable),
  }
  let content: React.ReactNode
  try {
    const list = <T,>(key: string): T[] => {
      const parsed: unknown = JSON.parse(String(v[key]))
      if (!Array.isArray(parsed)) throw new Error(`${key} must be a JSON array.`)
      return parsed as T[]
    }
    const palette = list<string>('palette')
    if (palette.some((color) => typeof color !== 'string'))
      throw new Error('Palette must contain color strings.')
    common.palette = palette.length ? palette : undefined
    if (['line-chart', 'area-chart', 'bar-chart'].includes(id)) {
      const data = list<ChartDatum>('data').map((row, index) => {
        if (!row || typeof row.id !== 'string' || typeof row.label !== 'string')
          throw new Error('Each row needs a string id and label.')
        return Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === 'number' ? value + revision * (index % 2 ? 5 : -3) : value,
          ]),
        ) as ChartDatum
      })
      const series = list<ChartSeries>('series')
      if (series.some((item) => !item || typeof item.key !== 'string'))
        throw new Error('Each series needs a key.')
      const Component = id === 'line-chart' ? LineChart : id === 'area-chart' ? AreaChart : BarChart
      content = (
        <Component
          {...common}
          {...presentation}
          data={data}
          series={series}
          stacked={Boolean(v.stacked)}
          horizontal={Boolean(v.horizontal)}
          smooth={Boolean(v.smooth)}
          zoom={Boolean(v.zoom)}
          showGrid={Boolean(v.showGrid)}
          showLabels={Boolean(v.showLabels)}
        />
      )
    } else if (id === 'pie-chart') {
      const data = list<ChartValue>('data')
      if (
        data.some(
          (item) =>
            !item ||
            typeof item.id !== 'string' ||
            typeof item.name !== 'string' ||
            !Number.isFinite(item.value) ||
            item.value < 0,
        )
      )
        throw new Error('Each slice needs an id, name, and nonnegative numeric value.')
      content = (
        <PieChart
          {...common}
          {...presentation}
          data={data.map((item, index) => ({
            ...item,
            value: item.value + revision * (index + 1) * 10,
          }))}
          donut={Boolean(v.donut)}
          rose={Boolean(v.rose)}
          showLabels={Boolean(v.showLabels)}
        />
      )
    } else if (id === 'scatter-chart') {
      const series = list<ScatterSeries>('data')
      if (
        series.some(
          (item) =>
            !item ||
            typeof item.id !== 'string' ||
            typeof item.name !== 'string' ||
            !Array.isArray(item.data) ||
            item.data.some(
              (point) =>
                !point ||
                typeof point.id !== 'string' ||
                !Number.isFinite(point.x) ||
                !Number.isFinite(point.y),
            ),
        )
      )
        throw new Error('Scatter series need an id, name, and data with id, x and y.')
      content = (
        <ScatterChart
          {...common}
          {...presentation}
          series={series.map((item) => ({
            ...item,
            data: item.data.map((point) => ({ ...point, y: point.y + revision * 3 })),
          }))}
          zoom={Boolean(v.zoom)}
          showGrid={Boolean(v.showGrid)}
        />
      )
    } else if (id === 'radar-chart') {
      const series = list<RadarSeries>('data'),
        indicators = list<RadarIndicator>('indicators')
      if (
        indicators.some((item) => !item || typeof item.name !== 'string') ||
        series.some(
          (item) =>
            !item ||
            typeof item.id !== 'string' ||
            typeof item.name !== 'string' ||
            !Array.isArray(item.values) ||
            item.values.length !== indicators.length ||
            item.values.some((value) => !Number.isFinite(value)),
        )
      )
        throw new Error('Radar series values must match the named indicators.')
      content = (
        <RadarChart
          {...common}
          {...presentation}
          series={series.map((item) => ({
            ...item,
            values: item.values.map((value) => Math.max(0, Math.min(100, value + revision * 2))),
          }))}
          indicators={indicators}
          shape={v.shape as 'circle' | 'polygon'}
          filled={Boolean(v.filled)}
        />
      )
    } else if (id === 'heatmap-chart') {
      const data = list<HeatmapPoint>('data')
      if (
        data.some(
          (item) =>
            !item ||
            typeof item.id !== 'string' ||
            typeof item.x !== 'string' ||
            typeof item.y !== 'string' ||
            !Number.isFinite(item.value),
        )
      )
        throw new Error('Each heatmap point needs an id, x and y labels, and numeric value.')
      content = (
        <HeatmapChart
          {...common}
          {...presentation}
          data={data.map((item) => ({ ...item, value: item.value + revision * 4 }))}
          xCategories={String(v.xCategories)
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)}
          yCategories={String(v.yCategories)
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)}
          showLabels={Boolean(v.showLabels)}
        />
      )
    } else if (id === 'gauge-chart') {
      content = (
        <GaugeChart
          {...common}
          {...presentation}
          name="Goal completed"
          value={Math.min(Number(v.max), Number(v.value) + revision * 5)}
          max={Number(v.max)}
          unit={String(v.unit)}
          showPointer={Boolean(v.showPointer)}
        />
      )
    } else {
      const option: EChartsOption = JSON.parse(String(v.option))
      if (!option || typeof option !== 'object' || Array.isArray(option))
        throw new Error('ECharts option must be a JSON object.')
      const series = Array.isArray(option.series)
        ? option.series
        : option.series
          ? [option.series]
          : []
      const updated = {
        ...option,
        tooltip: {
          ...(!Array.isArray(option.tooltip) ? option.tooltip : {}),
          show: Boolean(v.showTooltip),
        },
        series: series.map((item) => ({
          ...item,
          data: Array.isArray(item.data)
            ? item.data.map((value) => (typeof value === 'number' ? value + revision * 3 : value))
            : item.data,
        })),
      } as EChartsOption
      content = (
        <MixedChart {...common} option={updated}>
          <ChartCanvas />
          {presentation.showLegend && (
            <ChartLegend
              items={series.flatMap((item) =>
                typeof item.name === 'string' ? [{ name: item.name }] : [],
              )}
            />
          )}
          {presentation.showDataTable && (
            <ChartDataTable
              columns={['Series', 'Point', 'Value']}
              rows={series.flatMap((item, seriesIndex) =>
                (Array.isArray(item.data) ? item.data : []).map((point, index) => {
                  const value =
                    point && typeof point === 'object' && 'value' in point ? point.value : point
                  return {
                    id: `${String(item.id ?? seriesIndex)}:${index}`,
                    cells: [
                      String(item.name ?? item.type),
                      String(
                        point && typeof point === 'object' && 'name' in point
                          ? point.name
                          : index + 1,
                      ),
                      typeof value === 'number'
                        ? value + revision * 3
                        : typeof value === 'string'
                          ? value
                          : JSON.stringify(value),
                    ],
                  }
                }),
              )}
              caption="Chart series data. Compose your own table for dataset-based options."
            />
          )}
        </MixedChart>
      )
    }
  } catch (error) {
    content = (
      <p
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
      >
        {error instanceof Error ? error.message : String(error)}
      </p>
    )
  }
  const exportImage = () => {
    try {
      const type = v.renderer === 'canvas' ? 'png' : 'svg'
      const url = ref.current?.getDataURL({ type, pixelRatio: 2, excludeComponents: ['toolbox'] })
      if (!url) return
      const link = document.createElement('a')
      link.href = url
      link.download = `ergonui-${id}.${type}`
      link.click()
      setActionError(undefined)
      emit('export', type)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error))
    }
  }
  return (
    <div className="w-full min-w-0 max-w-4xl space-y-5 rounded-xl border bg-card p-4 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ChartHeader>
          <p className="mb-2 text-[10px] font-medium tracking-[.14em] text-muted-foreground uppercase">
            Data, with perspective
          </p>
          <ChartTitle className="text-lg">{String(v.title)}</ChartTitle>
          <ChartDescription>{String(v.description)}</ChartDescription>
        </ChartHeader>
        <Button variant="outline" size="sm" onClick={exportImage}>
          <Download />
          Export {v.renderer === 'canvas' ? 'PNG' : 'SVG'}
        </Button>
      </div>
      {content}
      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setRevision((value) => value + 1)
            emit('data-update', revision + 1)
          }}
        >
          <RefreshCw />
          Update data
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRevision(0)
            emit('data-reset', null)
          }}
        >
          Reset data
        </Button>
        {Boolean(v.zoom) && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => ref.current?.dispatchAction({ type: 'dataZoom', start: 20, end: 70 })}
            >
              <ZoomIn />
              Zoom in
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => ref.current?.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })}
            >
              <RotateCcw />
              Reset zoom
            </Button>
          </>
        )}
        <span className="ms-auto text-[10px] text-muted-foreground">
          Local sample · update {revision}
        </span>
      </div>
    </div>
  )
}
