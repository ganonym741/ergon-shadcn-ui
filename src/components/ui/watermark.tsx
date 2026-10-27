import * as React from 'react'
import { cn } from '@/lib/utils'
export function Watermark({
  text = 'CONFIDENTIAL',
  image,
  opacity = 0.13,
  protect = true,
  children,
  className,
}: {
  text?: string
  image?: string
  opacity?: number
  protect?: boolean
  children: React.ReactNode
  className?: string
}) {
  const root = React.useRef<HTMLDivElement>(null),
    layer = React.useRef<HTMLDivElement>(null),
    escaped = text.replace(
      /[<>&"']/g,
      (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!,
    )
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140"><text x="110" y="70" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="15" transform="rotate(-25 110 70)">${escaped}</text></svg>`,
    background = `url("${image ?? `data:image/svg+xml,${encodeURIComponent(svg)}`}")`
  React.useEffect(() => {
    if (!protect || !root.current || !layer.current) return
    const container = root.current,
      overlay = layer.current,
      attributes = { style: overlay.getAttribute('style')!, class: overlay.className }
    const observer = new MutationObserver(() => {
      observer.disconnect()
      if (overlay.parentElement !== container) container.appendChild(overlay)
      overlay.setAttribute('style', attributes.style)
      overlay.className = attributes.class
      observe()
    })
    const observe = () => {
      observer.observe(container, { childList: true })
      observer.observe(overlay, { attributes: true })
    }
    observe()
    return () => observer.disconnect()
  }, [protect, background, opacity])
  return (
    <div ref={root} className={cn('relative isolate overflow-hidden', className)}>
      {children}
      <div
        ref={layer}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{ opacity, backgroundImage: background, backgroundSize: '220px 140px' }}
      />
    </div>
  )
}
