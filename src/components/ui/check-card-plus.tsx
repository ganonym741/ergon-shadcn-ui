import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'
export function CheckCardPlus({
  title,
  description,
  icon,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  title: string
  description?: string
  icon?: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative flex min-w-48 items-start gap-3 rounded-xl border p-5 text-left transition hover:border-primary/50 disabled:opacity-40',
        checked && 'border-primary bg-primary/5 ring-1 ring-primary',
        className,
      )}
    >
      {icon && <span className="text-primary">{icon}</span>}
      <span className="flex-1 pr-4">
        <span className="block text-sm font-semibold">{title}</span>
        {description && (
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      {checked && (
        <CircleCheck className="absolute top-3 right-3 size-4 fill-primary text-primary-foreground" />
      )}
    </button>
  )
}
export function CheckCardGroup({
  options,
  value,
  defaultValue = [],
  onValueChange,
  multiple = true,
  min = 0,
  max = Infinity,
  disabled,
}: {
  options: {
    value: string
    title: string
    description?: string
    icon?: React.ReactNode
    disabled?: boolean
  }[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (values: string[]) => void
  multiple?: boolean
  min?: number
  max?: number
  disabled?: boolean
}) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  return (
    <div role="group" aria-label="Selectable cards" className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const checked = selected.includes(option.value)
        return (
          <CheckCardPlus
            key={option.value}
            {...option}
            checked={checked}
            disabled={
              disabled ||
              option.disabled ||
              (!checked && multiple && selected.length >= max) ||
              (checked && selected.length <= min)
            }
            onCheckedChange={(next) => {
              const values = next
                ? multiple
                  ? [...selected, option.value]
                  : [option.value]
                : selected.filter((value) => value !== option.value)
              if (values.length >= min && values.length <= max) setSelected(values)
            }}
          />
        )
      })}
    </div>
  )
}
