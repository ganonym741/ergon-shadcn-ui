import * as React from 'react'
import { ArrowRight, Code2, Layers, Palette } from 'lucide-react'
import { components } from '@/catalog'
import { coverage } from '@/coverage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeBlock } from './ui'
import {
  installationSnippets as setup,
  ergonInstallCommand,
  cliCommand,
  quickCreateCommand,
  taskCommand,
  type DocsPackageManager,
} from './installation'
import { PackageManagerSelect } from './package-manager-select'
export function DocumentPage({ page }: { page: string }) {
  const [query, setQuery] = React.useState('')
  const [manager, setManager] = React.useState<DocsPackageManager>('npm')
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
        {(page === 'installation' || page === 'theming') && (
          <PackageManagerSelect value={manager} onChange={setManager} />
        )}
        {page === 'installation' ? (
          <>
            <h2>Create an application</h2>
            <p>
              Components use React 19 and Tailwind CSS 4. The CLI provides a Vite starter with
              aliases, theme tokens, and selected source. Other React frameworks need manual setup
              and client-only rendering for browser-dependent components.
            </p>
            <p>These package-manager commands require CLI 0.2 or later.</p>
            <CodeBlock title="Terminal" code={quickCreateCommand(manager)} />
            <h2>Use a component</h2>
            <p>Import the installed source. For example, replace src/App.tsx with:</p>
            <CodeBlock title="src/App.tsx" code={setup.chartApp} />
            <CodeBlock title="Verify" code={taskCommand(manager, 'build')} />
            <h2>Existing applications</h2>
            <CodeBlock
              title="Terminal"
              code={[
                cliCommand(manager, 'init'),
                ergonInstallCommand(['button', 'table-plus'], '', manager),
              ].join('\n')}
            />
            <p>
              Run init once inside a Vite + React 19 TypeScript project. It preserves existing
              styles and fills missing configuration. Component pages include installation commands
              and usage examples; supply the referenced state, data, and callbacks.
            </p>
            <h2>Update and customize</h2>
            <CodeBlock
              title="Terminal"
              code={[
                ergonInstallCommand(['button'], '--dry-run', manager),
                ergonInstallCommand(['button'], '--overwrite', manager),
              ].join('\n')}
            />
            <p>
              Review the plan before replacing customized files with --overwrite. Keep the generated
              Tailwind bindings, animation imports, and source license notices.
            </p>
            <details>
              <summary>Application provider (optional)</summary>
              <p>
                AppProvider adds shared theme, density, locale, direction, tooltips, and
                message/confirmation services. Button works without it.
              </p>
              <CodeBlock
                title="Terminal"
                code={ergonInstallCommand(['app', 'button'], '', manager)}
              />
              <CodeBlock title="src/App.tsx" code={setup.providerApp} />
              <p>
                Use useApp() inside this provider for scoped services. It includes toast hosts; add
                separate hosts only for separate scopes.
              </p>
            </details>
            <h2>More guides</h2>
            <ul>
              <li>
                <a href="#/docs/theming">Theme tokens and scoped appearance</a>
              </li>
              <li>
                <a href="https://github.com/ganonym741/ergon-shadcn-ui/blob/HEAD/docs/MANUAL-INSTALLATION.md">
                  Manual installation
                </a>
              </li>
              <li>
                <a href="https://github.com/ganonym741/ergon-shadcn-ui/blob/HEAD/packages/cli/README.md">
                  CLI options and custom registries
                </a>
              </li>
            </ul>
          </>
        ) : page === 'theming' ? (
          <>
            <h2>Application tokens</h2>
            <p>
              ErgonUI uses semantic CSS variables for color, surfaces, focus, spacing, and radius.
              Complete the <a href="#/docs/installation">installation guide</a> first. To replace
              your current tokens with ErgonUI defaults:
            </p>
            <CodeBlock
              title="Terminal"
              code={ergonInstallCommand(['theme'], '--overwrite', manager)}
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
            <CodeBlock
              title="Terminal"
              code={ergonInstallCommand(['config-provider', 'button'], '', manager)}
            />
            <CodeBlock title="src/App.tsx" code={setup.configApp} />
            <p>
              ConfigProvider scopes appearance, density, direction and locale. It does not switch
              the light/dark theme. AppProvider from the installation guide includes the theme
              provider, or use ThemeProvider and useTheme from the theme-provider helper installed
              with AppProvider. setTheme accepts light, dark, or system. Providers do not translate
              your application's own labels.
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
