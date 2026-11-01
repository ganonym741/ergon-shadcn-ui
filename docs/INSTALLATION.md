# Install ErgonUI in your application

## Quick start with the ErgonUI CLI

The CLI is implemented and tested locally. **Its first npm publication is pending**: the following `bunx @ergonui/cli` commands become publicly available after release. See [publishing](PUBLISHING.md) for the maintainer steps; the manual path below remains available before publication.

```sh
bunx @ergonui/cli create my-app --components line-chart,pie-chart
cd my-app
bun run dev
```

This creates a complete Bun/Vite/React 19/TypeScript application with Tailwind 4, aliases, semantic theme bindings, animation utilities and selected component source. You do not need an ErgonUI clone. Import your selected charts using the [chart guide](CHARTS.md), then run `bun run build` to verify your application.

For an existing Vite + React 19 TypeScript application:

```sh
bunx @ergonui/cli init
bunx @ergonui/cli add button table-plus
```

Initialization preserves existing settings/CSS and fills missing configuration. It supports the standard TypeScript Vite entry and `@/*` source aliases; unsupported configurations fail before writing. Existing starter CSS is preserved too: remove Vite's starter styling if it interferes with your component styling. Additional installs reuse `components.json`. Preview changes with `--dry-run`; explicitly pass `--overwrite` only when you intend to replace differing source. To replace existing theme values, explicitly select `theme` with `--overwrite`.

The default registry is the public Netlify site. To test unreleased source, append `--registry http://localhost:5174` (substitute the printed local documentation origin). `create` and `init` save that origin for later `add` calls. This development override is not needed for normal public installation.

<details>
<summary>Manual setup using the published shadcn CLI</summary>

You do not need an ErgonUI clone. The published **shadcn** CLI runs through `bunx`, fetches selected source files from the hosted registry, and installs their npm dependencies into your application. There is currently no published first-party ErgonUI CLI. The repository's Development instructions are for contributing to the documentation and component library.

This guide targets Bun, Vite, React 19, TypeScript, and Tailwind CSS 4. Install Bun and a Node.js version supported by Vite before starting. The setup was checked with Bun 1.4.4, Vite 8.3.5, and TypeScript 7.0.2.

## 1. Create an application

```sh
bun create vite my-app --template react-ts
cd my-app
bun install
bun add -d tailwindcss @tailwindcss/vite @types/node
```

For an existing Vite + React application, skip scaffolding and merge the missing setup into your project. Run subsequent commands from the application directory.

## 2. Configure Vite and both TypeScript aliases

Replace a fresh project's `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

Merge the following into **both** `tsconfig.json` and `tsconfig.app.json`. Preserve their existing options, includes, and references; this is an excerpt, not a replacement file:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

The root configuration lets the installer detect the alias; the app configuration lets TypeScript resolve imports. No `baseUrl` is needed. Keep your existing strict and unused-code checks.

## 3. Prepare the stylesheet

For a fresh project, replace `src/index.css` with:

```css
@import 'tailwindcss';
```

Keep `import './index.css'` in `src/main.tsx`. The App replacement below removes the starter `App.css` import. Vite's starter `body`, `button`, and `#root` rules can interfere with component styling. In an existing application, preserve your stylesheet and merge the Tailwind import.

## 4. Initialize once

```sh
bunx --bun shadcn@latest init --base radix --template vite --defaults --yes
```

This creates `components.json`, utilities, and semantic CSS bindings with the Radix base used by ErgonUI. It may add a starter Button and dependencies such as the `shadcn` CSS package and `tw-animate-css`. Keep the generated CSS imports, dark variant, and `@theme` bindings. **Do not replace the stylesheet with the one-line example after initialization.**

If `components.json` already exists, skip initialization and verify its aliases and stylesheet path. Avoid forcing a fresh configuration over a customized project.

## 5. Install the theme and Button

For the fresh application:

```sh
bunx --bun shadcn@latest add --yes --overwrite https://ergonui.netlify.app/r/theme.json https://ergonui.netlify.app/r/button.json
```

`--overwrite` replaces the initializer's Button and shared utility with the ErgonUI versions. The theme applies ErgonUI's light/dark tokens. For an existing application, inspect changes first and omit `--overwrite` to review file conflicts:

```sh
bunx --bun shadcn@latest add --dry-run --diff https://ergonui.netlify.app/r/button.json
```

Omit `theme.json` to keep your current semantic tokens. Retain `LICENSES/shadcn-ui.txt` and `LICENSES/ergonui.txt` installed alongside the source. ErgonUI includes copied/adapted shadcn/ui MIT-licensed source and original work; see [attribution](../THIRD-PARTY-NOTICES.md).

## 6. Use and verify

Replace `src/App.tsx` with:

```tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold">ErgonUI is ready</h1>
      <Button onClick={() => setCount(count + 1)}>Clicked {count} times</Button>
    </main>
  )
}
```

```sh
bun run build
bun run dev
```

Open Vite's printed URL and click the Button. Your application uses its own editable source; it does not fetch component code from ErgonUI at runtime.

## Add more components

```sh
bunx --bun shadcn@latest add https://ergonui.netlify.app/r/table-plus.json
```

Each entry includes its own transitive source imports and tested npm dependency versions. A composition can import additional catalog components: install those entries too. Component-page commands include the additional entries used by their displayed examples. For example, a Tooltip composition with a Button needs both:

```sh
bunx --bun shadcn@latest add https://ergonui.netlify.app/r/tooltip.json https://ergonui.netlify.app/r/button.json
```

Usage fragments belong inside your React component. Supply their referenced state, callbacks, data, and assets. Hooks belong inside components or custom hooks. Requests such as `/api/projects` and `/api/images` are integration examples: implement those endpoints or replace the callbacks with your own service. No production data or storage service is included.

## Optional application provider

Button does not require an application provider. Install this entry when you want theme switching, shared configuration, tooltip defaults, and scoped message/confirmation services:

```sh
bunx --bun shadcn@latest add https://ergonui.netlify.app/r/app.json
```

Then replace `src/App.tsx` with:

```tsx
import { AppProvider } from '@/components/ui/app'
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <AppProvider density="comfortable" direction="ltr" locale="en-US">
      <main className="p-8">
        <Button>Ready to build</Button>
      </main>
    </AppProvider>
  )
}
```

`AppProvider` includes a global toast host and a scoped message host. Use `useApp().message` and `useApp().confirm` inside it for scoped services. Avoid adding another global MessageProvider/NotificationProvider when AppProvider already provides that host. `useMessage()` creates a separate scope and returns an API and a holder that must be rendered.

`ConfigProvider` alone scopes appearance, density, direction and locale; it does not switch light/dark appearance. Install `/r/config-provider.json` when using it independently. The `theme-provider` helper installed with AppProvider exports `ThemeProvider` and `useTheme`; `setTheme` accepts `light`, `dark`, or `system`. Providers do not translate your application's own labels.

## Styling and animations

Keep the initializer's `@theme inline` mappings such as `--color-primary: var(--primary)`. Override values in `:root` and `.dark`; hex colors are supported directly:

```css
:root {
  --primary: #b93e28;
  --primary-foreground: #ffffff;
  --radius: 0.625rem;
}

.dark {
  --primary: #f17c5e;
  --primary-foreground: #171917;
}
```

Keep one `@import 'tw-animate-css';` and the installed `tw-animate-css` package for entrance/exit utilities. If your existing setup lacks it, run `bun add tw-animate-css` and add that import. Outside the documentation playground, motion can respect the user's reduced-motion preference. Do not copy the documentation's global stylesheet into your application.

## Registry origins and manual installation

These commands use the public Netlify registry. The web handbook uses the origin it is served from, so local/preview documentation points to that deployment's registry. For unreleased work, substitute the running local documentation origin. A component is available publicly only after its source is pushed, built, and deployed; a missing entry returns 404.

Manual installation requires every file from the component's Source selector, its listed npm dependencies, license notices, and the same alias/theme configuration. Copying only the primary TSX file can omit required helpers.

For charts, follow the [modular chart guide](CHARTS.md). For the hosted handbook, see [installation](https://ergonui.netlify.app/#/docs/installation) and [theming](https://ergonui.netlify.app/#/docs/theming).

The setup follows the official [Vite integration](https://ui.shadcn.com/docs/installation/vite), [CLI reference](https://ui.shadcn.com/docs/cli), and [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite). The TypeScript aliases here avoid the `baseUrl` option removed in TypeScript 7.

</details>
