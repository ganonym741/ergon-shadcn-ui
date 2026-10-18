import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Input, type InputProps } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useControllableState, useDebouncedValue } from '@/components/ui/util'
import { cn } from '@/lib/utils'
export interface AutoCompleteProps extends Omit<InputProps, 'onChange' | 'value' | 'defaultValue'> {
  options: string[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  loadOptions?: (query: string, signal: AbortSignal) => Promise<string[]>
  renderOption?: (value: string) => React.ReactNode
  virtual?: boolean
  searchable?: boolean
}
export function AutoComplete({
  options,
  value,
  defaultValue = '',
  onValueChange,
  loadOptions,
  renderOption,
  virtual,
  searchable = true,
  ...props
}: AutoCompleteProps) {
  const [text, setText] = useControllableState({ value, defaultValue, onChange: onValueChange }),
    [open, setOpen] = React.useState(false),
    [remote, setRemote] = React.useState<string[]>([]),
    [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState(''),
    [active, setActive] = React.useState(0)
  const query = useDebouncedValue(text),
    id = React.useId(),
    scroll = React.useRef<HTMLDivElement>(null),
    input = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (!open || !loadOptions) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    loadOptions(query, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setRemote(data)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(String(e))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [query, loadOptions, open])
  const filtered = React.useMemo(
      () =>
        loadOptions
          ? remote
          : searchable
            ? options.filter((option) => option.toLowerCase().includes(text.toLowerCase()))
            : options,
      [loadOptions, remote, options, text, searchable],
    ),
    virtualized = virtual ?? filtered.length > 100,
    list = useVirtualizer({
      count: filtered.length,
      getScrollElement: () => scroll.current,
      estimateSize: () => 36,
      overscan: 4,
      enabled: open && virtualized,
      initialRect: { width: 280, height: 250 },
    })
  const choose = (option: string) => {
    setText(option)
    setOpen(false)
    input.current?.focus()
  }
  const render = (index: number, start?: number) => (
    <div
      key={index}
      id={`${id}-${index}`}
      role="option"
      aria-selected={active === index}
      className={cn('cursor-pointer rounded px-3 py-2 text-sm', active === index && 'bg-accent')}
      style={
        start === undefined
          ? undefined
          : { position: 'absolute', top: start, height: 36, width: '100%' }
      }
      onPointerMove={() => setActive(index)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => choose(filtered[index])}
    >
      {renderOption?.(filtered[index]) ?? filtered[index]}
    </div>
  )
  return (
    <Popover open={open && !props.disabled} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          {...props}
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={id}
          aria-activedescendant={open && filtered[active] ? `${id}-${active}` : undefined}
          value={text}
          onFocus={() => setOpen(true)}
          onValueChange={(next) => {
            setText(next)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              const next =
                (active + (event.key === 'ArrowDown' ? 1 : filtered.length - 1)) %
                Math.max(1, filtered.length)
              setActive(next)
              list.scrollToIndex(next)
            }
            if (event.key === 'Enter' && open && filtered[active]) {
              event.preventDefault()
              choose(filtered[active])
            }
            if (event.key === 'Escape') setOpen(false)
            props.onKeyDown?.(event)
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-56 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (input.current?.contains(e.target as Node)) e.preventDefault()
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div
          ref={scroll}
          id={id}
          role="listbox"
          className="max-h-64 overflow-auto"
          style={virtualized ? { height: Math.min(250, filtered.length * 36) } : undefined}
        >
          {loading ? (
            <p role="status" className="p-3 text-sm">
              Loading suggestions…
            </p>
          ) : error ? (
            <p role="alert" className="p-3 text-sm text-destructive">
              {error}
            </p>
          ) : filtered.length ? (
            virtualized ? (
              <div className="relative" style={{ height: list.getTotalSize() }}>
                {list.getVirtualItems().map((item) => render(item.index, item.start))}
              </div>
            ) : (
              filtered.map((_, index) => render(index))
            )
          ) : (
            <p className="p-3 text-sm text-muted-foreground">No suggestions.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
