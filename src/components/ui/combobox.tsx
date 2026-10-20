import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Check, ChevronsUpDown, X, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useControllableState, useDebouncedValue } from '@/components/ui/util'
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  description?: string
}
export interface ComboboxProps {
  id?: string
  options: SelectOption[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  multiple?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  loadOptions?: (query: string, signal: AbortSignal) => Promise<SelectOption[]>
  label?: string
  virtual?: boolean
  creatable?: boolean
  renderOption?: (option: SelectOption) => React.ReactNode
  renderValue?: (options: SelectOption[]) => React.ReactNode
}
export function Combobox({
  id,
  options,
  value,
  defaultValue = [],
  onValueChange,
  multiple,
  placeholder = 'Select an option',
  disabled,
  className,
  loadOptions,
  label = 'Select options',
  virtual,
  creatable,
  renderOption,
  renderValue,
}: ComboboxProps) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [open, setOpen] = React.useState(false),
    [query, setQuery] = React.useState(''),
    [remote, setRemote] = React.useState<SelectOption[]>([]),
    [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState(''),
    [active, setActive] = React.useState(0)
  const debounced = useDebouncedValue(query),
    listId = React.useId(),
    input = React.useRef<HTMLInputElement>(null),
    scroll = React.useRef<HTMLDivElement>(null),
    cache = React.useRef(new Map<string, SelectOption>())
  for (const option of [...options, ...remote]) cache.current.set(option.value, option)
  React.useEffect(() => {
    if (!loadOptions || !open) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    loadOptions(debounced, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setRemote(result)
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Unable to load options')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [debounced, loadOptions, open])
  const baseFiltered = loadOptions
      ? remote
      : options.filter((o) =>
          (o.label + ' ' + o.value).toLowerCase().includes(query.toLowerCase()),
        ),
    filtered =
      creatable &&
      query.trim() &&
      ![...options, ...remote].some(
        (option) =>
          option.value === query.trim() ||
          option.label.toLowerCase() === query.trim().toLowerCase(),
      )
        ? [
            ...baseFiltered,
            { value: query.trim(), label: query.trim(), description: 'Create a new option' },
          ]
        : baseFiltered,
    enabled = filtered.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)
  const virtualized = virtual ?? filtered.length > 100
  const [scrollElement, setScrollElement] = React.useState<HTMLDivElement | null>(null)
  const attachScroll = React.useCallback((element: HTMLDivElement | null) => {
    scroll.current = element
    setScrollElement(element)
  }, [])
  const list = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 52,
    overscan: 5,
    enabled: open && virtualized,
    initialRect: { width: 280, height: 280 },
  })
  const choose = (option: SelectOption) => {
    if (option.disabled) return
    cache.current.set(option.value, option)
    setSelected(
      multiple
        ? selected.includes(option.value)
          ? selected.filter((v) => v !== option.value)
          : [...selected, option.value]
        : [option.value],
    )
    if (!multiple) setOpen(false)
  }
  const optionId = (index: number) => `${listId}-${index}`
  const focus = (index: number) => {
    setActive(index)
    if (virtualized) list.scrollToIndex(index)
    else document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' })
  }
  const render = (option: SelectOption, index: number, start?: number) => (
    <div
      id={optionId(index)}
      key={option.value}
      role="option"
      aria-selected={selected.includes(option.value)}
      aria-disabled={option.disabled}
      onMouseMove={() => {
        if (!option.disabled) setActive(index)
      }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => choose(option)}
      className={cn(
        'flex h-13 cursor-pointer items-center gap-2 rounded-md px-3 text-sm',
        active === index && 'bg-accent',
        option.disabled && 'cursor-default opacity-40',
      )}
      style={
        virtualized
          ? {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${start}px)`,
            }
          : undefined
      }
    >
      <Check className={cn('size-4 shrink-0', !selected.includes(option.value) && 'opacity-0')} />
      <div className="min-w-0">
        <div className="truncate">{renderOption?.(option) ?? option.label}</div>
        {option.description && (
          <p className="truncate text-xs text-muted-foreground">{option.description}</p>
        )}
      </div>
    </div>
  )
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setQuery('')
          setActive(0)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={id ? undefined : label}
          disabled={disabled}
          className={cn('min-w-48 justify-between font-normal', className)}
        >
          <span className="truncate">
            {renderValue && selected.length ? (
              renderValue(
                selected.map((value) => cache.current.get(value) ?? { value, label: value }),
              )
            ) : selected.length ? (
              multiple ? (
                `${selected.length} selected`
              ) : (
                (cache.current.get(selected[0])?.label ?? selected[0])
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-56 p-1"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          input.current?.focus()
        }}
      >
        <div className="flex items-center gap-2 border-b px-2">
          <Search size={15} className="text-muted-foreground" />
          <Input
            ref={input}
            role="combobox"
            aria-label="Search options"
            aria-autocomplete="list"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={filtered[active] ? optionId(active) : undefined}
            className="border-0 px-0 shadow-none focus-visible:ring-0"
            placeholder="Search options…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
              scroll.current?.scrollTo({ top: 0 })
            }}
            onKeyDown={(e) => {
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                e.preventDefault()
                const at = enabled.indexOf(active),
                  next =
                    e.key === 'Home'
                      ? enabled[0]
                      : e.key === 'End'
                        ? enabled.at(-1)
                        : enabled[
                            (at + (e.key === 'ArrowDown' ? 1 : enabled.length - 1)) % enabled.length
                          ]
                if (next !== undefined) focus(next)
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                if (filtered[active]) choose(filtered[active])
              }
            }}
          />
        </div>
        <div
          ref={attachScroll}
          id={listId}
          role="listbox"
          aria-label={label}
          aria-multiselectable={!!multiple}
          className="max-h-70 overflow-auto"
          style={
            virtualized
              ? {
                  height:
                    loading || error || !filtered.length
                      ? 100
                      : Math.min(filtered.length * 52, 280),
                }
              : undefined
          }
        >
          {loading ? (
            <div role="status" className="flex items-center gap-2 p-4 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : error ? (
            <p role="alert" className="p-3 text-sm text-destructive">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No options found.</p>
          ) : virtualized ? (
            <div className="relative" style={{ height: list.getTotalSize() }}>
              {list
                .getVirtualItems()
                .map((item) => render(filtered[item.index], item.index, item.start))}
            </div>
          ) : (
            filtered.map((option, index) => render(option, index))
          )}
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            className="flex w-full items-center gap-2 border-t p-2.5 text-xs text-muted-foreground"
            onClick={() => {
              setSelected([])
              input.current?.focus()
            }}
          >
            <X size={13} />
            Clear selection
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
