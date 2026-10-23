import { cn } from '@/lib/utils'
export interface DescriptionItem {
  key: string
  label: React.ReactNode
  children: React.ReactNode
  span?: number
}
export function Descriptions({
  title,
  items,
  columns = 2,
  bordered = true,
  className,
  layout = 'vertical',
}: {
  title?: React.ReactNode
  items: DescriptionItem[]
  columns?: number
  bordered?: boolean
  className?: string
  layout?: 'vertical' | 'horizontal'
}) {
  return (
    <section className={className}>
      {title && <h3 className="mb-4 font-semibold">{title}</h3>}
      <dl
        className={cn('grid overflow-hidden rounded-lg', bordered && 'border')}
        style={{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              'flex min-w-0 flex-col gap-1 p-4 text-sm',
              layout === 'horizontal' &&
                'flex-row items-baseline gap-4 [&>dt]:min-w-20 [&>dt]:shrink-0',
              bordered && 'border-b last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0',
            )}
            style={{ gridColumn: `span ${Math.min(item.span ?? 1, columns)}` }}
          >
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="break-words font-medium">{item.children}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
