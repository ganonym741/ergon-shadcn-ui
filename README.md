# ErgonUI

A React component library built on **[shadcn/ui](https://ui.shadcn.com) component source and community work**, extended with expressive controls, customization, and heavy data workflows. ErgonUI includes copied and adapted MIT-licensed shadcn/ui components alongside original components, with an interactive playground for each component.

**Bun · Vite · React · TypeScript · Tailwind CSS · Radix UI**

## Development

```sh
bun install --frozen-lockfile
bun run dev
```

Open Vite's printed Local URL. Component source and API documentation are generated before startup. Run `bun run registry:build` after changing component source to refresh registry and API payloads.

```sh
bun run check
bun run test
bun run build
bun run preview
```

## Component collections

All components belong to General, Layout, Navigation, Data entry, Data display, Feedback, or Other. The + suffix identifies enhanced compositions: Table+, Form+, Layout+, Descriptions+, List+, Editable Table+, Card+, Field+, Skeleton+, and Check Card+.

Each component page offers an interactive playground, property controls, state examples, event inspection, configuration export, installation instructions, source, and typed API documentation.

## Source installation

ErgonUI uses an open registry format. A compatible CLI can copy components and their local source dependencies into your application:

```sh
bunx --bun shadcn@latest add <documentation-origin>/r/button.json
bunx --bun shadcn@latest add <documentation-origin>/r/table-plus.json
```

Configure React, Tailwind, and the @ import alias first. Initialize `components.json` using the compatible CLI when needed, or copy the files and dependencies from a component's Source tab. CLI compatibility is a distribution option; the library has no shadcn runtime dependency.

Import Tailwind and `tw-animate-css` in your stylesheet (`bun add tw-animate-css`). Install `/r/theme.json` with the same CLI to apply ErgonUI's light and dark tokens, or keep your application's tokens.

```tsx
import { Button } from '@/components/ui/button'
import { TablePlus } from '@/components/ui/table-plus'
```

## Architecture

```text
src/components/ui/     shadcn/ui-derived and original component source
src/playground/        Component controls, presets, previews, and events
src/lib/               Shared utilities
src/catalog.ts         Component inventory and functional collections
src/docs/              Documentation and example compositions
src/test/              Behavior and distribution tests
scripts/build-registry.ts
public/r/              Generated installable source
public/api/            Generated API metadata
docs/COVERAGE.md       Capability and verification record
```

Components never import documentation or demo data. Public APIs use typed schemas and callbacks, controlled/uncontrolled state, native props, compound parts, and render slots. Runtime data, uploads, routing, and permissions are injected by the consuming application.

See [capabilities](docs/COVERAGE.md) and the [verification record](docs/VERIFICATION.md) for the supported behavior and tested scenarios.

## Attribution

Built on shadcn/ui component source and community work. Thank you to shadcn and the contributors sharing ideas, code, and accessibility improvements. ErgonUI extends this foundation with original components and workflows and is maintained separately from shadcn/ui.

Required copyright and license notices for included MIT-licensed code are retained in [LICENSES/shadcn-ui.txt](LICENSES/shadcn-ui.txt) and distributed with the relevant source. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) and [LICENSE](LICENSE).
