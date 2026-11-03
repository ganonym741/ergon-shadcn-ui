import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
export interface StepItem {
  title: string
  description?: string
  disabled?: boolean
  status?: 'wait' | 'process' | 'finish' | 'error'
  icon?: React.ReactNode
}
export function Steps({
  items,
  current = 0,
  onChange,
  vertical,
  responsive = true,
  className,
  status = 'process',
}: {
  items: StepItem[]
  current?: number
  onChange?: (step: number) => void
  vertical?: boolean
  responsive?: boolean
  className?: string
  status?: StepItem['status']
}) {
  return (
    <div className={cn('@container/steps w-full min-w-0', className)}>
      <ol
        className={cn(
          'flex gap-4',
          vertical ? 'flex-col' : responsive ? 'flex-col @md/steps:flex-row' : 'flex-row',
        )}
        aria-label="Progress"
      >
        {items.map((item, index) => {
          const state =
            item.status ?? (index < current ? 'finish' : index === current ? status : 'wait')
          return (
            <li
              key={index}
              className="flex min-w-0 flex-1 items-start gap-3"
              aria-current={index === current ? 'step' : undefined}
            >
              <button
                type="button"
                disabled={item.disabled || !onChange}
                onClick={() => onChange?.(index)}
                aria-label={`Step ${index + 1}: ${item.title}`}
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  state === 'wait'
                    ? 'bg-muted text-muted-foreground'
                    : state === 'error'
                      ? 'border-destructive bg-destructive text-white'
                      : 'border-primary bg-primary text-primary-foreground',
                )}
              >
                {item.icon ??
                  (state === 'finish' ? (
                    <Check size={15} />
                  ) : state === 'error' ? (
                    <X size={15} />
                  ) : (
                    index + 1
                  ))}
              </button>
              <div className="min-w-0 flex-1 pt-1">
                <div className="wrap-anywhere text-sm font-medium">{item.title}</div>
                {item.description && (
                  <p className="mt-1 wrap-anywhere text-xs text-muted-foreground">
                    {item.description}
                  </p>
                )}
                {index < items.length - 1 && (
                  <div
                    className={cn(
                      'mt-3 bg-border',
                      vertical
                        ? 'h-6 w-px'
                        : responsive
                          ? 'h-6 w-px @md/steps:h-px @md/steps:w-full'
                          : 'h-px',
                    )}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
