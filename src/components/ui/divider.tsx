import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
export function Divider({
  orientation = 'horizontal',
  children,
  align = 'center',
  dashed,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical'
  align?: 'start' | 'center' | 'end'
  dashed?: boolean
  children?: ReactNode
}) {
  if (orientation === 'vertical')
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('mx-2 h-full min-h-4 w-px shrink-0 bg-border', className)}
        {...props}
      />
    )
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('flex w-full items-center gap-3 text-xs text-muted-foreground', className)}
      {...props}
    >
      <span
        className={cn('border-t', dashed && 'border-dashed', align === 'start' ? 'w-5' : 'flex-1')}
      />
      {children && <span>{children}</span>}
      {children && (
        <span
          className={cn('border-t', dashed && 'border-dashed', align === 'end' ? 'w-5' : 'flex-1')}
        />
      )}
    </div>
  )
}
