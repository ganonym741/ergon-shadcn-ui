import * as React from 'react'
import { ArrowRight, Code2, Layers, Palette } from 'lucide-react'
import { components } from '@/catalog'
import { coverage } from '@/coverage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeBlock } from './ui'
import { installationSnippets as setup, installCommand, ergonInstallCommand } from './installation'
export function DocumentPage({ page }: { page: string }) {
  const [query, setQuery] = React.useState('')
  const origin = window.location.origin
  const titles: Record<string, [string, string]> = {
    introduction: [
      'Designed for real work.',
      'Expressive React components, open source, and room to make them your own.',
    ],
    installation: [
      'Start with a building block.',
      'Install only what you need. Keep the source in your application.',
    ],
    theming: [
      'Your design language.',
      'Shared tokens, independent parts, and precise customization.',
    ],
    credits: [
      'Built on community work.',
      'Acknowledging the component source, contributors, and projects behind ErgonUI.',
    ],
    coverage: [
      'Capabilities, in the open.',
      'Explore what each component supports and how it is verified.',
    ],
    changelog: ['ErgonUI, evolving.', 'Changes to the library and its interactive documentation.'],
  }
  const [title, description] = titles[page] ?? titles.introduction
  return (
    <>
      <div className="detail-heading">
        <div className="intro-eyebrow">
          <span className="dot" />
          THE ERGONUI HANDBOOK
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="plain-doc">
        {page === 'installation' ? (
          <>
            <h2>Quick start with the ErgonUI CLI</h2>
            <p>
              Create a configured Bun + Vite + React application in one command. You do not need to
              clone ErgonUI: bunx downloads the CLI from npm, and the CLI installs selected
              component source and dependencies from the public registry.
            </p>
            <p>
              Publication status: the CLI is implemented and locally tested; the first npm
              publication is pending. These commands become publicly available after release. Until
              then, use the manual installation below or test the packed CLI locally.
            </p>
            <CodeBlock title="Terminal · after the first npm release" code={setup.quickCreate} />
            <p>
              The starter includes TypeScript/Vite aliases, Tailwind, theme tokens, animation
              utilities and components.json. It installs Line Chart and Pie Chart as editable
              source. Replace src/App.tsx to render a selected component:
            </p>
            <CodeBlock title="src/App.tsx" code={setup.chartApp} />
            <CodeBlock title="Verify" code="bun run build" />
            <h2>Existing applications and additional components</h2>
            <CodeBlock
              title="Terminal"
              code={'bunx @ergonui/cli init\nbunx @ergonui/cli add button table-plus'}
            />
            <p>
              Run init once inside a Vite + React 19 TypeScript application. It merges configuration
              and preserves existing CSS tokens. Additional installs reuse the registry saved in
              components.json. Differing component files are preserved unless you explicitly pass
              --overwrite; inspect the plan first with --dry-run. New applications get a clean
              stylesheet; existing applications retain their styles, including any Vite starter
              rules you may want to remove.
            </p>
            <h2>Local or custom registries</h2>
            <p>
              Normal commands use the public ErgonUI registry. To test unpublished work, supply the
              running documentation origin explicitly:
            </p>
            <CodeBlock
              title="Local development only"
              code={`bunx @ergonui/cli create my-app --components line-chart,pie-chart --registry ${origin}`}
            />
            <details>
              <summary>Manual installation with the shadcn CLI</summary>
              <p>
                Start with Bun, Node.js supported by Vite, React 19, and Tailwind CSS 4. You do not
                need to clone ErgonUI. Bunx downloads the published shadcn CLI from npm; the CLI
                downloads editable component files from this documentation site into your project.
                There is currently no published first-party ErgonUI CLI.
              </p>
              <h2>1. Create a React application</h2>
              <p>
                For an existing Vite + React project, keep your files and add any missing setup
                below.
              </p>
              <CodeBlock title="Terminal" code={setup.createProject} />
              <h2>2. Configure Vite and TypeScript</h2>
              <p>
                For a fresh project, replace vite.config.ts with this configuration. In an existing
                application, merge the plugin and alias into your current configuration.
              </p>
              <CodeBlock title="vite.config.ts" code={setup.vite} />
              <p>
                Merge this compilerOptions.paths entry into both tsconfig.json and
                tsconfig.app.json. Preserve their other options, include entries, and project
                references. The root alias lets the installer detect your setup; the app alias lets
                TypeScript resolve component imports. No baseUrl is needed.
              </p>
              <CodeBlock
                title="tsconfig.json and tsconfig.app.json (merge)"
                code={setup.typescriptAlias}
              />
              <h2>3. Prepare the stylesheet</h2>
              <p>
                In a fresh project, replace src/index.css with the following. Keep its import in
                src/main.tsx. The App example below replaces src/App.tsx and removes the starter
                App.css import. Starter body, button, and #root rules can override component
                styling. In an existing project, preserve your styles and merge the Tailwind import.
              </p>
              <CodeBlock title="src/index.css (before initialization)" code={setup.stylesheet} />
              <h2>4. Initialize the component configuration</h2>
              <CodeBlock title="Terminal" code={setup.initialize} />
              <p>
                Run this once in your application directory. It creates components.json, utilities,
                and semantic Tailwind bindings. Choose the Radix base used by ErgonUI.
                Initialization may install a starter Button and CSS packages, including
                shadcn/tailwind.css and tw-animate-css. Keep the generated stylesheet imports and
                @theme bindings; do not replace the stylesheet with the one-line example afterward.
                If components.json already exists, skip initialization and check that its aliases
                and CSS path match your project.
              </p>
              <h2>5. Install the theme and Button</h2>
              <CodeBlock
                title="Terminal"
                code={installCommand(origin, ['theme', 'button'], '--yes --overwrite')}
              />
              <p>
                This fresh-project command replaces the initializer's Button with ErgonUI's version
                and applies our light/dark tokens. For an existing application, preview changes with
                --dry-run --diff and omit --overwrite to review file conflicts. Keep your existing
                theme by omitting theme.json. Each registry item includes local source dependencies,
                tested npm dependency versions, and retained license notices.
              </p>
              <h2>6. Use your component and verify</h2>
              <CodeBlock title="src/App.tsx" code={setup.buttonApp} />
              <CodeBlock title="Terminal" code={'bun run build\nbun run dev'} />
              <p>Open Vite's printed URL and click the Button to update its counter.</p>
              <h2>7. Add more components</h2>
              <CodeBlock title="Terminal" code={installCommand(origin, ['table-plus'])} />
              <p>
                Component pages provide installation commands and usage examples. Snippets marked as
                compositions need your own surrounding component, state, data, and callbacks. The
                installation command includes additional catalog components imported by the example.
                Install only the entries you use; their own source dependencies are included.
              </p>
              <h2>Optional: application providers</h2>
              <p>
                Button works without an application provider. Install AppProvider when you want
                system-aware light/dark appearance, shared density, locale and direction, tooltip
                defaults, and scoped message/confirmation services. It mounts the toast hosts for
                these services. Add separate hosts only when you intentionally need another scope.
              </p>
              <CodeBlock title="Terminal" code={installCommand(origin, ['app'])} />
              <CodeBlock title="src/App.tsx (optional replacement)" code={setup.providerApp} />
              <h2>Registry URLs and manual installation</h2>
              <p>
                Commands use this documentation's origin ({origin}). On the public site they fetch
                from Netlify; local documentation uses its local registry. A 404 means the requested
                entry is unavailable at that deployment. For manual installation, copy every file in
                the component's Source tab, preserve its license files, install its listed npm
                dependencies, and keep the same aliases and theme setup.
              </p>
              <p>
                For animations, keep one @import &quot;tw-animate-css&quot; in src/index.css and
                ensure the package is installed. Outside this playground, motion can respect the
                user's reduced-motion preference.
              </p>
            </details>
          </>
        ) : page === 'theming' ? (
          <>
            <h2>Application tokens</h2>
            <p>
              ErgonUI uses semantic CSS variables for color, surfaces, focus, spacing, and radius.
              Complete the <a href="#/docs/installation">installation guide</a> first so Tailwind
              has its semantic @theme bindings. Apply our theme to your configured stylesheet:
            </p>
            <CodeBlock
              title="Terminal · after CLI publication"
              code={ergonInstallCommand(['theme'])}
            />
            <p>
              Keep the generated imports, @custom-variant dark, and @theme inline block. Customize
              tokens inside :root and .dark. Values below are CSS colors, so hex values work
              directly.
            </p>
            <CodeBlock
              code={
                ':root {\n  --primary: #b93e28;\n  --primary-foreground: #ffffff;\n  --radius: 0.625rem;\n}\n\n.dark {\n  --primary: #f17c5e;\n  --primary-foreground: #171917;\n}'
              }
            />
            <h2>Scoped configuration</h2>
            <CodeBlock title="Terminal" code={ergonInstallCommand(['config-provider', 'button'])} />
            <CodeBlock title="src/App.tsx" code={setup.configApp} />
            <p>
              ConfigProvider scopes appearance, density, direction and locale. It does not switch
              the light/dark theme. AppProvider from the installation guide includes the theme
              provider, or use ThemeProvider and useTheme from the theme-provider helper installed
              with AppProvider. setTheme accepts light, dark, or system. Providers do not translate
              your application's own labels.
            </p>
            <p>
              Each component playground includes its own controls, state examples, events, and
              configuration export. Class names, native props, render callbacks, and typed schemas
              let you go further.
            </p>
            <Button asChild variant="outline">
              <a href="#/playground">
                Open theme playground
                <ArrowRight />
              </a>
            </Button>
          </>
        ) : page === 'credits' ? (
          <>
            <h2>Apache ECharts</h2>
            <p>
              The Chart collection uses{' '}
              <a href="https://echarts.apache.org/" target="_blank" rel="noreferrer">
                Apache ECharts
              </a>
              , licensed under Apache License 2.0. Copyright 2017–2026 The Apache Software
              Foundation. The React components are original ErgonUI compositions.
            </p>
            <h2>shadcn/ui and its community</h2>
            <p>
              ErgonUI builds on{' '}
              <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
                shadcn/ui
              </a>{' '}
              component source and community work. It includes copied and adapted MIT-licensed
              shadcn/ui components alongside original ErgonUI components, customization, and data
              workflows. ErgonUI is maintained separately from shadcn/ui.
            </p>
            <p>
              Thank you to shadcn and everyone contributing components, ideas, documentation, and
              accessibility improvements to the ecosystem.
            </p>
            <h2>License acknowledgments</h2>
            <p>
              The required copyright and permission notices for copied and adapted shadcn/ui
              component code are retained in LICENSES/shadcn-ui.txt and distributed with the
              relevant source. The acknowledgments describe provenance; they do not imply
              affiliation or endorsement.
            </p>
            <h2>Open-source foundations</h2>
            <p>
              React, Radix UI, TanStack Table and Virtual, React Hook Form, Lucide, React Day
              Picker, date-fns, Embla, Sonner, Vaul, React Resizable Panels, cmdk, qrcode.react,
              Tiptap, ProseMirror, Tailwind, Bun, and Vite. The documentation uses Geist and Geist
              Mono under the SIL Open Font License.
            </p>
            <p>See LICENSE and THIRD-PARTY-NOTICES.md for the complete notices.</p>
          </>
        ) : page === 'coverage' ? (
          <>
            <h2>One collection, more possibilities</h2>
            <p>
              All {components.length} components live in their functional collections. Components
              ending in + provide additional workflows and data capabilities using the same design
              system.
            </p>
            <Input
              aria-label="Search feature coverage"
              placeholder="Search components or capabilities…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-4 max-w-sm"
            />
            <div className="api-wrap">
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Capabilities</th>
                    <th>Checks and integration notes</th>
                  </tr>
                </thead>
                <tbody>
                  {components
                    .filter((c) =>
                      (c.name + ' ' + coverage[c.id]?.implemented.join(' '))
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((c) => (
                      <tr key={c.id}>
                        <td>
                          <a href={`#/components/${c.id}`}>{c.name}</a>
                        </td>
                        <td>{coverage[c.id]?.implemented.join('; ')}</td>
                        <td>
                          {coverage[c.id]?.notes.join('; ') ||
                            'Interactive playground and source available.'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <h2>Verification</h2>
            <p>
              Behavior tests, source-installation checks, and browser scenarios verify supported
              interactions. Virtualized datasets are measured in the playground. Application data
              services are connected through explicit typed callbacks.
            </p>
          </>
        ) : page === 'changelog' ? (
          <>
            <h2>0.2.0</h2>
            <ul>
              <li>ErgonUI identity and shadcn/ui source attribution.</li>
              <li>All + components integrated into their functional collections.</li>
              <li>
                Dedicated component playgrounds with controls, presets, events, and configuration
                export.
              </li>
              <li>Expanded component behaviors and data workflows.</li>
            </ul>
          </>
        ) : (
          <>
            <h2>A library for ambitious applications</h2>
            <p>
              ErgonUI brings controls, layouts, feedback, forms, and heavy data workflows into one
              consistent system. Its composable TypeScript APIs give you independent control over
              presentation and behavior.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [Layers, 'A complete collection'],
                [Code2, 'Editable source'],
                [Palette, 'Your design language'],
              ].map(([Icon, label]) => {
                const I = Icon as typeof Layers
                return (
                  <div key={String(label)} className="rounded-xl border bg-background p-5">
                    <I size={19} className="mb-3 text-primary" />
                    <span className="text-xs font-medium text-foreground">{String(label)}</span>
                  </div>
                )
              })}
            </div>
            <h2>Explore before you install</h2>
            <p>
              Open a component's playground to change its properties, test states, inspect
              interactions, and export a configuration. Then bring the source into your application.
            </p>
            <Button asChild>
              <a href="#/components">
                Explore components
                <ArrowRight />
              </a>
            </Button>
            <p className="mt-6 text-xs">
              Built on shadcn/ui component source and community work. Extended with ErgonUI
              components and workflows.
            </p>
          </>
        )}
      </div>
    </>
  )
}
