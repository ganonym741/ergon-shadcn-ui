import type ts from 'typescript'
import { createRequire } from 'node:module'
import { dirname, posix, resolve } from 'node:path'
import { json, read, setJSON, destination, type Change } from './files'

// Keep CommonJS dependencies on the package runner's require hook, including Yarn PnP.
const compiler: typeof import('typescript') = createRequire(import.meta.url)('typescript')
const postcss: typeof import('postcss') = createRequire(import.meta.url)('postcss')

export const DEFAULT_REGISTRY = 'https://ergonui.netlify.app'
export const tooling = ['tailwindcss@4.3.3', '@tailwindcss/vite@4.3.3', '@types/node@26.6.6']
export interface Setup {
  changes: Change[]
  source: string
  css: string
  aliases: { ui: string; lib: string; utils: string }
  registry: string
  config: any
}

export function registryOrigin(value: string) {
  const url = new URL(value)
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      'Registry must be an HTTP(S) origin/base path without credentials, query or hash.',
    )
  return url.toString().replace(/\/$/, '')
}

export function viteConfiguration(content: string, source: string) {
  const file = compiler.createSourceFile(
    'vite.config.ts',
    content,
    compiler.ScriptTarget.Latest,
    true,
  )
  const exports = file.statements.filter(compiler.isExportAssignment)
  if (exports.length !== 1 || exports[0].isExportEquals)
    throw new Error(
      'Vite configuration must have one default export. Configure Tailwind and the @ alias manually before retrying.',
    )
  if (content.includes('// ErgonUI configuration adapter')) return content
  let hasAlias = false
  let hasTailwind = false
  const tailwindImports = new Set<string>()
  for (const node of file.statements) {
    if (
      compiler.isImportDeclaration(node) &&
      compiler.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === '@tailwindcss/vite' &&
      node.importClause?.name
    )
      tailwindImports.add(node.importClause.name.text)
  }
  function visit(node: ts.Node) {
    if (
      compiler.isPropertyAssignment(node) &&
      (compiler.isStringLiteral(node.name) || compiler.isIdentifier(node.name)) &&
      node.name.text === '@'
    )
      hasAlias = true
    if (
      compiler.isCallExpression(node) &&
      compiler.isIdentifier(node.expression) &&
      tailwindImports.has(node.expression.text)
    )
      hasTailwind = true
    compiler.forEachChild(node, visit)
  }
  visit(file)
  if (hasAlias && hasTailwind) return content
  if (content.includes('__ergon'))
    throw new Error(
      'Reserved __ergon identifiers already exist in Vite config; configure it manually.',
    )
  const declaration = exports[0]
  const imports = [
    "import { defineConfig as __ergonDefineConfig, mergeConfig as __ergonMergeConfig } from 'vite'",
  ]
  if (!hasTailwind) imports.push("import __ergonTailwind from '@tailwindcss/vite'")
  if (!hasAlias) imports.push("import { fileURLToPath as __ergonPath } from 'node:url'")
  const additions = [
    ...(!hasTailwind ? ['plugins: [__ergonTailwind()]'] : []),
    ...(!hasAlias
      ? [
          `resolve: { alias: { '@': __ergonPath(new URL(${JSON.stringify(`./${source}`)}, import.meta.url)) } }`,
        ]
      : []),
  ]
  const replacement = `// ErgonUI configuration adapter\nconst __ergonOriginal = ${declaration.expression.getText(file)}\nasync function __ergonResolve(__ergonConfig: import('vite').UserConfigExport, __ergonEnv: import('vite').ConfigEnv) {\n  return typeof __ergonConfig === 'function' ? await __ergonConfig(__ergonEnv) : await __ergonConfig\n}\nexport default __ergonDefineConfig(async (__ergonEnv) => __ergonMergeConfig(\n  await __ergonResolve(__ergonOriginal, __ergonEnv),\n  { ${additions.join(', ')} },\n))`
  return `${imports.join('\n')}\n${content.slice(0, declaration.getStart(file))}${replacement}${content.slice(declaration.end)}\n`
}

export async function configure(
  root: string,
  registry: string | undefined,
  initialize: boolean,
): Promise<Setup> {
  const changes: Change[] = []
  const pkgContent = await read(resolve(root, 'package.json'))
  if (!pkgContent)
    throw new Error('Run inside a Vite + React application, or use ergonui create <directory>.')
  const pkg = json(pkgContent, 'package.json')
  if (
    !pkg.dependencies?.react?.match(/(?:19|\*)/) ||
    !(pkg.devDependencies?.vite || pkg.dependencies?.vite)
  )
    throw new Error(
      'Version 1 supports Vite + React 19 applications. Keep other stacks on manual installation.',
    )
  const existing = await read(resolve(root, 'components.json'))
  if (!existing && !initialize) throw new Error('Run ergonui init before adding components.')
  const config = existing ? json(existing, 'components.json') : {}
  const configPath = config.registries?.['@ergonui']
  const savedRegistry =
    typeof configPath === 'string' && configPath.endsWith('/r/{name}.json')
      ? configPath.slice(0, -'/r/{name}.json'.length)
      : undefined
  const origin = registryOrigin(registry ?? savedRegistry ?? DEFAULT_REGISTRY)
  let source = 'src'
  const aliasesFound: string[] = []
  for (const name of ['tsconfig.json', 'tsconfig.app.json']) {
    const before = await read(resolve(root, name))
    if (!before) {
      if (name === 'tsconfig.json')
        throw new Error('A TypeScript Vite project with tsconfig.json is required.')
      continue
    }
    const current = json(before, name)
    const alias = current.compilerOptions?.paths?.['@/*']
    if (alias) {
      if (!Array.isArray(alias) || alias.length !== 1 || !alias[0].endsWith('/*'))
        throw new Error(`Unsupported @/* alias in ${name}`)
      aliasesFound.push(alias[0].replace(/^\.\//, '').slice(0, -2))
    }
  }
  if (new Set(aliasesFound).size > 1)
    throw new Error('The @/* aliases in your TypeScript configurations disagree.')
  source = aliasesFound[0] ?? source
  await destination(root, `${source}/main.tsx`)
  const aliases = {
    ui: config.aliases?.ui ?? '@/components/ui',
    lib: config.aliases?.lib ?? '@/lib',
    utils: config.aliases?.utils ?? '@/lib/utils',
  }
  for (const alias of Object.values(aliases)) {
    if (typeof alias !== 'string' || !alias.startsWith('@/'))
      throw new Error(
        'Version 1 supports aliases rooted at @/; preserve your setup using manual installation for other alias prefixes.',
      )
    await destination(root, `${source}/${alias.slice(2)}`)
  }
  let css = config.tailwind?.css as string | undefined
  const mainPath = `${source}/main.tsx`
  const main = await read(resolve(root, mainPath))
  if (initialize && !main)
    throw new Error(
      `Expected ${mainPath}. Version 1 supports the standard Vite React TypeScript entry; configure other entries manually.`,
    )
  if (!css && main) {
    const file = compiler.createSourceFile(mainPath, main, compiler.ScriptTarget.Latest, true)
    const imported = file.statements.find(
      (node) =>
        compiler.isImportDeclaration(node) &&
        compiler.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text.startsWith('.') &&
        node.moduleSpecifier.text.endsWith('.css'),
    ) as ts.ImportDeclaration | undefined
    if (imported)
      css = posix.normalize(posix.join(source, (imported.moduleSpecifier as ts.StringLiteral).text))
  }
  css ??= `${source}/index.css`
  await destination(root, css)
  if (initialize) {
    for (const name of ['tsconfig.json', 'tsconfig.app.json']) {
      const before = await read(resolve(root, name))
      if (before)
        changes.push({
          path: name,
          content: setJSON(before, ['compilerOptions', 'paths', '@/*'], [`./${source}/*`]),
          replace: true,
        })
    }
    const vitePath =
      (await read(resolve(root, 'vite.config.ts'))) !== undefined
        ? 'vite.config.ts'
        : 'vite.config.mts'
    const vite = await read(resolve(root, vitePath))
    if (!vite) throw new Error('A vite.config.ts or vite.config.mts default export is required.')
    changes.push({ path: vitePath, content: viteConfiguration(vite, source), replace: true })
    if (main && !main.includes(`./${posix.relative(source, css)}`)) {
      changes.push({
        path: mainPath,
        content: `import ${JSON.stringify(`./${posix.relative(dirname(mainPath), css)}`)}\n${main}`,
        replace: true,
      })
    }
    let updated = existing ?? '{}\n'
    const defaults = {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'new-york',
      rsc: false,
      tsx: true,
      tailwind: { config: '', css, baseColor: 'neutral', cssVariables: true },
      aliases: {
        components: '@/components',
        ui: aliases.ui,
        lib: aliases.lib,
        utils: aliases.utils,
        hooks: '@/hooks',
      },
    }
    for (const [key, value] of Object.entries(defaults)) {
      if (config[key] === undefined) updated = setJSON(updated, [key], value)
      else if (typeof value === 'object' && value !== null)
        for (const [nested, v] of Object.entries(value))
          if (config[key]?.[nested] === undefined) updated = setJSON(updated, [key, nested], v)
    }
    updated = setJSON(updated, ['registries', '@ergonui'], `${origin}/r/{name}.json`)
    changes.push({ path: 'components.json', content: updated, replace: true })
  }
  return { changes, source, css, aliases, registry: origin, config }
}

export function stylesheet(
  content: string,
  vars: Record<string, Record<string, string>>,
  overwrite: boolean,
) {
  const root = postcss.parse(content)
  for (const name of ['tailwindcss', 'tw-animate-css']) {
    let exists = false
    root.walkAtRules('import', (node) => {
      if (node.params.match(/^['"]([^'"]+)['"]/)?.[1] === name) exists = true
    })
    if (!exists) root.prepend(postcss.atRule({ name: 'import', params: JSON.stringify(name) }))
  }
  let dark = false
  root.walkAtRules('custom-variant', (node) => {
    if (node.params.startsWith('dark ')) dark = true
  })
  if (!dark) root.append(postcss.atRule({ name: 'custom-variant', params: 'dark (&:is(.dark *))' }))
  let theme: ReturnType<typeof postcss.atRule> | undefined
  root.walkAtRules('theme', (node) => {
    if (node.params === 'inline') theme = node
  })
  if (!theme) {
    theme = postcss.atRule({ name: 'theme', params: 'inline' })
    root.append(theme)
  }
  const bound = new Set<string>()
  root.walkAtRules('theme', (node) => {
    if (node.params === 'inline')
      node.walkDecls((declaration) => {
        bound.add(declaration.prop)
      })
  })
  for (const key of Object.keys(vars.light ?? {})) {
    if (key === 'radius') continue
    const prop = `--color-${key}`
    if (!bound.has(prop)) theme.append({ prop, value: `var(--${key})` })
  }
  for (const [size, value] of Object.entries({
    sm: 'calc(var(--radius) - 4px)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
    xl: 'calc(var(--radius) + 4px)',
  }))
    if (!bound.has(`--radius-${size}`)) theme.append({ prop: `--radius-${size}`, value })
  for (const [mode, values] of Object.entries(vars)) {
    if (!['light', 'dark'].includes(mode)) continue
    const selector = mode === 'light' ? ':root' : '.dark'
    let rule: ReturnType<typeof postcss.rule> | undefined
    root.each((node) => {
      if (node.type === 'rule' && node.selector === selector) rule = node
    })
    if (!rule) {
      rule = postcss.rule({ selector })
      root.append(rule)
    }
    for (const [key, value] of Object.entries(values)) {
      let exists = false
      root.walkRules(selector, (candidate) => {
        candidate.walkDecls(`--${key}`, (declaration) => {
          exists = true
          if (overwrite) declaration.value = value
        })
      })
      if (!exists) rule.append({ prop: `--${key}`, value })
    }
  }
  if (!content.includes('/* ErgonUI base styles */'))
    root.append(
      postcss.comment({ text: 'ErgonUI base styles' }),
      postcss.parse(
        '@layer base { * { @apply border-border outline-ring/50; } body { @apply bg-background text-foreground; } }',
      ),
    )
  return root.toString().trimEnd() + '\n'
}
