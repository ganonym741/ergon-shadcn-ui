import { readdir, realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { basename, resolve } from 'node:path'
import { apply, destination, json, read, setJSON, type Change } from './files'
import {
  configure,
  DEFAULT_REGISTRY,
  registryOrigin,
  stylesheet,
  tooling,
  type Setup,
} from './config'
import {
  selectPackageManager,
  managerConfiguration,
  installDependencies,
  taskCommand,
} from './package-manager'

export interface Options {
  packageManager?: string
  cwd?: string
  registry?: string
  components?: string[]
  overwrite?: boolean
  dryRun?: boolean
  install?: boolean
  keepTheme?: boolean
}
interface RegistryFile {
  path: string
  content: string
}
interface Item {
  name: string
  type: 'registry:ui' | 'registry:theme'
  dependencies?: string[]
  files?: RegistryFile[]
  cssVars?: Record<string, Record<string, string>>
}
export function componentNames(names: string[]) {
  return [
    ...new Set(
      names
        .flatMap((name) => name.split(','))
        .filter(Boolean)
        .map((name) => {
          const normalized = name.toLowerCase().replace(/\+$/, '-plus')
          if (!/^[a-z][a-z0-9-]*$/.test(normalized))
            throw new Error(`Invalid component name: ${name}`)
          return normalized
        }),
    ),
  ]
}

export async function registryItem(origin: string, name: string): Promise<Item> {
  const url = `${registryOrigin(origin)}/r/${name}.json`
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!response.ok)
    throw new Error(
      `Registry returned ${response.status} for ${name}: ${url}. Check that this component is deployed.`,
    )
  let item: Item
  try {
    item = (await response.json()) as Item
  } catch {
    throw new Error(`Registry did not return JSON for ${name}: ${url}`)
  }
  if (item.name !== name || !['registry:ui', 'registry:theme'].includes(item.type))
    throw new Error(`Invalid registry entry: ${name}`)
  if (item.type === 'registry:ui' && (!Array.isArray(item.files) || !item.files.length))
    throw new Error(`Registry source is missing for ${name}`)
  if (item.type === 'registry:theme' && (!item.cssVars?.light || !item.cssVars?.dark))
    throw new Error(`Theme tokens are missing for ${name}`)
  for (const dependency of item.dependencies ?? []) {
    if (
      typeof dependency !== 'string' ||
      !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*@\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(
        dependency,
      )
    )
      throw new Error(`Registry dependency must be a pinned npm version: ${dependency}`)
  }
  return item
}

export function sourceFile(file: RegistryFile, setup: Setup): Change {
  if (
    typeof file.path !== 'string' ||
    typeof file.content !== 'string' ||
    file.path.includes('\\') ||
    file.path.split('/').some((p) => p === '..' || p === '.' || !p)
  )
    throw new Error('Invalid registry source file')
  const { source, aliases } = setup
  let path: string
  if (/^src\/components\/ui\/[a-zA-Z0-9-]+\.tsx?$/.test(file.path))
    path = `${source}/${aliases.ui.slice(2)}/${file.path.split('/').at(-1)}`
  else if (file.path === 'src/lib/utils.ts') path = `${source}/${aliases.utils.slice(2)}.ts`
  else if (/^src\/lib\/[a-zA-Z0-9-]+\.tsx?$/.test(file.path))
    path = `${source}/${aliases.lib.slice(2)}/${file.path.split('/').at(-1)}`
  else if (/^LICENSES\/[a-zA-Z0-9._-]+$/.test(file.path)) path = file.path
  else throw new Error(`Unsupported registry destination: ${file.path}`)
  const content = file.path.startsWith('src/')
    ? file.content
        .replace(/(['"])@\/components\/ui\//g, `$1${aliases.ui}/`)
        .replace(/(['"])@\/lib\/utils(['"])/g, `$1${aliases.utils}$2`)
        .replace(/(['"])@\/lib\//g, `$1${aliases.lib}/`)
    : file.content
  return { path, content }
}

export async function planEntries(root: string, setup: Setup, names: string[], overwrite: boolean) {
  const items = await Promise.all(names.map((name) => registryItem(setup.registry, name)))
  const changes = new Map<string, Change>()
  const dependencies = new Set<string>()
  for (const item of items) {
    for (const dependency of item.dependencies ?? []) dependencies.add(dependency)
    for (const file of item.files ?? []) {
      const change = sourceFile(file, setup)
      await destination(root, change.path)
      const key = change.path.toLowerCase()
      const previous = changes.get(key)
      if (previous && (previous.path !== change.path || previous.content !== change.content))
        throw new Error(`Registry entries disagree about ${change.path}`)
      changes.set(key, change)
    }
    if (item.cssVars) {
      const before = (await read(resolve(root, setup.css))) ?? ''
      changes.set(setup.css.toLowerCase(), {
        path: setup.css,
        content: stylesheet(before, item.cssVars, overwrite),
        replace: true,
      })
    }
  }
  const versions = new Map<string, string>()
  for (const dependency of dependencies) {
    const name = dependency.slice(0, dependency.lastIndexOf('@'))
    if (versions.has(name) && versions.get(name) !== dependency)
      throw new Error(`Registry dependencies disagree on the version of ${name}`)
    versions.set(name, dependency)
  }
  return { changes: [...changes.values()], dependencies: [...dependencies] }
}

function declareDependencies(content: string, runtime: string[], dev: string[] = []) {
  for (const [section, dependencies] of [
    ['dependencies', runtime],
    ['devDependencies', dev],
  ] as const) {
    for (const dependency of dependencies) {
      const separator = dependency.lastIndexOf('@')
      const name = dependency.slice(0, separator)
      content = setJSON(content, [section, name], dependency.slice(separator + 1))
      const other = section === 'dependencies' ? 'devDependencies' : 'dependencies'
      if (json(content, 'package.json')[other]?.[name] !== undefined)
        content = setJSON(content, [other, name], undefined)
    }
  }
  return content
}

async function add(root: string, options: Options, initialize: boolean) {
  const manager = await selectPackageManager(root, options.packageManager)
  const managerChanges = await managerConfiguration(root, manager)
  const setup = await configure(root, options.registry, initialize)
  const names = componentNames(options.components ?? [])
  const includeTheme = names.includes('theme') || initialize
  const entries = await planEntries(
    root,
    setup,
    [...new Set([...names, ...(includeTheme ? ['theme'] : [])])],
    !!options.overwrite && names.includes('theme') && !options.keepTheme,
  )
  const deps = [
    ...new Set([...entries.dependencies, ...(initialize ? ['tw-animate-css@1.4.0'] : [])]),
  ]
  const manifest = declareDependencies(
    (await read(resolve(root, 'package.json')))!,
    deps,
    initialize ? tooling : [],
  )
  await apply(
    root,
    [
      ...setup.changes,
      ...entries.changes,
      ...managerChanges,
      { path: 'package.json', content: manifest, replace: true },
    ],
    !!options.overwrite,
    !!options.dryRun,
  )
  if (options.dryRun)
    console.log(`Dependencies: ${[...deps, ...(initialize ? tooling : [])].join(', ') || 'none'}`)
  else if (options.install !== false) installDependencies(root, manager)
  else
    console.log(
      `Dependencies recorded in package.json. Run ${manager} install before using the components.`,
    )
  return { root, names }
}

export async function run(commandName: string, positionals: string[], options: Options = {}) {
  if (commandName === 'create') {
    if (positionals.length !== 1)
      throw new Error('Usage: ergonui create <directory> [--components line-chart,pie-chart]')
    const parent = options.cwd ?? process.cwd()
    const root = resolve(parent, positionals[0])
    const manager = await selectPackageManager(parent, options.packageManager)
    const managerChanges = await managerConfiguration(root, manager)
    if ((await read(resolve(root, 'package.json'))) !== undefined)
      throw new Error('Target already contains an application. Use init inside it.')
    try {
      await realpath(root)
      throw new Error('Create requires a new directory; existing directories are preserved.')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    const origin = registryOrigin(options.registry ?? DEFAULT_REGISTRY)
    const names = componentNames(options.components?.length ? options.components : ['button'])
    const setup: Setup = {
      changes: [],
      source: 'src',
      css: 'src/index.css',
      aliases: { ui: '@/components/ui', lib: '@/lib', utils: '@/lib/utils' },
      registry: origin,
      config: {},
    }
    const entries = await planEntries(root, setup, [...new Set(['theme', ...names])], false)
    const template = fileURLToPath(new URL('./template/', import.meta.url))
    const changes: Change[] = []
    async function walk(path = '') {
      for (const entry of await readdir(resolve(template, path), { withFileTypes: true })) {
        const name = path ? `${path}/${entry.name}` : entry.name
        if (entry.isDirectory()) await walk(name)
        else {
          let content = (await read(resolve(template, name)))!
          if (name === 'package.json') {
            const pkg = json(content, name)
            pkg.name =
              basename(root)
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-') || 'ergonui-app'
            content = JSON.stringify(pkg, null, 2) + '\n'
          }
          changes.push({ path: name === 'gitignore' ? '.gitignore' : name, content })
        }
      }
    }
    await walk()
    const configured = {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'new-york',
      rsc: false,
      tsx: true,
      tailwind: { config: '', css: setup.css, baseColor: 'neutral', cssVariables: true },
      aliases: { components: '@/components', ...setup.aliases, hooks: '@/hooks' },
      registries: { '@ergonui': `${origin}/r/{name}.json` },
    }
    changes.push({ path: 'components.json', content: JSON.stringify(configured, null, 2) + '\n' })
    const all = new Map(changes.map((change) => [change.path, change]))
    for (const change of entries.changes) all.set(change.path, change)
    for (const change of managerChanges) all.set(change.path, change)
    all.get('package.json')!.content = declareDependencies(
      all.get('package.json')!.content,
      entries.dependencies,
    )
    await apply(root, [...all.values()], false, !!options.dryRun)
    if (!options.dryRun && options.install !== false) {
      installDependencies(root, manager)
    } else if (!options.dryRun)
      console.log(
        `Dependencies recorded in package.json. Run ${manager} install before starting the application.`,
      )
    console.log(
      `${options.dryRun ? 'Dry run: no files written.' : 'Created application.'}\n${root}\nNext: cd ${JSON.stringify(positionals[0])} and ${taskCommand(manager, 'dev')}`,
    )
    return { root, names }
  }
  if (!['init', 'add'].includes(commandName)) throw new Error(`Unknown command: ${commandName}`)
  if (commandName === 'init' && positionals.length)
    throw new Error('Pass initial components with --components, not positional arguments, to init.')
  const root = await realpath(resolve(options.cwd ?? process.cwd()))
  const components = [...(options.components ?? []), ...(commandName === 'add' ? positionals : [])]
  if (commandName === 'add' && !components.length)
    throw new Error('Usage: ergonui add <component...>')
  const result = await add(root, { ...options, components }, commandName === 'init')
  console.log(
    options.dryRun ? 'Dry run: no files or dependencies changed.' : 'ErgonUI source is ready.',
  )
  return result
}
