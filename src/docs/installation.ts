import { components } from '@/catalog'

export const installationSnippets = {
  quickCreate:
    'bunx @ergonui/cli create my-app --components line-chart,pie-chart\ncd my-app\nbun run dev',
  chartApp: `import { LineChart } from '@/components/ui/line-chart'

export default function App() {
  return <main className="mx-auto max-w-3xl p-8">
    <LineChart label="Monthly revenue"
      data={[{ id: 'jan', label: 'Jan', revenue: 42 }, { id: 'feb', label: 'Feb', revenue: 58 }]}
      series={[{ key: 'revenue', label: 'Revenue' }]} />
  </main>
}`,
  createProject:
    'bun create vite my-app --template react-ts\ncd my-app\nbun install\nbun add -d tailwindcss @tailwindcss/vite @types/node',
  vite: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})`,
  typescriptAlias: `{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}`,
  stylesheet: '@import "tailwindcss";',
  initialize: 'bunx --bun shadcn@latest init --base radix --template vite --defaults --yes',
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

export function installCommand(origin: string, ids: string[], options = '') {
  return `bunx --bun shadcn@latest add${options ? ` ${options}` : ''} ${ids.map((id) => `${origin}/r/${id}.json`).join(' ')}`
}

export function ergonInstallCommand(ids: string[], options = '') {
  return `bunx @ergonui/cli add${options ? ` ${options}` : ''} ${ids.join(' ')}`
}
