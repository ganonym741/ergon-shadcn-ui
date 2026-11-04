import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { components } from '@/catalog'
import { examples } from '@/docs/examples'
import { coverage } from '@/coverage'
import { usageInstallIds } from '@/docs/installation'
describe('source distribution', () => {
  it('documents real exports without advertising private implementation helpers', async () => {
    const calendar = JSON.parse(await readFile('public/api/calendar-plus.json', 'utf8')),
      button = JSON.parse(await readFile('public/api/button.json', 'utf8'))
    const calendarApi = calendar.api.find(
        (file: { file: string }) => file.file === 'calendar-plus.tsx',
      ),
      buttonApi = button.api.find((file: { file: string }) => file.file === 'button.tsx')
    expect(calendarApi.exports).toContain('CalendarPlus')
    expect(calendarApi.exports).not.toContain('dateKey')
    expect(calendarApi.types.join('\n')).not.toContain('export function fromApi')
    expect(buttonApi.exports).toContain('Button')
    expect(buttonApi.types.join('\n')).toContain('export function Button')
  })
  it('can install every local import used by the suggested usage composition', async () => {
    for (const { id } of components) {
      const files = new Set<string>()
      for (const installId of usageInstallIds(id, examples[id])) {
        const item = JSON.parse(await readFile(`public/r/${installId}.json`, 'utf8'))
        for (const file of item.files) files.add(file.path.replaceAll('\\', '/'))
      }
      for (const [, path] of examples[id].matchAll(/from\s*['"](@\/[^'"]+)['"]/g)) {
        const local = `src/${path.slice(2)}`
        expect(files.has(`${local}.tsx`) || files.has(`${local}.ts`), `${id}: ${path}`).toBe(true)
      }
    }
  })
  it('ships installable chart source with pinned ECharts and portable API signatures', async () => {
    const charts = components.filter((component) => component.category === 'Chart')
    expect(charts).toHaveLength(16)
    for (const component of charts) {
      const item = JSON.parse(await readFile(`public/r/${component.id}.json`, 'utf8'))
      const api = JSON.parse(await readFile(`public/api/${component.id}.json`, 'utf8'))
      expect(item.dependencies).toContain('echarts@6.1.0')
      expect(
        item.files.some((file: { path: string }) => file.path === 'src/components/ui/chart.tsx'),
      ).toBe(true)
      const sourcePaths = item.files.map((file: { path: string }) => file.path)
      expect(sourcePaths).toContain('src/components/ui/chart-canvas-renderer.tsx')
      expect(sourcePaths).toContain('src/components/ui/chart-zoom.tsx')
      for (const file of item.files)
        expect(file.content).not.toMatch(/from ['"]@\/(?:docs|playground|generated)\//)
      expect(JSON.stringify(api.api)).not.toMatch(/(?:[A-Z]:[\\/]|\/node_modules\/)/)
    }
  })
  it('provides a real usage example for every catalog entry', () => {
    expect(components).toHaveLength(111)
    for (const item of components) expect(examples[item.id], item.id).toMatch(/import/)
    for (const item of components) {
      expect(coverage[item.id], item.id).toBeDefined()
      expect(coverage[item.id].implemented.length).toBeGreaterThan(0)
    }
    expect(new Set(components.map((c) => c.id)).size).toBe(components.length)
  })
  it('keeps every generated API portable across checkout locations', async () => {
    for (const { id } of components) {
      const api = JSON.parse(await readFile(`public/api/${id}.json`, 'utf8'))
      expect(JSON.stringify(api.api), id).not.toMatch(/(?:[A-Z]:[\\/]|\/node_modules\/)/)
    }
  })
  it('includes all transitive source imports, package dependencies, and shadcn attribution', async () => {
    for (const component of components) {
      const item = JSON.parse(await readFile(`public/r/${component.id}.json`, 'utf8'))
      const paths = new Set(item.files.map((f: any) => f.path))
      expect(item.files.find((f: any) => f.path === 'LICENSES/shadcn-ui.txt')?.content).toContain(
        'Copyright (c) 2023 shadcn',
      )
      for (const file of item.files) {
        for (const [, path] of file.content.matchAll(/from\s*['"](@\/[^'"]+)['"]/g)) {
          const local = 'src/' + path.slice(2)
          expect(
            paths.has(local + '.tsx') || paths.has(local + '.ts'),
            `${component.id}: ${path}`,
          ).toBe(true)
        }
      }
    }
  })
})
