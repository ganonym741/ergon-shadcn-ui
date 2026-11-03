import * as React from 'react'
import type { HTMLAttributes } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useControllableState, useMediaQuery } from '@/components/ui/util'
import { cn } from '@/lib/utils'
export function Layout({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex min-h-0 flex-1 flex-col', className)} {...props} />
}
export function LayoutHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <header className={cn('flex min-h-14 items-center border-b px-5', className)} {...props} />
}
export function LayoutSider({
  className,
  children,
  collapsible,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  width = 208,
  collapsedWidth = 56,
  breakpoint = 768,
  style,
  ...props
}: HTMLAttributes<HTMLElement> & {
  collapsible?: boolean
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  width?: number
  collapsedWidth?: number
  breakpoint?: number
}) {
  const [small, setSmall] = useControllableState({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  })
  const mobile = useMediaQuery(`(max-width:${breakpoint}px)`)
  const previousMobile = React.useRef(mobile)
  React.useEffect(() => {
    if (collapsible && (mobile || previousMobile.current !== mobile)) setSmall(mobile)
    previousMobile.current = mobile
  }, [mobile, collapsible])
  return (
    <aside
      data-collapsed={small}
      className={cn('shrink-0 border-r p-3 transition-[width]', className)}
      style={{ width: small ? collapsedWidth : width, ...style }}
      {...props}
    >
      <div className={small ? 'overflow-hidden' : ''}>{children}</div>
      {collapsible && (
        <button
          type="button"
          aria-label={small ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!small}
          onClick={() => setSmall((v) => !v)}
          className="mt-4 flex w-full justify-center rounded border p-2 text-muted-foreground"
        >
          {small ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      )}
    </aside>
  )
}
export function LayoutContent({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={cn('min-w-0 flex-1 p-5', className)} {...props} />
}
export function LayoutFooter({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn('border-t px-5 py-3 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}
