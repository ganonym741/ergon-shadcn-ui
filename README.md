# ErgonUI

Editable React components with typed, composable APIs, interactive playgrounds, and advanced data controls. Built on [shadcn/ui](https://ui.shadcn.com) component source and community work.

[Browse components](https://ergonui.netlify.app/#/components) · [Documentation](https://ergonui.netlify.app/#/docs/installation) · [CLI on npm](https://www.npmjs.com/package/@ergonui/cli)

## Get started

Components require React 19 and Tailwind CSS 4. The CLI provides automatic Vite setup; other React frameworks need manual setup and client-only rendering for browser-dependent components.

These commands require CLI **0.2 or later**.

| Package manager | Runner                  | Development command |
| --------------- | ----------------------- | ------------------- |
| npm             | `npx @ergonui/cli`      | `npm run dev`       |
| Bun             | `bunx @ergonui/cli`     | `bun run dev`       |
| Deno            | `dx @ergonui/cli`       | `deno task dev`     |
| pnpm            | `pnpm dlx @ergonui/cli` | `pnpm run dev`      |
| Yarn            | `yarn dlx @ergonui/cli` | `yarn run dev`      |

Examples below use npm; substitute your runner and development command from the table. For Deno 2.6+, set up `dx` once with `deno x --install-alias=dx`. Yarn's `dlx` requires Yarn 2+.

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

`init` configures aliases, Tailwind, and theme styles while preserving existing CSS. Import installed components from your local source, for example `import { LineChart } from '@/components/ui/line-chart'`.

Components are copied into your application for you to customize. Enhanced compositions use the **+** suffix, such as Table+ and Form+.

- [Installation and usage](docs/INSTALLATION.md)
- [Charts](docs/CHARTS.md)
- [Component capabilities](docs/COVERAGE.md)
- [CLI options](packages/cli/README.md)

## Contribute

Read the [contributor guide](CONTRIBUTING.md) for local setup, development guidelines, checks, and the review workflow. All changes to `main` require a pull request with at least **one approving review**.

## Attribution

ErgonUI includes copied and adapted MIT-licensed shadcn/ui components alongside original work. Thank you to shadcn and the community. Retained notices: [shadcn/ui license](LICENSES/shadcn-ui.txt), [third-party notices](THIRD-PARTY-NOTICES.md), and [ErgonUI license](LICENSE).
