import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { components } from '@/catalog'
import { examples } from '@/docs/examples'
import { coverage } from '@/coverage'
describe('source distribution', () => {
  it('provides a real usage example for every catalog entry', () => {
    expect(components).toHaveLength(83)
    for (const item of components) expect(examples[item.id], item.id).toMatch(/import/)
    for (const item of components) {
      expect(coverage[item.id], item.id).toBeDefined()
      expect(coverage[item.id].implemented.length).toBeGreaterThan(0)
    }
    expect(new Set(components.map((c) => c.id)).size).toBe(components.length)
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
