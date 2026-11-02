# @ergonui/cli

Install editable React components with npm, Bun, Deno, pnpm, or Yarn. Automatic scaffolding uses Vite; the components use React 19 and Tailwind CSS 4.

| Package manager | Command                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| npm             | `npx @ergonui/cli create my-app --components line-chart,pie-chart`      |
| Bun             | `bunx @ergonui/cli create my-app --components line-chart,pie-chart`     |
| Deno            | `dx @ergonui/cli create my-app --components line-chart,pie-chart`       |
| pnpm            | `pnpm dlx @ergonui/cli create my-app --components line-chart,pie-chart` |
| Yarn            | `yarn dlx @ergonui/cli create my-app --components line-chart,pie-chart` |

Use the same runner with `init` for an existing Vite project, or `add button table-plus` to install components. npm/pnpm/Yarn use Node.js; Deno uses `dx` after `deno x --install-alias` (or `deno x` directly).

`create` configures aliases, Tailwind 4, theme tokens, and selected source. `init` merges configuration and preserves existing CSS. Existing projects use a TypeScript Vite config and the standard `main.tsx` entry; `init` fills missing `@/*` aliases. See [installation](https://ergonui.netlify.app/#/docs/installation) for examples.

## Options

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
