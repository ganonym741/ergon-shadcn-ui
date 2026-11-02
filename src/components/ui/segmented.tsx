import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'
export interface SegmentedOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}
export function Segmented({
  options,
  value,
  defaultValue,
  onValueChange,
  label = 'View',
  className,
  vertical,
  disabled,
}: {
  options: SegmentedOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  label?: string
  className?: string
  vertical?: boolean
  disabled?: boolean
}) {
  const [current, set] = useControllableState({
    value,
    defaultValue: defaultValue ?? options[0]?.value ?? '',
    onChange: onValueChange,
  })
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex gap-1 rounded-lg bg-muted p-1', vertical && 'flex-col', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={current === option.value}
          disabled={disabled || option.disabled}
          tabIndex={current === option.value ? 0 : -1}
          onClick={() => set(option.value)}
          onKeyDown={(e) => {
            if (
              ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)
            ) {
              e.preventDefault()
              const enabled = options.filter((o) => !o.disabled)
              const at = enabled.findIndex((o) => o.value === option.value)
              const next =
                e.key === 'Home'
                  ? enabled[0]
                  : e.key === 'End'
                    ? enabled.at(-1)
                    : enabled[
                        (at +
                          (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : enabled.length - 1)) %
                          enabled.length
                      ]
              if (next) {
                set(next.value)
                const button =
                  e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[
                    options.findIndex((o) => o.value === next.value)
                  ]
                button?.focus()
              }
            }
          }}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition disabled:opacity-40',
            current === option.value && 'bg-background font-medium text-foreground shadow-sm',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
