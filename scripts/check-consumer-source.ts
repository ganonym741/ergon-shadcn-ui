import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'
import { components } from '../src/catalog'

// Compile the generated payload, with the same unused-code checks as the CLI starter.
// Dependencies resolve from the repository's node_modules; component source is copied,
// so an accidental dependency on website-only files cannot resolve through @/.
const output = resolve('output/consumer-source')
await mkdir(output, { recursive: true })
const root = await mkdtemp(resolve(output, 'check-'))
const files = new Map<string, string>()
for (const component of components) {
  const item = JSON.parse(await readFile(`public/r/${component.id}.json`, 'utf8')) as {
    files: { path: string; content: string }[]
  }
  for (const file of item.files) {
    if (!/^src\/[\w/.-]+\.tsx?$/.test(file.path) || file.path.includes('..')) continue
    const previous = files.get(file.path)
    if (previous !== undefined && previous !== file.content)
      throw new Error(`Conflicting distributed source: ${file.path}`)
    files.set(file.path, file.content)
  }
}
for (const [path, content] of files) {
  const target = resolve(root, path)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, content)
}
const program = ts.createProgram(
  [...files.keys()].map((path) => resolve(root, path)),
  {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    baseUrl: root,
    paths: { '@/*': ['src/*'] },
  },
)
const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (file) => file,
      getCurrentDirectory: () => root,
      getNewLine: () => '\n',
    }),
  )
  process.exitCode = 1
} else {
  console.log(
    `Strict consumer compilation passed for all ${components.length} registry entries (${files.size} source files).`,
  )
}
