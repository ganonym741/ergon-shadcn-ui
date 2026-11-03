import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Chart,
  ChartCanvas,
  ChartLegend,
  mergeChartOptions,
  type ChartHandle,
} from '@/components/ui/chart'
import * as echarts from 'echarts/core'
import { MapChart } from '@/components/ui/map-chart'
import { BoxplotChart } from '@/components/ui/boxplot-chart'
import { CalendarHeatmapChart } from '@/components/ui/calendar-heatmap-chart'
import { ComboChart } from '@/components/ui/combo-chart'
import { SankeyChart } from '@/components/ui/sankey-chart'
import { CandlestickChart, type CandlestickDatum } from '@/components/ui/candlestick-chart'
import { BarChart } from '@/components/ui/bar-chart'
import { AreaChart } from '@/components/ui/area-chart'
import { LineChart } from '@/components/ui/line-chart'
import { PieChart } from '@/components/ui/pie-chart'
import { ScatterChart } from '@/components/ui/scatter-chart'
import { RadarChart } from '@/components/ui/radar-chart'
import { HeatmapChart } from '@/components/ui/heatmap-chart'
import { GaugeChart } from '@/components/ui/gauge-chart'
import ComponentPlayground from '@/playground'
import { ThemeProvider } from '@/components/ui/theme-provider'

const engine = vi.hoisted(() => ({
  instances: [] as any[],
  resize: undefined as undefined | (() => void),
}))
vi.mock('echarts/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('echarts/core')>()
  return {
    ...actual,
    use: vi.fn(),
    registerMap: vi.fn(),
    init: vi.fn(() => {
      const handlers = new Map<string, (event: unknown) => void>()
      const selected: Record<string, boolean> = {}
      let disposed = false
      let currentOption: any = {}
      const instance = {
        setOption: vi.fn((option) => {
          currentOption = option
        }),
        getOption: () => currentOption,
        getWidth: () => 600,
        getHeight: () => 320,
        on: vi.fn((event, handler) => handlers.set(event, handler)),
        resize: vi.fn(),
        dispose: vi.fn(() => {
          disposed = true
        }),
        isDisposed: () => disposed,
        getDataURL: vi.fn(() => 'data:image/svg+xml;base64,PHN2Zy8+'),
        dispatchAction: vi.fn((action) => {
          if (action.type === 'legendToggleSelect') {
            selected[action.name] = selected[action.name] === false
            handlers.get('legendselectchanged')?.({ name: action.name, selected: { ...selected } })
          }
        }),
        handlers,
      }
      engine.instances.push(instance)
      return instance
    }),
  }
})
beforeEach(() => {
  engine.instances.length = 0
})
const option = {
  xAxis: { type: 'category' as const, data: ['Jan'] },
  yAxis: {},
  series: [{ type: 'bar' as const, name: 'Revenue', data: [42] }],
}
const latest = () => engine.instances.at(-1)!

describe('dashboard chart compositions', () => {
  it('uses the resolved font family so native chart labels can be measured accurately', async () => {
    const { rerender } = render(
      <Chart label="Measured labels" option={option} dir="rtl" style={{ fontFamily: 'monospace' }}>
        <ChartCanvas />
      </Chart>,
    )
    await waitFor(() => expect(latest().getOption().textStyle.fontFamily).toBe('monospace'))
    expect(screen.getByRole('figure', { name: 'Measured labels' })).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('img', { name: 'Measured labels' })).toHaveAttribute('dir', 'ltr')
    rerender(
      <Chart label="Measured labels" option={option} dir="rtl" style={{ fontFamily: 'serif' }}>
        <ChartCanvas />
      </Chart>,
    )
    await waitFor(() => expect(latest().getOption().textStyle.fontFamily).toBe('serif'))
  })
  it('merges native options without mutating a reusable base', () => {
    const base = { grid: { right: 12 }, series: [{ type: 'bar' as const, data: [0, 1] }] }
    const merged = mergeChartOptions(base, { grid: { right: 40 } })
    expect(merged.grid).toMatchObject({ right: 40 })
    expect(base.grid.right).toBe(12)
    expect(base.series[0].data).toEqual([0, 1])
  })
  it('maps mixed series to named axes, preserves gaps, and offsets axes sharing a side', () => {
    render(
      <ComboChart
        label="Revenue and rate"
        data={[{ id: 'jan', label: 'Jan', revenue: 0, rate: null }]}
        axes={[
          { id: 'money', position: 'left' },
          { id: 'rate', position: 'left', unit: '%' },
        ]}
        series={[
          { key: 'revenue', type: 'bar', axisId: 'money' },
          { key: 'rate', type: 'line', axisId: 'rate' },
        ]}
      />,
    )
    const applied = latest().getOption()
    expect(applied.series.map((s: any) => [s.type, s.yAxisIndex, s.data])).toEqual([
      ['bar', 0, [{ id: 'jan', name: 'Jan', value: 0 }]],
      ['line', 1, [{ id: 'jan', name: 'Jan', value: null }]],
    ])
    expect(applied.yAxis[1].offset).toBe(58)
  })
  it('renders summary boxes and outlier coordinates in either orientation', () => {
    render(
      <BoxplotChart
        label="Latency"
        horizontal
        data={[{ id: 'api', label: 'API', summary: [0, 2, 4, 6, 8], outliers: [20] }]}
      />,
    )
    const applied = latest().getOption()
    expect(applied.series[0].data[0].value).toEqual([0, 2, 4, 6, 8])
    expect(applied.series[1].data[0].value).toEqual([20, 0])
    expect(applied.yAxis.data).toEqual(['API'])
  })
  it('filters calendar values to the requested month and retains zeros', () => {
    render(
      <CalendarHeatmapChart
        label="Activity"
        range="2024-02"
        data={[
          { id: 'leap', date: '2024-02-29', value: 0 },
          { id: 'outside', date: '2024-03-01', value: 12 },
        ]}
      />,
    )
    const applied = latest().getOption()
    expect(applied.calendar.range).toEqual(['2024-02-01', '2024-02-29'])
    expect(applied.series[0].data).toEqual([
      { id: 'leap', name: '2024-02-29', value: ['2024-02-29', 0] },
    ])
    expect(applied.calendar.dayLabel.firstDay).toBe(1)
  })
  it('registers injected maps before initialization and forwards named selections', async () => {
    const user = userEvent.setup()
    const selection = vi.fn(),
      event = vi.fn()
    render(
      <MapChart
        label="Regions"
        mapName="test-map"
        geoJSON={{ type: 'FeatureCollection', features: [] }}
        data={[{ id: 'north', name: 'North', value: 0 }]}
        onSelectionChange={selection}
        events={{ selectchanged: event }}
      />,
    )
    expect(echarts.registerMap).toHaveBeenCalledWith('test-map', {
      type: 'FeatureCollection',
      features: [],
    })
    expect(vi.mocked(echarts.registerMap).mock.invocationCallOrder.at(-1)).toBeLessThan(
      vi.mocked(echarts.init).mock.invocationCallOrder.at(-1)!,
    )
    latest().getOption().series[0].selectedMap = { North: true, South: false }
    act(() => latest().handlers.get('selectchanged')({ selected: [] }))
    expect(selection).toHaveBeenCalledWith(['North'])
    expect(event).toHaveBeenCalled()
    expect(screen.getByLabelText('Selected region')).toHaveValue('North')
    await user.click(screen.getByRole('button', { name: 'Clear regions' }))
    expect(latest().dispatchAction).toHaveBeenCalledWith({
      type: 'unselect',
      seriesIndex: 0,
      name: ['North'],
    })
  })
  it('keeps Sankey layout options stable on an unrelated rerender and rejects zero-flow layouts safely', () => {
    const nodes = [
        { id: 'a', label: 'Visitors' },
        { id: 'b', label: 'Signed up' },
      ],
      links = [{ id: 'ab', source: 'a', target: 'b', value: 5 }]
    const view = render(<SankeyChart label="Flow" nodes={nodes} links={links} />)
    const instance = latest(),
      calls = instance.setOption.mock.calls.length
    view.rerender(<SankeyChart label="Flow" className="p-2" nodes={nodes} links={links} />)
    expect(instance.setOption).toHaveBeenCalledTimes(calls)
    expect(instance.getOption().series[0].label.formatter({ name: 'a' })).toBe('Visitors')
    view.rerender(
      <SankeyChart label="Zero flow" nodes={nodes} links={[{ ...links[0], value: 0 }]} />,
    )
    expect(screen.getByText('No data to display')).toBeInTheDocument()
  })
  const market: CandlestickDatum[] = [
    { id: 'a', date: '2026-01-01', open: 10, close: 11, low: 9, high: 12, volume: 100 },
    { id: 'b', date: '2026-01-02', open: 11, close: 12, low: 10, high: 13, volume: 200 },
    { id: 'c', date: '2026-01-03', open: 12, close: 13, low: 11, high: 14, volume: 300 },
  ]
  it('restores map selection and viewport when the theme recreates the renderer', async () => {
    const geo = { type: 'FeatureCollection' as const, features: [] },
      data = [{ id: 'north', name: 'North', value: 42 }]
    const view = render(<MapChart label="Regions" mapName="persistent" geoJSON={geo} data={data} />)
    const initial = latest()
    Object.assign(initial.getOption().series[0], {
      zoom: 2,
      center: [3, 4],
      selectedMap: { North: true },
    })
    act(() => {
      initial.handlers.get('georoam')({ zoom: 2 })
      initial.handlers.get('selectchanged')({ selected: [] })
    })
    view.rerender(
      <MapChart label="Regions" mapName="persistent" geoJSON={geo} data={data} theme="dark" />,
    )
    await waitFor(() => expect(engine.instances).toHaveLength(2))
    const options = latest().setOption.mock.calls.map((call: any[]) => call[0])
    expect(options.some((o: any) => o.series?.[0]?.selectedMap?.North)).toBe(true)
    expect(
      options.some((o: any) => o.series?.[0]?.zoom === 2 && o.series?.[0]?.center?.[0] === 3),
    ).toBe(true)
    expect(screen.getByLabelText('Selected region')).toHaveValue('North')
  })
  it('restores brush data coordinates across theme changes without retaining old panel IDs or repeating semantic callbacks', async () => {
    const selected = vi.fn(),
      averages = [2]
    const view = render(
      <CandlestickChart
        label="Market"
        data={market}
        movingAverages={averages}
        zoom={false}
        onSelectionChange={selected}
      />,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply range' })).toBeEnabled())
    const event = {
      batch: [
        {
          areas: [
            {
              brushType: 'lineX',
              xAxisIndex: 0,
              coordRange: [1, 2],
              range: [100, 200],
              panelId: 'old-engine',
            },
          ],
          selected: [{ seriesIndex: 0, dataIndex: [1, 2] }],
        },
      ],
    }
    act(() => latest().handlers.get('brushselected')(event))
    view.rerender(
      <CandlestickChart
        label="Market"
        data={market}
        movingAverages={averages}
        zoom={false}
        theme="dark"
        onSelectionChange={selected}
      />,
    )
    await waitFor(() => expect(engine.instances).toHaveLength(2))
    expect(latest().dispatchAction).toHaveBeenCalledWith({
      type: 'brush',
      areas: [{ brushType: 'lineX', xAxisIndex: 0, coordRange: [1, 2] }],
    })
    act(() => latest().handlers.get('brushselected')(event))
    expect(selected).toHaveBeenCalledTimes(1)
    expect(screen.getByText('2 selected')).toBeInTheDocument()
  })
  it('orders OHLC dimensions correctly and links volume and average series', () => {
    render(
      <CandlestickChart
        label="Market"
        data={market}
        movingAverages={[2]}
        brush={false}
        zoom={false}
      />,
    )
    const applied = latest().getOption()
    expect(applied.series[0].data[0].value).toEqual([10, 11, 9, 12])
    expect(applied.series[1].data).toEqual([null, 11.5, 12.5])
    expect(applied.series[2]).toMatchObject({ type: 'bar', xAxisIndex: 1, yAxisIndex: 1 })
    expect(applied.xAxis[0].data).toEqual(applied.xAxis[1].data)
  })
  it('supports keyboard range application, typed brush callbacks and clearing', async () => {
    const user = userEvent.setup(),
      selected = vi.fn()
    render(
      <CandlestickChart
        label="Market"
        data={market}
        movingAverages={[]}
        zoom={false}
        onSelectionChange={selected}
      />,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply range' })).toBeEnabled())
    await user.selectOptions(screen.getByLabelText('Selection start'), '1')
    await user.click(screen.getByRole('button', { name: 'Apply range' }))
    expect(latest().dispatchAction).toHaveBeenCalledWith({
      type: 'brush',
      areas: [{ brushType: 'lineX', xAxisIndex: 0, coordRange: [1, 2] }],
    })
    act(() =>
      latest().handlers.get('brushselected')({
        batch: [
          {
            selected: [
              { seriesIndex: 0, dataIndex: [1, 2] },
              { seriesIndex: 1, dataIndex: [1] },
            ],
          },
        ],
      }),
    )
    expect(selected).toHaveBeenLastCalledWith({ indices: [1, 2], rows: [market[1], market[2]] })
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(latest().dispatchAction).toHaveBeenCalledWith({ type: 'brush', areas: [] })
    act(() => latest().handlers.get('brushselected')({ batch: [{ selected: [] }] }))
    expect(screen.getByText('0 selected')).toBeInTheDocument()
  })
})

describe('Chart lifecycle and interactions', () => {
  it('updates the existing instance, resizes and disposes on unmount', () => {
    const previous = global.ResizeObserver,
      disconnect = vi.fn()
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect = disconnect
      constructor(callback: ResizeObserverCallback) {
        engine.resize = () => callback([], this)
      }
    }
    const ready = vi.fn()
    const { rerender, unmount } = render(<Chart label="Revenue" option={option} onReady={ready} />)
    const instance = latest()
    expect(ready).toHaveBeenCalledWith(instance)
    rerender(
      <Chart
        label="Revenue"
        option={{ ...option, series: [{ type: 'bar', data: [0, 58] }] }}
        onReady={ready}
      />,
    )
    expect(engine.instances).toHaveLength(1)
    expect(instance.setOption.mock.lastCall[0].series[0].data).toEqual([0, 58])
    act(() => engine.resize?.())
    expect(instance.resize).toHaveBeenCalled()
    unmount()
    expect(disconnect).toHaveBeenCalled()
    expect(instance.dispose).toHaveBeenCalledOnce()
    global.ResizeObserver = previous
  })
  it('uses current event callbacks without recreating the chart', () => {
    const old = vi.fn(),
      next = vi.fn()
    const { rerender } = render(<Chart label="Revenue" option={option} events={{ click: old }} />)
    const instance = latest()
    rerender(<Chart label="Revenue" option={option} events={{ click: next }} />)
    act(() => instance.handlers.get('click')({ name: 'Jan', value: 42 }))
    expect(old).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith({ name: 'Jan', value: 42 }, instance)
    expect(engine.instances).toHaveLength(1)
  })
  it('replaces its engine when the renderer changes', async () => {
    const { rerender } = render(<Chart label="Revenue" option={option} renderer="svg" />)
    const first = latest()
    rerender(<Chart label="Revenue" option={option} renderer="canvas" />)
    expect(first.dispose).toHaveBeenCalledOnce()
    await waitFor(() => expect(engine.instances).toHaveLength(2))
  })
  it('does not create an engine after unmounting during an optional import', async () => {
    const { unmount } = render(<Chart label="Revenue" option={option} renderer="canvas" />)
    unmount()
    await act(async () => {
      await import('@/components/ui/chart-canvas-renderer')
    })
    expect(engine.instances).toHaveLength(0)
  })
  it('uses the latest options after an optional renderer finishes loading', async () => {
    const { rerender } = render(<Chart label="Revenue" option={option} renderer="canvas" />)
    rerender(
      <Chart
        label="Revenue"
        option={{ ...option, series: [{ type: 'bar', data: [99] }] }}
        renderer="canvas"
      />,
    )
    await waitFor(() => expect(latest()).toBeDefined())
    expect(latest().setOption.mock.lastCall[0].series[0].data).toEqual([99])
  })
  it('cancels a pending renderer when switching back to SVG', async () => {
    const { rerender } = render(<Chart label="Revenue" option={option} />)
    const first = latest()
    rerender(<Chart label="Revenue" option={option} renderer="canvas" />)
    rerender(<Chart label="Revenue" option={option} renderer="svg" />)
    await act(async () => {
      await import('@/components/ui/chart-canvas-renderer')
    })
    expect(first.dispose).toHaveBeenCalledOnce()
    expect(engine.instances).toHaveLength(2)
  })
  it('toggles legends by keyboard and retains selection across theme changes', async () => {
    const user = userEvent.setup()
    const view = (theme: 'light' | 'dark') => (
      <Chart label="Revenue" option={option} theme={theme}>
        <ChartCanvas />
        <ChartLegend items={[{ name: 'Revenue' }]} />
      </Chart>
    )
    const { rerender } = render(view('light'))
    await user.tab()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Toggle Revenue' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    rerender(view('dark'))
    expect(latest().setOption.mock.lastCall[0].legend[0].selected.Revenue).toBe(false)
  })
  it('exposes export and action methods and clears the disposed instance', () => {
    const ref = React.createRef<ChartHandle>()
    const { unmount } = render(<Chart ref={ref} label="Revenue" option={option} />)
    const handle = ref.current!
    expect(handle.getDataURL({ type: 'svg' })).toContain('data:image/svg+xml')
    handle.dispatchAction({ type: 'dataZoom', start: 20, end: 80 })
    expect(latest().dispatchAction).toHaveBeenCalledWith({ type: 'dataZoom', start: 20, end: 80 })
    unmount()
    expect(handle.getInstance()).toBeNull()
  })
  it('distinguishes loading, empty and error states', () => {
    const { rerender } = render(<Chart label="Revenue" option={option} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading chart')
    rerender(<Chart label="Revenue" option={option} empty />)
    expect(screen.getByRole('status')).toHaveTextContent('No data to display')
    rerender(<Chart label="Revenue" option={option} error="Request failed" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed')
  })
  it('reports update failures and recovers with valid options', () => {
    const error = vi.fn()
    const { rerender } = render(<Chart label="Revenue" option={option} onError={error} />)
    latest().setOption.mockImplementationOnce(() => {
      throw new Error('Invalid axis')
    })
    rerender(<Chart label="Revenue" option={{ series: [] }} onError={error} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid axis')
    expect(error).toHaveBeenCalledWith(expect.any(Error))
    rerender(<Chart label="Revenue" option={{ ...option }} onError={error} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
it('validates chart option objects and array-based data independently', async () => {
  render(
    <ThemeProvider defaultTheme="light">
      <ComponentPlayground id="chart" />
    </ThemeProvider>,
  )
  await screen.findByRole('button', { name: 'Update data' })
  expect(screen.queryByText('Provide an array.')).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: /ECharts option/ }), {
    target: { value: '[]' },
  })
  expect(screen.getByText('Provide an object.')).toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: /ECharts option/ }), {
    target: { value: '{"series":[]}' },
  })
  expect(screen.queryByText('Provide an object.')).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'Custom palette' }), {
    target: { value: '{}' },
  })
  expect(screen.getByText('Provide an array.')).toBeInTheDocument()
})
it('respects reduced motion outside previews and retains an explicit animation override', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  )
  const { rerender } = render(<Chart label="Revenue" option={option} />)
  expect(latest().setOption.mock.lastCall[0].animation).toBe(false)
  rerender(<Chart label="Revenue" option={option} animated />)
  expect(latest().setOption.mock.lastCall[0].animation).toBe(true)
  vi.unstubAllGlobals()
})
describe('typed chart compositions', () => {
  it.each([BarChart, AreaChart, LineChart])(
    'keeps zeros and gaps while applying overrides',
    (Component) => {
      const override = { tooltip: { show: false }, grid: { right: 44 } }
      render(
        <Component
          label="Revenue"
          data={[
            { id: 'a', label: 'Jan', revenue: 0 },
            { id: 'b', label: 'Feb', revenue: null },
          ]}
          series={[{ key: 'revenue', label: 'Revenue' }]}
          horizontal
          stacked
          option={override}
        />,
      )
      const applied = latest().setOption.mock.lastCall[0]
      expect(applied.series[0].data).toEqual([0, null])
      expect(applied.series[0].stack).toBe('total')
      expect(applied.yAxis.type).toBe('category')
      expect(applied.tooltip.show).toBe(false)
      expect(applied.grid.right).toBe(44)
      expect(override).toEqual({ tooltip: { show: false }, grid: { right: 44 } })
      expect(screen.getByText('View data table')).toBeInTheDocument()
    },
  )
  it('preserves named pie slices and IDs', () => {
    render(
      <PieChart label="Sources" data={[{ id: 'a', name: 'Direct', value: 0 }]} donut={false} />,
    )
    expect(latest().setOption.mock.lastCall[0].series[0].data[0]).toMatchObject({
      id: 'a',
      name: 'Direct',
      value: 0,
    })
  })
  it('maps scatter coordinates and sizes', () => {
    render(
      <ScatterChart
        label="Projects"
        series={[{ id: 'team', name: 'Team', data: [{ id: 'p', x: 0, y: 4, size: 20 }] }]}
      />,
    )
    expect(latest().setOption.mock.lastCall[0].series[0].data[0]).toMatchObject({
      id: 'p',
      value: [0, 4],
      symbolSize: 20,
    })
  })
  it('maps radar indicators and values', () => {
    render(
      <RadarChart
        label="Skills"
        indicators={[{ name: 'Design', max: 100 }]}
        series={[{ id: 'a', name: 'Team', values: [0] }]}
        shape="circle"
      />,
    )
    expect(latest().setOption.mock.lastCall[0].radar.shape).toBe('circle')
    expect(latest().setOption.mock.lastCall[0].series[0].data[0].value).toEqual([0])
  })
  it('maps heatmap labels to indices and excludes unknown coordinates', () => {
    render(
      <HeatmapChart
        label="Activity"
        xCategories={['Mon']}
        yCategories={['AM']}
        data={[
          { id: 'a', x: 'Mon', y: 'AM', value: 0 },
          { id: 'b', x: 'Tue', y: 'AM', value: 10 },
        ]}
      />,
    )
    expect(latest().setOption.mock.lastCall[0].series[0].data).toEqual([
      { id: 'a', name: 'Mon, AM', value: [0, 0, 0] },
    ])
  })
  it('preserves gauge zero, bounds and units', () => {
    render(<GaugeChart label="Completion" value={0} max={200} unit=" tasks" />)
    expect(latest().setOption.mock.lastCall[0].series[0]).toMatchObject({
      min: 0,
      max: 200,
      data: [{ value: 0, name: 'Progress' }],
      detail: { formatter: '{value} tasks' },
    })
  })
})
