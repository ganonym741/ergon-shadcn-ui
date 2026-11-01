# ErgonUI

A React component library built on **[shadcn/ui](https://ui.shadcn.com) component source**, extended with expressive controls, customization, and heavy data workflows. ErgonUI includes copied and adapted MIT-licensed shadcn/ui components alongside original components, with an interactive playground for each component.

## Development

These commands run the ErgonUI contributor workspace. To use components in your own application,
follow the [installation guide](docs/INSTALLATION.md); no ErgonUI clone is needed.

```sh
bun install --frozen-lockfile
bun run dev
```

Open Vite's printed Local URL. Component source and API documentation are generated before startup. Run `bun run registry:build` after changing component source to refresh registry and API payloads.

For Netlify, use `bun run build`, publish `dist`, and set `REGISTRY_URL=https://ergonui.netlify.app` in the build environment so generated registry metadata uses the public homepage. Keep the Bun version aligned with the version used to verify the project. New source becomes publicly installable after pushing and deploying it.

```sh
bun run check
bun run charts:check
bun run test
bun run build
bun run preview
```

## Component collections

All components belong to General, Layout, Navigation, Data entry, Data display, Chart, Feedback, or Other. The + suffix identifies enhanced compositions: Table+, Form+, Layout+, Descriptions+, List+, Editable Table+, Card+, Field+, Skeleton+, and Check Card+.

The Chart collection uses Apache ECharts and includes a composable Chart foundation, Line, Area, Bar, Pie, Scatter, Radar, Heatmap and Gauge components. Each supports typed data/options, SVG or Canvas rendering, themes, events and readable data tables. Applications provide their own data; the playgrounds use local samples.

Chart entries register only their own series and required components. Canvas and zoom load on demand. Use `modules` for additional native ECharts features. See the [modular chart guide](docs/CHARTS.md) for configuration and standalone bundle verification.

Each component page offers an interactive playground, property controls, state examples, event inspection, configuration export, installation instructions, source, and typed API documentation.

## Source installation

The first-party CLI is implemented and tested locally; its first npm publication is pending. After release, create an application with:

```sh
bunx @ergonui/cli create my-app --components line-chart,pie-chart
cd my-app
bun run dev
```

For an existing Vite + React 19 TypeScript project, use `bunx @ergonui/cli init`, then `bunx @ergonui/cli add button table-plus`. See [CLI development](packages/cli/README.md) and [npm publishing](docs/PUBLISHING.md). The commands below describe the manual alternative available before publication.

Follow the [complete Bun + Vite + React installation guide](docs/INSTALLATION.md) for Tailwind 4, both TypeScript aliases, initialization, a working example, and optional providers. In an application already configured with `components.json`, use the published shadcn CLI to copy selected component source from the public registry:

```sh
bunx --bun shadcn@latest add https://ergonui.netlify.app/r/button.json
bunx --bun shadcn@latest add https://ergonui.netlify.app/r/table-plus.json
```

Bunx downloads the selected CLI package automatically. Each registry entry includes its local source dependencies, tested npm package versions, and retained licenses. Component-page commands use the first-party CLI and include any additional catalog entries imported by their usage example. Your application runs the installed source independently of the registry.

Initialization supplies semantic Tailwind bindings and CSS dependencies. Keep the generated stylesheet imports and theme mappings. Add `https://ergonui.netlify.app/r/theme.json` to apply ErgonUI's tokens, or keep your own. Preview changes with `--dry-run --diff` before replacing customized source. See the guide for manual installation and animation setup.



CLI development has its own pinned dependencies: run `bun install --cwd packages/cli --frozen-lockfile`, then `bun run cli:check`, `bun run cli:test`, and `bun run cli:build`. Build/test/pack artifacts stay in ignored `dist`/`output` directories.

See [capabilities](docs/COVERAGE.md) and the [verification record](docs/VERIFICATION.md) for the supported behavior and tested scenarios.
