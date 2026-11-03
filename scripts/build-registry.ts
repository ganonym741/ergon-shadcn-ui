import { readdir, readFile, mkdir, unlink } from 'node:fs/promises'
import { writeGeneratedFile as writeFile } from './write-generated-file'
import { resolve, relative, basename } from 'node:path'
import ts from 'typescript'
import { components } from '../src/catalog'
import { coverage } from '../src/coverage'
const root = resolve(import.meta.dir, '..'),
  output = resolve(root, 'public/r')
await mkdir(resolve(root, 'public/api'), { recursive: true })
await mkdir(output, { recursive: true })
const validNames = new Set([...components.map((c) => c.id), 'theme'])
for (const directory of [output, resolve(root, 'public/api')]) {
  for (const file of await readdir(directory)) {
    if (file.endsWith('.json') && !validNames.has(file.slice(0, -5)))
      await unlink(resolve(directory, file))
  }
}
const cache = new Map<string, string>()
async function read(path: string) {
  if (!cache.has(path)) cache.set(path, await readFile(path, 'utf8'))
  return cache.get(path)!
}
const extra: Record<string, string[]> = {
  select: ['combobox'],
  input: ['textarea'],
  drawer: ['sheet'],
  form: ['form-plus'],
  calendar: ['event-calendar'],
  upload: ['image-crop-upload'],
}
const filePath = (name: string) =>
  resolve(root, `src/components/ui/${name}.${name === 'util' ? 'ts' : 'tsx'}`)
async function collect(path: string, files = new Map<string, string>(), deps = new Set<string>()) {
  if (files.has(path)) return { files, deps }
  const content = await read(path)
  files.set(path, content)
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true)
  const imports = source.statements.flatMap((statement) =>
    (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
    statement.moduleSpecifier &&
    ts.isStringLiteral(statement.moduleSpecifier)
      ? [statement.moduleSpecifier.text]
      : [],
  )
  function collectDynamicImports(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      imports.push(node.arguments[0].text)
    ts.forEachChild(node, collectDynamicImports)
  }
  collectDynamicImports(source)
  for (const importPath of imports) {
    if (importPath.startsWith('@/')) {
      const local = resolve(root, 'src', importPath.slice(2))
      let found = false
      for (const ext of ['.tsx', '.ts']) {
        try {
          await read(local + ext)
          await collect(local + ext, files, deps)
          found = true
          break
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
        }
      }
      if (!found) throw new Error(`Missing ${importPath} in ${path}`)
    } else if (!importPath.startsWith('.')) {
      const name = importPath.startsWith('@')
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0]
      if (!['react', 'react-dom'].includes(name)) {
        const installed = JSON.parse(
          await readFile(resolve(root, 'node_modules', name, 'package.json'), 'utf8'),
        )
        deps.add(`${name}@${installed.version}`)
      }
    }
  }
  return { files, deps }
}
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
const configFile = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile)
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root)
const program = ts.createProgram(
  parsedConfig.fileNames.filter(
    (name) => name.includes('/components/ui/') || name.includes('\\components\\ui\\'),
  ),
  parsedConfig.options,
)
const checker = program.getTypeChecker()
function portableType(type: string) {
  return type.replace(/import\("([^"]+)"\)/g, (expression, path: string) => {
    const normalized = path.replaceAll('\\', '/')
    const dependency = normalized.split('/node_modules/').at(-1)
    if (dependency !== normalized && dependency) {
      const name = dependency.startsWith('@types/')
        ? dependency.slice('@types/'.length).replace(/\/index$/, '')
        : dependency
      return `import("${name}")`
    }
    const source = `${root.replaceAll('\\', '/')}/src/`
    return normalized.startsWith(source)
      ? `import("@/${normalized.slice(source.length)}")`
      : expression
  })
}
function getAPI(content: string, path: string) {
  const file =
    program.getSourceFile(path) ??
    ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const types: string[] = []
  const exports: string[] = []
  for (const statement of file.statements) {
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      types.push(printer.printNode(ts.EmitHint.Unspecified, statement, file))
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      exports.push(statement.name.text)
      if (!statement.parameters[0]?.type) continue
      const signature = checker.getSignatureFromDeclaration(statement)
      const returnType = signature
        ? checker.typeToString(
            checker.getReturnTypeOfSignature(signature),
            statement,
            ts.TypeFormatFlags.NoTruncation,
          )
        : 'unknown'
      types.push(
        `export function ${statement.name.text}${statement.typeParameters ? `<${statement.typeParameters.map((t) => t.getText(file)).join(', ')}>` : ''}(${statement.parameters.map((p) => p.getText(file)).join(', ')}): ${portableType(returnType)}`,
      )
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const e of statement.exportClause.elements) exports.push(e.name.text)
    }
  }
  return { exports: [...new Set(exports)], types }
}
const license = await readFile(resolve(root, 'LICENSES/shadcn-ui.txt'), 'utf8')
const ergonLicense = await readFile(resolve(root, 'LICENSE'), 'utf8')
const items = []
const metadata: Record<string, any> = {}
for (const component of components) {
  const main = filePath(component.id)
  const { files, deps } = await collect(main)
  for (const name of extra[component.id] ?? []) await collect(filePath(name), files, deps)
  const entry = {
    name: component.id,
    type: 'registry:ui',
    title: component.name,
    description: component.description,
    dependencies: [...deps].sort(),
    files: [
      ...[...files].map(([path, content]) => ({
        path: relative(root, path).replaceAll('\\', '/'),
        type: path.includes(`${resolve(root, 'src/lib')}`) ? 'registry:lib' : 'registry:ui',
        content,
      })),
      {
        path: 'LICENSES/shadcn-ui.txt',
        type: 'registry:file',
        target: '~/LICENSES/shadcn-ui.txt',
        content: license,
      },
      {
        path: 'LICENSES/ergonui.txt',
        type: 'registry:file',
        target: '~/LICENSES/ergonui.txt',
        content: ergonLicense,
      },
    ],
  }
  const sourceEntry = { ...entry, files: entry.files.map(({ content: _content, ...f }) => f) }
  items.push(sourceEntry)
  await writeFile(
    resolve(output, `${component.id}.json`),
    JSON.stringify(
      { $schema: 'https://ui.shadcn.com/schema/registry-item.json', ...entry },
      null,
      2,
    ),
  )
  const apis = [...files]
    .filter(([p]) => !p.includes('utils.ts'))
    .map(([p, c]) => ({ file: basename(p), ...getAPI(c, p) }))
  metadata[component.id] = {
    files: [...files.keys()].map((p) => relative(root, p).replaceAll('\\', '/')),
    dependencies: [...deps],
    api: apis,
    source: await read(main),
  }
  await writeFile(
    resolve(root, `public/api/${component.id}.json`),
    JSON.stringify(metadata[component.id]),
  )
}
const cssVars = {
  light: {
    background: '#ffffff',
    foreground: '#262725',
    card: '#ffffff',
    'card-foreground': '#262725',
    popover: '#ffffff',
    'popover-foreground': '#262725',
    primary: '#b93e28',
    'primary-foreground': '#ffffff',
    secondary: '#f3f2ef',
    'secondary-foreground': '#444740',
    muted: '#f5f4f1',
    'muted-foreground': '#62695e',
    accent: '#f2f1ee',
    'accent-foreground': '#262725',
    destructive: '#c93434',
    border: '#e9e9e3',
    input: '#e1e2db',
    ring: '#b93e28',
    radius: '0.625rem',
  },
  dark: {
    background: '#1b1d1c',
    foreground: '#eeeeea',
    card: '#202321',
    'card-foreground': '#eeeeea',
    popover: '#242724',
    'popover-foreground': '#eeeeea',
    primary: '#f17c5e',
    'primary-foreground': '#171917',
    secondary: '#292d28',
    'secondary-foreground': '#e0e3dc',
    muted: '#272b27',
    'muted-foreground': '#a2a79e',
    accent: '#30362e',
    'accent-foreground': '#eeeeea',
    destructive: '#f47777',
    border: '#343a32',
    input: '#3d453b',
    ring: '#f17c5e',
  },
}
const theme = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'theme',
  type: 'registry:theme',
  title: 'ErgonUI theme',
  cssVars,
}
await writeFile(resolve(output, 'theme.json'), JSON.stringify(theme, null, 2))
const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'ergonui',
  homepage: process.env.REGISTRY_URL ?? 'http://localhost:5173',
  items: [...items, theme],
}
await writeFile(resolve(root, 'registry.json'), JSON.stringify(registry, null, 2))
await writeFile(resolve(root, 'public/registry.json'), JSON.stringify(registry, null, 2))
await mkdir(resolve(root, 'src/generated'), { recursive: true })
await writeFile(resolve(root, 'src/generated/metadata.json'), JSON.stringify(metadata))
await writeFile(
  resolve(root, 'public/llms.txt'),
  '# ErgonUI\nReact components built on shadcn/ui component source and community work, including copied/adapted MIT-licensed components alongside original ErgonUI components.\n\n' +
    components.map((c) => '- ' + c.name + ': /r/' + c.id + '.json — ' + c.description).join('\n') +
    '\n',
)
await mkdir(resolve(root, 'docs'), { recursive: true })
await writeFile(
  resolve(root, 'docs/COVERAGE.md'),
  '# ErgonUI capabilities\n\nEach component provides editable source, typed APIs, and an interactive playground. This document is generated from src/coverage.ts.\n\n' +
    [...new Set(components.map((c) => c.category))]
      .map(
        (category) =>
          '## ' +
          category +
          '\n\n| Component | Capabilities | Verification / integration notes |\n| --- | --- | --- |\n' +
          components
            .filter((c) => c.category === category)
            .map(
              (c) =>
                '| ' +
                c.name +
                ' | ' +
                coverage[c.id].implemented.join('; ') +
                ' | ' +
                (coverage[c.id].notes.join('; ') || 'Playground and source available.') +
                ' |',
            )
            .join('\n'),
      )
      .join('\n\n') +
    '\n',
)
console.log('Generated ' + components.length + ' ErgonUI registry entries and API documentation.')
