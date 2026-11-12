import * as React from 'react'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-[state=checked]:bg-primary',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
/**
 * Presents independently selectable labeled options and emits the complete selected-value array. An optional label names the group for assistive technology.
 */
export function CheckboxGroup({
  options,
  value = [],
  onValueChange,
  disabled,
  label,
}: {
  options: { value: string; label: React.ReactNode; disabled?: boolean }[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-4">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.includes(option.value)}
            disabled={disabled || option.disabled}
            onCheckedChange={(checked) =>
              onValueChange?.(
                checked ? [...value, option.value] : value.filter((v) => v !== option.value),
              )
            }
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
