import { expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { managerConfiguration, selectPackageManager, taskCommand } from '../src/package-manager'

const base = fileURLToPath(new URL('../../../output/manager-tests/', import.meta.url))
await mkdir(base, { recursive: true })
test('explicit selection overrides existing lockfiles', async () => {
  const root = await mkdtemp(resolve(base, 'override-'))
  await writeFile(resolve(root, 'bun.lock'), '{}')
  expect(await selectPackageManager(root, 'npm')).toBe('npm')
  await expect(selectPackageManager(root, 'unknown')).rejects.toThrow('Unknown package manager')
})
test('detects each package manager from its lockfile', async () => {
  for (const [name, lock] of [
    ['npm', 'package-lock.json'],
    ['bun', 'bun.lock'],
    ['deno', 'deno.lock'],
    ['pnpm', 'pnpm-lock.yaml'],
    ['yarn', 'yarn.lock'],
  ] as const) {
    const root = await mkdtemp(resolve(base, 'lock-'))
    await writeFile(resolve(root, lock), '{}')
    expect(await selectPackageManager(root)).toBe(name)
  }
})
test('ambiguous lockfiles require an explicit selection', async () => {
  const root = await mkdtemp(resolve(base, 'conflict-'))
  await writeFile(resolve(root, 'bun.lock'), '{}')
  await writeFile(resolve(root, 'package-lock.json'), '{}')
  await expect(selectPackageManager(root)).rejects.toThrow('Multiple package managers')
})
test('preserves Deno config and rejects incompatible node module settings', async () => {
  const root = await mkdtemp(resolve(base, 'deno-'))
  await writeFile(
    resolve(root, 'deno.jsonc'),
    '// retained\n{"imports":{"example":"./example.ts"}}',
  )
  const [change] = await managerConfiguration(root, 'deno')
  expect(change.content).toContain('// retained')
  expect(change.content).toContain('example.ts')
  expect(change.content).toContain('"auto"')
  await writeFile(resolve(root, 'deno.jsonc'), '{"nodeModulesDir":"none"}')
  await expect(managerConfiguration(root, 'deno')).rejects.toThrow('nodeModulesDir')
})
test('uses each package manager task syntax', () => {
  expect(taskCommand('deno', 'build')).toBe('deno task build')
  expect(taskCommand('pnpm', 'dev')).toBe('pnpm run dev')
})

test('Deno config changes follow deno.json precedence over deno.jsonc', async () => {
  const root = await mkdtemp(resolve(base, 'deno-precedence-'))
  await writeFile(resolve(root, 'deno.json'), '{"tasks":{"dev":"vite"}}')
  await writeFile(resolve(root, 'deno.jsonc'), '{"nodeModulesDir":"none"}')
  const [change] = await managerConfiguration(root, 'deno')
  expect(change.path).toBe('deno.json')
  expect(change.content).toContain('"auto"')
  expect(await readFile(resolve(root, 'deno.jsonc'), 'utf8')).toBe('{"nodeModulesDir":"none"}')
})

test('Yarn YAML keys, comments, and existing settings are preserved', async () => {
  const root = await mkdtemp(resolve(base, 'yarn-yaml-'))
  await writeFile(resolve(root, '.yarnrc.yml'), '"nodeLinker" : node-modules\n')
  expect(await managerConfiguration(root, 'yarn')).toEqual([])
  await writeFile(resolve(root, '.yarnrc.yml'), '# Keep this setting\nenableScripts: false\n')
  const [change] = await managerConfiguration(root, 'yarn')
  expect(change.content).toContain('# Keep this setting')
  expect(change.content).toContain('enableScripts: false')
  expect(change.content).toContain('nodeLinker: node-modules')
  await writeFile(resolve(root, '.yarnrc.yml'), '"nodeLinker" : pnp\n')
  await expect(managerConfiguration(root, 'yarn')).rejects.toThrow('preserved')
  await writeFile(resolve(root, '.yarnrc.yml'), 'nodeLinker: [\n')
  await expect(managerConfiguration(root, 'yarn')).rejects.toThrow('Invalid .yarnrc.yml')
})

test('new Yarn projects use node modules without replacing an existing PnP configuration', async () => {
  const root = await mkdtemp(resolve(base, 'yarn-'))
  expect((await managerConfiguration(root, 'yarn'))[0].content).toBe('nodeLinker: node-modules\n')
  await writeFile(resolve(root, '.yarnrc.yml'), 'nodeLinker: pnp\n')
  await expect(managerConfiguration(root, 'yarn')).rejects.toThrow('PnP')
})
