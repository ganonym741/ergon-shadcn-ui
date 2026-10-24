import { TrendingDown, TrendingUp } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { useUIConfig } from '@/components/ui/config-provider'
export function Statistic({
  title,
  value,
  precision = 0,
  prefix,
  suffix,
  trend,
  locale,
  className,
  animated,
  duration = 800,
}: {
  title: string
  value: number
  precision?: number
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  trend?: number
  locale?: string
  className?: string
  animated?: boolean
  duration?: number
}) {
  const config = useUIConfig()
  const [display, setDisplay] = React.useState(animated ? 0 : value),
    previous = React.useRef(animated ? 0 : value)
  React.useEffect(() => {
    if (!animated || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      previous.current = value
      return
    }
    const start = performance.now(),
      from = previous.current
    let frame: number
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration),
        next = from + (value - from) * (1 - (1 - progress) ** 3)
      setDisplay(next)
      previous.current = next
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, animated, duration])
  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <div className="flex items-baseline gap-1.5 font-semibold tracking-tight">
        <span className="text-xl">{prefix}</span>
        <span className="text-3xl tabular-nums">
          {new Intl.NumberFormat(locale ?? config.locale, {
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
          }).format(display)}
        </span>
        <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
      </div>
      {trend !== undefined && (
        <p
          className={cn(
            'flex items-center gap-1 text-xs',
            trend >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive',
          )}
        >
          {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{' '}
          {trend >= 0 ? '+' : ''}
          {trend}%<span className="ml-1 text-muted-foreground">vs. previous period</span>
        </p>
      )}
    </div>
  )
}
export function Countdown({
  target,
  title = 'Time remaining',
  onFinish,
}: {
  target: Date | number
  title?: string
  onFinish?: () => void
}) {
  const end = +target,
    [remaining, setRemaining] = React.useState(() => Math.max(0, end - Date.now())),
    finished = React.useRef(false),
    callback = React.useRef(onFinish)
  callback.current = onFinish
  React.useEffect(() => {
    finished.current = false
    const tick = () => {
      const next = Math.max(0, end - Date.now())
      setRemaining(next)
      if (next === 0 && !finished.current) {
        finished.current = true
        callback.current?.()
      }
    }
    tick()
    const timer = setInterval(tick, 250)
    return () => clearInterval(timer)
  }, [end])
  const seconds = Math.ceil(remaining / 1000)
  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">{title}</p>
      <p role="timer" aria-label={title} className="font-mono text-3xl font-semibold tabular-nums">
        {[Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
          .map((n) => String(n).padStart(2, '0'))
          .join(':')}
      </p>
    </div>
  )
}
