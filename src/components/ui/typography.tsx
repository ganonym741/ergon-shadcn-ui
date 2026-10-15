import * as React from 'react'
import { Copy, Check, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'blockquote' | 'code'
  muted?: boolean
  copyable?: boolean
  editable?: boolean
  onTextChange?: (text: string) => void
  ellipsis?: number
  expandable?: boolean
  tooltip?: string
  editTrigger?: 'icon' | 'text' | 'doubleClick'
}
export function Typography({
  as: Tag = 'p',
  muted,
  copyable,
  editable,
  onTextChange,
  ellipsis,
  expandable,
  tooltip,
  editTrigger = 'icon',
  children,
  className,
  style,
  ...props
}: TypographyProps) {
  const [copied, setCopied] = React.useState(false),
    [editing, setEditing] = React.useState(false),
    [expanded, setExpanded] = React.useState(false),
    [draft, setDraft] = React.useState(String(children))
  const committed = React.useRef(false)
  const start = () => {
    committed.current = false
    setDraft(String(children))
    setEditing(true)
  }
  const commit = () => {
    if (committed.current) return
    committed.current = true
    onTextChange?.(draft)
    setEditing(false)
  }
  return (
    <Tag
      className={cn(
        'leading-relaxed',
        Tag === 'h1' && 'text-4xl font-semibold tracking-tight',
        Tag === 'h2' && 'text-3xl font-semibold tracking-tight',
        Tag === 'h3' && 'text-xl font-semibold',
        Tag === 'blockquote' && 'border-l-2 pl-5 italic',
        Tag === 'code' && 'rounded bg-muted px-1.5 py-0.5 font-mono text-sm',
        muted && 'text-muted-foreground',
        className,
      )}
      style={style}
      {...props}
    >
      {editing ? (
        <input
          autoFocus
          aria-label="Edit text"
          value={draft}
          className="rounded border bg-background px-2 font-[inherit] outline-ring"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              committed.current = true
              setEditing(false)
            }
          }}
        />
      ) : (
        <span
          title={tooltip ?? (ellipsis ? String(children) : undefined)}
          onClick={editable && editTrigger === 'text' ? start : undefined}
          onDoubleClick={editable && editTrigger === 'doubleClick' ? start : undefined}
          style={
            ellipsis && !expanded
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: ellipsis,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }
              : undefined
          }
        >
          {children}
        </span>
      )}
      {ellipsis && expandable && (
        <button
          type="button"
          className="mt-1 text-sm text-primary"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      {copyable && (
        <button
          type="button"
          aria-label="Copy text"
          className="ml-2 inline-flex text-muted-foreground"
          onClick={async () => {
            await navigator.clipboard.writeText(String(children))
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      )}
      {editable && !editing && editTrigger === 'icon' && (
        <button
          type="button"
          aria-label="Edit text"
          className="ml-2 inline-flex text-muted-foreground hover:text-primary"
          onClick={start}
        >
          <Pencil size={13} />
        </button>
      )}
    </Tag>
  )
}
