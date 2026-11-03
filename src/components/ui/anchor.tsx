import * as React from 'react'
import { cn } from '@/lib/utils'
export interface AnchorItem {
  href: string
  title: string
  children?: AnchorItem[]
}
export interface AnchorProps {
  items: AnchorItem[]
  className?: string
  label?: string
  horizontal?: boolean
  offset?: number
  getContainer?: () => HTMLElement | Window | null
  onActiveChange?: (href: string) => void
}
const sectionFor = (href: string) => {
  if (!href.startsWith('#')) return null
  try {
    return document.getElementById(decodeURIComponent(href.slice(1)))
  } catch {
    return null
  }
}
export function Anchor({
  items,
  className,
  label = 'On this page',
  horizontal,
  offset = 100,
  getContainer,
  onActiveChange,
}: AnchorProps) {
  const [active, setActive] = React.useState('')
  const activeRef = React.useRef('')
  const callback = React.useRef(onActiveChange)
  callback.current = onActiveChange
  const select = React.useCallback((href: string) => {
    if (activeRef.current === href) return
    activeRef.current = href
    setActive(href)
    callback.current?.(href)
  }, [])
  React.useEffect(() => {
    const container = getContainer?.() ?? window
    const element = container === window ? null : (container as HTMLElement)
    const all = items
      .flatMap(function flat(item): AnchorItem[] {
        return [item, ...(item.children?.flatMap(flat) ?? [])]
      })
      .filter((item) => {
        const section = sectionFor(item.href)
        return section && (!element || element.contains(section))
      })
    const update = () => {
      const top = element ? element.getBoundingClientRect().top + element.clientTop : 0
      const scrollTop = element?.scrollTop ?? window.scrollY
      const height = element?.clientHeight ?? window.innerHeight
      const scrollHeight = element?.scrollHeight ?? document.documentElement.scrollHeight
      let current = all[0]?.href ?? ''
      for (const item of all) {
        const section = sectionFor(item.href)
        if (section && section.getBoundingClientRect().top <= top + offset + 8) current = item.href
      }
      if (all.length && scrollHeight > height + 2 && scrollTop + height >= scrollHeight - 2)
        current = all[all.length - 1].href
      select(current)
    }
    update()
    container.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    if (element) observer.observe(element)
    for (const item of all) observer.observe(sectionFor(item.href)!)
    return () => {
      container.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [items, offset, getContainer, select])
  const renderItems = (links: AnchorItem[]): React.ReactNode =>
    links.map((item) => (
      <div key={item.href}>
        <a
          aria-current={active === item.href ? 'location' : undefined}
          className={cn(
            'block px-4 py-2 text-sm text-muted-foreground hover:text-primary',
            horizontal ? 'border-b-2' : 'border-l-2',
            active === item.href ? 'border-primary text-primary' : 'border-transparent',
          )}
          href={item.href}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.altKey ||
              event.shiftKey
            )
              return
            const section = sectionFor(item.href)
            const container = getContainer?.() ?? window
            const element = container === window ? null : (container as HTMLElement)
            if (!section || (element && !element.contains(section))) return
            event.preventDefault()
            const top = element
              ? element.scrollTop +
                section.getBoundingClientRect().top -
                element.getBoundingClientRect().top -
                element.clientTop -
                offset
              : window.scrollY + section.getBoundingClientRect().top - offset
            container.scrollTo({
              top: Math.max(0, top),
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            })
          }}
        >
          {item.title}
        </a>
        {item.children && !horizontal && (
          <div className="ml-4 border-l">{renderItems(item.children)}</div>
        )}
      </div>
    ))
  return (
    <nav
      aria-label={label}
      className={cn(horizontal ? 'flex flex-wrap border-b' : 'border-l', className)}
    >
      {renderItems(items)}
    </nav>
  )
}
