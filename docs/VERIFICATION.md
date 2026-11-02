# Verification

## Run checks

```sh
bun run lint
bun run check
bun run test
bun run build
bun run charts:check
bun run cli:check
bun run cli:test
bun run hooks:check
```

Install the CLI's dependencies first with `bun install --cwd packages/cli --frozen-lockfile`.

## Coverage

| Area                    | Checks                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Source distribution     | Catalog entries, example imports, transitive helpers, pinned dependencies, and retained license notices                                |
| CLI                     | Application creation, configuration/CSS preservation, dry runs, file conflicts, invalid registry responses, and destination validation |
| Data controls           | Decimal precision, dates/time zones, validation, nested-row editing, cell spans, selection, and save/error flows                       |
| Navigation and overlays | Keyboard interaction, focus restoration, portals, and controlled state                                                                 |
| Charts                  | Lifecycle, resizing, renderer changes, events, legends, data mapping, optional-module cancellation, and bundle boundaries              |
| Rich Text Editor        | Formatting, image insertion, upload progress/cancellation, retry, and cursor tracking                                                  |

Independent applications have been built using installed registry source and the packed CLI. Browser checks cover component interaction, responsive layouts, light/dark appearance, chart rendering, data updates, and image insertion. Build reports and browser captures belong in ignored `output/`.

CLI 0.2 package-manager checks created and built independent Line/Pie chart applications with npm, Bun, Deno, pnpm, and Yarn. Normal `init` runners also selected the correct manager and produced its lockfile without an override. These checks use a locally packed release. Yarn scaffolds use node-modules linking, while existing PnP configuration is preserved for manual setup.

See [component capabilities](COVERAGE.md) for integration notes and the [chart guide](CHARTS.md) for bundle behavior.

## Limits

- Accessibility checks include automated axe and keyboard/structure testing. They do not constitute certification; NVDA, JAWS, and VoiceOver have not been manually tested.
- Custom themes, renderers, and application integrations need their own acceptance checks. There is no exhaustive visual baseline for every prop combination.
- ECharts core has a shared bundle cost. Canvas and zoom load separately; enabling them downloads additional code.
- Custom expanded table content uses native table layout and disables row virtualization.
- Data services, uploads, routing, permissions, and persistence are supplied by the consuming application. Playground samples use local data.
