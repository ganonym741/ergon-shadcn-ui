import * as React from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import { toast } from 'sonner'
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 36" fill="none" aria-hidden="true">
      <path d="M4 4h24v6H11v6h14v6H11v6h17v6H4z" fill="currentColor" />
    </svg>
  )
}
export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="code-block">
      {title && (
        <div className="code-header">
          <Terminal size={12} />
          {title}
        </div>
      )}
      <pre>
        <code>{code}</code>
      </pre>
      <button
        className="copy-code"
        aria-label="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          } catch {
            toast.error('Unable to copy. Select and copy the code manually.')
          }
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  )
}
export function Footer() {
  return (
    <footer className="docs-footer">
      <span>
        Built on{' '}
        <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
          shadcn/ui
        </a>{' '}
        component source and community work. Yours to make your own.
      </span>
      <span className="footer-right">
        <a href="#/docs/credits">Attribution & licenses</a>
        <a href="#/docs/coverage">Feature coverage</a>
        <span>ErgonUI © 2026</span>
      </span>
    </footer>
  )
}
