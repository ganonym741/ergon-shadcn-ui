# ErgonUI contributor instructions

- Use the ErgonUI identity. Describe the project as built on shadcn/ui component source and community work, including copied/adapted MIT-licensed components alongside original work. Keep provenance and retained license notices accurate. Keep components in functional collections and use the + suffix for enhanced compositions.

- Keep component source in `src/components/ui`, one installable entry per catalog component. Use named, composable parts and typed props. Never import docs, demo data, or generated metadata from a distributed component.
- Preserve upstream shadcn attribution in `LICENSES/shadcn-ui.txt`, the visible credits, and registry payloads. Record copied upstream work in `THIRD-PARTY-NOTICES.md`.
- `src/catalog.ts` is the catalog inventory. Every entry must have a real preview, usage example, source entry, and registry item. A card or demo is not evidence that a capability works. Keep `docs/COVERAGE.md` and the coverage page accurate.
- Run `bun run registry:build` after component changes. It resolves local source imports and includes tested npm package versions. Regenerate rather than manually editing `public/r`, `public/api`, `registry.json`, or `src/generated`.
- Use stable row IDs in data demos. Real data and uploads are injected callbacks; never imply that local examples are connected to a production service.
- Run meaningful behavior tests for interactions changed, `bun run check`, and `bun run build`. Test the browser for visual, focus, keyboard, responsive, portal, or virtualization changes.
- Keep source formatted with Prettier. Build/test artifacts belong in ignored `output/`.
