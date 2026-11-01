# ErgonUI 0.2.0 verification

The current source inventory contains 92 components across eight functional collections, including the Chart collection and Rich Text Editor. Enhanced compositions use the + suffix and belong to those collections. The broader baseline checks below were recorded November 1, 2026 against the earlier 83-entry inventory, before the subsequent additions.

## Installation and usage documentation

The first-party CLI is now implemented in `packages/cli` with a bundled Bun/Vite/React starter. `create`, `init`, and `add` read the registry directly, retain source licenses and declare pinned npm dependencies. The handbook and component pages lead with ErgonUI commands and explicitly mark npm publication as pending; the shadcn CLI guide remains a collapsed manual alternative. Desktop and 390 px browser checks confirmed the quick-start command and an expandable manual alternative, without page-level horizontal overflow. Screenshots are in ignored `output/playwright/cli-installation-guide.png` and `cli-installation-mobile.png`. The [publishing guide](PUBLISHING.md) covers npm account/scope ownership and the release commands.

All 11 CLI tests pass, including JSONC/CSS preservation, repeated initialization, multiple/layered theme blocks, async Vite configuration, dry-run behavior, preflight file conflicts, invalid registry responses, traversal/symlink rejection and creation through the built executable. CLI TypeScript checks pass. The packed package contains only its allowlisted executable, starter, README, license and metadata (14 files, approximately 12 kB compressed, excluding npm dependencies).

The tarball was installed in the separate `../ergonui-cli-consumer-check` runner, where `bunx --no-install @ergonui/cli` executed the actual packaged binary. It created `../ergonui-cli-created-app` with Line and Pie from the local registry, initialized an independently scaffolded `../ergonui-cli-init-app`, and added components using saved registry configuration. A third application, `../ergonui-cli-public-check`, was created using the default public registry and Button. All three applications build; the chart app imports and renders its installed Line/Pie components and a later-added Button. Its combined ECharts chunk still produces Vite's size warning. Browser checks confirmed both charts, a Button-driven data update and the changed value in the accessible table, with no runtime console warnings/errors. This tests a local tarball, not an npm publication; public `bunx @ergonui/cli` remains unavailable until the owner publishes it.

The handbook, README, and [installation guide](INSTALLATION.md) now show the full Bun/Vite/React/Tailwind 4 setup, aliases in both TypeScript configs, explicit Radix initialization, preservation of generated CSS, a complete interactive Button example, optional provider installation, and file-conflict handling. They distinguish the published shadcn CLI from the proposed first-party CLI, and contributor setup from consumer installation. The theming and chart guides include install commands and complete examples.

A fresh sibling application, `../ergonui-installation-check`, was scaffolded with create-vite 9.3.3, Bun 1.4.4, Vite 8.3.5, React 19.3.1 and TypeScript 7.0.2. The actual handbook configuration and examples were applied without disabling unused-code checks; strict mode was enabled. Button and Theme were installed from the public Netlify registry and passed a production build. The optional provider, form, message, notification and utility examples were installed through the registry CLI. Default unused-code checks exposed unused imports/bindings in Field+, Form+, Rate, Steps and the responsive helper; these were removed upstream, regenerated, and reinstalled through the local registry. Table+ and Line Chart were also installed from the current local registry. No consuming application source imports or package links point back to the ErgonUI workspace.

The seven complete handbook/component examples and all four TSX examples extracted directly from the installation/chart Markdown guides pass strict TypeScript and a production build against the installed source. A named-export audit checks all 92 usage snippets; a distribution test verifies that their suggested install entries cover every local import. This is not a claim that all usage fragments are standalone applications: fragments explicitly require their surrounding component, state, callbacks, data and services.

Browser checks confirmed Button counter updates, Form required-field validation and submission, message/notification toasts, utility input/debouncing, provider rendering and scoped accent/density, and rendering of both chart guide examples. The handbook was inspected at desktop and 390 px widths; the mobile guide and installed Line Chart had no page-level horizontal overflow. The usage fixture and handbook had no console warnings/errors during these checks. Screenshots are in ignored `output/playwright/installation-guide.png` and `installation-mobile.png`.

All 116 behavior/distribution tests, registry generation, `bun run check`, and the production build passed. Public installation checks cover the already deployed source; the new documentation and source fixes require a push and deployment before they are available on Netlify.

## Chart collection

Nine installable entries use Apache ECharts 6.1.0: Chart, Line Chart, Area Chart, Bar Chart, Pie Chart, Scatter Chart, Radar Chart, Heatmap Chart and Gauge Chart. Each has source/API documentation, usage, a registry item and an editable playground. Shared parts provide a canvas, headings, keyboard-operable legends and a readable data table. Props expose native options, typed events, image export and an imperative handle. Rendering uses selected ECharts modules and is loaded separately from other playgrounds.

All 115 tests, TypeScript checks, registry generation and the production build passed. Chart tests cover lifecycle disposal, resizing, renderer changes, callback updates, keyboard legends, selection across theme changes, errors, reduced motion, option-object validation and data mapping. Optional module tests cover cancellation on unmount, cancellation when switching renderers, and applying the latest options after loading. All documentation chunks remain below the configured size-warning threshold.

Each component entry now registers its own series and required engine components. The base includes SVG and accessibility support, with explicit native modules; Canvas and data zoom load on demand. Documentation chart entries load separately. `bun run charts:check` builds all nine entries independently and rejects unrelated series installers, eager Canvas painters, eager data zoom, and the full ECharts entry. An isolated ES consumer comparison reduced initial SVG Line Chart JavaScript from approximately 302.7 to 225.0 KiB gzip (React external), and Gauge from 302.1 to 181.7 KiB. The [modular chart guide](CHARTS.md) records the method and limits.

Brave checks exercised all nine components in Default, Showcase, Canvas renderer, Loading, Empty, Error and Dark presets (63 runs), with no unexpected alerts or console errors/warnings. The modular revision repeated these checks with a fresh page for each component, so earlier registrations could not mask missing modules. Additional checks confirmed real point-click payloads, legend toggles, data updates, zoom actions, SVG export and resizing to a 283 px chart within the narrow preview without page overflow. The registry CLI installed all nine entries and their optional helper files into an independent consumer; strict TypeScript and a build using the installed charts passed, and three installed charts rendered without errors. Data is supplied through props; no production data service is included.

## Independent consumer outside the repository

A new application was scaffolded in the sibling `../ergonui-chart-consumer` directory with create-vite 9.3.3, Bun 1.4.4, Vite 8.3.5, React 19.3.1 and TypeScript 7.0.2. Tailwind and the compatible registry CLI were configured from scratch. Button, Line, Pie, Gauge and the ErgonUI theme were installed through the local registry URLs. All 11 installed source/license files match their payloads; there are no source symlinks or local-repository package dependencies.

The scaffold's unused-import checks exposed type-only React imports that were not referenced explicitly. The chart compositions now declare their React.JSX.Element return types. The consumer was reinstalled through the registry and passes strict TypeScript without disabling these checks.

Four real browser application builds passed. The dashboard initially includes only Line; Pie and Gauge views load on selection. Independent Line/Pie/Gauge builds include only their own series. Canvas painters and data zoom are absent from every initial dependency graph. Reports measure final written assets and include React: initial gzip JavaScript was 264.6 KiB for the dashboard, 255.7 KiB for Line, 232.0 KiB for Pie and 219.4 KiB for Gauge. CSS and fonts are separate. The single Line and Pie builds retain Vite's individual-chunk size warnings; ECharts core remains substantial.

Production browser checks confirmed all three views, SVG/Canvas rendering, legend keyboard toggles, data-table updates, loading zoom, PNG export, theme changes and no runtime console warnings/errors. Lint exits successfully with warnings about refresh exports and imperative refs/effects in installed source. The consumer contains its own installation guide, reproducible bundle/provenance scripts, raw reports and screenshots. The ErgonUI repository's 115 tests, registry generation, TypeScript and production build also passed after the compatibility fix.

## Rich Text Editor and nested table playgrounds

The Rich Text Editor is an original composition using Tiptap and ProseMirror. It provides named toolbar, content and status parts, typed controlled HTML and HTML/JSON/text callbacks, formatting, links, tables, and images within the document. Applications inject `onImageUpload` to choose their own storage and authentication. Uploads track insertion positions through document edits, report progress, support cancellation and retry, validate type/size/count, and avoid stale insertion after content replacement or unmount. The local playground uses temporary object URLs; its custom endpoint example sends multipart `file` and accepts `{ url }` or `{ src }`.

Table and Table+ now expose Nested rows, Row details and Nested table presets, including children/grandchildren, child editing, and custom Add child/Add task actions that update demo-owned tree data. Parent action cells render their custom content, selected-child batch callbacks include child records, and server-paginated trees expand locally without counting children as server pages.

- `bun run check`, `bun run build`, registry regeneration and all 71 tests passed. Twenty focused tests cover the new editor and table behaviors, including cancellation when a storage handler ignores its signal.
- Browser checks exercised cursor-mapped uploads, surrounding text preservation, alt text/width/alignment, URL images, keyboard formatting and toolbar navigation, undo/redo, editable editor tables, upload failure/retry/cancellation, and a mocked custom multipart endpoint. Table/Table+ checks covered editing children and nested tables, adding children, custom detail actions and simulated server requests, without runtime exceptions.
- Automated WCAG 2 A/AA and WCAG 2.1 AA axe checks reported zero violations in the tested editor light, dark and 390 px mobile canvases and both nested-row table previews. The mobile editor had no page-level horizontal overflow. These checks retain the accessibility limits stated below.
- The registry CLI installed the editor and updated table source into the separate consumer fixture. Installed source passed strict TypeScript and a production build; browser editing and image insertion worked. The documentation loads editor code separately from the general playground.
- No external storage service was provisioned or certified. Production upload destinations, access controls, persistence and server-side content handling remain application integrations.
- Production browser checks confirmed the 83-entry catalog, editor paste/drop uploads with surrounding text preserved, registry contents and nested table presets, without runtime exceptions.

## Animation playground verification

Measured successive browser frames confirmed moving pulse opacity for Skeleton/Skeleton+, processing badges and active progress, and changing rotation for Spin, loading buttons, Card+, and Border Beam. Accordion expansion also used its expected keyframes. These were not missing from the production stylesheet.

Spin's initial loading state and demo toggle now operate independently, and Default/Showcase both demonstrate a running spinner. Loading/Processing/Active presets expose the relevant states in other previews. Skeleton+ provides an `animated` prop and matching playground control for all five layouts. A live notice explains device-requested reduced motion; reduced-motion CSS runs shortened animations once instead of compressing infinite loops into near-zero durations.

All 74 tests, TypeScript, production build, and registry regeneration passed. Focused browser checks exercised normal and reduced motion, live preference changes, all Skeleton+ layouts, and loading toggles.

An additional check in the user's actual Brave profile confirmed `prefers-reduced-motion: reduce`, whereas the separate test browser reported normal motion. An initial follow-up offered an explicit Play animations action scoped to preview content. Brave checks confirmed moving Skeleton/Skeleton+ opacity and Border Beam rotation after opting in, with animations stopped again after opting out. All 77 tests, TypeScript, and production build passed at that stage.

At the user's request, component previews now always enable full motion automatically. The Play animations prompt and session preference were removed. The scoped CSS exception applies only inside preview canvases; the surrounding page continues respecting reduced motion, and each component's Animate control still works. All 79 tests, TypeScript, registry regeneration, and production build passed after this change.

Skeleton and Skeleton+ now default to a sweeping wave animation. Both expose `animation="wave" | "pulse"` and retain `animated={false}`. The wave keyframes travel with component source, and React de-duplicates the inline stylesheet across multiple placeholders. Browser checks in Brave and the production build confirmed moving wave transforms, pulse selection, animation disabling, all five Skeleton+ layouts, and a single wave stylesheet for the composed placeholders. The registry CLI installed the updated source into the consumer fixture, which passed strict TypeScript and a production build. All 85 tests, TypeScript, registry regeneration, and the documentation production build passed.

## Tabs visual repair

Workspace tab close controls now sit beside their own labels, with no nested buttons. Explicit row sizing and indicators contained inside their triggers remove the unintended vertical scrollbar. Vertical navigation fills its column and scrolls within a bounded height. Closing a tab restores focus, skips disabled neighbors, and provides an empty state after the final tab closes.

All 94 tests, TypeScript checks, registry regeneration, and the production build passed. Brave checks covered default and line primitives in both orientations, arrow-key selection, keyboard closing and focus return, 20-tab overflow in a narrow preview, and light/dark production rendering. The horizontal viewport had equal client and scroll heights; overflowing tab labels stayed inside the preview.

## List consolidation

The legacy List alias and duplicate catalog entry were removed. The modern collection implementation is now `List` / `ListProps` in `src/components/ui/list.tsx`; List+ uses this canonical source. Playground controls, examples, imports, registry items, and generated API documentation use the List name. Catalog and navigation “New” labels and the legacy badge were removed.

The production build and all 51 tests passed. Browser checks confirmed 82 catalog entries, one canonical List card, no obsolete Listy links or New/legacy labels, virtual rendering (10 mounted items from 200), all 200 items in normal mode, grid layout, action events, List+ search, and the canonical source registry payload, without runtime exceptions.

## Build and source distribution

- `bun install --frozen-lockfile` passed with the renamed package and pinned dependency versions.
- `bun run check` and the production Vite build passed.
- All 51 behavior/distribution tests passed. Tests cover precise decimals, daylight-saving transitions, async suggestions, form dependencies, scoped portals, confirmation failures, selection constraints, transactions, rollback, cross-page selection, merged cells, batch edits, and controlled column visibility.
- All 83 registry entries were installed into a fresh consumer project using the compatible source CLI. It created 110 source/license files. The installed source passed a separate strict TypeScript check and production build.
- The consumer app's Button, Table+, and Form+ interactions were exercised in a browser with no runtime exceptions.
- Registry collection resolves TypeScript import/export declarations and includes transitive source, exact package versions, and retained license notices.

## Playground and browser checks

- All 83 component pages rendered with their default and showcase presets: 166 production preview runs, with no runtime errors or warnings.
- Every selectable control mode was exercised across the 83 development playgrounds without preview failures or console errors.
- Controls, event inspection, saved presets, configuration import/export, canvas sizing, typed source/API views, and installation instructions are available on each component page.
- A 100,000-record, 120-column table rendered 17 rows initially and 15 at the final window. Eight column headers were mounted at the far horizontal edge. Scrolling reached record `PRJ-100000`.
- Native row spans, transactional save failure and rollback, 10,000-option keyboard selection, modal drag/resize and focus return, prepared tour steps, cropped uploads, QR PNG export with a center mark, and responsive column spans passed focused browser scenarios.
- Desktop, dark, and mobile views were inspected. At 390 px, the closed sidebar was fully off screen, navigation closed after choosing a destination, and the page had no horizontal overflow.

## Accessibility checks and limits

Automated axe-core 4.14 checks used the WCAG 2 A/AA and WCAG 2.1 AA rule tags on all default and showcase preview canvases. Reported issues were fixed and the affected states were rechecked without violations. Additional checks of open popovers, dialogs, drawers, selects, date pickers, and tree selects passed after their animations settled. Representative dark-mode Button, Layout+, Typography, Table, and Calendar previews also passed.

These are automated and keyboard/structure checks, not a certification. NVDA, JAWS, and VoiceOver were not manually tested, and no exhaustive pixel-regression baseline exists for every combination of native props, custom renderers, and consumer themes. Custom colors and application integrations require their own acceptance checks.

Source callbacks simulate data services in the documentation. Production routing, permissions, requests, uploads, saved views, and persistence remain explicit consumer integrations. Cell merging uses native table layout; custom expansion content disables row virtualization.

## Local artifacts

Ignored `output/playwright/` contains review captures for the overview, component playground, dark and mobile views, the large table, QR PNG export, and the independently installed consumer app. The source consumer is in ignored `output/consumer-ergonui/`.

ErgonUI builds on shadcn/ui component source and community work, including copied and adapted MIT-licensed components alongside original work. Required MIT notices remain in the repository and registry payloads.
