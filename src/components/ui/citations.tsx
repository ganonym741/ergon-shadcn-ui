import * as React from 'react'
import { ExternalLink, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { productURL } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export interface CitationSource {
  id: string
  title: string
  url?: string
  description?: string
  quote?: string
  document?: string
  page?: number
}
export interface CitationsProps extends React.ComponentProps<'section'> {
  sources: CitationSource[]
  label?: string
  defaultExpanded?: boolean
  onSourceOpen?: (source: CitationSource) => void
}
interface CitationContext {
  sources: CitationSource[]
  onSourceOpen?: CitationsProps['onSourceOpen']
}
const Context = React.createContext<CitationContext | null>(null)
const useCitations = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Citation parts need Citations.')
  return c
}
/** Source collections with inline references; URLs and quotes are supplied by the application. */
export function Citations({
  sources,
  label = 'Sources',
  defaultExpanded = true,
  onSourceOpen,
  children,
  className,
  ...props
}: CitationsProps) {
  const valid =
    sources.every((source) => source.id && source.title) &&
    new Set(sources.map((source) => source.id)).size === sources.length
  return (
    <Context.Provider value={{ sources, onSourceOpen }}>
      <section
        {...props}
        data-slot="citations"
        aria-label={label}
        className={cn('w-full min-w-0', className)}
      >
        {!valid ? (
          <p role="alert" className="text-sm text-destructive">
            Sources need unique IDs and titles.
          </p>
        ) : (
          (children ?? (
            <details open={defaultExpanded} className="rounded-xl border bg-background p-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                <FileText className="size-4 text-muted-foreground" />
                {sources.length} {label}
                <ChevronDown className="ms-auto size-4" />
              </summary>
              <CitationsList />
            </details>
          ))
        )}
      </section>
    </Context.Provider>
  )
}
/** One inline numeric reference with an accessible keyboard-triggered source preview. */
export function CitationReference({ sourceId, label }: { sourceId: string; label?: string }) {
  const c = useCitations(),
    index = c.sources.findIndex((source) => source.id === sourceId),
    source = c.sources[index]
  if (!source) return <span className="text-xs text-muted-foreground">[?]</span>
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mx-0.5 h-5 min-w-5 px-1 align-baseline text-[10px]"
          aria-label={label ?? `Source ${index + 1}: ${source.title}`}
        >
          {index + 1}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={`Source ${index + 1}: ${source.title}`}
        className="w-[min(22rem,calc(100vw-2rem))]"
      >
        <CitationCard source={source} />
      </PopoverContent>
    </Popover>
  )
}
/** Source list remains useful independently of inline markers. */
export function CitationsList() {
  const c = useCitations()
  return (
    <ol className="mt-3 space-y-2">
      {c.sources.map((source, index) => (
        <li key={source.id} className="flex items-start gap-2 rounded-lg border p-3">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]" dir="ltr">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <CitationCard source={source} />
          </div>
        </li>
      ))}
    </ol>
  )
}
export function CitationCard({ source }: { source: CitationSource }) {
  const c = useCitations(),
    href = source.url && productURL(source.url)
  return (
    <div className="space-y-2 break-words text-xs">
      <p className="font-medium">{source.title}</p>
      {source.document && (
        <p className="text-muted-foreground">
          {source.document}
          {source.page ? ` · page ${source.page}` : ''}
        </p>
      )}
      {source.description && (
        <p className="leading-relaxed text-muted-foreground">{source.description}</p>
      )}
      {source.quote && (
        <blockquote className="border-s-2 ps-3 text-muted-foreground">{source.quote}</blockquote>
      )}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => c.onSourceOpen?.(source)}
          className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
        >
          Open source
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  )
}
