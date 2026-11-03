import * as React from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'
export interface InputProps extends Omit<React.ComponentProps<'input'>, 'prefix'> {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  allowClear?: boolean
  showCount?: boolean
  passwordToggle?: boolean
  onValueChange?: (value: string) => void
}
export function Input({
  className,
  type = 'text',
  value,
  defaultValue = '',
  onChange,
  onValueChange,
  leading,
  trailing,
  allowClear,
  showCount,
  passwordToggle,
  ref,
  ...props
}: InputProps) {
  const [current, setCurrent] = useControllableState<string>({
    value: value === undefined ? undefined : String(value),
    defaultValue: String(defaultValue),
    onChange: onValueChange,
  })
  const [reveal, setReveal] = React.useState(false),
    input = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => input.current!)
  const field = (
    <input
      {...props}
      ref={input}
      type={passwordToggle && reveal ? 'text' : type}
      data-slot="input"
      value={current}
      onChange={(event) => {
        setCurrent(event.target.value)
        onChange?.(event)
      }}
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive',
        '[[data-density=compact]_&]:h-[30px]',
        leading && 'pl-9',
        (trailing || allowClear || passwordToggle) && 'pr-10',
        className,
      )}
    />
  )
  if (!leading && !trailing && !allowClear && !showCount && !passwordToggle) return field
  return (
    <span className="relative inline-flex w-full flex-col">
      <span className="relative flex w-full items-center">
        {leading && <span className="absolute left-3 z-1 text-muted-foreground">{leading}</span>}
        {field}
        <span className="absolute right-2 flex items-center gap-1 text-muted-foreground">
          {allowClear && current && !props.disabled && (
            <button
              type="button"
              aria-label="Clear input"
              onClick={() => {
                const element = input.current
                if (!element) return
                Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
                  element,
                  '',
                )
                element.dispatchEvent(new Event('input', { bubbles: true }))
                setCurrent('')
                element.focus()
              }}
            >
              <X size={14} />
            </button>
          )}
          {passwordToggle && (
            <button
              type="button"
              aria-label={reveal ? 'Hide password' : 'Show password'}
              onClick={() => setReveal((v) => !v)}
            >
              {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
          {trailing}
        </span>
      </span>
      {showCount && (
        <span className="mt-1 self-end text-[10px] text-muted-foreground">
          {current.length}
          {props.maxLength ? ` / ${props.maxLength}` : ''}
        </span>
      )}
    </span>
  )
}
export function OTPInput({
  value,
  defaultValue = '',
  onValueChange,
  length = 6,
  disabled,
  pattern = /\d/,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (code: string) => void
  length?: number
  disabled?: boolean
  pattern?: RegExp
}) {
  const [code, setCode] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const clean = (text: string) =>
    Array.from(text)
      .filter((char) => {
        pattern.lastIndex = 0
        return pattern.test(char)
      })
      .join('')
      .slice(0, length)
  return (
    <div
      role="group"
      aria-label="One-time code"
      className="flex gap-2"
      onPaste={(e) => {
        e.preventDefault()
        const text = clean(e.clipboardData.getData('text'))
        setCode(text)
        refs.current[Math.min(text.length, length - 1)]?.focus()
      }}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          aria-label={`Code digit ${index + 1}`}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          value={code[index] ?? ''}
          disabled={disabled}
          maxLength={1}
          className="h-11 w-9 rounded-lg border bg-background text-center font-mono text-lg outline-ring"
          onChange={(e) => {
            const char = clean(e.target.value).slice(-1)
            setCode((code.slice(0, index) + char + code.slice(index + 1)).slice(0, length))
            if (char) refs.current[Math.min(index + 1, length - 1)]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              if (!code[index]) refs.current[Math.max(0, index - 1)]?.focus()
              else setCode(code.slice(0, index) + code.slice(index + 1))
            }
            if (e.key === 'ArrowLeft') refs.current[Math.max(0, index - 1)]?.focus()
            if (e.key === 'ArrowRight') refs.current[Math.min(length - 1, index + 1)]?.focus()
          }}
        />
      ))}
    </div>
  )
}
