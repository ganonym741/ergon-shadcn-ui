# @ergonui/cli

Install editable React components with npm, Bun, Deno, pnpm, or Yarn. Automatic scaffolding uses Vite; the components use React 19 and Tailwind CSS 4.

## Installation

These commands require CLI **0.2 or later**.

| Package manager | Runner                  | Development command |
| --------------- | ----------------------- | ------------------- |
| npm             | `npx @ergonui/cli`      | `npm run dev`       |
| Bun             | `bunx @ergonui/cli`     | `bun run dev`       |
| Deno            | `dx @ergonui/cli`       | `deno task dev`     |
| pnpm            | `pnpm dlx @ergonui/cli` | `pnpm run dev`      |
| Yarn            | `yarn dlx @ergonui/cli` | `yarn run dev`      |

Examples below use npm; substitute your runner and development command from the table. npm/pnpm/Yarn use Node.js. For Deno 2.6+, set up `dx` once with `deno x --install-alias=dx`; Yarn's `dlx` requires Yarn 2+.

**New application:** create a project and install the selected components.

```sh
npx @ergonui/cli create my-app --components line-chart,pie-chart
cd my-app
npm run dev
```

**Existing application:** run inside your Vite + React 19 TypeScript project to initialize and install components in one step.

```sh
npx @ergonui/cli init --components line-chart,pie-chart
```

**Add more components:** after initialization, run only `add`.

```sh
npx @ergonui/cli add button table-plus
```

`init` configures aliases, Tailwind, and theme styles while preserving existing CSS. Import installed components from your local source, for example `import { LineChart } from '@/components/ui/line-chart'`. See the [installation guide](https://ergonui.netlify.app/#/docs/installation) for complete usage examples and manual framework setup.

## Options

Append options to `create`, `init`, or `add`.

| Option                 | Purpose                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `--components <names>` | Select comma-separated component names                                                       |
| `--cwd <path>`         | Set the application or parent directory                                                      |
| `--dry-run`            | Preview without writing or installing                                                        |
| `--overwrite`          | Replace differing component files; explicitly select `theme` to replace tokens               |
| `--keep-theme`         | Preserve theme values during initialization                                                  |
| `--registry <origin>`  | Use a custom registry instead of `https://ergonui.netlify.app`                               |
| `--no-install`         | Record dependencies without installing; run your package manager's install command afterward |

Use `--help` for command help. Package-manager support requires CLI 0.2+. The CLI detects the package manager automatically. Yarn scaffolds use node-modules linking; existing PnP settings are preserved and require manual setup. Deno scaffolds configure local npm modules. `add` preserves differing files unless `--overwrite` is supplied. `create` and `init` save the registry in `components.json`; a registry override on `add` applies to that invocation only.

Components and their helpers are copied into your application with pinned npm dependencies and retained licenses. Applications run the installed source independently of the registry.

## Attribution

ErgonUI builds on shadcn/ui component source and community work, including copied/adapted MIT-licensed components alongside original work. This CLI is original ErgonUI code. Retain the license notices included with installed components.

Maintainers: see [development and publishing](https://github.com/ganonym741/ergon-shadcn-ui/blob/HEAD/docs/PUBLISHING.md).
