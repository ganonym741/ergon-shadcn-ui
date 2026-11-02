import { components } from '@/catalog'

export const packageManagerLabels = {
  npm: 'npm',
  bun: 'Bun',
  deno: 'Deno',
  pnpm: 'pnpm',
  yarn: 'Yarn',
}
export type DocsPackageManager = keyof typeof packageManagerLabels
const runners: Record<DocsPackageManager, string> = {
  npm: 'npx @ergonui/cli',
  bun: 'bunx @ergonui/cli',
  deno: 'dx @ergonui/cli',
  pnpm: 'pnpm dlx @ergonui/cli',
  yarn: 'yarn dlx @ergonui/cli',
}
export function cliCommand(manager: DocsPackageManager, action: string) {
  return `${runners[manager]} ${action}`
}
export function taskCommand(manager: DocsPackageManager, task: string) {
  return `${manager} ${manager === 'deno' ? 'task' : 'run'} ${task}`
}
export function quickCreateCommand(manager: DocsPackageManager) {
  return `${cliCommand(manager, 'create my-app --components line-chart,pie-chart')}\ncd my-app\n${taskCommand(manager, 'dev')}`
}

export const installationSnippets = {
  chartApp: `import { LineChart } from '@/components/ui/line-chart'

export default function App() {
  return <main className="mx-auto max-w-3xl p-8">
    <LineChart label="Monthly revenue"
      data={[{ id: 'jan', label: 'Jan', revenue: 42 }, { id: 'feb', label: 'Feb', revenue: 58 }]}
      series={[{ key: 'revenue', label: 'Revenue' }]} />
  </main>
}`,
  buttonApp: `import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">ErgonUI is ready</h1>
      <Button onClick={() => setCount(count + 1)}>Clicked {count} times</Button>
    </main>
  )
}`,
  providerApp: `import { AppProvider } from '@/components/ui/app'
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <AppProvider density="comfortable" direction="ltr" locale="en-US">
      <main className="p-8"><Button>Ready to build</Button></main>
    </AppProvider>
  )
}`,
  configApp: `import { ConfigProvider } from '@/components/ui/config-provider'
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <ConfigProvider accent="#4f8a6c" radius={12} density="compact" direction="ltr" locale="en-US">
      <main className="p-8"><Button>Scoped appearance</Button></main>
    </ConfigProvider>
  )
}`,
}

// Examples can compose additional catalog entries beyond the component being viewed.
// Non-catalog helpers (e.g. Textarea) are already bundled in their owning entry.
export function usageInstallIds(id: string, example = '') {
  const ids = new Set([id])
  for (const [, name] of example.matchAll(/from\s*['"]@\/components\/ui\/([^'"]+)['"]/g)) {
    if (components.some((component) => component.id === name)) ids.add(name)
  }
  return [...ids]
}

export function ergonInstallCommand(
  ids: string[],
  options = '',
  manager: DocsPackageManager = 'npm',
) {
  return cliCommand(manager, `add${options ? ` ${options}` : ''} ${ids.join(' ')}`)
}
