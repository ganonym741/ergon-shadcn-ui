#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { run } from './engine'
import packageInfo from '../package.json'

const help = `ErgonUI CLI ${packageInfo.version} — React 19 + Tailwind 4 · automatic Vite setup

Usage:
  ergonui create my-app --components line-chart,pie-chart
  ergonui init
  ergonui add button table-plus

Options:
  --components <names>  Comma-separated component names
  --package-manager <name>  npm, bun, deno, pnpm or yarn (auto-detected)
  --cwd, -c <path>      Application/parent directory
  --registry <origin>  Override the hosted ErgonUI registry (e.g. local preview)
  --overwrite          Replace differing component files and explicitly selected theme values
  --keep-theme         On init, preserve existing tokens while filling missing bindings/tokens
  --dry-run            Preview changes without writing or installing
  --no-install         Write files without installing npm dependencies
  --help, -h           Show help
  --version, -v        Show version

Components are editable source with retained shadcn/ui and community attribution.
`

try {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      components: { type: 'string' },
      'package-manager': { type: 'string' },
      cwd: { type: 'string', short: 'c' },
      registry: { type: 'string' },
      overwrite: { type: 'boolean' },
      'keep-theme': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      'no-install': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  })
  if (values.version) console.log(packageInfo.version)
  else if (values.help || !positionals.length) console.log(help)
  else
    await run(positionals[0], positionals.slice(1), {
      cwd: values.cwd,
      registry: values.registry,
      components: values.components?.split(','),
      packageManager: values['package-manager'],
      overwrite: values.overwrite,
      dryRun: values['dry-run'],
      install: !values['no-install'],
      keepTheme: values['keep-theme'],
    })
} catch (error) {
  console.error(`ErgonUI: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
