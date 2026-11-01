# Acknowledgments

ErgonUI builds on [shadcn/ui](https://ui.shadcn.com) component source and community work. This repository contains copied and adapted shadcn/ui components alongside original ErgonUI components and workflows. We appreciate the open-code approach, composable interfaces, and community contributions to accessible component design. ErgonUI is maintained separately; this acknowledgment does not imply affiliation or endorsement.

## Retained code notices

This repository includes MIT-licensed component code obtained or adapted from shadcn/ui. Copyright (c) 2023 shadcn. Its complete copyright and permission notice is retained in [LICENSES/shadcn-ui.txt](LICENSES/shadcn-ui.txt) and included in component registry distributions. Retaining these notices is required for the code they cover.

## Dependencies and fonts

The original ErgonUI CLI uses jsonc-parser 3.3.1 and PostCSS 8.5.6 under MIT, and TypeScript 5.9.3 under Apache License 2.0. They are external npm dependencies and retain their notices in their package distributions. The CLI reads ErgonUI registry payloads directly and retains the component source licenses when installing them.

The original ErgonUI Chart collection uses Apache ECharts 6.1.0, Copyright 2017–2026 The Apache Software Foundation, under Apache License 2.0. ECharts and its ZRender dependency retain their license and notice files in their npm distributions. Chart rendering uses selected ECharts modules; the React compositions and playgrounds are original ErgonUI work. See https://echarts.apache.org/.

The original ErgonUI Rich Text Editor composition uses the open-source Tiptap editor and ProseMirror packages under their MIT licenses. It uses no commercial editor extensions. Their copyright and license notices remain in the installed package distributions.

React, Radix UI, TanStack Table and Virtual, React Hook Form, Lucide, React Day Picker, date-fns, Embla Carousel, Sonner, Vaul, React Resizable Panels, cmdk, qrcode.react, Tailwind CSS, class-variance-authority, clsx, tailwind-merge, Bun, and Vite retain their respective licenses in their package distributions.

The documentation bundles Geist and Geist Mono by the Geist Project Authors under the SIL Open Font License 1.1. Complete notices are in `public/LICENSES/geist.txt` and `public/LICENSES/geist-mono.txt` and are included in production builds.
