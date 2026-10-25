import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
export interface TimelineItem {
  key: string
  title: React.ReactNode
  description?: React.ReactNode
  time?: React.ReactNode
  status?: 'complete' | 'active' | 'pending'
  icon?: React.ReactNode
}
export function Timeline({
  items,
  className,
  reverse,
  layout = 'vertical',
}: {
  items: TimelineItem[]
  className?: string
  reverse?: boolean
  layout?: 'vertical' | 'horizontal' | 'alternate'
}) {
  return (
    <ol className={cn('space-y-0', layout === 'horizontal' && 'flex overflow-x-auto', className)}>
      {(reverse ? [...items].reverse() : items).map((item, i) => (
        <li
          key={item.key}
          className={cn(
            'relative flex gap-4 pb-7 last:pb-0',
            layout === 'horizontal' && 'min-w-40 flex-1 flex-col pb-0 pr-5',
            layout === 'alternate' && 'w-1/2',
            layout === 'alternate' && (i % 2 ? 'ml-auto' : 'flex-row-reverse text-right'),
          )}
        >
          {i < items.length - 1 && (
            <span
              className={cn(
                'absolute bg-border',
                layout === 'horizontal'
                  ? 'top-[9px] right-0 left-5 h-px'
                  : layout === 'alternate' && i % 2 === 0
                    ? 'top-5 bottom-0 right-[9px] w-px'
                    : 'top-5 bottom-0 left-[9px] w-px',
              )}
            />
          )}
          <span
            className={cn(
              'relative z-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-primary',
              item.status === 'pending' && 'text-muted-foreground',
            )}
          >
            {item.icon ??
              (item.status === 'complete' ? (
                <CircleCheck size={19} />
              ) : (
                <span
                  className={cn(
                    'size-2 rounded-full bg-primary ring-4 ring-primary/10',
                    item.status === 'pending' && 'bg-border ring-muted',
                  )}
                />
              ))}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="text-sm font-medium">{item.title}</div>
              {item.time && <span className="text-xs text-muted-foreground">{item.time}</span>}
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
