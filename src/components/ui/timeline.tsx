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
    <ol
      data-slot="timeline"
      data-layout={layout}
      className={cn('space-y-0', layout === 'horizontal' && 'flex overflow-x-auto', className)}
    >
      {(reverse ? [...items].reverse() : items).map((item, i) => (
        <li
          key={item.key}
          data-slot="timeline-item"
          className={cn(
            'relative flex gap-4 pb-7 last:pb-0',
            layout === 'horizontal' && 'min-w-40 flex-1 flex-col pb-0 pe-5',
            layout === 'alternate' && 'grid grid-cols-[minmax(0,1fr)_1.25rem_minmax(0,1fr)]',
          )}
        >
          {i < items.length - 1 && (
            <span
              data-slot="timeline-connector"
              className={cn(
                'absolute bg-border',
                layout === 'horizontal'
                  ? 'top-[9.5px] start-5 end-0 h-px'
                  : layout === 'alternate'
                    ? 'top-5 bottom-0 left-1/2 w-px -translate-x-1/2'
                    : 'top-5 bottom-0 start-[9.5px] w-px',
              )}
            />
          )}
          <span
            data-slot="timeline-marker"
            className={cn(
              'relative z-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-primary',
              item.status === 'pending' && 'text-muted-foreground',
              layout === 'alternate' && 'col-start-2 row-start-1',
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
          <div
            data-slot="timeline-content"
            className={cn(
              'min-w-0 flex-1 wrap-anywhere',
              layout === 'alternate' && 'row-start-1',
              layout === 'alternate' && (i % 2 ? 'col-start-3 text-start' : 'col-start-1 text-end'),
            )}
          >
            <div
              className={cn(
                'flex flex-wrap justify-between gap-2',
                layout === 'alternate' && 'flex-col gap-1',
                layout === 'alternate' && (i % 2 ? 'items-start' : 'items-end'),
              )}
            >
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
