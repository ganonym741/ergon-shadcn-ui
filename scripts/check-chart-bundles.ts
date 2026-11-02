import { build } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

// Inspect real standalone consumer builds, independent of documentation chunking.
// React is external so these numbers describe chart JavaScript, without fonts/CSS.
const root = resolve(import.meta.dir, '..')
const directory = resolve(root, 'output/chart-bundle-entries')
await mkdir(directory, { recursive: true })
const cases = [
  ['chart', 'Chart', undefined],
  ['line-chart', 'LineChart', 'line'],
  ['area-chart', 'AreaChart', 'line'],
  ['bar-chart', 'BarChart', 'bar'],
  ['pie-chart', 'PieChart', 'pie'],
  ['scatter-chart', 'ScatterChart', 'scatter'],
  ['radar-chart', 'RadarChart', 'radar'],
  ['heatmap-chart', 'HeatmapChart', 'heatmap'],
  ['gauge-chart', 'GaugeChart', 'gauge'],
] as const
const report: Record<string, unknown> = {}
for (const [id, component, expected] of cases) {
  const entry = resolve(directory, `${id}.tsx`)
  await writeFile(entry, `export { ${component} } from '../../src/components/ui/${id}'\n`)
  const result = await build({
    configFile: false,
    root,
    logLevel: 'silent',
    resolve: { alias: { '@': resolve(root, 'src') } },
    build: {
      write: false,
      minify: true,
      lib: { entry, formats: ['es'], fileName: id },
      rolldownOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
    },
  })
  const outputs = Array.isArray(result) ? result : [result]
  const chunks = outputs
    .flatMap((output) => ('output' in output ? output.output : []))
    .filter((item) => item.type === 'chunk')
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const initial = new Set<string>()
  function visit(name: string) {
    const chunk = byName.get(name)
    if (!chunk || initial.has(name)) return
    initial.add(name)
    chunk.imports.forEach(visit)
  }
  chunks.filter((chunk) => chunk.isEntry).forEach((chunk) => visit(chunk.fileName))
  const eager = chunks.filter((chunk) => initial.has(chunk.fileName))
  const modules = eager.flatMap((chunk) =>
    Object.entries(chunk.modules)
      .filter(([, info]) => info.renderedLength > 0)
      .map(([name]) => name.replaceAll('\\', '/')),
  )
  const installedSeries = [
    ...new Set(
      modules.flatMap(
        (name) => name.match(/\/echarts\/lib\/chart\/([^/]+)\/install\.js$/)?.slice(1) ?? [],
      ),
    ),
  ]
    .filter((name) => name !== 'custom')
    .sort()
  if (installedSeries.join(',') !== (expected ?? ''))
    throw new Error(`${id} contains unexpected series installers: ${installedSeries.join(',')}`)
  if (
    modules.some(
      (name) =>
        name.endsWith('/installCanvasRenderer.js') ||
        name.endsWith('/zrender/lib/canvas/Painter.js'),
    )
  )
    throw new Error(`${id} eagerly includes the Canvas renderer`)
  if (modules.some((name) => name.includes('/echarts/lib/component/dataZoom/')))
    throw new Error(`${id} eagerly includes data zoom`)
  if (modules.some((name) => /\/echarts\/index\.js$/.test(name)))
    throw new Error(`${id} imports the full ECharts entry`)
  const data = {
    initialBytes: eager.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0),
    initialGzipBytes: eager.reduce((sum, chunk) => sum + gzipSync(chunk.code).length, 0),
    totalEmittedBytes: chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0),
    totalEmittedGzipBytes: chunks.reduce((sum, chunk) => sum + gzipSync(chunk.code).length, 0),
    installedSeries,
    optionalChunks: chunks
      .filter((chunk) => !initial.has(chunk.fileName))
      .map((chunk) => ({
        file: chunk.fileName,
        bytes: Buffer.byteLength(chunk.code),
        gzipBytes: gzipSync(chunk.code).length,
      })),
    initialModules: modules,
  }
  report[id] = data
  console.log(
    `${component}: ${(data.initialGzipBytes / 1024).toFixed(1)} KiB gzip initially; series=${installedSeries.join(',') || 'none'}; Canvas/zoom deferred`,
  )
}
await writeFile(resolve(root, 'output/chart-bundles.json'), JSON.stringify(report, null, 2))
console.log('All nine standalone chart module checks passed. Report: output/chart-bundles.json')
