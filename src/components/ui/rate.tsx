import * as React from 'react'
import { Star } from 'lucide-react'
import { useControllableState } from '@/components/ui/util'
export function Rate({
  value,
  defaultValue = 0,
  onValueChange,
  count = 5,
  disabled,
  label = 'Rating',
  allowHalf,
  allowClear = true,
  character,
}: {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  count?: number
  disabled?: boolean
  label?: string
  allowHalf?: boolean
  allowClear?: boolean
  character?: React.ReactNode | ((index: number) => React.ReactNode)
}) {
  const [current, set] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const [hover, setHover] = React.useState<number>()
  const display = hover ?? current
  const hitValue = (index: number, event: React.MouseEvent<HTMLElement>) =>
    index +
    (allowHalf &&
    event.clientX - event.currentTarget.getBoundingClientRect().left <
      event.currentTarget.clientWidth / 2
      ? 0.5
      : 1)
  return (
    <div
      role="slider"
      aria-label={label}
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={count}
      aria-valuetext={`${current} of ${count} stars`}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className="inline-flex gap-1 rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
      onMouseLeave={() => setHover(undefined)}
      onKeyDown={(e) => {
        if (disabled) return
        const step = allowHalf ? 0.5 : 1
        if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
          e.preventDefault()
          set(
            e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? count
                : Math.max(
                    0,
                    Math.min(
                      count,
                      current + (['ArrowRight', 'ArrowUp'].includes(e.key) ? step : -step),
                    ),
                  ),
          )
        }
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          aria-hidden
          key={i}
          aria-label={`Rate ${i + 1} stars`}
          onMouseMove={(e) => {
            if (!disabled) setHover(hitValue(i, e))
          }}
          onClick={(e) => {
            if (disabled) return
            const next = hitValue(i, e)
            set(allowClear && current === next ? 0 : next)
          }}
          className="relative rounded p-0.5"
        >
          {character ? (
            <span className="flex size-6 items-center justify-center text-xl text-border">
              {typeof character === 'function' ? character(i) : character}
            </span>
          ) : (
            <Star size={24} className="fill-muted text-border" />
          )}
          <span
            className="absolute inset-0 overflow-hidden p-0.5"
            style={{
              clipPath: `inset(0 ${100 - Math.max(0, Math.min(1, display - i)) * 100}% 0 0)`,
            }}
          >
            {character ? (
              <span className="flex size-6 items-center justify-center text-xl text-amber-400">
                {typeof character === 'function' ? character(i) : character}
              </span>
            ) : (
              <Star size={24} className="fill-amber-400 text-amber-400" />
            )}
          </span>
        </span>
      ))}
    </div>
  )
}
