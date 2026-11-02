import { cp, mkdir, readFile, writeFile, chmod } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))
await mkdir(resolve(root, 'dist'), { recursive: true })
const result = await Bun.build({
  entrypoints: [resolve(root, 'src/index.ts')],
  outdir: resolve(root, 'dist'),
  target: 'node',
  packages: 'external',
})
if (!result.success) throw new AggregateError(result.logs, 'CLI build failed')
const entry = resolve(root, 'dist/index.js')
const code = await readFile(entry, 'utf8')
await writeFile(entry, code.startsWith('#!') ? code : `#!/usr/bin/env node\n${code}`)
await chmod(entry, 0o755)
await cp(resolve(root, '../../templates/react-vite'), resolve(root, 'dist/template'), {
  recursive: true,
})
await cp(resolve(root, '../../LICENSE'), resolve(root, 'LICENSE'))
console.log('Built @ergonui/cli with its React/Vite template.')
