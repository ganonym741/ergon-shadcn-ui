import * as React from 'react'
import { Progress as ProgressPrimitive } from 'radix-ui'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
export interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string
  status?: 'normal' | 'success' | 'error' | 'active'
  successPercent?: number
}
export function Progress({
  className,
  value = 0,
  indicatorClassName,
  status = 'normal',
  successPercent = 0,
  ...props
}: ProgressProps) {
  const percent = Math.max(0, Math.min(100, value ?? 0))
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      aria-label="Progress"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/15', className)}
      value={percent}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 bg-primary transition-transform duration-300',
          status === 'success' && 'bg-emerald-500',
          status === 'error' && 'bg-destructive',
          status === 'active' && 'animate-pulse',
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
      {successPercent > 0 && (
        <span
          className="absolute inset-y-0 left-0 bg-emerald-500"
          style={{ width: `${Math.max(0, Math.min(percent, successPercent))}%` }}
        />
      )}
    </ProgressPrimitive.Root>
  )
}
export function ProgressCircle({
  value,
  size = 100,
  strokeWidth = 7,
  status = 'normal',
  children,
  className,
  label = 'Progress',
  dashboard,
  successPercent = 0,
}: {
  value: number
  size?: number
  strokeWidth?: number
  status?: 'normal' | 'success' | 'error'
  children?: React.ReactNode
  className?: string
  label?: string
  dashboard?: boolean
  successPercent?: number
}) {
  const percent = Math.max(0, Math.min(100, value)),
    radius = (size - strokeWidth) / 2,
    circumference = 2 * Math.PI * radius
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: dashboard ? 'rotate(135deg)' : 'rotate(-90deg)' }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={
            dashboard ? `${circumference * 0.75} ${circumference * 0.25}` : undefined
          }
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={
            status === 'success'
              ? '#10b981'
              : status === 'error'
                ? 'var(--destructive)'
                : 'var(--primary)'
          }
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${(circumference * (dashboard ? 0.75 : 1) * percent) / 100} ${circumference}`}
          className="transition-[stroke-dashoffset] duration-300"
        />
        {successPercent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10b981"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(circumference * (dashboard ? 0.75 : 1) * Math.min(percent, successPercent)) / 100} ${circumference}`}
          />
        )}
      </svg>
      <span className="absolute text-lg font-semibold">
        {children ??
          (percent === 100 ? <Check className="text-emerald-500" /> : `${Math.round(percent)}%`)}
      </span>
    </div>
  )
}
export function ProgressSteps({
  value,
  steps = 8,
  label = 'Progress',
}: {
  value: number
  steps?: number
  label?: string
}) {
  const percent = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="flex gap-1.5"
    >
      {Array.from({ length: steps }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 flex-1 rounded-sm bg-muted transition-colors',
            i < Math.round((percent * steps) / 100) && 'bg-primary',
          )}
        />
      ))}
    </div>
  )
}
