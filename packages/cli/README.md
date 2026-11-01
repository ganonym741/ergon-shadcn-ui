# @ergonui/cli

Create Bun + Vite + React 19 + Tailwind 4 applications and install editable ErgonUI component source. No ErgonUI repository clone is needed by consumers.

This package is prepared for its first npm release. The `bunx @ergonui/cli` commands below become publicly available after publication. Until then, use the built executable or install its packed tarball locally.

```sh
bunx @ergonui/cli create my-app --components line-chart,pie-chart
cd my-app
bun run dev
```

Selected components are copied to `src/components/ui`; import them using the examples in the [handbook](https://ergonui.netlify.app/#/components). The starter configures aliases, Tailwind bindings, light/dark tokens, animation utilities, and `components.json`. Canvas and zoom helpers retain their dynamic import boundaries.

For an existing Vite + React 19 TypeScript application:

```sh
bunx @ergonui/cli init
bunx @ergonui/cli add button table-plus
bunx @ergonui/cli add line-chart --dry-run
```

Initialization merges TypeScript aliases and a Vite configuration adapter while preserving existing plugins/settings, JSONC comments, CSS rules and existing token values. Version 1 supports a `@/*` source alias, aliases rooted at `@/`, a `src/main.tsx` entry (or its configured source-directory equivalent), and a TypeScript Vite configuration with one default export. Unsupported configurations fail before writing; use the manual handbook for other stacks/configurations.

`add` refuses differing existing files before writing any files. Review your changes, then explicitly use `--overwrite` to replace customized components. Select `theme` with `--overwrite` to replace theme token values. Initialization preserves existing tokens by default. `--keep-theme` also prevents explicitly selected theme values from being replaced. Licenses shipped by the registry are retained.

Options: `--cwd <path>`, `--components <comma-separated-names>`, `--registry <origin>`, `--overwrite`, `--keep-theme`, `--dry-run`, `--no-install`, `--help`, and `--version`. With `--no-install`, dependencies are recorded in package.json; run `bun install` before running your application.

The default registry is `https://ergonui.netlify.app`. For unpublished component work:

```sh
bunx @ergonui/cli create local-app --components line-chart,pie-chart --registry http://localhost:5174
```

`init` saves that registry in `components.json`. Future `add` calls reuse it; a one-off `--registry` on `add` does not change the saved configuration. A missing entry reports its URL/status and exits before writing source. The CLI supports ErgonUI's generated UI/theme registry items, bundled local source and exact npm versions; it is not a general-purpose installer for every third-party registry format.

Dependency installation happens after files are written. If Bun installation fails, resolve the reported error and retry the same command to install the declared dependencies. Registry source is copied at installation time; applications run independently of the registry afterward.

## Development and publication

From this directory:

```sh
bun install --frozen-lockfile
bun run check
bun run test
bun run build
npm pack --dry-run
```

See [the publishing guide](../../docs/PUBLISHING.md) for npm scope ownership, first-release validation and publishing. The repository root remains private; publish from `packages/cli` only.

ErgonUI is built on shadcn/ui component source and community work, including copied/adapted MIT-licensed components alongside original work. This CLI is original ErgonUI code. Registry payloads preserve the applicable source licenses; retain them in consuming applications. See the repository's `THIRD-PARTY-NOTICES.md` for provenance.
