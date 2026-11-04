import * as React from 'react'
import { Check, Copy, Download, WrapText } from 'lucide-react'
import type { ThemedTokenWithVariants } from 'shiki/core'
import { Button } from '@/components/ui/button'
import { highlightCode, type CodeLanguage } from '@/components/ui/code-highlighter'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'

export { codeLanguages, type CodeLanguage } from '@/components/ui/code-highlighter'
export interface CodeBlockProps extends Omit<React.ComponentProps<'figure'>, 'onCopy'> {
  code: string
  language?: CodeLanguage
  filename?: string
  label?: string
  lineNumbers?: boolean
  startLine?: number
  highlightedLines?: number[]
  wrap?: boolean
  defaultWrap?: boolean
  onWrapChange?: (wrap: boolean) => void
  copyable?: boolean
  downloadable?: boolean
  maxHighlightLength?: number
  onCopy?: (code: string) => void | Promise<void>
}
interface CodeContext {
  code: string
  filename: string
  language: CodeLanguage
  lineNumbers: boolean
  startLine: number
  highlightedLines: number[]
  wrap: boolean
  setWrap: (value: boolean) => void
  copyable: boolean
  downloadable: boolean
  onCopy?: CodeBlockProps['onCopy']
  tokens: ThemedTokenWithVariants[][] | null
  status: string
  setStatus: (status: string) => void
}
const Context = React.createContext<CodeContext | null>(null)
function useCode() {
  const context = React.useContext(Context)
  if (!context) throw new Error('CodeBlock parts need CodeBlock.')
  return context
}
/** Shows source as escaped React text and lazily highlights bounded code with grammar-specific imports. */
export function CodeBlock({
  code,
  language = 'text',
  filename = '',
  label = 'Code example',
  lineNumbers = true,
  startLine = 1,
  highlightedLines = [],
  wrap,
  defaultWrap = false,
  onWrapChange,
  copyable = true,
  downloadable = false,
  maxHighlightLength = 100000,
  onCopy,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [wrapped, setWrap] = useControllableState({
      value: wrap,
      defaultValue: defaultWrap,
      onChange: onWrapChange,
    }),
    [result, setResult] = React.useState<{
      code: string
      language: CodeLanguage
      tokens: ThemedTokenWithVariants[][]
    } | null>(null),
    [status, setStatus] = React.useState('')
  React.useEffect(() => {
    let stale = false
    setStatus('')
    setResult(null)
    if (
      code.length >
      Math.min(
        500000,
        Math.max(0, Number.isFinite(maxHighlightLength) ? maxHighlightLength : 100000),
      )
    ) {
      setStatus('Syntax highlighting skipped for large content.')
      return
    }
    if (language === 'text') return
    highlightCode(code, language)
      .then((tokens) => {
        if (!stale) setResult({ code, language, tokens })
      })
      .catch(() => {
        if (!stale) setStatus('Syntax highlighting unavailable. Plain text is shown.')
      })
    return () => {
      stale = true
    }
  }, [code, language, maxHighlightLength])
  const tokens = result?.code === code && result.language === language ? result.tokens : null
  return (
    <Context.Provider
      value={{
        code,
        filename,
        language,
        lineNumbers,
        startLine: Number.isFinite(startLine) ? Math.max(1, Math.floor(startLine)) : 1,
        highlightedLines,
        wrap: wrapped,
        setWrap,
        copyable,
        downloadable,
        onCopy,
        tokens,
        status,
        setStatus,
      }}
    >
      <figure
        {...props}
        aria-label={label}
        data-slot="code-block"
        className={cn('min-w-0 overflow-hidden rounded-xl border bg-muted/20', className)}
      >
        {children ?? (
          <>
            <CodeBlockHeader />
            <CodeBlockContent />
          </>
        )}
        <p
          role="status"
          className={cn(status ? 'border-t px-4 py-2 text-xs text-muted-foreground' : 'sr-only')}
        >
          {status}
        </p>
      </figure>
    </Context.Provider>
  )
}
/** Provides independently composable filename, wrapping, copy, and local download actions. */
export function CodeBlockHeader({ className, ...props }: React.ComponentProps<'figcaption'>) {
  const c = useCode()
  const copy = async () => {
    try {
      if (c.onCopy) await c.onCopy(c.code)
      else await navigator.clipboard.writeText(c.code)
      c.setStatus('Code copied.')
    } catch {
      c.setStatus('Could not copy code.')
    }
  }
  return (
    <figcaption
      {...props}
      className={cn('flex flex-wrap items-center gap-2 border-b px-3 py-2', className)}
    >
      <span className="min-w-0 flex-1 truncate text-xs font-medium">
        {c.filename || c.language}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Wrap code"
        aria-pressed={c.wrap}
        onClick={() => c.setWrap(!c.wrap)}
      >
        <WrapText className="size-4" />
      </Button>
      {c.copyable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Copy code"
          onClick={() => void copy()}
        >
          {c.status === 'Code copied.' ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      )}
      {c.downloadable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Download code"
          onClick={() => {
            const url = URL.createObjectURL(
                new Blob([c.code], { type: 'text/plain;charset=utf-8' }),
              ),
              link = document.createElement('a')
            link.href = url
            link.download = c.filename || 'code.txt'
            link.click()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          }}
        >
          <Download className="size-4" />
        </Button>
      )}
    </figcaption>
  )
}
/** Renders line numbers separately from selectable code, with optional line emphasis and wrapping. */
export function CodeBlockContent({ className, ...props }: React.ComponentProps<'pre'>) {
  const c = useCode(),
    lines = c.code.split('\n')
  return (
    <pre
      {...props}
      dir="ltr"
      tabIndex={0}
      className={cn(
        'max-h-[36rem] overflow-auto py-4 text-left text-[13px] leading-6',
        c.wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
        className,
      )}
    >
      <code className="block">
        {lines.map((line, index) => (
          <span
            key={index}
            data-line={c.startLine + index}
            className={cn(
              'flex min-h-6 px-4',
              c.highlightedLines.includes(c.startLine + index) &&
                'bg-primary/10 shadow-[inset_3px_0_0_var(--primary)]',
            )}
          >
            {c.lineNumbers && (
              <span
                aria-hidden="true"
                className="me-5 w-8 shrink-0 select-none text-right text-muted-foreground/60"
              >
                {c.startLine + index}
              </span>
            )}
            <span className="min-w-0 flex-1">
              {c.tokens?.[index]
                ? c.tokens[index].map((token, i) => (
                    <span
                      key={i}
                      className="[color:var(--code-light)] dark:[color:var(--code-dark)]"
                      style={
                        {
                          '--code-light': `color-mix(in srgb,${token.variants.light?.color ?? 'var(--foreground)'} 80%,var(--foreground))`,
                          '--code-dark': `color-mix(in srgb,${token.variants.dark?.color ?? 'var(--foreground)'} 80%,var(--foreground))`,
                          fontStyle:
                            (token.variants.light?.fontStyle ?? 0) & 1 ? 'italic' : undefined,
                          fontWeight:
                            (token.variants.light?.fontStyle ?? 0) & 2 ? 'bold' : undefined,
                        } as React.CSSProperties
                      }
                    >
                      {token.content}
                    </span>
                  ))
                : line}
            </span>
            {index < lines.length - 1 ? '\n' : null}
          </span>
        ))}
      </code>
    </pre>
  )
}
