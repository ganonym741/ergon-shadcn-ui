import { cn } from '@/lib/utils'

function Skeleton({
  className,
  animated = true,
  type,
  rows = 3,
  ...props
}: React.ComponentProps<'div'> & {
  animated?: boolean
  type?: 'text' | 'avatar' | 'button' | 'input' | 'image' | 'card'
  rows?: number
}) {
  if (type === 'text')
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            key={index}
            animated={animated}
            className="h-3"
            style={{ width: index === rows - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    )
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md bg-accent motion-reduce:animate-none',
        animated && 'animate-pulse',
        type === 'avatar'
          ? 'size-12 rounded-full'
          : type === 'button'
            ? 'h-9 w-24'
            : type === 'input'
              ? 'h-9 w-full'
              : type === 'image'
                ? 'aspect-video w-full'
                : type === 'card'
                  ? 'h-40 w-full'
                  : '',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
