import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
export interface MenuItem {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
  children?: MenuItem[]
  href?: string
  permission?: string
}
export function Menu({
  items,
  value,
  onValueChange,
  className,
  label = 'Navigation',
  mode = 'vertical',
  collapsed = false,
  allow,
}: {
  items: MenuItem[]
  value?: string
  onValueChange?: (key: string) => void
  className?: string
  label?: string
  mode?: 'horizontal' | 'vertical'
  collapsed?: boolean
  allow?: (item: MenuItem) => boolean
}) {
  const [expanded, setExpanded] = React.useState<string[]>([])
  const ref = React.useRef<HTMLElement>(null)
  const horizontal = mode === 'horizontal'
  const visible = items.filter((item) => allow?.(item) !== false)
  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cn(horizontal ? 'flex gap-1' : 'space-y-1', className)}
      onKeyDown={(e) => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key))
          return
        const buttons = Array.from(
            ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
          ),
          index = buttons.indexOf(document.activeElement as HTMLButtonElement)
        if (index < 0) return
        e.preventDefault()
        const direction = ['ArrowDown', 'ArrowRight'].includes(e.key) ? 1 : -1
        buttons[
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? buttons.length - 1
              : (index + direction + buttons.length) % buttons.length
        ]?.focus()
      }}
    >
      {visible.map((item) => (
        <div key={item.key} className={horizontal ? 'relative' : ''}>
          <button
            type="button"
            title={collapsed ? String(item.label) : undefined}
            disabled={item.disabled}
            aria-expanded={item.children ? expanded.includes(item.key) : undefined}
            aria-current={value === item.key ? 'page' : undefined}
            aria-label={collapsed && typeof item.label === 'string' ? item.label : undefined}
            onClick={() => {
              if (item.children)
                setExpanded((p) =>
                  p.includes(item.key) ? p.filter((k) => k !== item.key) : [...p, item.key],
                )
              else {
                onValueChange?.(item.key)
                if (item.href) window.location.assign(item.href)
              }
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted disabled:opacity-40',
              value === item.key && 'bg-primary/10 font-medium text-primary',
              collapsed && 'justify-center px-2',
            )}
          >
            {item.icon ?? (collapsed ? <span>{String(item.label).slice(0, 1)}</span> : null)}
            {!collapsed && <span className="flex-1">{item.label}</span>}
            {item.children && !collapsed && (
              <ChevronDown size={14} className={expanded.includes(item.key) ? 'rotate-180' : ''} />
            )}
          </button>
          {item.children && expanded.includes(item.key) && (
            <Menu
              className={cn(
                horizontal || collapsed
                  ? 'absolute z-30 min-w-44 rounded-lg border bg-popover p-1 shadow-md'
                  : 'ml-4 mt-1 border-l pl-2',
              )}
              items={item.children}
              value={value}
              onValueChange={onValueChange}
              allow={allow}
            />
          )}
        </div>
      ))}
    </nav>
  )
}
