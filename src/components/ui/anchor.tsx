import * as React from 'react'
import { cn } from '@/lib/utils'
export interface AnchorItem {
  href: string
  title: string
  children?: AnchorItem[]
}
export function Anchor({
  items,
  className,
  label = 'On this page',
  horizontal,
  offset = 100,
  onActiveChange,
}: {
  items: AnchorItem[]
  className?: string
  label?: string
  horizontal?: boolean
  offset?: number
  onActiveChange?: (href: string) => void
}) {
  const [active, setActive] = React.useState('')
  React.useEffect(() => {
    const all = items.flatMap(function flat(item): AnchorItem[] {
      return [item, ...(item.children?.flatMap(flat) ?? [])]
    })
    const update = () => {
      let current = all[0]?.href ?? ''
      for (const item of all) {
        const el = document.getElementById(decodeURIComponent(item.href.replace(/^#/, '')))
        if (el && el.getBoundingClientRect().top <= offset + 8) current = item.href
      }
      setActive((previous) => {
        if (previous !== current) queueMicrotask(() => onActiveChange?.(current))
        return current
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    return () => window.removeEventListener('scroll', update, true)
  }, [items, offset, onActiveChange])
  return (
    <nav
      aria-label={label}
      className={cn(horizontal ? 'flex flex-wrap border-b' : 'border-l', className)}
    >
      {items.map((item) => (
        <div key={item.href}>
          <a
            aria-current={active === item.href ? 'location' : undefined}
            className={cn(
              'block px-4 py-2 text-sm text-muted-foreground hover:text-primary',
              horizontal ? 'border-b-2' : 'border-l-2',
              active === item.href ? 'border-primary text-primary' : 'border-transparent',
            )}
            href={item.href}
          >
            {item.title}
          </a>
          {item.children && !horizontal && (
            <Anchor className="ml-4" items={item.children} offset={offset} />
          )}
        </div>
      ))}
    </nav>
  )
}
