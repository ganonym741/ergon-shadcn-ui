import * as React from 'react'
import { useUIConfig } from '@/components/ui/config-provider'
import { cn } from '@/lib/utils'
export interface ContextUsageProps extends React.ComponentProps<'section'> {
  inputTokens: number
  outputTokens?: number
  cachedInputTokens?: number
  reasoningTokens?: number
  contextWindow: number
  usedTokens?: number
  cost?: number
  currency?: string
  label?: string
}
/** Displays supplied token counts without double-counting cached input or reasoning subsets. */
export function ContextUsage({
  inputTokens,
  outputTokens = 0,
  cachedInputTokens = 0,
  reasoningTokens = 0,
  contextWindow,
  usedTokens,
  cost,
  currency = 'USD',
  label = 'Context usage',
  className,
  children,
  ...props
}: ContextUsageProps) {
  const { locale } = useUIConfig(),
    counts = [
      inputTokens,
      outputTokens,
      cachedInputTokens,
      reasoningTokens,
      contextWindow,
      ...(usedTokens === undefined ? [] : [usedTokens]),
    ]
  const valid =
    counts.every((count) => Number.isSafeInteger(count) && count >= 0) &&
    contextWindow > 0 &&
    cachedInputTokens <= inputTokens &&
    reasoningTokens <= outputTokens &&
    (cost === undefined || (Number.isFinite(cost) && cost >= 0))
  const total = usedTokens ?? inputTokens + outputTokens,
    percent = Math.min(100, (total / contextWindow) * 100),
    format = (value: number) => new Intl.NumberFormat(locale).format(value)
  const parts = [
    { label: 'Input', value: inputTokens - cachedInputTokens, color: 'bg-blue-600' },
    { label: 'Cached input', value: cachedInputTokens, color: 'bg-violet-600' },
    { label: 'Output', value: outputTokens - reasoningTokens, color: 'bg-emerald-600' },
    { label: 'Reasoning output', value: reasoningTokens, color: 'bg-amber-600' },
  ]
  let amount = ''
  try {
    if (cost !== undefined)
      amount = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits:
          cost > 0 && cost < 0.000001
            ? Math.min(20, Math.max(7, -Math.floor(Math.log10(cost)) + 1))
            : 6,
      }).format(cost)
    if (cost !== undefined && cost > 0 && cost < 1e-20)
      amount = `<${new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 20 }).format(1e-20)}`
  } catch {
    amount = `${cost} ${currency}`
  }
  return (
    <section
      {...props}
      data-slot="context-usage"
      aria-label={label}
      className={cn('w-full min-w-0 space-y-3 rounded-xl border bg-background p-4', className)}
    >
      {!valid ? (
        <p role="alert" className="text-sm text-destructive">
          Provide nonnegative integer counts, a positive context window, and valid cached/reasoning
          subsets.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <h3 className="font-medium">{label}</h3>
            <span dir="ltr" className={cn('tabular-nums', percent >= 90 && 'text-destructive')}>
              {format(total)} / {format(contextWindow)}
            </span>
          </div>
          <div
            role="meter"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={contextWindow}
            aria-valuenow={Math.min(total, contextWindow)}
            aria-valuetext={`${format(total)} of ${format(contextWindow)} tokens`}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width]',
                percent >= 90 ? 'bg-destructive' : 'bg-primary',
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {parts.map((part) => (
              <div key={part.label} className="flex flex-wrap items-center justify-between gap-1">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <span aria-hidden className={cn('size-2 rounded-full', part.color)} />
                  {part.label}
                </dt>
                <dd className="font-mono tabular-nums" dir="ltr">
                  {format(part.value)}
                </dd>
              </div>
            ))}
          </dl>
          {cost !== undefined && (
            <p className="text-xs text-muted-foreground">
              Reported cost: <bdi>{amount}</bdi>
            </p>
          )}
          {total > contextWindow && (
            <p role="alert" className="text-xs text-destructive">
              The reported usage exceeds this context window.
            </p>
          )}
          {children}
        </>
      )}
    </section>
  )
}
