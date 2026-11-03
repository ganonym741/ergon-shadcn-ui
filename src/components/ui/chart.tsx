import * as React from 'react'
import * as echarts from 'echarts/core'
import type { EChartsOption, ECElementEvent, SetOptionOpts } from 'echarts'
import { AriaComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { cn } from '@/lib/utils'

echarts.use([AriaComponent, SVGRenderer])

export { use as registerChartModules } from 'echarts/core'
export type { EChartsOption, ECElementEvent } from 'echarts'
export type ChartModule = Extract<Parameters<typeof echarts.use>[0], unknown[]>[number]
export interface ChartFeatures {
  dataZoom?: boolean
  brush?: boolean
}
export interface ChartBrushEvent {
  batch: { areas?: unknown[]; selected: { seriesIndex: number; dataIndex: number[] }[] }[]
}
export const chartPalette = ['#b93e28', '#5579bd', '#36836a', '#c38a28', '#9864af', '#2992a6']
export interface ChartLegendEvent {
  name: string
  selected: Record<string, boolean>
}
export interface ChartZoomEvent {
  type: string
  start?: number
  end?: number
  batch?: { start: number; end: number }[]
}
export interface ChartEvents {
  brushselected?: (event: ChartBrushEvent, instance: echarts.EChartsType) => void
  selectchanged?: (event: echarts.SelectChangedEvent, instance: echarts.EChartsType) => void
  georoam?: (
    event: { zoom?: number; dx?: number; dy?: number },
    instance: echarts.EChartsType,
  ) => void
  click?: (event: ECElementEvent, instance: echarts.EChartsType) => void
  dblclick?: (event: ECElementEvent, instance: echarts.EChartsType) => void
  legendselectchanged?: (event: ChartLegendEvent, instance: echarts.EChartsType) => void
  datazoom?: (event: ChartZoomEvent, instance: echarts.EChartsType) => void
  finished?: (event: unknown, instance: echarts.EChartsType) => void
}
export interface ChartHandle {
  getInstance: () => echarts.EChartsType | null
  resize: () => void
  dispatchAction: (action: Parameters<echarts.EChartsType['dispatchAction']>[0]) => void
  getDataURL: (options?: Parameters<echarts.EChartsType['getDataURL']>[0]) => string | undefined
}
export interface ChartProps extends Omit<React.ComponentProps<'figure'>, 'onError' | 'ref'> {
  option: EChartsOption
  modules?: readonly ChartModule[]
  features?: ChartFeatures
  label: string
  height?: React.CSSProperties['height']
  renderer?: 'svg' | 'canvas'
  theme?: 'auto' | 'light' | 'dark'
  palette?: string[]
  animated?: boolean
  loading?: boolean
  empty?: boolean
  error?: string
  emptyMessage?: React.ReactNode
  events?: ChartEvents
  updateOptions?: SetOptionOpts
  onReady?: (instance: echarts.EChartsType) => void
  onError?: (error: Error) => void
  ref?: React.Ref<ChartHandle>
}
interface ChartContextValue extends Omit<ChartProps, 'ref' | 'children' | 'theme' | 'palette'> {
  instance: React.RefObject<echarts.EChartsType | null>
  mode: 'light' | 'dark'
  colors: string[]
  selected: Record<string, boolean>
  setSelected: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}
const ChartContext = React.createContext<ChartContextValue | null>(null)
export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error('Chart parts must be used inside Chart.')
  return context
}
/**
 * Returns a deep-merged copy of the base options. Neither the base object nor its nested options are mutated.
 */
export function mergeChartOptions(base: EChartsOption, overrides?: EChartsOption): EChartsOption {
  return echarts.util.merge(echarts.util.clone(base), overrides ?? {}, true)
}

/**
 * Provides shared chart options, theme and motion handling, events, and the imperative chart handle for composable visualization parts.
 */
export function Chart({
  option,
  modules,
  features,
  label,
  height = 320,
  renderer = 'svg',
  theme = 'auto',
  palette,
  animated,
  loading = false,
  empty = false,
  error,
  emptyMessage = 'No data to display',
  events,
  updateOptions,
  onReady,
  onError,
  children,
  className,
  style,
  ref,
  ...props
}: ChartProps) {
  const root = React.useRef<HTMLElement>(null)
  const instance = React.useRef<echarts.EChartsType | null>(null)
  const [mode, setMode] = React.useState<'light' | 'dark'>('light')
  const [reduced, setReduced] = React.useState(false)
  const [accent, setAccent] = React.useState(chartPalette[0])
  const [fontFamily, setFontFamily] = React.useState('sans-serif')
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const read = () => {
      const node = root.current
      if (!node) return
      setMode(
        theme === 'auto' ? (node.closest('.dark, [data-theme="dark"]') ? 'dark' : 'light') : theme,
      )
      setReduced(media.matches && !node.closest('[data-preview-motion="full"]'))
      const computed = getComputedStyle(node)
      setFontFamily(computed.fontFamily || 'sans-serif')
      const color = computed.getPropertyValue('--primary').trim()
      setAccent(/^#|^rgb|^hsl/.test(color) ? color : chartPalette[0])
    }
    read()
    const observer = new MutationObserver(read)
    let node: HTMLElement | null = root.current
    while (node) {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme', 'data-preview-motion'],
      })
      node = node.parentElement
    }
    media.addEventListener('change', read)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', read)
    }
  }, [theme])
  React.useImperativeHandle(
    ref,
    () => ({
      getInstance: () => instance.current,
      resize: () => instance.current?.resize(),
      dispatchAction: (action) => {
        instance.current?.dispatchAction(action)
      },
      getDataURL: (options) => instance.current?.getDataURL(options),
    }),
    [],
  )
  const colors = React.useMemo(
    () => (palette?.length ? palette : [accent, ...chartPalette.slice(1)]),
    [palette, accent],
  )
  const themedOption = React.useMemo(() => {
    const result = mergeChartOptions(
      {
        backgroundColor: 'transparent',
        color: colors,
        textStyle: { fontFamily, fontSize: 12 },
        ...(option.tooltip ? { tooltip: { confine: true, renderMode: 'richText' as const } } : {}),
        aria: { enabled: true, label: { description: label } },
      },
      option,
    )
    result.animation = animated ?? option.animation ?? !reduced
    if (Object.keys(selected).length) {
      const legends = Array.isArray(result.legend) ? result.legend : [result.legend ?? {}]
      result.legend = legends.map((legend) => ({
        ...legend,
        selected: { ...legend.selected, ...selected },
      }))
    }
    return result
  }, [option, colors, label, animated, reduced, selected, fontFamily])
  return (
    <ChartContext.Provider
      value={{
        option: themedOption,
        modules,
        features,
        label,
        height,
        renderer,
        mode,
        colors,
        selected,
        setSelected,
        instance,
        animated,
        loading,
        empty,
        error,
        emptyMessage,
        events,
        updateOptions,
        onReady,
        onError,
      }}
    >
      <figure
        ref={root}
        data-slot="chart"
        aria-label={label}
        className={cn(
          'w-full min-w-0 space-y-4 rounded-lg bg-background text-foreground',
          className,
        )}
        style={{
          ...(theme !== 'auto'
            ? ({
                '--background': mode === 'dark' ? '#202321' : '#ffffff',
                '--foreground': mode === 'dark' ? '#eeeeea' : '#262725',
                '--muted-foreground': mode === 'dark' ? '#a2a79e' : '#62695e',
                '--border': mode === 'dark' ? '#343a32' : '#e9e9e3',
                colorScheme: mode,
              } as React.CSSProperties)
            : {}),
          ...style,
        }}
        {...props}
      >
        {children ?? <ChartCanvas />}
      </figure>
    </ChartContext.Provider>
  )
}

/**
 * Creates and disposes the native ECharts instance, loads optional rendering features, and renders loading, empty, and recoverable error states.
 */
export function ChartCanvas({ className, style, ...props }: React.ComponentProps<'div'>) {
  const context = useChart()
  const latest = React.useRef(context)
  latest.current = context
  const host = React.useRef<HTMLDivElement>(null)
  const applied = React.useRef<EChartsOption | null>(null)
  const [failure, setFailure] = React.useState<string>()
  const [preparing, setPreparing] = React.useState(false)
  React.useEffect(() => {
    const node = host.current
    if (!node) return
    let chart: echarts.EChartsType | undefined
    let cancelled = false
    const fail = (reason: unknown) => {
      if (cancelled) return
      const error = reason instanceof Error ? reason : new Error(String(reason))
      setFailure(error.message)
      latest.current.onError?.(error)
      setPreparing(false)
    }
    let resize: ResizeObserver | undefined
    const initialize = () => {
      if (cancelled) return
      try {
        if (latest.current.modules?.length) echarts.use([...latest.current.modules])
        chart = echarts.init(node, context.mode, { renderer: context.renderer })
        context.instance.current = chart
        for (const event of [
          'click',
          'dblclick',
          'legendselectchanged',
          'datazoom',
          'finished',
          'brushselected',
          'selectchanged',
          'georoam',
        ] as const) {
          chart.on(event, (...args: unknown[]) => {
            const payload = args[0]
            if (event === 'legendselectchanged')
              latest.current.setSelected((payload as ChartLegendEvent).selected)
            const handler = latest.current.events?.[event] as
              ((value: unknown, instance: echarts.EChartsType) => void) | undefined
            if (chart) handler?.(payload, chart)
          })
        }
        chart.setOption(latest.current.option, {
          replaceMerge: ['series'],
          ...latest.current.updateOptions,
        })
        applied.current = latest.current.option
        resize = new ResizeObserver(() => {
          if (!chart?.isDisposed()) chart?.resize()
        })
        resize.observe(node)
        latest.current.onReady?.(chart)
        setFailure(undefined)
        setPreparing(false)
      } catch (reason) {
        fail(reason)
      }
    }
    const pending: Promise<void>[] = []
    if (context.renderer === 'canvas')
      pending.push(
        import('@/components/ui/chart-canvas-renderer').then(({ CanvasRenderer }) => {
          echarts.use(CanvasRenderer)
        }),
      )
    if (context.features?.dataZoom)
      pending.push(
        import('@/components/ui/chart-zoom').then(({ DataZoomComponent }) => {
          echarts.use(DataZoomComponent)
        }),
      )
    if (context.features?.brush)
      pending.push(
        import('@/components/ui/chart-brush').then(({ BrushComponent }) => {
          echarts.use(BrushComponent)
        }),
      )
    if (pending.length) {
      setPreparing(true)
      Promise.all(pending).then(initialize, fail)
    } else initialize()
    return () => {
      cancelled = true
      resize?.disconnect()
      chart?.dispose()
      if (context.instance.current === chart) context.instance.current = null
      applied.current = null
    }
  }, [
    context.renderer,
    context.mode,
    context.instance,
    context.features?.dataZoom,
    context.features?.brush,
  ])
  React.useEffect(() => {
    const chart = context.instance.current
    if (!chart || chart.isDisposed()) return
    if (context.modules?.length) echarts.use([...context.modules])
    if (applied.current === context.option) return
    try {
      chart.setOption(context.option, { replaceMerge: ['series'], ...context.updateOptions })
      applied.current = context.option
      setFailure(undefined)
    } catch (reason) {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      setFailure(error.message)
      context.onError?.(error)
    }
  }, [context.option, context.modules, context.updateOptions, context.instance, context.onError])
  const message = context.error ?? failure
  return (
    <div
      data-slot="chart-canvas"
      className={cn('relative min-w-0', className)}
      style={{ height: context.height, ...style }}
      aria-busy={context.loading || preparing}
      {...props}
    >
      <div
        ref={host}
        // ECharts positions text in physical coordinates, including on RTL pages.
        dir="ltr"
        role="img"
        aria-label={context.label}
        className="h-full w-full"
        style={{ visibility: message || context.empty ? 'hidden' : undefined }}
      />
      {(context.loading || preparing || context.empty || message) && (
        <div
          role={message ? 'alert' : 'status'}
          className="absolute inset-0 flex items-center justify-center gap-3 rounded-lg bg-background/90 p-6 text-center text-sm text-muted-foreground"
        >
          {message ??
            (context.loading || preparing ? (
              <>
                <span
                  className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
                  aria-hidden="true"
                />
                Loading chart…
              </>
            ) : (
              context.emptyMessage
            ))}
        </div>
      )}
    </div>
  )
}
export function ChartHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="chart-header" className={cn('space-y-1', className)} {...props} />
}
export function ChartTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return (
    <h3
      data-slot="chart-title"
      className={cn('font-semibold tracking-tight', className)}
      {...props}
    />
  )
}
export function ChartDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="chart-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
export interface ChartLegendItem {
  name: string
  color?: string
}
export function ChartLegend({
  items,
  className,
  ...props
}: React.ComponentProps<'div'> & { items: ChartLegendItem[] }) {
  const { instance, selected, colors } = useChart()
  return (
    <div
      data-slot="chart-legend"
      aria-label="Chart series"
      className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-2', className)}
      {...props}
    >
      {items.map((item, index) => (
        <button
          key={item.name}
          type="button"
          aria-label={`Toggle ${item.name}`}
          aria-pressed={selected[item.name] !== false}
          onClick={() =>
            instance.current?.dispatchAction({ type: 'legendToggleSelect', name: item.name })
          }
          className="inline-flex min-h-8 items-center gap-2 rounded px-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span
            className="size-2.5 rounded-sm"
            style={{
              background: item.color ?? colors[index % colors.length],
              opacity: selected[item.name] === false ? 0.25 : 1,
            }}
          />
          <span className={selected[item.name] === false ? 'line-through opacity-60' : undefined}>
            {item.name}
          </span>
        </button>
      ))}
    </div>
  )
}
export interface ChartTableRow {
  id: string
  cells: React.ReactNode[]
}
export function ChartDataTable({
  columns,
  rows,
  caption = 'Chart data',
  className,
}: {
  columns: string[]
  rows: ChartTableRow[]
  caption?: string
  className?: string
}) {
  return (
    <details data-slot="chart-data-table" className={cn('rounded-lg border text-xs', className)}>
      <summary className="cursor-pointer rounded-lg px-3 py-2.5 font-medium focus-visible:outline-2 focus-visible:outline-ring">
        View data table
      </summary>
      <div className="max-h-72 overflow-auto" role="region" aria-label={caption} tabIndex={0}>
        <table className="w-full text-start">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column, i) => (
                <th
                  key={i}
                  scope="col"
                  className="border-b px-3 py-2 text-start font-medium text-muted-foreground"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, i) => (
                  <td key={i} className="border-b px-3 py-2 last:border-b-0">
                    {cell ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
