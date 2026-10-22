import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Slot } from 'radix-ui'
export function Ribbon({
  text,
  children,
  color = 'var(--primary)',
}: {
  text: React.ReactNode
  children: React.ReactNode
  color?: string
}) {
  return (
    <div className="relative pt-2">
      <span
        className="absolute -right-2 top-5 z-10 rounded-l px-4 py-1 text-xs text-white shadow-sm"
        style={{ background: color }}
      >
        {text}
        <span
          className="absolute right-0 top-full border-4 border-transparent brightness-75"
          style={{ borderLeftColor: color, borderTopColor: color }}
        />
      </span>
      {children}
    </div>
  )
}

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
export function CountBadge({
  count = 0,
  max = 99,
  dot,
  showZero,
  children,
  className,
}: {
  count?: number
  max?: number
  dot?: boolean
  showZero?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {children}
      {(count > 0 || dot || showZero) && (
        <span
          role="status"
          aria-label={dot ? 'New activity' : `${count} notifications`}
          className={cn(
            'absolute -top-2 -right-2 inline-flex min-w-4 items-center justify-center rounded-full border-2 border-background bg-primary px-1 text-[10px] leading-4 text-primary-foreground',
            dot && 'top-0 right-0 size-2 min-w-0 p-0',
          )}
        >
          {dot ? null : count > max ? `${max}+` : count}
        </span>
      )}
    </span>
  )
}
export function StatusBadge({
  status = 'success',
  children,
}: {
  status?: 'success' | 'processing' | 'warning' | 'error' | 'default'
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn(
          'size-1.5 rounded-full',
          {
            success: 'bg-emerald-500',
            processing: 'animate-pulse bg-blue-500',
            warning: 'bg-amber-500',
            error: 'bg-destructive',
            default: 'bg-muted-foreground',
          }[status],
        )}
      />
      {children}
    </span>
  )
}
