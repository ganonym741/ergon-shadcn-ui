import * as React from 'react'
import type { Token, Marked } from 'marked'
import { CodeBlock, codeLanguages, type CodeLanguage } from '@/components/ui/code-block'
import { productURL, clamp } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
import { useTextStream, type TextStreamOptions } from '@/components/ui/text-stream'
export interface StreamingMarkdownProps
  extends Omit<React.ComponentProps<'div'>, 'children'>, TextStreamOptions {
  content: string
  streaming?: boolean
  breaks?: boolean
  allowImages?: boolean
  maxCharacters?: number
  renderCode?: (code: string, language: string) => React.ReactNode
  renderImage?: (image: { src: string; alt: string; title?: string }) => React.ReactNode
  /** An application renderer for fenced math, latex or mermaid blocks; no rendering engine is bundled. */
  renderMath?: (source: string) => React.ReactNode
  renderDiagram?: (source: string) => React.ReactNode
}
let engine: Promise<typeof import('marked')> | undefined
/** Decode character entities in an unattached text-only element; escape '<' before parsing. */
export function decodeMarkdownText(text: string) {
  if (!text.includes('&')) return text
  if (typeof document === 'undefined')
    return text.replace(
      /&(?:amp|lt|gt|quot|apos);/g,
      (entity) =>
        ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" })[entity]!,
    )
  const decoder = document.createElement('textarea')
  decoder.innerHTML = text.replace(/</g, '&lt;')
  return decoder.value
}
/** Lazily lexes Markdown into React elements. Raw HTML is displayed as text, never injected. */
export function StreamingMarkdown({
  content,
  streaming = false,
  textAnimation = 'typewriter',
  charactersPerSecond = 60,
  breaks = false,
  allowImages = true,
  maxCharacters = 150000,
  renderCode,
  renderImage,
  renderMath,
  renderDiagram,
  className,
  ...props
}: StreamingMarkdownProps) {
  const [parser, setParser] = React.useState<Marked | null>(null),
    [error, setError] = React.useState(''),
    limit = Math.floor(clamp(maxCharacters, 100, 1000000)),
    bounded = content.slice(0, limit)
  const { text: source, isRevealing } = useTextStream(bounded, {
    streaming,
    textAnimation,
    charactersPerSecond,
  })
  const busy = streaming || isRevealing
  React.useEffect(() => {
    let active = true
    ;(engine ??= import('marked')).then(
      (module) => {
        if (active) setParser(new module.Marked({ gfm: true }))
      },
      (failure) => {
        engine = undefined
        if (active)
          setError(failure instanceof Error ? failure.message : 'Markdown could not load.')
      },
    )
    return () => {
      active = false
    }
  }, [])
  const parsed = React.useMemo(() => {
    try {
      return { tokens: parser?.lexer(source, { gfm: true, breaks }) ?? null, error: '' }
    } catch (failure) {
      return {
        tokens: null,
        error: failure instanceof Error ? failure.message : 'Markdown could not be parsed.',
      }
    }
  }, [source, parser, breaks])
  const inline = (tokens: Token[] | undefined, fallback = ''): React.ReactNode =>
    tokens ? tokens.map((token, index) => render(token, `i${index}`)) : decodeMarkdownText(fallback)
  const render = (token: Token, key: string, depth = 0): React.ReactNode => {
    if (depth > 32) return null
    const nested = (tokens: Token[] | undefined, fallback = '') =>
      tokens
        ? tokens.map((t, index) => render(t, `${key}-${index}`, depth + 1))
        : decodeMarkdownText(fallback)
    switch (token.type) {
      case 'space':
      case 'def':
      case 'checkbox':
        return null
      case 'heading': {
        const Tag = `h${Math.min(6, Math.max(1, token.depth))}` as
          'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
        return (
          <Tag
            key={key}
            className={cn(
              'mt-5 mb-2 font-semibold tracking-tight first:mt-0',
              token.depth === 1 ? 'text-2xl' : token.depth === 2 ? 'text-xl' : 'text-base',
            )}
          >
            {nested(token.tokens, token.text)}
          </Tag>
        )
      }
      case 'paragraph':
        return (
          <p key={key} className="my-3 leading-relaxed first:mt-0 last:mb-0">
            {nested(token.tokens, token.text)}
          </p>
        )
      case 'text':
        return <React.Fragment key={key}>{nested(token.tokens, token.text)}</React.Fragment>
      case 'escape':
        return <React.Fragment key={key}>{decodeMarkdownText(token.text)}</React.Fragment>
      case 'strong':
        return <strong key={key}>{nested(token.tokens, token.text)}</strong>
      case 'em':
        return <em key={key}>{nested(token.tokens, token.text)}</em>
      case 'del':
        return <del key={key}>{nested(token.tokens, token.text)}</del>
      case 'codespan':
        return (
          <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[.85em]">
            {token.text}
          </code>
        )
      case 'br':
        return <br key={key} />
      case 'hr':
        return <hr key={key} className="my-5 border-border" />
      case 'blockquote':
        return (
          <blockquote key={key} className="my-4 border-s-2 ps-4 text-muted-foreground">
            {nested(token.tokens, token.text)}
          </blockquote>
        )
      case 'code': {
        const language = (token.lang ?? 'text').split(/\s/)[0].toLowerCase()
        return (
          <div key={key} className="my-4 min-w-0">
            {language === 'mermaid' && renderDiagram ? (
              renderDiagram(token.text)
            ) : ['math', 'latex'].includes(language) && renderMath ? (
              renderMath(token.text)
            ) : renderCode ? (
              renderCode(token.text, language)
            ) : (
              <CodeBlock
                code={token.text}
                language={
                  codeLanguages.includes(language as CodeLanguage)
                    ? (language as CodeLanguage)
                    : 'text'
                }
                lineNumbers={false}
              />
            )}
          </div>
        )
      }
      case 'link': {
        const href = productURL(token.href)
        return href ? (
          <a
            key={key}
            href={href}
            title={token.title ?? undefined}
            target={/^https?:/i.test(href) ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
          >
            {nested(token.tokens, token.text)}
          </a>
        ) : (
          <span key={key}>{nested(token.tokens, token.text)}</span>
        )
      }
      case 'image': {
        const src = allowImages && productURL(token.href, true)
        return src ? (
          <React.Fragment key={key}>
            {renderImage?.({ src, alt: token.text, title: token.title ?? undefined }) ?? (
              <img
                src={src}
                alt={token.text}
                title={token.title ?? undefined}
                loading="lazy"
                className="my-3 max-h-[32rem] max-w-full rounded-lg object-contain"
              />
            )}
          </React.Fragment>
        ) : (
          <span key={key} className="text-muted-foreground">
            {token.text}
          </span>
        )
      }
      case 'list': {
        const Tag = token.ordered ? 'ol' : 'ul'
        return (
          <Tag
            key={key}
            start={token.ordered ? Number(token.start) || 1 : undefined}
            className={cn('my-3 space-y-1 ps-6', token.ordered ? 'list-decimal' : 'list-disc')}
          >
            {token.items.map(
              (item: { tokens: Token[]; task?: boolean; checked?: boolean }, index: number) => (
                <li key={`${key}-${index}`} className={cn(item.task && 'list-none')}>
                  {item.task && (
                    <input
                      type="checkbox"
                      checked={!!item.checked}
                      readOnly
                      tabIndex={-1}
                      aria-label={item.checked ? 'Completed task' : 'Incomplete task'}
                      className="me-2 align-middle accent-primary"
                    />
                  )}
                  {nested(item.tokens)}
                </li>
              ),
            )}
          </Tag>
        )
      }
      case 'table':
        return (
          <div key={key} className="my-4 max-w-full overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {token.header.map((cell: { tokens: Token[] }, index: number) => (
                    <th
                      key={index}
                      className="border-b px-3 py-2 font-medium"
                      style={{ textAlign: token.align[index] ?? 'start' }}
                    >
                      {nested(cell.tokens)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {token.rows.map((row: { tokens: Token[] }[], index: number) => (
                  <tr key={index} className="border-b last:border-0">
                    {row.map((cell, column) => (
                      <td
                        key={column}
                        className="px-3 py-2"
                        style={{ textAlign: token.align[column] ?? 'start' }}
                      >
                        {inline(cell.tokens)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'html':
        return <span key={key}>{token.text}</span>
      default:
        return (
          <React.Fragment key={key}>
            {typeof token.raw === 'string' ? token.raw : ''}
          </React.Fragment>
        )
    }
  }
  return (
    <div
      {...props}
      data-slot="streaming-markdown"
      aria-busy={busy}
      data-revealing={isRevealing}
      className={cn('min-w-0 break-words text-sm text-foreground', className)}
    >
      {error || parsed.error ? (
        <>
          <p role="alert" className="text-destructive">
            {error || parsed.error}
          </p>
          <p className="whitespace-pre-wrap">{source}</p>
        </>
      ) : parsed.tokens ? (
        parsed.tokens.map((token, index) => render(token, `b${index}`))
      ) : (
        <p className="whitespace-pre-wrap">{source}</p>
      )}
      {content.length > limit && (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          Preview limited to {limit.toLocaleString()} characters.
        </p>
      )}
      {busy && (
        <span
          role="status"
          aria-label="Response streaming"
          className="mt-2 inline-block size-2 animate-pulse rounded-full bg-primary"
        />
      )}
    </div>
  )
}
