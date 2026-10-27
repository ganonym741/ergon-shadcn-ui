import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
export function Result({
  status = 'success',
  title,
  description,
  children,
}: {
  status?: 'success' | 'error' | 'info' | 'warning' | '403' | '404' | '500'
  title: string
  description?: string
  children?: React.ReactNode
}) {
  const Icon = { success: CircleCheck, error: CircleX, info: Info, warning: TriangleAlert }[
    status as 'success'
  ]
  return (
    <section className="flex flex-col items-center px-5 py-10 text-center">
      {Icon ? (
        <Icon
          className={cn(
            'mb-5 size-14',
            {
              success: 'text-emerald-500',
              error: 'text-destructive',
              info: 'text-blue-500',
              warning: 'text-amber-500',
            }[status as 'success'],
          )}
        />
      ) : (
        <div
          aria-label={`HTTP ${status}`}
          className="relative mb-5 grid h-32 w-64 place-items-center overflow-hidden rounded-3xl border bg-primary/5"
        >
          <span
            aria-hidden
            className="absolute -right-4 -bottom-10 size-32 rounded-full bg-primary/10"
          />
          <span className="font-mono text-7xl font-semibold tracking-widest text-primary">
            {status}
          </span>
        </div>
      )}
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      <div className="mt-6 flex gap-3">{children}</div>
    </section>
  )
}
