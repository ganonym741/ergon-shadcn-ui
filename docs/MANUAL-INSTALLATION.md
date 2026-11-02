# Manual installation

Use this reference to configure Vite, React 19 and Tailwind CSS 4 by hand and install source with the shadcn CLI. For automatic setup, follow the [ErgonUI CLI guide](INSTALLATION.md). The example below uses npm and Vite. Other React frameworks can use the source with matching aliases and Tailwind tokens; browser-dependent components need client-only rendering in SSR applications. Framework integrations beyond Vite have not been verified.

## 1. Create a Vite application

```sh
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install -D tailwindcss @tailwindcss/vite @types/node
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
npx shadcn@latest init --base radix --template vite --defaults --yes
```

This creates `components.json`, utilities, and semantic CSS bindings with the Radix base used by ErgonUI. It may add a starter Button and dependencies such as the `shadcn` CSS package and `tw-animate-css`. Keep the generated CSS imports, dark variant, and `@theme` bindings. **Do not replace the stylesheet with the one-line example after initialization.**

If `components.json` already exists, skip initialization and verify its aliases and stylesheet path. Avoid forcing a fresh configuration over a customized project.

## 5. Install the theme and Button

For the fresh application:

```sh
npx shadcn@latest add --yes --overwrite https://ergonui.netlify.app/r/theme.json https://ergonui.netlify.app/r/button.json
```

`--overwrite` replaces the initializer's Button and shared utility with the ErgonUI versions. The theme applies ErgonUI's light/dark tokens. For an existing application, inspect changes first and omit `--overwrite` to review file conflicts:

```sh
npx shadcn@latest add --dry-run --diff https://ergonui.netlify.app/r/button.json
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
npm run build
npm run dev
```

Open Vite's printed URL and click the Button. Your application uses its own editable source; it does not fetch component code from ErgonUI at runtime.

## Additional components and styling

Install other entries using their registry URL. Copy every file and license notice from the Source selector if installing by hand. Keep the generated Tailwind bindings and animation imports. See [providers and customization](INSTALLATION.md#application-provider) and the [chart guide](CHARTS.md) for usage.
