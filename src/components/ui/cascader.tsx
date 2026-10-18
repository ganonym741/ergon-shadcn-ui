import * as React from 'react'
import { ChevronRight, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useControllableState, useDebouncedValue } from '@/components/ui/util'
export interface CascaderPath {
  values: string[]
  labels: string[]
  disabled?: boolean
}
export interface CascaderOption {
  value: string
  label: string
  disabled?: boolean
  children?: CascaderOption[]
  isLeaf?: boolean
}
export interface CascaderProps {
  options: CascaderOption[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (path: string[]) => void
  changeOnSelect?: boolean
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  loadChildren?: (path: string[], signal: AbortSignal) => Promise<CascaderOption[]>
  multiple?: boolean
  values?: string[][]
  onValuesChange?: (values: string[][]) => void
  searchOptions?: (query: string, signal: AbortSignal) => Promise<CascaderPath[]>
}
export function Cascader({
  options,
  value,
  defaultValue = [],
  onValueChange,
  changeOnSelect,
  placeholder = 'Choose a location',
  disabled,
  searchable = true,
  loadChildren,
  multiple,
  values,
  onValuesChange,
  searchOptions,
}: CascaderProps) {
  const [selectedPaths, setSelectedPaths] = useControllableState<string[][]>({
    value: values,
    defaultValue: [],
    onChange: onValuesChange,
  })
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: (path) => {
      onValueChange?.(path)
      if (multiple)
        setSelectedPaths((previous) =>
          previous.some((item) => JSON.stringify(item) === JSON.stringify(path))
            ? previous.filter((item) => JSON.stringify(item) !== JSON.stringify(path))
            : [...previous, path],
        )
    },
  })
  const [path, setPath] = React.useState<string[]>(selected),
    [open, setOpen] = React.useState(false),
    [query, setQuery] = React.useState(''),
    [loading, setLoading] = React.useState(''),
    [error, setError] = React.useState(''),
    [loaded, setLoaded] = React.useState<Record<string, CascaderOption[]>>({})
  const request = React.useRef<AbortController | null>(null)
  const [remotePaths, setRemotePaths] = React.useState<CascaderPath[]>([]),
    debounced = useDebouncedValue(query)
  React.useEffect(() => {
    if (!searchOptions || !debounced) return
    const controller = new AbortController()
    setLoading('search')
    searchOptions(debounced, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setRemotePaths(result)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading('')
      })
    return () => controller.abort()
  }, [searchOptions, debounced])
  React.useEffect(() => () => request.current?.abort(), [])
  const children = (option: CascaderOption, parents: string[]) =>
    option.children ?? loaded[JSON.stringify([...parents, option.value])]
  const columns: CascaderOption[][] = [options]
  const labels: string[] = []
  let level = options
  for (let i = 0; i < selected.length; i++) {
    const node = level.find((o) => o.value === selected[i])
    if (node) {
      labels.push(node.label)
      level = children(node, selected.slice(0, i)) ?? []
    }
  }
  for (let i = 0; i < path.length; i++) {
    const node = columns[i]?.find((o) => o.value === path[i])
    const next = node ? children(node, path.slice(0, i)) : undefined
    if (next?.length) columns.push(next)
    else break
  }
  const paths: CascaderPath[] = searchOptions ? remotePaths : []
  const walk = (
    nodes: CascaderOption[],
    values: string[] = [],
    names: string[] = [],
    parentDisabled = false,
  ) => {
    for (const node of nodes) {
      const valuesNext = [...values, node.value],
        labelsNext = [...names, node.label],
        child = children(node, values)
      if (child?.length) walk(child, valuesNext, labelsNext, parentDisabled || node.disabled)
      else
        paths.push({
          values: valuesNext,
          labels: labelsNext,
          disabled: parentDisabled || node.disabled,
        })
    }
  }
  if (query && !searchOptions) walk(options)
  const choose = async (option: CascaderOption, index: number) => {
    const next = [...path.slice(0, index), option.value]
    setPath(next)
    setError('')
    let child = children(option, next.slice(0, -1))
    if (!child && option.isLeaf === false && loadChildren) {
      request.current?.abort()
      const controller = new AbortController()
      request.current = controller
      setLoading(JSON.stringify(next))
      try {
        child = await loadChildren(next, controller.signal)
        if (controller.signal.aborted) return
        setLoaded((p) => ({ ...p, [JSON.stringify(next)]: child! }))
      } catch (e) {
        if (!controller.signal.aborted) setError(String(e))
        return
      } finally {
        if (!controller.signal.aborted) setLoading('')
      }
    }
    if (!child?.length || changeOnSelect) setSelected(next)
    if (!child?.length && !multiple) setOpen(false)
  }
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          setPath(selected)
          setQuery('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="min-w-56 justify-between font-normal"
          disabled={disabled}
        >
          {multiple
            ? `${selectedPaths.length} paths selected`
            : labels.length
              ? labels.join(' / ')
              : placeholder}
          <ChevronRight size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[90vw] p-1" align="start">
        {searchable && (
          <div className="flex items-center gap-2 border-b px-2">
            <Search size={14} className="text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search cascader options"
              placeholder="Search paths…"
              className="border-0 shadow-none"
            />
          </div>
        )}
        {query ? (
          <div className="max-h-64 min-w-60 overflow-auto">
            {paths
              .filter((p) => p.labels.join(' ').toLowerCase().includes(query.toLowerCase()))
              .map((p) => (
                <button
                  type="button"
                  key={JSON.stringify(p.values)}
                  disabled={p.disabled}
                  className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-40"
                  onClick={() => {
                    setSelected(p.values)
                    setPath(p.values)
                    if (!multiple) setOpen(false)
                  }}
                >
                  {p.labels.join(' / ')}
                </button>
              ))}
            {!paths.some((p) => p.labels.join(' ').toLowerCase().includes(query.toLowerCase())) && (
              <p className="p-4 text-xs text-muted-foreground">No paths found.</p>
            )}
          </div>
        ) : (
          <div className="flex gap-1 overflow-auto">
            {columns.map((col, index) => (
              <div className="max-h-64 min-w-36 overflow-auto border-r last:border-0" key={index}>
                {col.map((option) => (
                  <button
                    key={option.value}
                    disabled={option.disabled || !!loading}
                    className={cn(
                      'flex w-full items-center justify-between gap-4 rounded px-3 py-2 text-sm hover:bg-muted disabled:opacity-40',
                      path[index] === option.value && 'bg-primary/10 text-primary',
                    )}
                    onClick={() => void choose(option, index)}
                  >
                    {multiple &&
                    !children(option, path.slice(0, index))?.length &&
                    option.isLeaf !== false ? (
                      <span>
                        {selectedPaths.some(
                          (item) =>
                            JSON.stringify(item) ===
                            JSON.stringify([...path.slice(0, index), option.value]),
                        )
                          ? '☑'
                          : '☐'}{' '}
                        {option.label}
                      </span>
                    ) : (
                      option.label
                    )}
                    {loading === JSON.stringify([...path.slice(0, index), option.value]) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : children(option, path.slice(0, index))?.length ||
                      option.isLeaf === false ? (
                      <ChevronRight size={13} />
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="p-3 text-xs text-destructive">
            {error}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
