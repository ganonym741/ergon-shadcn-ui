# Modular charts

## Install and render a chart

Complete the [application setup](INSTALLATION.md) first; no ErgonUI clone is needed. Install the entry you use from the hosted registry:

```sh
bunx @ergonui/cli add line-chart
```

The CLI's first npm publication is pending; these commands become public after release. The [installation guide](INSTALLATION.md) includes a manual alternative available now. The CLI installs ECharts and the component's local helpers, including the optional renderer/zoom files. Public entries follow the deployed revision; use `--registry <local-documentation-origin>` for unreleased work. Replace `src/App.tsx` with this complete example:

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

Run `bun run build`, then `bun run dev`. Pass your own data through props; no data service is included. Install each additional chart entry that your application imports.

## Module boundaries

Import the component entry you use, for example `@/components/ui/line-chart`. Each entry registers its own ECharts series and required components. Line and Area share the line series; the shared Cartesian composition contains layout and data mapping, without importing the other series.

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

Optional imports show a loading state and are safe to cancel on unmount or renderer changes. `onReady` runs after the engine and optional modules are ready. Use it before imperative actions that must run during initialization. The engine resizes with its host and is disposed on unmount. Registry payloads include both optional helper source files.

The documentation loads each chart entry separately. It does not import every chart series into a shared preview or force optional modules into a broad vendor chunk.

These bundle boundaries describe production builds. Vite may prebundle dependency entrypoints more broadly during development; inspect a production build when evaluating download sizes.

## Bundle verification

Run `bun run charts:check`. It builds all nine standalone entries independently from the documentation, follows their static chunk dependencies and rejects unrelated series installers, the full ECharts entry, an eager Canvas painter, or eager data zoom. Results are written to ignored `output/chart-bundles.json`, including optional emitted chunks separately from initial JavaScript.

In the November 1, 2026 consumer comparison (ECharts 6.1.0, Vite 8.3.5, Bun 1.4.4), the initial SVG Line Chart JavaScript decreased from approximately 302.7 KiB to 225.0 KiB gzip, about 26%. Gauge decreased from 302.1 KiB to 181.7 KiB gzip, about 40%. These are isolated ES library builds with React external, excluding CSS and fonts; they are not total page-download sizes. ECharts core still has a substantial shared cost, and enabling optional features downloads additional chunks.
