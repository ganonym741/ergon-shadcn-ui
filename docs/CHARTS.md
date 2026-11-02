# Charts

## Install and render a chart

Complete the [application setup](INSTALLATION.md), then install the chart you need (npm example; the installation guide lists all five runners):

```sh
npx @ergonui/cli add line-chart
```

Replace `src/App.tsx` with:

```tsx
import { LineChart } from '@/components/ui/line-chart'

export default function App() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <LineChart
        label="Monthly revenue"
        data={[
          { id: 'jan', label: 'Jan', revenue: 42 },
          { id: 'feb', label: 'Feb', revenue: 58 },
        ]}
        series={[{ key: 'revenue', label: 'Revenue' }]}
      />
    </main>
  )
}
```

Pass your own data through props. Install each chart entry your application imports.

## Module boundaries

Import the component entry you use, for example `@/components/ui/line-chart`. Each entry registers its own ECharts series and required features. Line and Area share the line series.

The base `Chart` includes ECharts core, accessibility support and the default SVG renderer. It does not register chart series, axes, legends, tooltips, datasets or toolboxes on your behalf. Type-only imports from `echarts` disappear from the JavaScript build.

## Native options and additional modules

Use `modules` for the series and features required by a custom option. The same prop is available on the typed chart compositions. `registerChartModules` remains available for application-level registration.

```tsx
import { Chart } from '@/components/ui/chart'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

const modules = [BarChart, GridComponent, TooltipComponent]

export function RevenueChart() {
  return (
    <Chart
      modules={modules}
      label="Monthly revenue"
      option={{
        xAxis: { type: 'category', data: ['Jan', 'Feb'] },
        yAxis: { type: 'value' },
        tooltip: { trigger: 'axis' },
        series: [{ type: 'bar', data: [42, 58] }],
      }}
    />
  )
}
```

Dataset/transform, title, toolbox, annotations and additional coordinates are explicit module choices. Import them from ECharts and pass them through `modules`; using an option alone does not install its engine feature.

## Optional capabilities

SVG is ready by default. `renderer="canvas"` loads the Canvas painter on demand. `zoom` on Line, Area, Bar or Scatter loads the data-zoom module when enabled. For native options, use `features={{ dataZoom: true }}` with your `option.dataZoom` configuration.

`onReady` runs after the engine and optional modules are ready. Use it for imperative actions during initialization. The chart resizes with its host and disposes the engine on unmount.

## Bundle size

ECharts core has a shared cost; each additional series or feature adds code. Measure production builds, since Vite's development prebundling can include more modules. From the library repository, `bun run charts:check` verifies that unrelated series, Canvas, and zoom stay outside each entry's initial module graph. See [verification](VERIFICATION.md) for the testing scope.
