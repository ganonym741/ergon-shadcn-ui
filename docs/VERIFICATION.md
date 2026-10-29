# ErgonUI 0.2.0 verification

The current source inventory contains 83 components across seven functional collections, including the Rich Text Editor added after List consolidation. Enhanced compositions use the + suffix and belong to those collections. The broader baseline checks below were recorded November 1, 2026 against the original 83-entry inventory, before List consolidation and the editor addition.

## Rich Text Editor and nested table playgrounds

The Rich Text Editor is an original composition using Tiptap and ProseMirror. It provides named toolbar, content and status parts, typed controlled HTML and HTML/JSON/text callbacks, formatting, links, tables, and images within the document. Applications inject `onImageUpload` to choose their own storage and authentication. Uploads track insertion positions through document edits, report progress, support cancellation and retry, validate type/size/count, and avoid stale insertion after content replacement or unmount. The local playground uses temporary object URLs; its custom endpoint example sends multipart `file` and accepts `{ url }` or `{ src }`.

Table and Table+ now expose Nested rows, Row details and Nested table presets, including children/grandchildren, child editing, and custom Add child/Add task actions that update demo-owned tree data. Parent action cells render their custom content, selected-child batch callbacks include child records, and server-paginated trees expand locally without counting children as server pages.

- `bun run check`, `bun run build`, registry regeneration and all 71 tests passed. Twenty focused tests cover the new editor and table behaviors, including cancellation when a storage handler ignores its signal.
- Browser checks exercised cursor-mapped uploads, surrounding text preservation, alt text/width/alignment, URL images, keyboard formatting and toolbar navigation, undo/redo, editable editor tables, upload failure/retry/cancellation, and a mocked custom multipart endpoint. Table/Table+ checks covered editing children and nested tables, adding children, custom detail actions and simulated server requests, without runtime exceptions.
- Automated WCAG 2 A/AA and WCAG 2.1 AA axe checks reported zero violations in the tested editor light, dark and 390 px mobile canvases and both nested-row table previews. The mobile editor had no page-level horizontal overflow. These checks retain the accessibility limits stated below.
- The registry CLI installed the editor and updated table source into the separate consumer fixture. Installed source passed strict TypeScript and a production build; browser editing and image insertion worked. The documentation loads editor code separately from the general playground.
- No external storage service was provisioned or certified. Production upload destinations, access controls, persistence and server-side content handling remain application integrations.
- Production browser checks confirmed the 83-entry catalog, editor paste/drop uploads with surrounding text preserved, registry contents and nested table presets, without runtime exceptions.

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
