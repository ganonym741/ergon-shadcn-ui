import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { json, read, setJSON, type Change } from './files'

const spawn: typeof import('cross-spawn') = createRequire(import.meta.url)('cross-spawn')
const yaml: typeof import('yaml') = createRequire(import.meta.url)('yaml')

export const packageManagers = ['npm', 'bun', 'deno', 'pnpm', 'yarn'] as const
export type PackageManager = (typeof packageManagers)[number]

export async function selectPackageManager(
  root: string,
  explicit?: string,
): Promise<PackageManager> {
  if (explicit) {
    if (!packageManagers.includes(explicit as PackageManager))
      throw new Error(`Unknown package manager: ${explicit}. Choose ${packageManagers.join(', ')}.`)
    return explicit as PackageManager
  }
  const manifest = await read(resolve(root, 'package.json'))
  const saved = manifest && json(manifest, 'package.json').packageManager?.split('@')[0]
  if (packageManagers.includes(saved)) return saved
  const found: PackageManager[] = []
  for (const [manager, locks] of [
    ['npm', ['package-lock.json', 'npm-shrinkwrap.json']],
    ['bun', ['bun.lock', 'bun.lockb']],
    ['deno', ['deno.lock', 'deno.json', 'deno.jsonc']],
    ['pnpm', ['pnpm-lock.yaml']],
    ['yarn', ['yarn.lock']],
  ] as [PackageManager, string[]][]) {
    for (const lock of locks)
      if ((await read(resolve(root, lock))) !== undefined) {
        found.push(manager)
        break
      }
  }
  if (found.length > 1)
    throw new Error(
      `Multiple package managers found (${found.join(', ')}). Select one with --package-manager.`,
    )
  if (found[0]) return found[0]
  const agent = process.env.npm_config_user_agent?.split('/')[0]
  if (packageManagers.includes(agent as PackageManager)) return agent as PackageManager
  if (typeof (globalThis as { Deno?: unknown }).Deno !== 'undefined') return 'deno'
  return 'npm'
}

export function taskCommand(manager: PackageManager, task: string) {
  return `${manager} ${manager === 'deno' ? 'task' : 'run'} ${task}`
}

/**
 * Installs the planned dependency changes with the selected package manager. Allows its lockfile to update in CI and reuses the active Deno executable when necessary.
 */
export function installDependencies(root: string, manager: PackageManager) {
  // This operation intentionally changed package.json, so its lockfile must be updated too.
  const args = manager === 'pnpm' ? ['install', '--no-frozen-lockfile'] : ['install']
  const deno = (globalThis as { Deno?: { execPath?: () => string } }).Deno
  // Reuse the running Deno binary; Windows command lookup can miss it under deno x.
  const executable = manager === 'deno' && deno?.execPath ? deno.execPath() : manager
  console.log(`${manager} ${args.join(' ')}`)
  const result = spawn.sync(executable, args, {
    cwd: root,
    stdio: 'inherit',
    env:
      manager === 'yarn'
        ? { ...process.env, YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' }
        : process.env,
  })
  if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT')
    throw new Error(
      `${manager} is not installed or is not on PATH. Install it, then run ${manager} install in the application.`,
    )
  if (result.error) throw result.error
  if (result.status !== 0)
    throw new Error(
      `${manager} install failed. Dependencies are recorded in package.json; fix the reported error and retry.`,
    )
}

export async function managerConfiguration(
  root: string,
  manager: PackageManager,
): Promise<Change[]> {
  if (manager === 'yarn') {
    const before = await read(resolve(root, '.yarnrc.yml'))
    const document = yaml.parseDocument(before ?? '')
    if (document.errors.length || (document.contents && !yaml.isMap(document.contents)))
      throw new Error('Invalid .yarnrc.yml. Existing configuration was preserved.')
    const linker = document.get('nodeLinker')
    if (linker !== undefined && linker !== 'node-modules')
      throw new Error(
        'The Vite/TypeScript scaffold requires Yarn node-modules linking. Existing PnP or alternative linker configuration was preserved; use manual setup.',
      )
    if (linker === 'node-modules') return []
    if ((await read(resolve(root, '.pnp.cjs'))) !== undefined)
      throw new Error(
        'Existing Yarn PnP configuration was preserved. Configure node-modules linking or use manual setup.',
      )
    document.set('nodeLinker', 'node-modules')
    return [
      {
        path: '.yarnrc.yml',
        content: document.toString(),
        replace: true,
      },
    ]
  }
  if (manager !== 'deno') return []
  const strict = await read(resolve(root, 'deno.json'))
  const commented = strict === undefined ? await read(resolve(root, 'deno.jsonc')) : undefined
  const path = strict !== undefined || commented === undefined ? 'deno.json' : 'deno.jsonc'
  const before = strict ?? commented ?? '{}\n'
  const config = json(before, path)
  if (config.nodeModulesDir === 'none' || config.nodeModulesDir === false)
    throw new Error(
      'Deno nodeModulesDir must allow local npm dependencies for the Vite scaffold. Use auto or manual.',
    )
  return config.nodeModulesDir !== undefined
    ? []
    : [{ path, content: setJSON(before, ['nodeModulesDir'], 'auto'), replace: true }]
}
