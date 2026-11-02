# Installation

ErgonUI components use **React 19 and Tailwind CSS 4**, independently of your package manager. The CLI creates a Vite application; other React frameworks need manual setup. Browser-dependent parts need client-only rendering in SSR applications.

These commands require CLI **0.2 or later**.

## Create an application

| Package manager | Command                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| npm             | `npx @ergonui/cli create my-app --components line-chart,pie-chart`      |
| Bun             | `bunx @ergonui/cli create my-app --components line-chart,pie-chart`     |
| Deno            | `dx @ergonui/cli create my-app --components line-chart,pie-chart`       |
| pnpm            | `pnpm dlx @ergonui/cli create my-app --components line-chart,pie-chart` |
| Yarn            | `yarn dlx @ergonui/cli create my-app --components line-chart,pie-chart` |

Run `cd my-app`, then your manager's development command:

| npm           | Bun           | Deno            | pnpm           | Yarn           |
| ------------- | ------------- | --------------- | -------------- | -------------- |
| `npm run dev` | `bun run dev` | `deno task dev` | `pnpm run dev` | `yarn run dev` |

The scaffold configures aliases, Tailwind, theme tokens, and selected source in `src/components/ui`. npm, pnpm and Yarn use a supported Node.js version. With Deno 2.6+, install the `dx` alias once using `deno x --install-alias`; `deno x @ergonui/cli ...` is also available without an alias. Yarn 2+ is supported; the scaffold uses node-modules linking.

## Existing applications

Run the command matching your manager inside a Vite + React 19 TypeScript application:

| Package manager | Command                      |
| --------------- | ---------------------------- |
| npm             | `npx @ergonui/cli init`      |
| Bun             | `bunx @ergonui/cli init`     |
| Deno            | `dx @ergonui/cli init`       |
| pnpm            | `pnpm dlx @ergonui/cli init` |
| Yarn            | `yarn dlx @ergonui/cli init` |

Use the same runner with `add button table-plus` to install more components. The CLI detects the project's package manager from its declared manager or lockfile, then from the runner. `--package-manager` is only needed to override detection or resolve ambiguous lockfiles. Existing CSS is preserved. For other framework setups, see [manual installation](MANUAL-INSTALLATION.md).

## Use a component

After installing Line Chart, replace `src/App.tsx` with:

```tsx
import { LineChart } from '@/components/ui/line-chart'

export default function App() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <LineChart
        label="Monthly revenue"
        data={[
          { id: 'jan', label: 'Jan', revenue: 42 },
          { id: 'feb', label: 'Feb', revenue: 58 },
        ]}
        series={[{ key: 'revenue', label: 'Revenue' }]}
      />
    </main>
  )
}
```

Verify with your manager's build command (for example, `npm run build`). Component pages include installation commands and usage examples. Supply the state, data, callbacks, and services referenced by composition snippets.

## Updates and customization

```sh
npx @ergonui/cli add button --dry-run
npx @ergonui/cli add button --overwrite
```

The CLI preserves differing source files unless you pass `--overwrite`. Keep the generated Tailwind bindings and animation imports. Existing Vite starter styles may need removing if they override component styles. Retain the installed license notices when adapting source.

## Application provider

Install AppProvider for shared theme, density, locale, direction, tooltips, and message/confirmation services:

```sh
npx @ergonui/cli add app button
```

```tsx
import { AppProvider } from '@/components/ui/app'
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <AppProvider density="comfortable" locale="en-US">
      <main className="p-8">
        <Button>Ready to build</Button>
      </main>
    </AppProvider>
  )
}
```

Button works without a provider. AppProvider includes toast hosts; use `useApp()` inside it for scoped message and confirmation APIs. Add separate toast hosts only for separate scopes.

For custom registries and other flags, see [CLI options](../packages/cli/README.md). For theme tokens and scoped appearance, see [theming](https://ergonui.netlify.app/#/docs/theming).
