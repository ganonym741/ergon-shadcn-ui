import * as React from 'react'
import { registerMap } from 'echarts/core'
import { MapChart as MapSeries } from 'echarts/charts'
import { LabelLayout } from 'echarts/features'
import { GeoComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import {
  Chart,
  ChartCanvas,
  ChartDataTable,
  useChart,
  type ChartHandle,
  mergeChartOptions,
  registerChartModules,
  type ChartProps,
  type EChartsOption,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
registerChartModules([MapSeries, GeoComponent, TooltipComponent, VisualMapComponent, LabelLayout])
export type ChartMapSource = Parameters<typeof registerMap>[1]
export interface MapDatum {
  id: string
  name: string
  value: number
}
export interface MapChartProps extends Omit<ChartProps, 'option'> {
  mapName: string
  geoJSON: ChartMapSource
  data: MapDatum[]
  nameProperty?: string
  roam?: boolean | 'move' | 'scale'
  zoom?: number
  center?: [number, number]
  scaleLimit?: { min: number; max: number }
  selectedMode?: false | 'single' | 'multiple'
  onSelectionChange?: (names: string[]) => void
  showSelectionControl?: boolean
  showNavigation?: boolean
  min?: number
  max?: number
  colors?: string[]
  showLabels?: boolean
  showVisualMap?: boolean
  showTooltip?: boolean
  showDataTable?: boolean
  option?: EChartsOption
}
const mapColors = ['#dcece4', '#72b7a1', '#146c51']
/**
 * Dispatches map pan, zoom, and reset actions permitted by the current roam mode. Uses explicit buttons to make navigation keyboard accessible.
 */
export function MapChartNavigation({
  roam = true,
  initialZoom = 1,
  initialCenter,
  onReset,
  ready = true,
}: {
  roam?: boolean | 'move' | 'scale'
  initialZoom?: number
  initialCenter?: [number, number]
  onReset?: () => void
  ready?: boolean
}): React.JSX.Element {
  const { instance } = useChart()
  const move = (dx: number, dy: number) =>
    instance.current?.dispatchAction({
      type: 'geoRoam',
      componentType: 'series',
      seriesIndex: 0,
      dx,
      dy,
    })
  const scale = (factor: number) => {
    const chart = instance.current
    if (chart)
      chart.dispatchAction({
        type: 'geoRoam',
        componentType: 'series',
        seriesIndex: 0,
        zoom: factor,
        originX: chart.getWidth() / 2,
        originY: chart.getHeight() / 2,
      })
  }
  return (
    <div role="group" aria-label="Map navigation" className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Map view</span>
      <div className="flex gap-1">
        {roam !== 'scale' && (
          <>
            {[
              { name: 'Pan left', icon: ArrowLeft, x: -40, y: 0 },
              { name: 'Pan right', icon: ArrowRight, x: 40, y: 0 },
              { name: 'Pan up', icon: ArrowUp, x: 0, y: -40 },
              { name: 'Pan down', icon: ArrowDown, x: 0, y: 40 },
            ].map(({ name, icon: Icon, x, y }) => (
              <Button
                key={name}
                aria-label={name}
                title={name}
                disabled={!ready}
                variant="outline"
                size="icon-xs"
                onClick={() => move(x, y)}
              >
                <Icon />
              </Button>
            ))}
          </>
        )}
        {roam !== 'move' && (
          <>
            <Button
              aria-label="Zoom in map"
              title="Zoom in map"
              disabled={!ready}
              variant="outline"
              size="icon-xs"
              onClick={() => scale(1.3)}
            >
              <ZoomIn />
            </Button>
            <Button
              aria-label="Zoom out map"
              title="Zoom out map"
              disabled={!ready}
              variant="outline"
              size="icon-xs"
              onClick={() => scale(1 / 1.3)}
            >
              <ZoomOut />
            </Button>
          </>
        )}
        <Button
          aria-label="Reset map view"
          title="Reset map view"
          disabled={!ready}
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            instance.current?.setOption({
              series: [{ id: 'regions', zoom: initialZoom, center: initialCenter ?? null }],
            })
            onReset?.()
          }}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  )
}
/**
 * Selects or clears named map regions through the current chart instance. Supports native single- and multiple-selection controls.
 */
export function MapChartSelectionControl({
  regions,
  selectedNames,
  multiple = false,
  ready = true,
}: {
  regions: string[]
  selectedNames: string[]
  multiple?: boolean
  ready?: boolean
}): React.JSX.Element {
  const { instance } = useChart()
  const names = [...new Set([...regions, ...selectedNames])]
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="flex min-w-40 flex-1 items-center gap-2">
        {multiple ? 'Regions' : 'Region'}
        <select
          aria-label={multiple ? 'Selected regions' : 'Selected region'}
          multiple={multiple}
          size={multiple ? Math.min(4, names.length) : undefined}
          value={multiple ? selectedNames : (selectedNames[0] ?? '')}
          disabled={!ready || !names.length}
          className="min-w-0 flex-1 rounded border bg-background px-2 py-1.5"
          onChange={(event) => {
            const next = Array.from(event.target.selectedOptions)
                .map((o) => o.value)
                .filter(Boolean),
              removed = selectedNames.filter((name) => !next.includes(name)),
              added = next.filter((name) => !selectedNames.includes(name))
            if (removed.length)
              instance.current?.dispatchAction({ type: 'unselect', seriesIndex: 0, name: removed })
            if (added.length)
              instance.current?.dispatchAction({ type: 'select', seriesIndex: 0, name: added })
          }}
        >
          {!multiple && <option value="">Choose a region</option>}
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <Button
        size="sm"
        variant="ghost"
        disabled={!ready || !selectedNames.length}
        onClick={() =>
          instance.current?.dispatchAction({
            type: 'unselect',
            seriesIndex: 0,
            name: selectedNames,
          })
        }
      >
        Clear regions
      </Button>
    </div>
  )
}
/**
 * Registers application-supplied geometry and displays region metrics. Preserves selection and navigation across chart recreation without bundling map assets.
 */
export function MapChart({
  mapName,
  geoJSON,
  data,
  nameProperty = 'name',
  roam = true,
  zoom,
  center,
  scaleLimit,
  selectedMode = 'single',
  onSelectionChange,
  showSelectionControl = true,
  showNavigation = true,
  min,
  max,
  colors = mapColors,
  showLabels = false,
  showVisualMap = true,
  showTooltip = true,
  showDataTable = true,
  option,
  children,
  ...props
}: MapChartProps): React.JSX.Element {
  const [registrationError, setRegistrationError] = React.useState<string>()
  const [instance, setInstance] = React.useState<ReturnType<ChartHandle['getInstance']>>(null)
  const [regionSelection, setRegionSelection] = React.useState<Record<string, boolean>>({})
  const selectedNames = Object.entries(regionSelection)
    .filter(([, selected]) => selected)
    .map(([name]) => name)
  const view = React.useRef<{ zoom?: number; center?: [number, number] } | undefined>(undefined)
  React.useLayoutEffect(() => {
    try {
      registerMap(mapName, geoJSON)
      view.current = undefined
      setRegionSelection((previous) => (Object.keys(previous).length ? {} : previous))
      setRegistrationError(undefined)
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : String(error))
    }
  }, [mapName, geoJSON])
  const invalidData = data.some((d) => !Number.isFinite(d.value) || typeof d.name !== 'string')
    ? 'Regions need a name and a finite numeric value.'
    : undefined
  const lower =
      min ?? data.reduce((low, d) => (Number.isFinite(d.value) ? Math.min(low, d.value) : low), 0),
    upper =
      max ??
      data.reduce(
        (high, d) => (Number.isFinite(d.value) ? Math.max(high, d.value) : high),
        lower + 1,
      )
  const invalid =
    invalidData ??
    (!Number.isFinite(lower) || !Number.isFinite(upper) || upper <= lower
      ? 'Color maximum must exceed its finite minimum.'
      : undefined)
  const built = React.useMemo<EChartsOption>(
    () =>
      invalid
        ? {}
        : {
            tooltip: { show: showTooltip, trigger: 'item' },
            visualMap: {
              show: showVisualMap,
              min: lower,
              max: upper,
              left: 'center',
              bottom: 0,
              orient: 'horizontal',
              calculable: true,
              inRange: { color: colors },
            },
            series: [
              {
                id: 'regions',
                type: 'map',
                map: mapName,
                nameProperty,
                roam,
                ...(zoom === undefined ? {} : { zoom }),
                ...(center ? { center } : {}),
                scaleLimit: scaleLimit ?? { min: 0.5, max: 8 },
                selectedMode,
                selectedMap: regionSelection,
                top: 12,
                bottom: showVisualMap ? 64 : 12,
                left: 12,
                right: 12,
                label: { show: showLabels, fontSize: 10 },
                labelLayout: { hideOverlap: true },
                itemStyle: { areaColor: '#e4e8e3', borderColor: '#ffffff', borderWidth: 0.6 },
                emphasis: { label: { show: true }, itemStyle: { areaColor: '#e4b56b' } },
                select: {
                  label: { show: true },
                  itemStyle: { areaColor: '#e4b56b', borderWidth: 1.5 },
                },
                data: data.map((d) => ({ id: d.id, name: d.name, value: d.value })),
              },
            ],
          },
    [
      invalid,
      regionSelection,
      mapName,
      nameProperty,
      roam,
      zoom,
      center,
      scaleLimit,
      selectedMode,
      lower,
      upper,
      colors,
      showLabels,
      showVisualMap,
      showTooltip,
      data,
    ],
  )
  const chartOption = React.useMemo(() => mergeChartOptions(built, option), [built, option])
  return (
    <Chart
      empty={!data.length}
      {...props}
      error={props.error ?? registrationError ?? invalid}
      onReady={(chart) => {
        // Canvas/theme changes recreate the engine; keep the user's current viewport.
        if (view.current)
          chart.setOption({
            series: [
              {
                id: 'regions',
                ...(zoom === undefined ? { zoom: view.current.zoom } : {}),
                ...(center === undefined ? { center: view.current.center } : {}),
              },
            ],
          })
        setInstance(chart)
        props.onReady?.(chart)
      }}
      events={{
        ...props.events,
        georoam: (event, chart) => {
          const state = (
            chart.getOption().series as { zoom?: number; center?: [number, number] }[]
          )?.[0]
          if (state) view.current = { zoom: state.zoom, center: state.center }
          props.events?.georoam?.(event, chart)
        },
        selectchanged: (event, instance) => {
          const series = (
            instance.getOption().series as { selectedMap?: Record<string, boolean> }[] | undefined
          )?.[0]
          const names = Object.entries(series?.selectedMap ?? {})
            .filter(([, selected]) => selected)
            .map(([name]) => name)
          setRegionSelection({ ...series?.selectedMap })
          onSelectionChange?.(names)
          props.events?.selectchanged?.(event, instance)
        },
      }}
      option={chartOption}
    >
      {children ?? (
        <>
          <ChartCanvas />
          {showNavigation && roam && (
            <MapChartNavigation
              roam={roam}
              initialZoom={zoom ?? 1}
              initialCenter={center}
              ready={Boolean(instance) && !invalid}
              onReset={() => {
                view.current = undefined
              }}
            />
          )}
          {showSelectionControl && selectedMode && (
            <MapChartSelectionControl
              regions={data.map((d) => d.name)}
              selectedNames={selectedNames}
              multiple={selectedMode === 'multiple'}
              ready={Boolean(instance) && !invalid}
            />
          )}
          {showDataTable && (
            <ChartDataTable
              columns={['Region', 'Value']}
              rows={data.map((d) => ({ id: d.id, cells: [d.name, d.value] }))}
            />
          )}
        </>
      )}
    </Chart>
  )
}
