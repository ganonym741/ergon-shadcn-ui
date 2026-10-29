import * as React from 'react'
import { ArrowRight, Code2, Layers, Palette } from 'lucide-react'
import { components } from '@/catalog'
import { coverage } from '@/coverage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CodeBlock } from './ui'
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
            <h2>1. Prepare React and Tailwind</h2>
            <CodeBlock
              title="Terminal"
              code={
                'bun create vite my-app --template react-ts\ncd my-app\nbun install\nbun add -d tailwindcss @tailwindcss/vite'
              }
            />
            <p>
              Configure the Tailwind Vite plugin, import Tailwind in your stylesheet, and map the @
              alias to src in TypeScript and Vite.
            </p>
            <h2>2. Add a component</h2>
            <p>
              ErgonUI distributes editable TypeScript source through an open registry format. The
              compatible shadcn CLI is one way to install it; it is a distribution tool rather than
              an ErgonUI runtime dependency.
            </p>
            <CodeBlock
              title="Terminal"
              code={`bunx --bun shadcn@latest init\nbunx --bun shadcn@latest add ${origin}/r/theme.json\nbunx --bun shadcn@latest add ${origin}/r/button.json\nbunx --bun shadcn@latest add ${origin}/r/table-plus.json`}
            />
            <p>
              You can also copy the files shown in a component's Source tab and install its listed
              dependencies. Each registry item includes its local source dependencies and retained
              license notices. URLs use this running documentation origin.
            </p>
            <h2>3. Use your source</h2>
            <CodeBlock
              code={
                'import { Button } from "@/components/ui/button"\n\nexport default function App() {\n  return <Button>Build something useful</Button>\n}'
              }
            />
            <h2>Application providers</h2>
            <CodeBlock
              code={
                'import { AppProvider } from "@/components/ui/app"\n\n<AppProvider density="comfortable" locale="en-US">\n  <YourApplication />\n</AppProvider>'
              }
            />
          </>
        ) : page === 'theming' ? (
          <>
            <h2>Application tokens</h2>
            <p>
              ErgonUI uses semantic CSS variables for color, surfaces, focus, spacing, and radius.
              Light and dark values live in your stylesheet.
            </p>
            <CodeBlock
              code={
                ':root {\n  --primary: #e66043;\n  --primary-foreground: #ffffff;\n  --radius: 0.625rem;\n}'
              }
            />
            <h2>Scoped configuration</h2>
            <CodeBlock
              code={
                '<ConfigProvider accent="#4f8a6c" radius={12} density="compact" direction="ltr" locale="en-US">\n  <YourWorkspace />\n</ConfigProvider>'
              }
            />
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
