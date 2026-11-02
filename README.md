# ErgonUI

Editable React components with typed, composable APIs, interactive playgrounds, and advanced data controls. Built on [shadcn/ui](https://ui.shadcn.com) component source and community work.

[Browse components](https://ergonui.netlify.app/#/components) · [Documentation](https://ergonui.netlify.app/#/docs/installation) · [CLI on npm](https://www.npmjs.com/package/@ergonui/cli)

## Get started

Components require React 19 and Tailwind CSS 4. The CLI provides automatic Vite setup; other React frameworks need manual setup and client-only rendering for browser-dependent components.

These commands require CLI **0.2 or later**.

| Package manager | Command                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| npm             | `npx @ergonui/cli create my-app --components line-chart,pie-chart`      |
| Bun             | `bunx @ergonui/cli create my-app --components line-chart,pie-chart`     |
| Deno            | `dx @ergonui/cli create my-app --components line-chart,pie-chart`       |
| pnpm            | `pnpm dlx @ergonui/cli create my-app --components line-chart,pie-chart` |
| Yarn            | `yarn dlx @ergonui/cli create my-app --components line-chart,pie-chart` |

Run `cd my-app`, then `npm run dev`, `bun run dev`, `deno task dev`, `pnpm run dev`, or `yarn run dev`. Set up Deno's `dx` alias once with `deno x --install-alias`. Use the same runner for `init` and `add` in an existing project; see the [installation guide](docs/INSTALLATION.md).

Components are copied into your application for you to customize. Enhanced compositions use the **+** suffix, such as Table+ and Form+.

- [Installation and usage](docs/INSTALLATION.md)
- [Charts](docs/CHARTS.md)
- [Component capabilities](docs/COVERAGE.md)
- [CLI options](packages/cli/README.md)

## Contribute

Repository tooling uses Bun and Node.js 24.

```sh
bun install --frozen-lockfile
bun install --cwd packages/cli --frozen-lockfile
bun run dev
```

Before submitting changes, run `bun run verify`. Run `bun run registry:build` after editing component source. CLI development and deployment are covered in the [maintainer guide](docs/PUBLISHING.md); testing scope is documented in [verification](docs/VERIFICATION.md).

Husky runs ESLint before formatting staged files and validates Conventional Commit messages. Use `bun run commit` for the Commitizen prompt; pushes run the full `bun run verify` checks.

## Attribution

ErgonUI includes copied and adapted MIT-licensed shadcn/ui components alongside original work. Thank you to shadcn and the community. Retained notices: [shadcn/ui license](LICENSES/shadcn-ui.txt), [third-party notices](THIRD-PARTY-NOTICES.md), and [ErgonUI license](LICENSE).
