import { Minus, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'
import * as React from 'react'
import { addDecimal, compareDecimal } from '@/lib/decimal'
export interface InputNumberProps {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  label?: string
}
export function DecimalInputNumber({
  value,
  defaultValue = '0',
  onValueChange,
  step = '0.1',
  min,
  max,
  locale = 'en-US',
  disabled,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  step?: string
  min?: string
  max?: string
  locale?: string
  disabled?: boolean
}) {
  const [current, set] = useControllableState({ value, defaultValue, onChange: onValueChange }),
    [draft, setDraft] = React.useState(current),
    [focused, setFocused] = React.useState(false),
    [error, setError] = React.useState('')
  const decimal =
      new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal')?.value ??
      '.',
    group =
      new Intl.NumberFormat(locale).formatToParts(1000).find((p) => p.type === 'group')?.value ??
      ','
  const update = (text: string) => {
    try {
      let normalized = addDecimal(text, '0')
      if (min && compareDecimal(normalized, min) < 0) normalized = min
      if (max && compareDecimal(normalized, max) > 0) normalized = max
      set(normalized)
      setDraft(normalized)
      setError('')
    } catch {
      setError('Enter a valid decimal number')
    }
  }
  React.useEffect(() => setDraft(current.replace('.', decimal)), [current, decimal])
  const display = focused ? draft : current.replace('.', decimal)
  return (
    <div className="inline-flex flex-col">
      <div className="inline-flex items-center rounded-md border">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={disabled || (!!min && compareDecimal(current, min) <= 0)}
          aria-label="Decrease precise value"
          onClick={() =>
            update(addDecimal(current, step.startsWith('-') ? step.slice(1) : '-' + step))
          }
        >
          <Minus />
        </Button>
        <Input
          aria-label="Precise decimal value"
          inputMode="decimal"
          className="w-44 border-0 text-center shadow-none"
          value={display}
          disabled={disabled}
          onFocus={() => {
            setDraft(current.replace('.', decimal))
            setFocused(true)
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setFocused(false)
            update(draft.replaceAll(group, '').replace(decimal, '.'))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={disabled || (!!max && compareDecimal(current, max) >= 0)}
          aria-label="Increase precise value"
          onClick={() => update(addDecimal(current, step))}
        >
          <Plus />
        </Button>
      </div>
      {error && (
        <span role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}
export function InputNumber({
  value,
  defaultValue = 0,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  disabled,
  className,
  label = 'Quantity',
}: InputNumberProps) {
  const [current, set] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const update = (n: number) => {
    if (Number.isFinite(n)) set(Math.min(max, Math.max(min, Number(n.toFixed(10)))))
  }
  return (
    <div className={cn('inline-flex items-center overflow-hidden rounded-md border', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || current <= min}
        aria-label={`Decrease ${label}`}
        onClick={() => update(current - step)}
      >
        <Minus />
      </Button>
      <Input
        aria-label={label}
        className="w-20 rounded-none border-0 text-center shadow-none [&::-webkit-inner-spin-button]:appearance-none"
        type="number"
        value={current}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value !== '') update(e.target.valueAsNumber)
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || current >= max}
        aria-label={`Increase ${label}`}
        onClick={() => update(current + step)}
      >
        <Plus />
      </Button>
    </div>
  )
}
