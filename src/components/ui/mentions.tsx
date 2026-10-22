import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useControllableState, useDebouncedValue } from '@/components/ui/util'
export function Mentions({
  options,
  value,
  defaultValue = '',
  onValueChange,
  placeholder = 'Type @ to mention someone',
  label = 'Message',
  trigger = '@',
  loadOptions,
  disabled,
}: {
  options: { value: string; label: string }[]
  value?: string
  defaultValue?: string
  onValueChange?: (text: string) => void
  placeholder?: string
  label?: string
  trigger?: string
  loadOptions?: (query: string, signal: AbortSignal) => Promise<{ value: string; label: string }[]>
  disabled?: boolean
}) {
  const listId = React.useId()
  const [text, set] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const [cursor, setCursor] = React.useState(0)
  const [active, setActive] = React.useState(0)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const before = text.slice(0, cursor),
    startAt = before.lastIndexOf(trigger),
    word =
      startAt >= 0 && (!startAt || /\s/.test(before[startAt - 1]))
        ? before.slice(startAt + trigger.length)
        : null
  const match = word !== null && !/\s/.test(word) ? [trigger + word, word] : null
  const [remote, setRemote] = React.useState<typeof options>([]),
    [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState(''),
    debounced = useDebouncedValue(match?.[1] ?? '')
  React.useEffect(() => {
    if (!loadOptions || !match) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    loadOptions(debounced, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setRemote(result)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [loadOptions, debounced, !!match])
  const results = match
    ? loadOptions
      ? remote
      : options.filter((o) => o.label.toLowerCase().includes(match[1].toLowerCase()))
    : []
  const insert = (option: (typeof options)[number]) => {
    const start = cursor - (match?.[1].length ?? 0) - trigger.length
    const next = text.slice(0, start) + trigger + option.value + ' ' + text.slice(cursor)
    set(next)
    setCursor(start + option.value.length + trigger.length + 1)
    ref.current?.focus()
  }
  return (
    <div className="relative w-full max-w-md">
      <Textarea
        ref={ref}
        disabled={disabled}
        aria-label={label}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          set(e.target.value)
          setCursor(e.target.selectionStart)
          setActive(0)
        }}
        onSelect={(e) => setCursor(e.currentTarget.selectionStart)}
        aria-controls={results.length ? listId : undefined}
        onKeyDown={(e) => {
          if (!results.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => (a + 1) % results.length)
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => (a + results.length - 1) % results.length)
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            insert(results[active] ?? results[0])
          }
        }}
      />
      {(loading || error) && (
        <p role={error ? 'alert' : 'status'} className="p-2 text-xs">
          {error || 'Loading suggestions…'}
        </p>
      )}
      {results.length > 0 && (
        <div
          id={listId}
          role="listbox"
          aria-label="People"
          className="absolute top-full z-20 mt-1 w-full rounded-lg border bg-popover p-1 shadow-md"
        >
          {results.map((o, i) => (
            <button
              key={o.value}
              role="option"
              aria-selected={active === i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(o)}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${i === active ? 'bg-accent' : ''}`}
            >
              {o.label}
              <span className="ml-2 text-muted-foreground">
                {trigger}
                {o.value}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
