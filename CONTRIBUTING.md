# Contributing to ErgonUI

Contributions to components, accessibility, documentation, tests, and the CLI are welcome. For a bug report, include reproduction steps, expected and actual behavior, relevant versions, and a minimal example or screenshot. Discuss substantial features or public API changes in an issue before implementing them.

## Pull requests and approval

Every contribution to `main` must go through a **pull request (PR)**, also called a merge request (MR). The repository ruleset requires **at least one approving review** before merging. Work on a separate branch and open a PR targeting `main`; do not push changes directly to `main`.

Use a draft PR for work in progress. Before requesting review, complete the relevant checks and describe how reviewers can reproduce and verify the change. Address review feedback and resolve failing checks before the PR is merged.

## Set up your development environment

Repository development uses **Node.js 24 and Bun 1.4.4**, matching the current release workflow. This tooling requirement is separate from the package managers supported by installed components and the CLI.

Fork [the repository](https://github.com/ganonym741/ergon-shadcn-ui) unless you already have write access. For a fork, replace `YOUR-USERNAME` below:

```sh
git clone https://github.com/YOUR-USERNAME/ergon-shadcn-ui.git
cd ergon-shadcn-ui
git remote add upstream https://github.com/ganonym741/ergon-shadcn-ui.git
git fetch upstream
git switch -c feat/your-change upstream/main
bun install --frozen-lockfile
bun install --cwd packages/cli --frozen-lockfile
bun run dev
```

Open the local URL printed by Vite. Root installation enables the Git hooks. The documentation app and CLI have separate dependency installations; both are needed for the full checks.

## Find your way around

| Location               | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `src/components/ui`    | Installable component source and shared parts                   |
| `src/catalog.ts`       | Component inventory and source entries                          |
| `src/playground`       | Interactive previews, controls, and sample data                 |
| `src/docs`             | Usage examples, documentation pages, and thumbnails             |
| `src/coverage.ts`      | Capability descriptions used to generate coverage documentation |
| `src/test`             | Component and documentation tests                               |
| `packages/cli`         | Installer source and CLI tests                                  |
| `templates/react-vite` | Application starter bundled with the CLI                        |

Read [AGENTS.md](AGENTS.md) for the repository's contributor instructions.

## Develop components and documentation

- Keep components in functional collections, with one installable entry per catalog component. Use the **+** suffix for enhanced compositions, such as Table+.
- Use typed props and named, composable parts. Distributed components must not import documentation, demo data, or generated metadata.
- For new components, add the catalog entry, real preview, playground controls, usage example, thumbnail, and capability information. Only claim behavior that works and has been verified.
- Use stable IDs in data examples. Supply real data, persistence, and uploads through callbacks; clearly identify simulated examples.
- For charts, use modular ECharts imports and preserve lazy loading of optional features. Run `bun run charts:check` after changes to chart source or dependencies.
- Preserve shadcn/ui attribution in visible credits, registry payloads, and [LICENSES/shadcn-ui.txt](LICENSES/shadcn-ui.txt). ErgonUI includes copied and adapted MIT-licensed shadcn/ui source alongside original work. Record copied upstream work and its license in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

After changing component source, catalog entries, examples, or capability information, regenerate the registry and documentation:

```sh
bun run registry:build
```

Include the relevant generated changes in your PR. Do not hand-edit `public/r`, `public/api`, `public/registry.json`, `registry.json`, `src/generated`, `public/llms.txt`, or `docs/COVERAGE.md`; update their source inputs and regenerate instead.

## Verify your changes

Add or update meaningful behavior tests for changed interactions. Check visual, focus, keyboard, responsive, portal, and virtualization behavior in the browser when affected. For UI changes, include screenshots or a short recording in the PR and note which themes, viewport sizes, and input methods you checked.

Run the full verification before submitting:

```sh
bun run verify
```

This runs ESLint, Prettier checks, app and CLI TypeScript checks, both test suites, registry consumer compilation, and the production build. Run `bun run hooks:check` when changing hooks or commit tooling. Keep build reports, screenshots, and test artifacts in ignored `output/`.

See [verification](docs/VERIFICATION.md) for testing details and limits. For CLI changes, also test the built installer in a separate React project using the affected package manager; see the [maintainer guide](docs/PUBLISHING.md).

## Commit and submit

Keep commits focused on one component or shared scope, including its related tests and documentation. Use Conventional Commit messages:

```text
feat(candlestick-chart): add keyboard range selection
fix(timeline): align alternate items
docs(contributing): explain the review workflow
```

Stage the intended files and use `bun run commit` for the Commitizen prompt, or write a Conventional Commit yourself. Husky runs ESLint before formatting staged files, validates commit messages, and runs `bun run verify` before pushes. Fix failures before proceeding.

Push your branch and open a PR against `ganonym741/ergon-shadcn-ui:main`. Include:

- The problem and resulting behavior, with a related issue when available.
- Tests and browser checks performed, including any remaining limitations.
- Screenshots for visual changes and usage examples for API changes.
- Any breaking changes, new dependencies, or licensing updates.

Wait for at least **one approving review** and complete the applicable checks before merging. Contributors do not need npm publishing credentials; release handling is documented in the [maintainer guide](docs/PUBLISHING.md).
