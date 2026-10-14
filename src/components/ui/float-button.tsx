import * as React from 'react'
import { ArrowUp, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
export function FloatButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'fixed right-6 bottom-6 z-40 flex size-12 items-center justify-center rounded-full border bg-background text-foreground shadow-lg transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
export function BackTop({
  threshold = 240,
  target,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  threshold?: number
  target?: () => HTMLElement | null
}) {
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    const el = target?.() ?? window
    const update = () => setVisible((el instanceof Window ? el.scrollY : el.scrollTop) >= threshold)
    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [threshold, target])
  return visible ? (
    <FloatButton
      aria-label="Back to top"
      onClick={() => (target?.() ?? window).scrollTo({ top: 0, behavior: 'smooth' })}
      {...props}
    >
      <ArrowUp size={19} />
    </FloatButton>
  ) : null
}
export function FloatButtonGroup({
  children,
  expandable = true,
  className,
  label = 'Quick actions',
}: {
  children: React.ReactNode
  expandable?: boolean
  className?: string
  label?: string
}) {
  const [open, setOpen] = React.useState(!expandable)
  return (
    <div
      className={cn(
        'fixed right-6 bottom-6 z-40 flex flex-col items-center gap-3 [&>div_button]:static',
        className,
      )}
    >
      {open && (
        <div role="group" aria-label={label} className="flex flex-col gap-3 [&_button]:static">
          {children}
        </div>
      )}
      {expandable && (
        <FloatButton
          aria-label={label}
          aria-expanded={open}
          className="static bg-primary text-primary-foreground"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Plus size={20} />}
        </FloatButton>
      )}
    </div>
  )
}
