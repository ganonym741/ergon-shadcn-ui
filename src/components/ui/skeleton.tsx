import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.ComponentProps<'div'> {
  animated?: boolean
  animation?: 'wave' | 'pulse'
  type?: 'text' | 'avatar' | 'button' | 'input' | 'image' | 'card'
  rows?: number
}

function Skeleton({
  className,
  animated = true,
  animation = 'wave',
  type,
  rows = 3,
  ...props
}: SkeletonProps) {
  if (type === 'text')
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            key={index}
            animated={animated}
            animation={animation}
            className="h-3"
            style={{ width: index === rows - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    )
  return (
    <>
      {animated && animation === 'wave' && (
        <style
          href="ergonui-skeleton-wave"
          precedence="components"
        >{`@keyframes ergon-skeleton-wave { from { transform: translateX(-100%); } to { transform: translateX(100%); } }`}</style>
      )}
      <div
        data-slot="skeleton"
        data-animation={animated ? animation : 'none'}
        className={cn(
          'relative overflow-hidden rounded-md bg-accent motion-reduce:animate-none',
          animated && animation === 'pulse' && 'animate-pulse',
          animated &&
            animation === 'wave' &&
            "after:pointer-events-none after:absolute after:inset-0 after:animate-[ergon-skeleton-wave_1.8s_ease-in-out_infinite] after:bg-linear-to-r after:from-transparent after:via-muted-foreground/15 after:to-transparent after:content-[''] motion-reduce:after:animate-none",
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
    </>
  )
}

export { Skeleton }
