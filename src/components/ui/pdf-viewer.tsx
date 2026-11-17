import * as React from 'react'
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask, TextLayer } from 'pdfjs-dist'
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCw,
  Download,
  Search,
  PanelLeft,
  LoaderCircle,
  Maximize,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useControllableState } from '@/components/ui/util'
import { clamp, productURL, useAsyncAction } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export interface PDFSearchResult {
  page: number
  excerpt: string
  occurrences: number
}
export interface PDFViewerProps extends Omit<
  React.ComponentProps<'section'>,
  'onLoad' | 'onError'
> {
  source: string | Blob | Uint8Array
  workerSrc: string
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  scale?: number
  defaultScale?: number
  onScaleChange?: (scale: number) => void
  height?: number
  label?: string
  textLayer?: boolean
  showThumbnails?: boolean
  searchable?: boolean
  maxSearchPages?: number
  /** HTTP headers require an HTTPS source. Memoize functions, typed arrays and class instances; plain option contents are compared structurally. */
  documentOptions?: Omit<DocumentInitParameters, 'url' | 'data' | 'worker'>
  onDocumentLoad?: (info: { pages: number; fingerprints: (string | null)[] }) => void
  onError?: (error: Error) => void
  onDownload?: (source: PDFViewerProps['source']) => void | Promise<void>
  filename?: string
}
type Engine = typeof import('pdfjs-dist')
type DocumentInitParameters = NonNullable<Parameters<Engine['getDocument']>[0]>
function pdfSourceURL(value: string) {
  const url = productURL(value, true)
  return url && !url.startsWith('data:') ? url : undefined
}
interface PDFContext {
  pdf: PDFDocumentProxy | null
  engine: Engine | null
  page: number
  setPage: (page: number) => void
  scale: number
  setScale: (scale: number) => void
  rotation: number
  setRotation: (rotation: number) => void
  loading: boolean
  error: string
  query: string
  setQuery: (query: string) => void
  results: PDFSearchResult[]
  searching: boolean
  searchError: string
  searchLimit: number
  maxSearchPages: number
  thumbnails: boolean
  setThumbnails: (value: boolean) => void
  searchable: boolean
  textLayer: boolean
  height: number
  source: PDFViewerProps['source']
  onDownload?: PDFViewerProps['onDownload']
  filename: string
  host: React.RefObject<HTMLDivElement | null>
}
const Context = React.createContext<PDFContext | null>(null),
  EMPTY_OPTIONS = {}
const optionIds = new WeakMap<object, number>()
let nextOptionId = 0
/** Compares JSON-style options by content and preserves identity for PDF.js factories and binary assets. */
function pdfOptionsKey(value: unknown, parents = new Set<object>()): string {
  if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
    const object = value as object
    if (
      !parents.has(object) &&
      (Array.isArray(value) ||
        Object.getPrototypeOf(value) === Object.prototype ||
        Object.getPrototypeOf(value) === null)
    ) {
      const seen = new Set(parents).add(object)
      return Array.isArray(value)
        ? `[${value.map((item) => pdfOptionsKey(item, seen)).join(',')}]`
        : `{${Object.keys(object)
            .sort()
            .map(
              (key) =>
                `${JSON.stringify(key)}:${pdfOptionsKey((value as Record<string, unknown>)[key], seen)}`,
            )
            .join(',')}}`
    }
    if (!optionIds.has(object)) optionIds.set(object, ++nextOptionId)
    return `ref:${optionIds.get(object)}`
  }
  return JSON.stringify([typeof value, String(value)])
}
const usePDF = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('PDF parts need PDFViewer.')
  return c
}
/** Lazy PDF.js viewer. Supply the matching worker URL from your bundler or self-hosted assets. */
export function PDFViewer({
  source,
  workerSrc,
  page,
  defaultPage = 1,
  onPageChange,
  scale,
  defaultScale = 1,
  onScaleChange,
  height = 600,
  label = 'PDF document',
  textLayer = true,
  showThumbnails = false,
  searchable = true,
  maxSearchPages = 500,
  documentOptions = EMPTY_OPTIONS,
  onDocumentLoad,
  onError,
  onDownload,
  filename = 'document.pdf',
  children,
  className,
  ...props
}: PDFViewerProps) {
  const [pdf, setPDF] = React.useState<PDFDocumentProxy | null>(null),
    [engine, setEngine] = React.useState<Engine | null>(null),
    [loading, setLoading] = React.useState(true),
    [error, setError] = React.useState(''),
    [rotation, setRotation] = React.useState(0),
    [query, setQuery] = React.useState(''),
    [results, setResults] = React.useState<PDFSearchResult[]>([]),
    [searching, setSearching] = React.useState(false),
    [searchError, setSearchError] = React.useState(''),
    [searchLimit, setSearchLimit] = React.useState(0),
    [thumbnails, setThumbnails] = React.useState(showThumbnails),
    [password, setPassword] = React.useState<{
      update: (value: string) => void
      incorrect: boolean
    } | null>(null),
    [passwordText, setPasswordText] = React.useState(''),
    [reload, setReload] = React.useState(0),
    host = React.useRef<HTMLDivElement>(null),
    latest = React.useRef({ onDocumentLoad, onError })
  const [currentPage, setCurrentPage] = useControllableState({
      value: page,
      defaultValue: defaultPage,
      onChange: onPageChange,
    }),
    [currentScale, setCurrentScale] = useControllableState({
      value: scale,
      defaultValue: defaultScale,
      onChange: onScaleChange,
    })
  const optionsKey = pdfOptionsKey(documentOptions),
    options = React.useRef(documentOptions)
  React.useLayoutEffect(() => {
    latest.current = { onDocumentLoad, onError }
    options.current = documentOptions
  }, [onDocumentLoad, onError, documentOptions])
  React.useEffect(() => {
    let active = true,
      task: PDFDocumentLoadingTask | undefined
    setLoading(true)
    setError('')
    setPDF(null)
    setPassword(null)
    setQuery('')
    void (async () => {
      try {
        if (!workerSrc) throw new Error('Pass workerSrc for the installed PDF.js version.')
        const module = await import('pdfjs-dist')
        if (!active) return
        module.GlobalWorkerOptions.workerSrc = workerSrc
        const data =
          typeof source === 'string'
            ? { url: pdfSourceURL(source) }
            : {
                data:
                  source instanceof Uint8Array
                    ? source.slice()
                    : new Uint8Array(await source.arrayBuffer()),
              }
        if ('url' in data && !data.url) throw new Error('Unsupported PDF source URL.')
        if (
          'url' in data &&
          options.current?.httpHeaders &&
          Object.keys(options.current.httpHeaders).length &&
          new URL(data.url!, document.baseURI).protocol !== 'https:'
        )
          throw new Error('PDF requests with httpHeaders require an HTTPS source.')
        if (!active) return
        task = module.getDocument({
          ...options.current,
          ...data,

          enableXfa: false,
        })
        task.onPassword = (update: (value: string) => void, reason: number) => {
          if (active) {
            setPassword({
              update,
              incorrect: reason === module.PasswordResponses.INCORRECT_PASSWORD,
            })
            setPasswordText('')
          }
        }
        const doc = await task.promise
        if (!active) {
          void task.destroy()
          return
        }
        setEngine(module)
        setPDF(doc)
        setLoading(false)
        setPassword(null)
        latest.current.onDocumentLoad?.({ pages: doc.numPages, fingerprints: doc.fingerprints })
      } catch (failure) {
        if (active) {
          const issue = failure instanceof Error ? failure : new Error('The PDF could not load.')
          setError(issue.message)
          setLoading(false)
          setPassword(null)
          latest.current.onError?.(issue)
        }
      }
    })()
    return () => {
      active = false
      void task?.destroy()
    }
  }, [source, workerSrc, optionsKey, reload])
  React.useEffect(() => {
    let active = true
    setResults([])
    setSearchError('')
    setSearchLimit(0)
    if (!pdf || !query.trim()) {
      setSearching(false)
      return
    }
    setSearching(true)
    const needle = query.trim().toLowerCase(),
      limit = Math.min(pdf.numPages, Math.floor(clamp(maxSearchPages, 1, 2000)))
    const timer = setTimeout(
      () =>
        void (async () => {
          const found: PDFSearchResult[] = []
          try {
            for (let page = 1; page <= limit && active; page++) {
              const target = await pdf.getPage(page),
                content = await target.getTextContent()
              if (!active) return
              const text = content.items
                  .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
                  .join(''),
                lower = text.toLowerCase()
              let index = lower.indexOf(needle),
                count = 0
              const first = index
              while (index >= 0) {
                count++
                index = lower.indexOf(needle, index + needle.length)
              }
              if (count)
                found.push({
                  page,
                  occurrences: count,
                  excerpt: `${first > 35 ? '…' : ''}${text.slice(Math.max(0, first - 35), first + needle.length + 65)}…`,
                })
              setSearchLimit(page)
              if (found.length >= 250) break
            }
            if (active) setResults(found)
          } catch (failure) {
            if (active)
              setSearchError(failure instanceof Error ? failure.message : 'Search failed.')
          } finally {
            if (active) setSearching(false)
          }
        })(),
      180,
    )
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [pdf, query, maxSearchPages])
  const selected = pdf ? Math.floor(clamp(currentPage, 1, pdf.numPages)) : 1,
    zoom = clamp(currentScale, 0.25, 3)
  return (
    <section
      {...props}
      data-slot="pdf-viewer"
      aria-label={label}
      className={cn('w-full min-w-0 overflow-hidden rounded-xl border bg-background', className)}
    >
      <Context.Provider
        value={{
          pdf,
          engine,
          page: selected,
          setPage: (next) => setCurrentPage(Math.floor(clamp(next, 1, pdf?.numPages ?? 1))),
          scale: zoom,
          setScale: (next) => setCurrentScale(clamp(next, 0.25, 3)),
          rotation,
          setRotation,
          loading,
          error,
          query,
          setQuery,
          results,
          searching,
          searchError,
          searchLimit,
          maxSearchPages,
          thumbnails,
          setThumbnails,
          searchable,
          textLayer,
          height: clamp(height, 240, 1400),
          source,
          onDownload,
          filename,
          host,
        }}
      >
        {password ? (
          <form
            className="space-y-3 p-5"
            onSubmit={(event) => {
              event.preventDefault()
              password.update(passwordText)
              setPasswordText('')
            }}
          >
            <p className="text-sm font-medium">This PDF is password protected.</p>
            {password.incorrect && (
              <p role="alert" className="text-xs text-destructive">
                Incorrect password. Try again.
              </p>
            )}
            <Input
              type="password"
              aria-label="PDF password"
              autoComplete="off"
              value={passwordText}
              onValueChange={setPasswordText}
            />
            <Button type="submit" disabled={!passwordText}>
              Unlock PDF
            </Button>
          </form>
        ) : error ? (
          <div className="space-y-3 p-5">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setReload((value) => value + 1)}
            >
              Retry PDF
            </Button>
          </div>
        ) : (
          (children ?? (
            <>
              <PDFViewerToolbar />
              <div className="flex min-w-0">
                {thumbnails && <PDFViewerThumbnails />}
                <PDFViewerPage />
              </div>
              {query.trim() && <PDFViewerSearchResults />}
            </>
          ))
        )}
      </Context.Provider>
    </section>
  )
}
export function PDFViewerToolbar() {
  const c = usePDF(),
    action = useAsyncAction()
  const download = () =>
    void action.run(async () => {
      if (c.onDownload) {
        await c.onDownload(c.source)
        return
      }
      const temporary = typeof c.source !== 'string',
        href = temporary
          ? URL.createObjectURL(
              c.source instanceof Blob
                ? c.source
                : new Blob([new Uint8Array(c.source as Uint8Array)]),
            )
          : pdfSourceURL(c.source as string)
      if (!href) throw new Error('Unsupported download URL.')
      const a = document.createElement('a')
      a.href = href
      a.download = c.filename
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
      if (temporary) setTimeout(() => URL.revokeObjectURL(href), 0)
    })
  return (
    <div className="space-y-2 border-b p-2">
      <div role="toolbar" aria-label="PDF controls" className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle PDF thumbnails"
          aria-pressed={c.thumbnails}
          disabled={!c.pdf}
          onClick={() => c.setThumbnails(!c.thumbnails)}
        >
          <PanelLeft />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Previous PDF page"
          disabled={!c.pdf || c.page <= 1}
          onClick={() => c.setPage(c.page - 1)}
        >
          <ChevronLeft className="rtl:rotate-180" />
        </Button>
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Input
            type="number"
            aria-label="PDF page number"
            value={c.page}
            min={1}
            max={c.pdf?.numPages ?? 1}
            disabled={!c.pdf}
            onChange={(event) => {
              if (Number.isFinite(event.target.valueAsNumber)) c.setPage(event.target.valueAsNumber)
            }}
            className="h-8 w-14 px-1 text-center text-xs"
          />
          <span>/ {c.pdf?.numPages ?? '—'}</span>
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Next PDF page"
          disabled={!c.pdf || c.page >= (c.pdf?.numPages ?? 1)}
          onClick={() => c.setPage(c.page + 1)}
        >
          <ChevronRight className="rtl:rotate-180" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out PDF"
          disabled={!c.pdf || c.scale <= 0.25}
          onClick={() => c.setScale(c.scale - 0.25)}
        >
          <Minus />
        </Button>
        <span className="w-10 text-center text-[10px] tabular-nums">
          {Math.round(c.scale * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in PDF"
          disabled={!c.pdf || c.scale >= 3}
          onClick={() => c.setScale(c.scale + 0.25)}
        >
          <Plus />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Rotate PDF clockwise"
          disabled={!c.pdf}
          onClick={() => c.setRotation((c.rotation + 90) % 360)}
        >
          <RotateCw />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fit PDF width"
          disabled={!c.pdf}
          onClick={() => {
            void c.pdf?.getPage(c.page).then((page) => {
              const viewport = page.getViewport({
                scale: 1,
                rotation: ((page.rotate ?? 0) + c.rotation) % 360,
              })
              c.setScale(((c.host.current?.clientWidth ?? 600) - 32) / viewport.width)
            })
          }}
        >
          <Maximize />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Download PDF"
          disabled={!c.pdf || action.busy}
          onClick={download}
        >
          <Download />
        </Button>
      </div>
      {c.searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search PDF text"
            placeholder="Find in document…"
            value={c.query}
            onValueChange={c.setQuery}
            disabled={!c.pdf}
            className="h-9 ps-9"
          />
        </div>
      )}
      {action.error && (
        <p role="alert" className="text-xs text-destructive">
          {action.error}
        </p>
      )}
    </div>
  )
}
/** Text-layer CSS adapted from PDF.js. Copyright 2014 Mozilla Foundation. Apache-2.0; retained license: LICENSES/pdfjs.txt. */
const TEXT_STYLES = `.ergon-pdf-layer{position:absolute;inset:0;overflow:clip;line-height:1;text-align:initial;letter-spacing:normal;word-spacing:normal;transform-origin:0 0;--min-font-size:1;--scale-round-x:1px;--scale-round-y:1px;--text-scale-factor:calc(var(--total-scale-factor)*var(--min-font-size));--min-font-size-inv:calc(1/var(--min-font-size));}.ergon-pdf-layer :is(span,br){position:absolute;white-space:pre;color:transparent;cursor:text;transform-origin:0 0;user-select:text;}.ergon-pdf-layer>:not(.markedContent),.ergon-pdf-layer .markedContent span:not(.markedContent){font-size:calc(var(--text-scale-factor)*var(--font-height,0px));transform:rotate(var(--rotate,0deg)) scaleX(var(--scale-x,1)) scale(var(--min-font-size-inv));}.ergon-pdf-layer ::selection{background:#5579bd66;}.ergon-pdf-layer [data-search-match]{background:#ffc40066;}.ergon-pdf-layer[data-main-rotation="90"]{transform:rotate(90deg) translateY(-100%)}.ergon-pdf-layer[data-main-rotation="180"]{transform:rotate(180deg) translate(-100%,-100%)}.ergon-pdf-layer[data-main-rotation="270"]{transform:rotate(270deg) translateX(-100%)}`
export function PDFViewerPage() {
  const c = usePDF()
  return (
    <div
      ref={c.host}
      tabIndex={0}
      aria-label="PDF page viewport"
      className="min-w-0 flex-1 overflow-auto bg-muted/50 p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      style={{ height: c.height }}
    >
      {c.loading ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"
        >
          <LoaderCircle className="size-4 animate-spin" />
          Loading PDF engine…
        </p>
      ) : (
        c.pdf && (
          <PDFPageCanvas
            page={c.page}
            scale={c.scale}
            rotation={c.rotation}
            selectable={c.textLayer}
            query={c.query}
          />
        )
      )}
    </div>
  )
}
function PDFPageCanvas({
  page,
  scale,
  rotation = 0,
  selectable = false,
  query = '',
}: {
  page: number
  scale: number
  rotation?: number
  selectable?: boolean
  query?: string
}) {
  const c = usePDF(),
    canvas = React.useRef<HTMLCanvasElement>(null),
    layer = React.useRef<HTMLDivElement>(null),
    previous = React.useRef<RenderTask | null>(null),
    [size, setSize] = React.useState({ width: 1, height: 1 }),
    [error, setError] = React.useState(''),
    [ready, setReady] = React.useState(false)
  React.useEffect(() => {
    let active = true,
      task: RenderTask | undefined,
      text: TextLayer | undefined
    setReady(false)
    setError('')
    void (async () => {
      try {
        await previous.current?.promise.catch(() => {})
        if (!active || !c.pdf || !c.engine || !canvas.current) return
        const target = await c.pdf.getPage(page)
        if (!active || !canvas.current) return
        const viewport = target.getViewport({
            scale,
            rotation: ((target.rotate ?? 0) + rotation) % 360,
          }),
          output = Math.min(2, window.devicePixelRatio || 1),
          el = canvas.current
        setSize({ width: viewport.width, height: viewport.height })
        el.width = Math.floor(viewport.width * output)
        el.height = Math.floor(viewport.height * output)
        el.style.width = `${viewport.width}px`
        el.style.height = `${viewport.height}px`
        task = target.render({
          canvas: el,
          viewport,
          transform: output === 1 ? undefined : [output, 0, 0, output, 0, 0],
        })
        previous.current = task
        await task.promise
        if (!active) return
        if (selectable && layer.current) {
          layer.current.replaceChildren()
          layer.current.style.setProperty(
            '--total-scale-factor',
            String(viewport.scale * viewport.userUnit),
          )
          const textContent = await target.getTextContent()
          if (!active || !layer.current) return
          text = new c.engine.TextLayer({
            textContentSource: textContent,
            container: layer.current,
            viewport,
          })
          await text.render()
        }
        if (active) setReady(true)
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : 'Page rendering failed.')
      }
    })()
    return () => {
      active = false
      task?.cancel()
      text?.cancel()
    }
  }, [c.pdf, c.engine, page, scale, rotation, selectable])
  React.useEffect(() => {
    if (!ready || !layer.current) return
    const needle = query.trim().toLowerCase()
    for (const span of layer.current.querySelectorAll('span'))
      span.toggleAttribute(
        'data-search-match',
        !!needle && !!span.textContent?.toLowerCase().includes(needle),
      )
  }, [query, ready])
  return (
    <div
      className="relative mx-auto bg-white shadow-sm"
      style={{ width: size.width, height: size.height }}
      aria-label={`PDF page ${page}`}
      aria-busy={!ready}
    >
      <canvas ref={canvas} aria-label={`Rendered PDF page ${page}`} role="img" />
      {selectable && (
        <>
          <style>{TEXT_STYLES}</style>
          <div ref={layer} className="ergon-pdf-layer" />
        </>
      )}
      {error && (
        <p
          role="alert"
          className="absolute start-0 top-0 bg-background p-3 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
export function PDFViewerThumbnails() {
  const c = usePDF()
  return (
    <aside
      aria-label="PDF page thumbnails"
      className="w-24 shrink-0 space-y-3 overflow-auto border-e bg-muted/20 p-2 sm:w-32"
      style={{ height: c.height }}
    >
      {Array.from({ length: Math.min(c.pdf?.numPages ?? 0, 300) }, (_, index) => (
        <PDFThumbnail key={index} page={index + 1} />
      ))}
      {(c.pdf?.numPages ?? 0) > 300 && (
        <p className="text-[10px] text-muted-foreground">
          Showing the first 300 thumbnails. Use page navigation for the rest.
        </p>
      )}
    </aside>
  )
}
function PDFThumbnail({ page }: { page: number }) {
  const c = usePDF(),
    host = React.useRef<HTMLButtonElement>(null),
    [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' },
    )
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  return (
    <button
      ref={host}
      type="button"
      aria-label={`Go to PDF page ${page}`}
      aria-current={c.page === page ? 'page' : undefined}
      onClick={() => c.setPage(page)}
      className={cn(
        'block w-full overflow-hidden rounded border bg-background p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        c.page === page && 'border-primary ring-1 ring-primary',
      )}
    >
      {visible ? (
        <div className="pointer-events-none origin-top-left scale-[.8] sm:scale-100">
          <PDFPageCanvas page={page} scale={0.12} />
        </div>
      ) : (
        <div className="h-24 bg-muted" />
      )}
      <span className="block pt-1 text-[10px]">{page}</span>
    </button>
  )
}
export function PDFViewerSearchResults() {
  const c = usePDF()
  return (
    <div className="max-h-48 space-y-2 overflow-auto border-t p-3">
      {c.searchError && (
        <p role="alert" className="text-xs text-destructive">
          {c.searchError}
        </p>
      )}
      <p role="status" className="text-xs text-muted-foreground">
        {c.searching
          ? 'Searching…'
          : `${c.results.reduce((count, result) => count + result.occurrences, 0)} matches in ${c.results.length} pages`}
        {!c.searching && c.pdf && c.searchLimit < c.pdf.numPages
          ? ` · searched ${c.searchLimit} of ${c.pdf.numPages} pages`
          : ''}
      </p>
      {c.results.map((result) => (
        <button
          key={result.page}
          type="button"
          className="block w-full rounded-lg border p-2 text-start text-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => c.setPage(result.page)}
        >
          <span className="font-medium">
            Page {result.page} · {result.occurrences} matches
          </span>
          <span className="mt-1 block text-muted-foreground">{result.excerpt}</span>
        </button>
      ))}
    </div>
  )
}
