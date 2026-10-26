import * as React from 'react'
import { CircleCheck, CircleAlert, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
export function Alert({
  variant = 'info',
  title,
  children,
  closable,
  className,
  banner,
  messages,
  interval = 4000,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: React.ReactNode
  closable?: boolean
  banner?: boolean
  messages?: React.ReactNode[]
  interval?: number
}) {
  const [closed, setClosed] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    if (!messages?.length) return
    const timer = setInterval(() => setIndex((n) => (n + 1) % messages.length), interval)
    return () => clearInterval(timer)
  }, [messages?.length, interval])
  if (closed) return null
  const Icon = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert }[
    variant
  ]
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 text-sm',
        banner && 'rounded-none border-x-0 py-2',
        {
          info: 'border-blue-200 bg-blue-50/60 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300',
          success:
            'border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
          warning:
            'border-amber-200 bg-amber-50/60 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
          error:
            'border-red-200 bg-red-50/60 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
        }[variant],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        {(children || messages?.length) && (
          <div className={cn('leading-relaxed opacity-85', title && 'mt-1')}>
            {messages?.length ? messages[index % messages.length] : children}
          </div>
        )}
      </div>
      {closable && (
        <button aria-label="Dismiss alert" onClick={() => setClosed(true)}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
