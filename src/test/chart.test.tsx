import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chart, ChartCanvas, ChartLegend, type ChartHandle } from '@/components/ui/chart'
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
    init: vi.fn(() => {
      const handlers = new Map<string, (event: unknown) => void>()
      const selected: Record<string, boolean> = {}
      let disposed = false
      const instance = {
        setOption: vi.fn(),
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
