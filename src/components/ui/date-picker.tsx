import { format } from 'date-fns'
import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { useUIConfig } from '@/components/ui/config-provider'
import { getDateLocale, toZonedInput, fromZonedInput } from '@/lib/date-adapter'
export interface DatePickerProps {
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  locale?: string
  timeZone?: string
}
export function DatePicker({
  value,
  onValueChange,
  disabled,
  placeholder = 'Choose a date',
  minDate,
  maxDate,
  locale,
  timeZone,
}: DatePickerProps) {
  const config = useUIConfig(),
    resolvedLocale = locale ?? config.locale
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="min-w-52 justify-start font-normal"
        >
          <CalendarIcon className="text-muted-foreground" />
          {value
            ? new Intl.DateTimeFormat(resolvedLocale, { timeZone, dateStyle: 'medium' }).format(
                value,
              )
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={getDateLocale(resolvedLocale)}
          timeZone={timeZone}
          selected={value}
          onSelect={onValueChange}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
export function DateRangePicker({
  value,
  onValueChange,
  disabled,
  placeholder = 'Choose a date range',
}: {
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="min-w-60 justify-start font-normal"
        >
          <CalendarIcon />
          {value?.from
            ? `${format(value.from, 'MMM d')}${value.to ? ` – ${format(value.to, 'MMM d, yyyy')}` : ''}`
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[95vw] overflow-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={onValueChange}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
export function MultiDatePicker({
  value = [],
  onValueChange,
  disabled,
}: {
  value?: Date[]
  onValueChange?: (dates: Date[]) => void
  disabled?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="min-w-52 justify-start font-normal"
        >
          <CalendarIcon />
          {value.length ? `${value.length} dates selected` : 'Choose multiple dates'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="multiple"
          selected={value}
          onSelect={(dates) => onValueChange?.(dates ?? [])}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
export function DateTimePicker({
  value,
  onValueChange,
  disabled,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  label = 'Date and time',
  min,
  max,
}: {
  value?: Date
  onValueChange?: (value: Date | undefined) => void
  disabled?: boolean
  timeZone?: string
  label?: string
  min?: Date
  max?: Date
}) {
  const [error, setError] = React.useState('')
  return (
    <div>
      <Input
        type="datetime-local"
        aria-label={label}
        min={min ? toZonedInput(min, timeZone).slice(0, 16) : undefined}
        max={max ? toZonedInput(max, timeZone).slice(0, 16) : undefined}
        value={value ? toZonedInput(value, timeZone).slice(0, 16) : ''}
        onChange={(e) => {
          try {
            const next = e.target.value ? fromZonedInput(e.target.value, timeZone) : undefined
            if (next && ((min && next < min) || (max && next > max)))
              throw new Error('Choose a date within the allowed range')
            setError('')
            onValueChange?.(next)
          } catch (error) {
            setError(String(error))
          }
        }}
        disabled={disabled}
      />
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
export function DateTimeRangePicker({
  value,
  onValueChange,
  ...props
}: {
  value?: DateRange
  onValueChange?: (value: DateRange | undefined) => void
  disabled?: boolean
  timeZone?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={props.disabled}>
          Choose date-time range
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto space-y-3">
        <DateTimePicker
          {...props}
          label="Start date and time"
          value={value?.from}
          max={value?.to}
          onValueChange={(from) => onValueChange?.({ from, to: value?.to })}
        />
        <DateTimePicker
          {...props}
          label="End date and time"
          value={value?.to}
          min={value?.from}
          onValueChange={(to) => onValueChange?.({ from: value?.from, to })}
        />
        {value?.from && (
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: 'short',
              timeStyle: 'short',
              timeZone: props.timeZone,
            }).format(value.from)}{' '}
            →{' '}
            {value.to
              ? new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                  timeZone: props.timeZone,
                }).format(value.to)
              : 'Select end'}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
export function MonthPicker({
  value,
  onValueChange,
  disabled,
}: {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Input
      aria-label="Select month"
      type="month"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
    />
  )
}
export function WeekPicker({
  value,
  onValueChange,
  disabled,
}: {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <Input
      aria-label="Select week"
      type="week"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
    />
  )
}
export function YearPicker({
  value,
  onValueChange,
  min = 1900,
  max = 2100,
  disabled,
}: {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}) {
  const [draft, setDraft] = React.useState(value === undefined ? '' : String(value))
  React.useEffect(() => setDraft(value === undefined ? '' : String(value)), [value])
  return (
    <Input
      aria-label="Select year"
      type="number"
      value={draft}
      min={min}
      max={max}
      step={1}
      onChange={(e) => {
        setDraft(e.target.value)
        const next = e.target.valueAsNumber
        if (Number.isInteger(next) && next >= min && next <= max) onValueChange?.(next)
      }}
      onBlur={() => {
        const next = Number(draft)
        if (!Number.isInteger(next) || next < min || next > max)
          setDraft(value === undefined ? '' : String(value))
      }}
      disabled={disabled}
    />
  )
}
export function QuarterPicker({
  value,
  onValueChange,
  disabled,
}: {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}) {
  return (
    <select
      aria-label="Select quarter"
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="" disabled>
        Choose a quarter
      </option>
      {[1, 2, 3, 4].map((q) => (
        <option key={q} value={`Q${q}`}>
          Quarter {q}
        </option>
      ))}
    </select>
  )
}
