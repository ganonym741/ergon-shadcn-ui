import * as React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useControllableState, useDebouncedValue } from '@/components/ui/util'
/**
 * Suggests local or asynchronously loaded mentions at the active caret. Cancels dismissed requests and preserves surrounding text when inserting a selection.
 */
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
  const [focused, setFocused] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const pendingCursor = React.useRef<number | null>(null)
  const before = text.slice(0, cursor),
    startAt = before.lastIndexOf(trigger),
    word =
      startAt >= 0 && (!startAt || /\s/.test(before[startAt - 1]))
        ? before.slice(startAt + trigger.length)
        : null
  const match = word !== null && !/\s/.test(word) ? [trigger + word, word] : null
  const suggesting = focused && !dismissed && !disabled && !!match
  const [remote, setRemote] = React.useState<typeof options>([]),
    [remoteQuery, setRemoteQuery] = React.useState<string | null>(null),
    [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState(''),
    debounced = useDebouncedValue(match?.[1] ?? '')
  React.useEffect(() => {
    setLoading(false)
    setError('')
    if (!loadOptions || !suggesting || debounced !== word) return
    const controller = new AbortController()
    setLoading(true)
    setRemoteQuery(null)
    loadOptions(debounced, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setRemote(result)
          setRemoteQuery(debounced)
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [loadOptions, debounced, word, suggesting])
  React.useEffect(() => {
    if (!suggesting) return
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setDismissed(true)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [suggesting])
  React.useLayoutEffect(() => {
    if (pendingCursor.current === null) return
    ref.current?.setSelectionRange(pendingCursor.current, pendingCursor.current)
    pendingCursor.current = null
  }, [text])
  const results =
    suggesting && match
      ? loadOptions
        ? remoteQuery === word
          ? remote
          : []
        : options.filter((o) => o.label.toLowerCase().includes(match[1].toLowerCase()))
      : []
  const activeIndex = Math.min(active, Math.max(0, results.length - 1))
  const insert = (option: (typeof options)[number]) => {
    if (!match || !suggesting) return
    const start = cursor - (match?.[1].length ?? 0) - trigger.length
    const next = text.slice(0, start) + trigger + option.value + ' ' + text.slice(cursor)
    pendingCursor.current = start + option.value.length + trigger.length + 1
    set(next)
    setCursor(pendingCursor.current)
    setDismissed(true)
    ref.current?.focus()
  }
  return (
    <div ref={root} className="relative w-full max-w-md">
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
          setDismissed(false)
        }}
        onFocus={() => {
          setFocused(true)
          setDismissed(false)
        }}
        onBlur={() => setFocused(false)}
        onSelect={(e) => setCursor(e.currentTarget.selectionStart)}
        aria-controls={results.length ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={results.length ? `${listId}-${activeIndex}` : undefined}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return
          if (e.key === 'Escape' && suggesting) {
            e.preventDefault()
            e.stopPropagation()
            setDismissed(true)
            return
          }
          if (!results.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((activeIndex + 1) % results.length)
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((activeIndex + results.length - 1) % results.length)
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            insert(results[activeIndex])
          }
        }}
      />
      {suggesting && (loading || error || (loadOptions && debounced !== word)) && (
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
              id={`${listId}-${i}`}
              role="option"
              aria-selected={activeIndex === i}
              tabIndex={-1}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(o)}
              onPointerMove={() => setActive(i)}
              className={`block w-full rounded px-3 py-2 text-left text-sm ${i === activeIndex ? 'bg-accent' : ''}`}
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
