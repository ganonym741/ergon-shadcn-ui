import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useControllableState } from '@/components/ui/util'
export interface TimePickerProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  seconds?: boolean
  disabled?: boolean
  min?: string
  max?: string
  label?: string
  use12Hours?: boolean
  minuteStep?: number
  panel?: boolean
}
export function TimePicker({
  value,
  defaultValue = '',
  onValueChange,
  seconds,
  disabled,
  min,
  max,
  label = 'Select time',
  use12Hours,
  minuteStep = 1,
  panel = false,
}: TimePickerProps) {
  const [time, setTime] = useControllableState({ value, defaultValue, onChange: onValueChange }),
    parts = (time || '00:00:00').split(':').map(Number),
    [open, setOpen] = React.useState(false)
  const choose = (index: number, number: number) => {
    const next = [...parts]
    next[index] = number
    const text = next
      .slice(0, seconds ? 3 : 2)
      .map((n) => String(n || 0).padStart(2, '0'))
      .join(':')
    if ((!min || text >= min) && (!max || text <= max)) setTime(text)
  }
  if (!panel && !use12Hours)
    return (
      <Input
        className="w-44"
        type="time"
        aria-label={label}
        value={time}
        onValueChange={setTime}
        step={seconds ? 1 : minuteStep * 60}
        disabled={disabled}
        min={min}
        max={max}
      />
    )
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} aria-label={label}>
          {time
            ? use12Hours
              ? `${parts[0] % 12 || 12}:${String(parts[1]).padStart(2, '0')}${seconds ? ':' + String(parts[2] || 0).padStart(2, '0') : ''} ${parts[0] < 12 ? 'AM' : 'PM'}`
              : time
            : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          {[use12Hours ? 12 : 24, Math.ceil(60 / minuteStep), ...(seconds ? [60] : [])].map(
            (count, index) => (
              <div
                key={index}
                role="listbox"
                aria-label={['Hours', 'Minutes', 'Seconds'][index]}
                className="h-48 w-16 overflow-auto rounded border"
              >
                {Array.from({ length: count }, (_, n) => {
                  const number =
                      index === 1 ? n * minuteStep : index === 0 && use12Hours ? n + 1 : n,
                    actual =
                      index === 0 && use12Hours
                        ? (number % 12) + (parts[0] >= 12 ? 12 : 0)
                        : number,
                    next = [...parts]
                  next[index] = actual
                  const candidate = next
                      .slice(0, seconds ? 3 : 2)
                      .map((n) => String(n || 0).padStart(2, '0'))
                      .join(':'),
                    blocked = !!((min && candidate < min) || (max && candidate > max))
                  return (
                    <button
                      key={n}
                      type="button"
                      role="option"
                      aria-selected={parts[index] === actual}
                      disabled={blocked}
                      className="block w-full p-2 text-xs aria-selected:bg-primary/10 aria-selected:text-primary disabled:opacity-30"
                      onClick={() => choose(index, actual)}
                    >
                      {String(number).padStart(2, '0')}
                    </button>
                  )
                })}
              </div>
            ),
          )}
          {use12Hours && (
            <div className="space-y-1">
              {['AM', 'PM'].map((period, index) => (
                <Button
                  key={period}
                  size="sm"
                  variant={(parts[0] >= 12 ? 1 : 0) === index ? 'soft' : 'ghost'}
                  onClick={() => choose(0, (parts[0] % 12) + index * 12)}
                >
                  {period}
                </Button>
              ))}
            </div>
          )}
        </div>
        <Button size="sm" className="mt-2 w-full" onClick={() => setOpen(false)}>
          Done
        </Button>
      </PopoverContent>
    </Popover>
  )
}
export function TimeRangePicker({
  value = ['', ''],
  onValueChange,
  ...props
}: Omit<TimePickerProps, 'value' | 'onValueChange'> & {
  value?: [string, string]
  onValueChange?: (range: [string, string]) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TimePicker
        {...props}
        label="Start time"
        value={value[0]}
        max={value[1] || props.max}
        onValueChange={(start) => onValueChange?.([start, value[1]])}
      />
      <span>–</span>
      <TimePicker
        {...props}
        label="End time"
        value={value[1]}
        min={value[0] || props.min}
        onValueChange={(end) => onValueChange?.([value[0], end])}
      />
    </div>
  )
}
