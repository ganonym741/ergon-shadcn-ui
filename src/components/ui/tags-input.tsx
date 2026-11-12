import * as React from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useControllableState, useDebouncedValue } from '@/components/ui/util'

export interface TagsInputProps extends Omit<
  React.ComponentProps<'div'>,
  'onChange' | 'defaultValue'
> {
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  label?: string
  placeholder?: string
  name?: string
  disabled?: boolean
  readOnly?: boolean
  maxTags?: number
  allowDuplicates?: boolean
  separators?: string[]
  createOnBlur?: boolean
  suggestions?: string[]
  onSearch?: (query: string, signal: AbortSignal) => Promise<string[]>
  validateTag?: (tag: string) => string | undefined
  onInvalidTag?: (tag: string, message: string) => void
  renderTag?: (tag: string, index: number) => React.ReactNode
}
interface TagsContext {
  tags: string[]
  disabled?: boolean
  readOnly?: boolean
  remove: (index: number) => void
  move: (from: number, to: number) => void
  input: React.RefObject<HTMLInputElement | null>
  chips: React.RefObject<Map<number, HTMLButtonElement>>
}
const TagsContext = React.createContext<TagsContext | null>(null)
/** Displays a removable tag with arrow navigation and Alt+Arrow reordering. */
export function TagsInputTag({
  index,
  className,
  children,
}: {
  index: number
  className?: string
  children?: React.ReactNode
}) {
  const context = React.useContext(TagsContext)
  if (!context) throw new Error('TagsInputTag must be inside TagsInput.')
  const tag = context.tags[index]
  return (
    <li
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs',
        className,
      )}
    >
      <span className="truncate">{children ?? tag}</span>
      {!context.readOnly && (
        <button
          ref={(node) => {
            if (node) context.chips.current.set(index, node)
            else context.chips.current.delete(index)
          }}
          type="button"
          disabled={context.disabled}
          aria-label={`Remove ${tag}`}
          className="rounded outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
          onClick={() => context.remove(index)}
          onKeyDown={(event) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
              event.preventDefault()
              context.remove(index)
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              const next = index + (event.key === 'ArrowLeft' ? -1 : 1)
              if (event.altKey) context.move(index, next)
              else if (next >= 0 && next < context.tags.length)
                context.chips.current.get(next)?.focus()
              else context.input.current?.focus()
            }
          }}
        >
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </li>
  )
}
/** Edits validated string tags with paste, suggestions, async cancellation, and accessible keyboard actions. */
export function TagsInput({
  value,
  defaultValue = [],
  onValueChange,
  label = 'Tags',
  placeholder = 'Add a tag…',
  name,
  disabled,
  readOnly,
  maxTags = 20,
  allowDuplicates = false,
  separators = [',', ';', '\n'],
  createOnBlur = false,
  suggestions = [],
  onSearch,
  validateTag,
  onInvalidTag,
  renderTag,
  children,
  className,
  onBlur,
  ...props
}: TagsInputProps) {
  const [tags, setTags] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const [query, setQuery] = React.useState(''),
    [focused, setFocused] = React.useState(false),
    [dismissed, setDismissed] = React.useState(false),
    [active, setActive] = React.useState(0),
    [remote, setRemote] = React.useState<{ query: string; items: string[] } | null>(null),
    [loading, setLoading] = React.useState(false),
    [message, setMessage] = React.useState('')
  const input = React.useRef<HTMLInputElement>(null),
    chips = React.useRef(new Map<number, HTMLButtonElement>()),
    root = React.useRef<HTMLDivElement>(null),
    id = React.useId(),
    debounced = useDebouncedValue(query)
  const limit = Math.max(0, Math.floor(Number.isFinite(maxTags) ? maxTags : 20))
  React.useEffect(() => {
    if (!onSearch || !focused || dismissed) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setRemote(null)
    if (query !== debounced) return
    Promise.resolve()
      .then(() => onSearch(debounced, controller.signal))
      .then((items) => {
        if (!controller.signal.aborted) setRemote({ query: debounced, items })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setMessage(`Suggestions unavailable: ${String(error)}`)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [onSearch, query, debounced, focused, dismissed])
  const options = [
    ...new Set(onSearch ? (remote?.query === query ? remote.items : []) : suggestions),
  ].filter(
    (item) =>
      (allowDuplicates || !tags.includes(item)) && item.toLowerCase().includes(query.toLowerCase()),
  )
  const open = focused && !dismissed && !readOnly && !disabled && options.length > 0
  const selected = Math.min(active, Math.max(0, options.length - 1))
  const add = (incoming: string[]) => {
    if (disabled || readOnly) return
    const next = [...tags]
    const rejected: string[] = []
    let added = 0,
      lastError = ''
    for (const item of incoming) {
      const tag = item.trim()
      if (!tag) continue
      const error =
        !allowDuplicates && next.includes(tag)
          ? `${tag} is already added.`
          : next.length >= limit
            ? `Use at most ${limit} tags.`
            : validateTag?.(tag)
      if (error) {
        rejected.push(item)
        lastError = error
        onInvalidTag?.(tag, error)
        continue
      }
      next.push(tag)
      added++
    }
    if (added) setTags(next)
    setMessage(lastError || (added ? `Added ${added} ${added === 1 ? 'tag' : 'tags'}.` : ''))
    if (added || rejected.length) {
      setQuery(rejected.join(separators[0] ?? ','))
      setActive(0)
      setDismissed(true)
    }
    return added > 0
  }
  const remove = (index: number) => {
    if (disabled || readOnly) return
    setTags(tags.filter((_, i) => i !== index))
    setMessage(`Removed ${tags[index]}.`)
    requestAnimationFrame(() =>
      (chips.current.get(Math.min(index, tags.length - 2)) ?? input.current)?.focus(),
    )
  }
  const move = (from: number, to: number) => {
    if (disabled || readOnly || to < 0 || to >= tags.length) return
    const next = [...tags],
      [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setTags(next)
    setMessage(`Moved ${item} to position ${to + 1}.`)
    requestAnimationFrame(() => chips.current.get(to)?.focus())
  }
  const split = (text: string) => {
    const escaped = separators.filter(Boolean).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return escaped.length ? text.split(new RegExp(escaped.join('|'))) : [text]
  }
  const tagKeys = React.useMemo(() => {
    const occurrences = new Map<string, number>()
    return tags.map((tag) => {
      const occurrence = occurrences.get(tag) ?? 0
      occurrences.set(tag, occurrence + 1)
      return JSON.stringify([tag, occurrence])
    })
  }, [tags])
  return (
    <TagsContext.Provider value={{ tags, disabled, readOnly, remove, move, input, chips }}>
      <div
        {...props}
        ref={root}
        data-slot="tags-input"
        className={cn('relative w-full min-w-0', className)}
        onBlur={(event) => {
          onBlur?.(event)
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocused(false)
            if (createOnBlur && query.trim()) add(split(query))
          }
        }}
      >
        <div
          className={cn(
            'flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border bg-background p-2 focus-within:ring-2 focus-within:ring-ring/30',
            disabled && 'opacity-50',
          )}
        >
          <ul aria-label={`${label} values`} className="contents">
            {tags.map((_, index) => (
              <React.Fragment key={tagKeys[index]}>
                {renderTag?.(tags[index], index) ?? <TagsInputTag index={index} />}
              </React.Fragment>
            ))}
          </ul>
          <input
            ref={input}
            value={query}
            disabled={disabled}
            readOnly={readOnly}
            aria-label={label}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={!!open}
            aria-controls={open ? `${id}-options` : undefined}
            aria-activedescendant={open ? `${id}-option-${selected}` : undefined}
            aria-describedby={`${id}-help ${id}-status`}
            placeholder={tags.length >= limit ? 'Tag limit reached' : placeholder}
            className="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm outline-none disabled:cursor-not-allowed"
            onFocus={() => setFocused(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setDismissed(false)
              setActive(0)
            }}
            onPaste={(event) => {
              if (disabled || readOnly) return
              const input = event.currentTarget,
                start = input.selectionStart ?? query.length,
                end = input.selectionEnd ?? start,
                parts = split(
                  query.slice(0, start) + event.clipboardData.getData('text') + query.slice(end),
                )
              if (parts.length > 1) {
                event.preventDefault()
                add(parts)
              }
            }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || disabled || readOnly) return
              if (event.key === 'Escape') {
                event.preventDefault()
                setDismissed(true)
              } else if (open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault()
                setActive(
                  (selected + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
                    options.length,
                )
              } else if (event.key === 'Enter' || separators.includes(event.key)) {
                event.preventDefault()
                add(open && event.key === 'Enter' ? [options[selected]] : split(query))
              } else if (
                !query &&
                (event.key === 'Backspace' || event.key === 'ArrowLeft') &&
                tags.length
              ) {
                event.preventDefault()
                chips.current.get(tags.length - 1)?.focus()
              }
            }}
          />
          {loading && (
            <Loader2
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Loading suggestions"
            />
          )}
        </div>
        {open && (
          <ul
            id={`${id}-options`}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md"
          >
            {options.map((option, index) => (
              <li
                key={option}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={selected === index}
                className={cn(
                  'cursor-pointer rounded px-2 py-1.5 text-sm',
                  selected === index && 'bg-accent text-accent-foreground',
                )}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => setActive(index)}
                onClick={() => {
                  add([option])
                  input.current?.focus()
                }}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
        <p id={`${id}-help`} className="mt-1 text-xs text-muted-foreground">
          Enter adds a tag. Arrow keys navigate; Alt+Arrow reorders.
        </p>
        <p id={`${id}-status`} role="status" className="mt-1 text-xs text-muted-foreground">
          {message || `${tags.length} of ${limit} tags`}
        </p>
        {name &&
          tags.map((tag, index) => (
            <input key={index} type="hidden" name={name} value={tag} disabled={disabled} />
          ))}
        {children}
      </div>
    </TagsContext.Provider>
  )
}
