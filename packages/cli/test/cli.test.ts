import { afterAll, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply, json, read, setJSON } from '../src/files'
import { stylesheet, viteConfiguration } from '../src/config'
import { run } from '../src/engine'

const root = fileURLToPath(new URL('../../../output/cli-tests/', import.meta.url))
await mkdir(root, { recursive: true })
const item = (name: string) => ({
  name,
  type: 'registry:ui',
  dependencies: ['clsx@2.1.1'],
  files: [
    {
      path: `src/components/ui/${name}.tsx`,
      content: `export function Example(){return <button>${name}</button>}`,
    },
    { path: 'LICENSES/shadcn-ui.txt', content: 'Copyright (c) 2023 shadcn\nMIT license fixture' },
  ],
})
const vars = {
  light: {
    primary: '#b93e28',
    background: '#ffffff',
    foreground: '#262725',
    border: '#eee',
    ring: '#b93e28',
    radius: '0.625rem',
  },
  dark: {
    primary: '#f17c5e',
    background: '#1b1d1c',
    foreground: '#eee',
    border: '#333',
    ring: '#f17c5e',
  },
}
const server = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  fetch(request) {
    const name = new URL(request.url).pathname.match(/^\/r\/([a-z-]+)\.json$/)?.[1]
    if (name === 'theme') return Response.json({ name, type: 'registry:theme', cssVars: vars })
    if (name === 'unsafe')
      return Response.json({ ...item(name), files: [{ path: '../outside.ts', content: 'bad' }] })
    if (name === 'html') return new Response('<html>fallback</html>')
    if (name === 'missing') return new Response('missing', { status: 404 })
    return name ? Response.json(item(name)) : new Response('missing', { status: 404 })
  },
})
const registry = `http://127.0.0.1:${server.port}`
afterAll(() => server.stop(true))

async function application() {
  const dir = await mkdtemp(resolve(root, 'app-'))
  await mkdir(resolve(dir, 'src'))
  await writeFile(
    resolve(dir, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: { react: '19.3.1' },
      devDependencies: { vite: '8.3.5' },
    }),
  )
  await writeFile(
    resolve(dir, 'tsconfig.json'),
    '// Keep this comment\n{"compilerOptions":{"strict":true},"references":[]}',
  )
  await writeFile(resolve(dir, 'tsconfig.app.json'), '{"compilerOptions":{"noUnusedLocals":true}}')
  await writeFile(
    resolve(dir, 'vite.config.ts'),
    "import {defineConfig} from 'vite'\nexport default defineConfig({server:{port:6123},plugins:[]})",
  )
  await writeFile(
    resolve(dir, 'src/main.tsx'),
    "import './index.css'\nconsole.log('existing entry')",
  )
  await writeFile(
    resolve(dir, 'src/index.css'),
    "@import 'tailwindcss';\n/* personal styles */\n:root {--primary: #123456;} .custom {color:red}",
  )
  return dir
}

describe('CLI configuration and source installation', () => {
  test('preserves JSONC comments and unrelated settings', () => {
    const updated = setJSON(
      '// comment\n{"compilerOptions":{"strict":true}}',
      ['compilerOptions', 'paths', '@/*'],
      ['./src/*'],
    )
    expect(updated).toContain('// comment')
    expect(json(updated, 'config').compilerOptions.strict).toBe(true)
  })
  test('merges CSS without replacing existing tokens or duplicating imports', () => {
    const before =
      "@import 'tailwindcss';\n/* personal */\n:root {--primary: #123456;} .custom{color:red}"
    const merged = stylesheet(stylesheet(before, vars, false), vars, false)
    expect(merged).toContain('--primary: #123456')
    expect(merged).toContain('.custom{color:red}')
    expect(merged.match(/@import ["']tailwindcss["']/g)).toHaveLength(1)
    expect(merged.match(/ErgonUI base styles/g)).toHaveLength(1)
    expect(stylesheet(before, vars, true)).toContain('--primary: #b93e28')
  })
  test('preserves layered tokens and bindings across multiple CSS blocks', () => {
    const input =
      '@theme inline { --color-primary: var(--brand); } @theme inline { --font-sans: sans-serif; } @layer base { :root { --primary: #123456; } } :root { --radius: 8px; }'
    const output = stylesheet(input, vars, false)
    expect(output.match(/--primary: #123456/g)).toHaveLength(1)
    expect(output).not.toContain('--primary: #b93e28')
    expect(output.match(/--color-primary:/g)).toHaveLength(1)
    expect(output).toContain('--primary: #123456')
    expect(stylesheet(output, vars, false)).toBe(output)
  })
  test('preserves an async Vite function and its existing settings', () => {
    const input =
      "import { defineConfig } from 'vite'\nexport default defineConfig(async ({mode})=>({server:{port:6123},define:{MODE:JSON.stringify(mode)}}))"
    const output = viteConfiguration(input, 'src')
    expect(output).toContain('port:6123')
    expect(output).toContain("typeof __ergonConfig === 'function'")
    expect(viteConfiguration(output, 'src')).toBe(output)
  })
  test('rejects unsupported Vite exports instead of replacing them', () => {
    expect(() => viteConfiguration("export {default} from './shared'", 'src')).toThrow(
      'default export',
    )
  })
  test('dry run does not create an initialized config or source files', async () => {
    const dir = await application()
    const before = await read(resolve(dir, 'src/index.css'))
    await run('init', [], {
      cwd: dir,
      registry,
      components: ['button'],
      dryRun: true,
      install: false,
    })
    expect(await read(resolve(dir, 'components.json'))).toBeUndefined()
    expect(await read(resolve(dir, 'src/components/ui/button.tsx'))).toBeUndefined()
    expect(await read(resolve(dir, 'src/index.css'))).toBe(before)
  })
  test('initializes existing applications while preserving customization and notices', async () => {
    const dir = await application()
    await run('init', [], { cwd: dir, registry, components: ['button'], install: false })
    expect(await read(resolve(dir, 'src/index.css'))).toContain('--primary: #123456')
    expect(await read(resolve(dir, 'tsconfig.json'))).toContain('Keep this comment')
    expect(
      json((await read(resolve(dir, 'components.json')))!, 'components').registries['@ergonui'],
    ).toBe(`${registry}/r/{name}.json`)
    expect(await read(resolve(dir, 'LICENSES/shadcn-ui.txt'))).toContain('2023 shadcn')
    expect(json((await read(resolve(dir, 'package.json')))!, 'package').dependencies.clsx).toBe(
      '2.1.1',
    )
    await run('add', ['Table+'], { cwd: dir, install: false })
    expect(await read(resolve(dir, 'src/components/ui/table-plus.tsx'))).toContain('table-plus')
    await run('init', [], {
      cwd: dir,
      components: ['theme'],
      overwrite: true,
      keepTheme: true,
      install: false,
    })
    expect(await read(resolve(dir, 'src/index.css'))).toContain('--primary: #123456')
  })
  test('preflights conflicts before writing any file', async () => {
    const dir = await application()
    await expect(
      apply(
        dir,
        [
          { path: 'new.txt', content: 'new' },
          { path: 'src/index.css', content: 'replacement' },
        ],
        false,
        false,
      ),
    ).rejects.toThrow('No files were written')
    expect(await read(resolve(dir, 'new.txt'))).toBeUndefined()
  })
  test('rejects traversal and symlink destinations', async () => {
    const dir = await application()
    await expect(
      apply(dir, [{ path: '../escape.txt', content: 'bad' }], true, false),
    ).rejects.toThrow('Unsafe')
    await mkdir(resolve(dir, 'outside'))
    await symlink(
      resolve(dir, 'outside'),
      resolve(dir, 'linked'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await expect(
      apply(dir, [{ path: 'linked/file.ts', content: 'bad' }], true, false),
    ).rejects.toThrow('symlink')
  })
  test('rejects bad registry responses before modifying configuration', async () => {
    for (const component of ['unsafe', 'html', 'missing']) {
      const dir = await application()
      await expect(
        run('init', [], { cwd: dir, registry, components: [component], install: false }),
      ).rejects.toThrow()
      expect(await read(resolve(dir, 'components.json'))).toBeUndefined()
    }
  })
  test('the built executable creates a complete application with bundled template', async () => {
    const dir = await mkdtemp(resolve(root, 'create-'))
    const target = resolve(dir, 'fresh-app')
    const executable = fileURLToPath(new URL('../dist/index.js', import.meta.url))
    const child = Bun.spawn(
      [
        process.execPath,
        executable,
        'create',
        target,
        '--components',
        'line-chart,pie-chart',
        '--registry',
        registry,
        '--no-install',
      ],
      { stdout: 'pipe', stderr: 'pipe' },
    )
    const [status, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()])
    expect(status, stderr).toBe(0)
    expect(await read(resolve(target, 'src/components/ui/line-chart.tsx'))).toBeDefined()
    expect(await read(resolve(target, 'src/components/ui/pie-chart.tsx'))).toBeDefined()
    expect(await read(resolve(target, 'vite.config.ts'))).toContain('tailwindcss()')
    expect(await read(resolve(target, '.gitignore'))).toContain('node_modules')
  })
})
