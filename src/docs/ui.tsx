import * as React from 'react'
import { Check, Copy, Terminal } from 'lucide-react'
import { toast } from 'sonner'
export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M29.5 4H20C10.1 4 4 10.4 4 20s6.1 16 16 16h8.5a4.5 4.5 0 0 0 0-9H20c-4.4 0-7-2.7-7-7s2.6-7 7-7h9.5a4.5 4.5 0 0 0 0-9Z"
        fill="currentColor"
      />
      <path
        d="m23.1 17.1 8.9-1.6a3.5 3.5 0 1 1 1.2 6.9l-8.9 1.6a3.5 3.5 0 0 1-1.2-6.9Z"
        fill="currentColor"
      />
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
