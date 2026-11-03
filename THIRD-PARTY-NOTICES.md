# Acknowledgments

ErgonUI builds on [shadcn/ui](https://ui.shadcn.com) component source and community work. This repository contains copied and adapted shadcn/ui components alongside original ErgonUI components and workflows. We appreciate the open-code approach, composable interfaces, and community contributions to accessible component design. ErgonUI is maintained separately; this acknowledgment does not imply affiliation or endorsement.

## Retained code notices

This repository includes MIT-licensed component code obtained or adapted from shadcn/ui. Copyright (c) 2023 shadcn. Its complete copyright and permission notice is retained in [LICENSES/shadcn-ui.txt](LICENSES/shadcn-ui.txt) and included in component registry distributions. Retaining these notices is required for the code they cover.

## Dependencies and fonts

The Geographic Map playground uses Natural Earth 1:110m admin-0 country boundaries in `public/maps/world.geo.json`, obtained from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson. Geometry is unchanged; properties are reduced to display names and country codes. The map data is public domain: https://www.naturalearthdata.com/about/terms-of-use/. Made with Natural Earth. Map data is a documentation asset and is not included in installed component source; sample metric values are original simulated examples.

The documentation's npm, Bun, Deno, pnpm, Yarn and GitHub logos are from [Simple Icons](https://github.com/simple-icons/simple-icons), distributed under CC0. Their source revisions are recorded in `src/docs/package-manager-icons.ts` and `src/docs/ui.tsx`; the complete license is retained in [LICENSES/simple-icons.txt](LICENSES/simple-icons.txt). Brand names and marks belong to their respective owners.

The original ErgonUI CLI uses jsonc-parser 3.3.1, PostCSS 8.5.6 and cross-spawn 7.0.6 under MIT, YAML 2.9.1 under ISC, and TypeScript 5.9.3 under Apache License 2.0. They are external npm dependencies and retain their notices in their package distributions. The CLI reads ErgonUI registry payloads directly and retains the component source licenses when installing them.

The original ErgonUI Chart collection uses Apache ECharts 6.1.0, Copyright 2017–2026 The Apache Software Foundation, under Apache License 2.0. ECharts and its ZRender dependency retain their license and notice files in their npm distributions. Chart rendering uses selected ECharts modules; the React compositions and playgrounds are original ErgonUI work. See https://echarts.apache.org/.

The original ErgonUI Rich Text Editor composition uses the open-source Tiptap editor and ProseMirror packages under their MIT licenses. It uses no commercial editor extensions. Their copyright and license notices remain in the installed package distributions.

React, Radix UI, TanStack Table and Virtual, React Hook Form, Lucide, React Day Picker, date-fns, Embla Carousel, Sonner, Vaul, React Resizable Panels, cmdk, qrcode.react, Tailwind CSS, class-variance-authority, clsx, tailwind-merge, Bun, and Vite retain their respective licenses in their package distributions.

The documentation bundles Geist and Geist Mono by the Geist Project Authors under the SIL Open Font License 1.1. Complete notices are in `public/LICENSES/geist.txt` and `public/LICENSES/geist-mono.txt` and are included in production builds.
