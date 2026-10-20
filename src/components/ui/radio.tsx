export { RadioGroup as Radio, RadioGroupItem as RadioItem } from '@/components/ui/radio-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
export function RadioButtons({
  options,
  value,
  onValueChange,
  disabled,
}: {
  options: { value: string; label: React.ReactNode; disabled?: boolean }[]
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className="inline-flex gap-0 overflow-hidden rounded-lg border"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`relative cursor-pointer border-r px-4 py-2 text-sm last:border-0 ${value === option.value ? 'bg-primary/10 text-primary' : ''}`}
        >
          <RadioGroupItem
            value={option.value}
            disabled={option.disabled}
            className="absolute inset-0 h-full w-full rounded-none border-0 opacity-0"
          />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  )
}
