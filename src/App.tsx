import { contrastForeground, themeAccent } from '@/lib/contrast'
import * as React from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  BookOpen,
  Box,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Component,
  FileCode2,
  Grid2X2,
  Home,
  Layers,
  LayoutDashboard,
  List,
  Menu,
  Moon,
  MousePointer2,
  Navigation,
  Palette,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  X,
} from 'lucide-react'
import { useTheme } from '@/components/ui/theme-provider'
import { components, categories, slug, getComponent, type Category } from './catalog'
import { Thumbnail } from './docs/thumbnails'
import { BrandMark, CodeBlock, Footer, GitHubMark } from './docs/ui'
import {
  Playground,
  DocumentPage,
  ThemeControls,
  defaultSettings,
  type ThemeSettings,
} from './docs/pages'
import { examples } from './docs/examples'
import { ergonInstallCommand, usageInstallIds, type DocsPackageManager } from './docs/installation'
import { PackageManagerSelect } from './docs/package-manager-select'
import { coverage } from './coverage'
import { Button } from './components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './components/ui/sheet'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './components/ui/command'
type Meta = {
  files: string[]
  dependencies: string[]
  api: { file: string; exports: string[]; types: string[] }[]
  source: string
}
import './styles/docs.css'
const LazyPlayground = React.lazy(() => import('./playground'))
const categoryIcons: Record<Category, typeof Box> = {
  General: Box,
  Layout: LayoutDashboard,
  Navigation: Navigation,
  'Data entry': MousePointer2,
  'Data display': Layers,
  Chart: ChartNoAxesCombined,
  Feedback: CircleHelp,
  Other: Blocks,
}
function useRoute() {
  const [hash, setHash] = React.useState(
    window.location.hash.startsWith('#/') ? window.location.hash : '#/components',
  )
  React.useEffect(() => {
    const change = () => {
      if (window.location.hash && !window.location.hash.startsWith('#/')) return
      setHash(window.location.hash || '#/components')
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  const [path, query] = hash.slice(1).split('?')
  return { path, params: new URLSearchParams(query) }
}
function Catalog({
  category,
  query,
  setQuery,
  view,
  setView,
}: {
  category: string
  query: string
  setQuery: (q: string) => void
  view: string
  setView: (v: string) => void
}) {
  const searchRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const filtered = components.filter(
    (c) =>
      (category === 'all' || c.category === category) &&
      (query.trim() === '' ||
        query
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .every(
            (term) =>
              `${c.name} ${c.keywords}`
                .toLowerCase()
                .split(/[\s/,-]+/)
                .some((word) => word.startsWith(term)) ||
              c.name.toLowerCase().replaceAll(' ', '').includes(term),
          )),
  )
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="intro-eyebrow">
            <span className="dot" />
            OPEN SOURCE. OPEN POSSIBILITIES.
          </div>
          <h1>
            {category === 'all' ? 'Components' : category}
            <span className="title-count">
              {category === 'all'
                ? components.length
                : components.filter((c) => c.category === category).length}
            </span>
          </h1>
          <p>
            Thoughtfully crafted. Endlessly customizable.
            <br />
            Better building blocks for your next big thing.
          </p>
          <div className="intro-tags">
            <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
              <span style={{ fontSize: 13, letterSpacing: -3, marginRight: 3 }}>//</span>Built on
              shadcn/ui
              <ArrowUpRight size={10} />
            </a>
            <span>
              <Code2 size={12} />
              Open code
            </span>
            <span>
              <SlidersHorizontal size={12} />
              Yours to customize
            </span>
          </div>
        </div>
        <div className="intro-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="art-card">
            <div className="art-card-title">
              A little more growth
              <ArrowUpRight size={10} />
            </div>
            <div className="art-stat">
              24,680
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 400,
                  color: '#699477',
                  letterSpacing: 0,
                  marginLeft: 8,
                }}
              >
                ↗ 12.8%
              </span>
            </div>
            <div className="art-bars">
              {[26, 44, 35, 57, 46, 69, 54, 74, 66, 89].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="art-floating">
            <span className="art-floating-icon">
              <Check size={15} />
            </span>
            <div>
              <strong>Ready for your next idea.</strong>
              <small>The possibilities are yours.</small>
            </div>
          </div>
        </div>
      </div>
      <div className="feature-banner">
        <div className="feature-banner-icon">
          <Layers size={20} strokeWidth={1.4} />
        </div>
        <div>
          <h3>More possibilities. Same building blocks.</h3>
          <p>Rich tables, powerful forms, and complete application layouts.</p>
        </div>
        <a className="feature-banner-link" href="#/components/table-plus">
          Explore Table+
          <ArrowRight size={13} />
        </a>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search />
          <input
            ref={searchRef}
            aria-label="Search components"
            placeholder="Find your next building block…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query ? (
            <button aria-label="Clear search" className="key-hint" onClick={() => setQuery('')}>
              ×
            </button>
          ) : (
            <kbd className="key-hint">/</kbd>
          )}
        </div>
        {category !== 'all' && (
          <Button size="sm" variant="ghost" asChild>
            <a href="#/components">
              <X size={12} />
              Clear category
            </a>
          </Button>
        )}
        <span className="catalog-meta">{filtered.length} components to make your own</span>
        <div className="view-toggle" role="group" aria-label="Catalog view">
          <button
            className={view === 'grid' ? 'active' : ''}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            <Grid2X2 size={14} />
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            <List size={14} />
          </button>
        </div>
      </div>
      {filtered.length ? (
        categories.map((group) => {
          const items = filtered.filter((c) => c.category === group)
          const Icon = categoryIcons[group]
          return items.length ? (
            <section key={group} className="catalog-section" id={slug(group)}>
              <div className="category-heading">
                <Icon />
                <h2>{group}</h2>
                <span className="count">{items.length}</span>
                <span className="line" />
              </div>
              <div className={`component-grid ${view === 'list' ? 'list-view' : ''}`}>
                {items.map((c) => (
                  <a
                    key={c.id}
                    className="component-card"
                    aria-label={`${c.name} component`}
                    href={`#/components/${c.id}`}
                  >
                    <div className="component-preview">
                      <Thumbnail id={c.id} />
                    </div>
                    <div className="component-card-info">
                      <div className="component-card-title">
                        <h3>{c.name}</h3>
                        <ArrowUpRight className="arrow" />
                      </div>
                      <p>{c.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null
        })
      ) : (
        <div className="no-results">
          <Search className="mx-auto mb-4 text-muted-foreground" size={25} />
          <h3>No building blocks found.</h3>
          <p>Try a component name, a feature, or a different category.</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={() => setQuery('')}>
            Clear search
          </Button>
        </div>
      )}
    </>
  )
}

function Detail({ id, settings }: { id: string; settings: ThemeSettings }) {
  const [manager, setManager] = React.useState<DocsPackageManager>('npm')
  const info = getComponent(id)
  const [tab, setTab] = React.useState('preview')
  const [file, setFile] = React.useState('')
  const [sources, setSources] = React.useState<{ path: string; content: string }[]>([])
  const [meta, setMeta] = React.useState<Meta>()
  React.useEffect(() => {
    setTab('preview')
    setFile('')
    setSources([])
    const controller = new AbortController()
    setMeta(undefined)
    fetch(`/api/${id}.json`, { signal: controller.signal })
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {})
    fetch(`/r/${id}.json`, { signal: controller.signal })
      .then((r) => r.json())
      .then((r) => setSources(r.files.filter((f: { path: string }) => f.path.startsWith('src/'))))
      .catch(() => {})
    return () => controller.abort()
  }, [id])
  if (!info) return <DocumentPage page="introduction" />
  const primarySource = sources.find((s) => s.path === file) ?? sources[0]
  return (
    <>
      <div className="detail-heading">
        <div className="intro-eyebrow">
          <span className="dot" />
          {info.category.toUpperCase()}
        </div>
        <h1>{info.name}</h1>
        <p>{info.description}</p>
        <div className="detail-tags">
          <span className="detail-badge">React + TypeScript</span>
          <span className="detail-badge">Editable source</span>
          <a className="detail-badge" href="#/docs/coverage">
            Feature coverage
            <ArrowUpRight size={10} className="ml-1 inline" />
          </a>
        </div>
      </div>
      <div className="demo-panel">
        <div className="demo-panel-header">
          <button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
            <Component size={12} />
            Playground
          </button>
          <button className={tab === 'example' ? 'active' : ''} onClick={() => setTab('example')}>
            <Code2 size={12} />
            Usage
          </button>
          <button className={tab === 'source' ? 'active' : ''} onClick={() => setTab('source')}>
            <FileCode2 size={12} />
            Source
          </button>
          <span className="ml-auto hidden text-[10px] sm:block">
            Live components. Real interactions.
          </span>
        </div>
        {tab === 'preview' ? (
          <div>
            <div className="w-full" dir={settings.direction}>
              <React.Suspense
                fallback={
                  <div className="p-16 text-center text-xs text-muted-foreground">
                    Loading preview…
                  </div>
                }
              >
                <LazyPlayground key={id} id={id} direction={settings.direction} />
              </React.Suspense>
            </div>
          </div>
        ) : tab === 'example' ? (
          <CodeBlock code={examples[id] ?? ''} />
        ) : (
          <>
            <div className="flex items-center gap-2 border-b px-4 py-2 text-xs text-muted-foreground">
              <label htmlFor="source-file">File</label>
              <select
                id="source-file"
                value={primarySource?.path ?? ''}
                onChange={(e) => setFile(e.target.value)}
                className="min-w-0 max-w-full rounded border bg-background px-2 py-1"
              >
                {sources.map((s) => (
                  <option key={s.path} value={s.path}>
                    {s.path}
                  </option>
                ))}
              </select>
            </div>
            <CodeBlock code={primarySource?.content ?? meta?.source ?? 'Loading source…'} />
          </>
        )}
        <div className="demo-description">
          Change the values, use your keyboard, and make yourself at home. Every example uses the
          actual component source.{' '}
          <a className="text-primary" href="#/playground">
            Try your own theme →
          </a>
        </div>
      </div>
      <h2 className="docs-subheading" id="installation">
        Installation
      </h2>
      <PackageManagerSelect value={manager} onChange={setManager} />
      <CodeBlock
        title="Terminal"
        code={ergonInstallCommand(usageInstallIds(id, examples[id]), '', manager)}
      />
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        CLI 0.2+ commands. Run inside an application prepared by ergonui create or init. Copies this
        component, additional entries imported by the example, and their local dependencies.{' '}
        <a href="#/docs/installation" className="text-primary">
          Read the setup guide.
        </a>{' '}
        Includes copied and adapted shadcn/ui component source. License notices are included.
      </p>
      <h2 className="docs-subheading" id="usage">
        Usage
      </h2>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Examples show component composition. Place JSX and hooks inside your own React component;
        provide the state, data, and callbacks referenced in each snippet. Application requests and
        upload endpoints are examples for you to implement.
      </p>
      <CodeBlock title="React + TypeScript" code={examples[id] ?? ''} />
      <h2 className="docs-subheading">Available capabilities</h2>
      <div className="rounded-xl border bg-background p-5">
        <ul className="grid gap-3 sm:grid-cols-2">
          {coverage[id]?.implemented.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
            >
              <Check size={13} className="mt-0.5 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
        {coverage[id]?.notes.length > 0 && (
          <details className="mt-5 border-t pt-4">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Integration notes
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
              {coverage[id]?.notes.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <h2 className="docs-subheading" id="api">
        API reference
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Public types and signatures extracted from the component source. Standard primitives also
        accept their underlying React and Radix props. Open Source above for the complete
        implementation.
      </p>
      {meta?.api
        .filter((a) => a.types.length > 0)
        .slice(0, 5)
        .map((a) => (
          <details
            key={a.file}
            className="mb-3 overflow-hidden rounded-lg border bg-background"
            open={a.file === `${id}.tsx` || a.file === 'data-table.tsx'}
          >
            <summary className="cursor-pointer px-4 py-3 font-mono text-[11px]">{a.file}</summary>
            <CodeBlock code={a.types.join('\n\n')} />
          </details>
        ))}
      <details className="mt-4 rounded-lg border bg-background px-4 py-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          Included files & dependencies
        </summary>
        <ul className="mt-3 space-y-2 font-mono text-[10px] text-muted-foreground">
          {meta?.files.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="mt-4 text-[10px] text-muted-foreground">
          {meta?.dependencies.join(', ') || 'React only.'}
        </p>
      </details>
      <div className="mt-8 flex justify-between border-t pt-5 text-xs text-muted-foreground">
        <a className="flex items-center gap-2" href="#/components">
          <ArrowLeft size={13} />
          All components
        </a>
        <a className="flex items-center gap-2" href="#/docs/coverage">
          Implementation coverage
          <ArrowUpRight size={13} />
        </a>
      </div>
    </>
  )
}
export default function App() {
  const { path, params } = useRoute()
  const { resolvedTheme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [themeOpen, setThemeOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [view, setView] = React.useState('grid')
  const [settings, setSettings] = React.useState<ThemeSettings>(() => {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem('ergonui-theme') ?? '{}') }
    } catch {
      return defaultSettings
    }
  })
  React.useEffect(() => {
    try {
      localStorage.setItem('ergonui-theme', JSON.stringify(settings))
    } catch {
      // Keep the website's appearance controls usable when persistence is unavailable.
    }
    const el = document.documentElement
    const accent = themeAccent(settings.accent, resolvedTheme)
    el.style.setProperty('--primary', accent)
    el.style.setProperty('--ring', accent)
    el.style.setProperty('--radius', `${settings.radius}px`)
    el.style.setProperty('--primary-foreground', contrastForeground(accent))
  }, [settings, resolvedTheme])
  React.useEffect(() => {
    setMobileOpen(false)
    setQuery('')
  }, [path, params.get('category')])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const category = params.get('category') ?? 'all'
  const isDetail = path.startsWith('/components/')
  const componentId = path.split('/')[2]
  const docPage = path.split('/')[2] ?? 'introduction'
  const isDocs = path.startsWith('/docs')
  const isPlayground = path === '/playground'
  const selectedCategory = getComponent(componentId)?.category
  const currentLabel = isDetail
    ? getComponent(componentId)?.name
    : isDocs
      ? docPage[0].toUpperCase() + docPage.slice(1)
      : isPlayground
        ? 'Theme playground'
        : category === 'all'
          ? 'Components'
          : category
  const navDocs = [
    ['introduction', 'Introduction', BookOpen],
    ['installation', 'Installation', Terminal],
    ['theming', 'Theming', Palette],
    ['coverage', 'Feature coverage', ShieldCheck],
  ] as const
  const navigate = (href: string) => {
    window.location.hash = href
    setSearchOpen(false)
  }
  return (
    <div className="docs-shell" data-density={settings.density}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed left-4 top-4 z-100 rounded bg-background p-3 text-sm"
      >
        Skip to content
      </a>
      <header className="docs-header">
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
        <a className="brand" href="#/components" aria-label="ErgonUI home">
          <BrandMark />
          <span>
            Ergon<span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>UI</span>
          </span>
          <span className="brand-separator" />
        </a>
        <nav className="header-nav" aria-label="Main navigation">
          <a className={!isDocs && !isPlayground ? 'active' : ''} href="#/components">
            Components
          </a>
          <a className={isDocs ? 'active' : ''} href="#/docs/introduction">
            Documentation
          </a>
          <a className={isPlayground ? 'active' : ''} href="#/playground">
            Playground
          </a>
        </nav>
        <div className="header-tools">
          <button
            className="global-search"
            onClick={() => setSearchOpen(true)}
            aria-label="Search documentation"
          >
            <Search size={14} />
            <span>Search anything…</span>
            <kbd>⌘ K</kbd>
          </button>
          <span className="version-chip">v0.2.0</span>
          <a
            className="header-icon inline-flex shrink-0 items-center justify-center rounded-md"
            href="https://github.com/ganonym741/ergon-shadcn-ui"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ErgonUI GitHub repository (opens in a new tab)"
            title="View ErgonUI on GitHub"
          >
            <GitHubMark />
          </a>
          <button
            className="header-icon"
            aria-label="Customize theme"
            onClick={() => setThemeOpen(true)}
          >
            <SlidersHorizontal size={17} />
          </button>
          <button
            className="header-icon"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={17} />}
          </button>
        </div>
      </header>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`docs-sidebar ${mobileOpen ? 'open' : ''}`}
        aria-label="Documentation sidebar"
      >
        <div className="sidebar-scroll">
          <div className="sidebar-label">Get started</div>
          {navDocs.map(([id, title, Icon]) => (
            <a
              key={id}
              href={`#/docs/${id}`}
              className={`sidebar-link ${isDocs && docPage === id ? 'active' : ''}`}
            >
              <Icon />
              {title}
            </a>
          ))}
          <div className="sidebar-label section">The collection</div>
          <a
            href="#/components"
            className={`sidebar-link ${!isDetail && !isDocs && !isPlayground && category === 'all' ? 'active' : ''}`}
          >
            <Grid2X2 />
            All components<span className="sidebar-count">{components.length}</span>
          </a>
          {categories.map((group) => {
            const Icon = categoryIcons[group]
            return (
              <React.Fragment key={group}>
                <a
                  href={`#/components?category=${encodeURIComponent(group)}`}
                  className={`sidebar-link ${!isDocs && !isPlayground && ((!isDetail && category === group) || (isDetail && selectedCategory === group)) ? 'active' : ''}`}
                >
                  <Icon />
                  {group}
                  <span className="sidebar-count">
                    {components.filter((c) => c.category === group).length}
                  </span>
                </a>
                {isDetail &&
                  selectedCategory === group &&
                  components
                    .filter((c) => c.category === group)
                    .map((c) => (
                      <a
                        key={c.id}
                        href={`#/components/${c.id}`}
                        className={`sidebar-link sidebar-component ${c.id === componentId ? 'active' : ''}`}
                      >
                        {c.name}
                      </a>
                    ))}
              </React.Fragment>
            )
          })}
          <div className="sidebar-label section">More possibilities</div>
          <a href="#/playground" className={`sidebar-link ${isPlayground ? 'active' : ''}`}>
            <Palette />
            Theme playground
          </a>
          <a
            href="#/docs/changelog"
            className={`sidebar-link ${isDocs && docPage === 'changelog' ? 'active' : ''}`}
          >
            <Sparkles />
            Changelog
            <span className="ml-auto size-1.5 rounded-full bg-primary" />
          </a>
          <a
            href="#/docs/credits"
            className={`sidebar-link ${isDocs && docPage === 'credits' ? 'active' : ''}`}
          >
            <Layers />
            Credits & attribution
          </a>
        </div>
        <div className="sidebar-footer">
          <div className="title">
            <Code2 size={13} className="text-primary" />
            Your code. Your canvas.
          </div>
          <p>
            Copy the source. Shape the details.
            <br />
            Make something unmistakably yours.
          </p>
          <a href="#/docs/installation">
            Start building
            <ArrowUpRight size={11} />
          </a>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="docs-content">
        <div className="breadcrumbs">
          <a href="#/components" aria-label="Home">
            <Home size={12} />
          </a>
          <ChevronRight size={11} />
          <a href={isDocs ? '#/docs/introduction' : '#/components'}>
            {isDocs ? 'Documentation' : isPlayground ? 'Customize' : 'Components'}
          </a>
          <ChevronRight size={11} />
          <span className="current">
            {!isDetail && !isDocs && !isPlayground && category === 'all'
              ? 'Overview'
              : currentLabel}
          </span>
        </div>
        {isDetail ? (
          <Detail key={componentId} id={componentId} settings={settings} />
        ) : isDocs ? (
          <DocumentPage page={docPage} />
        ) : isPlayground ? (
          <Playground settings={settings} onChange={setSettings} />
        ) : (
          <Catalog
            category={category}
            query={query}
            setQuery={setQuery}
            view={view}
            setView={setView}
          />
        )}
        <Footer />
      </main>
      <Sheet open={themeOpen} onOpenChange={setThemeOpen}>
        <SheetContent className="overflow-auto">
          <SheetHeader>
            <SheetTitle>Your design language.</SheetTitle>
            <SheetDescription>A few small details. A whole new personality.</SheetDescription>
          </SheetHeader>
          <ThemeControls settings={settings} onChange={setSettings} />
          <div className="px-6">
            <Button variant="outline" size="sm" asChild>
              <a href="#/playground" onClick={() => setThemeOpen(false)}>
                Open the playground
                <ArrowUpRight />
              </a>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find your next building block"
        description="Search components and documentation"
      >
        <CommandInput placeholder="What would you like to build?" />
        <CommandList>
          <CommandEmpty>No matches. Try another idea.</CommandEmpty>
          <CommandGroup heading="Documentation">
            {navDocs.map(([id, title, Icon]) => (
              <CommandItem key={id} onSelect={() => navigate(`#/docs/${id}`)}>
                <Icon size={15} />
                {title}
              </CommandItem>
            ))}
            <CommandItem onSelect={() => navigate('#/playground')}>
              <Palette />
              Theme playground
            </CommandItem>
          </CommandGroup>
          {categories.map((group) => (
            <CommandGroup key={group} heading={group}>
              {components
                .filter((c) => c.category === group)
                .map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.name} ${c.keywords}`}
                    onSelect={() => navigate(`#/components/${c.id}`)}
                  >
                    <Box size={14} />
                    {c.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  )
}
