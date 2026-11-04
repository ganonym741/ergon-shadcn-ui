import * as React from 'react'
import { ChevronRight, Copy, Search, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type JsonPath = (string | number)[]
export interface JsonViewerProps extends Omit<React.ComponentProps<'section'>, 'onCopy'> {
  value: unknown
  name?: string
  label?: string
  defaultExpandDepth?: number
  expandedPaths?: string[]
  onExpandedPathsChange?: (paths: string[]) => void
  searchable?: boolean
  copyable?: boolean
  pageSize?: number
  maxNodes?: number
  maxDepth?: number
  maxStringLength?: number
  onCopy?: (text: string, kind: 'path' | 'value', path: JsonPath) => void | Promise<void>
  renderValue?: (value: unknown, path: JsonPath) => React.ReactNode
}
interface JsonRow {
  path: JsonPath
  key: string
  parent?: string
  name: string
  value: unknown
  depth: number
  kind: string
  text: string
  circular: boolean
  children: JsonRow[]
}
const bounded = (value: number, fallback: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.floor(value))) : fallback
function take<T>(values: Iterable<T>, limit = 10000) {
  const result: T[] = []
  for (const value of values) {
    if (result.length >= limit) break
    result.push(value)
  }
  return result
}
/** Formats a JSON path using safe bracket notation for keys that are not identifiers. */
export function formatJsonPath(path: readonly (string | number)[]): string {
  return (
    '$' +
    path
      .map((key) =>
        typeof key === 'number'
          ? `[${key}]`
          : /^[A-Za-z_$][\w$]*$/.test(key)
            ? `.${key}`
            : `[${JSON.stringify(key)}]`,
      )
      .join('')
  )
}
/** Serializes ordinary and extended JavaScript values without throwing on cycles or BigInt. */
export function stringifyJsonValue(value: unknown, space = 2): string {
  let count = 0
  const normalize = (item: unknown, ancestors: Set<object>, depth: number): unknown => {
    if (++count > 10000 || depth > 50) return '[Truncated]'
    if (typeof item === 'bigint') return `${item}n`
    if (typeof item === 'undefined') return null
    if (typeof item === 'symbol' || typeof item === 'function') return String(item)
    if (!item || typeof item !== 'object') return item
    if (ancestors.has(item)) return '[Circular]'
    if (item instanceof Date)
      return Number.isNaN(item.getTime()) ? 'Invalid Date' : item.toISOString()
    const next = new Set(ancestors).add(item)
    if (item instanceof Map)
      return take(item).map(([key, value]) => [
        normalize(key, next, depth + 1),
        normalize(value, next, depth + 1),
      ])
    if (item instanceof Set) return take(item).map((child) => normalize(child, next, depth + 1))
    if (Array.isArray(item))
      return item.slice(0, 10000).map((child) => normalize(child, next, depth + 1))
    return Object.fromEntries(
      Object.entries(Object.getOwnPropertyDescriptors(item))
        .slice(0, 10000)
        .map(([key, descriptor]) => [
          key,
          'value' in descriptor ? normalize(descriptor.value, next, depth + 1) : '[Getter]',
        ]),
    )
  }
  try {
    return JSON.stringify(normalize(value, new Set(), 0), null, bounded(space, 2, 0, 10)) ?? 'null'
  } catch {
    return '"[Unserializable]"'
  }
}
function describe(
  value: unknown,
  maxLength: number,
): { kind: string; text: string; entries: [string | number, unknown][] } {
  if (value === null) return { kind: 'null', text: 'null', entries: [] }
  if (typeof value === 'string')
    return {
      kind: 'string',
      text: JSON.stringify(value.length > maxLength ? value.slice(0, maxLength) + '…' : value),
      entries: [],
    }
  if (typeof value !== 'object')
    return {
      kind: typeof value,
      text: (typeof value === 'bigint'
        ? `${value}n`
        : typeof value === 'function'
          ? Function.prototype.toString.call(value)
          : String(value)
      ).slice(0, maxLength),
      entries: [],
    }
  if (value instanceof Date)
    return {
      kind: 'date',
      text: Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString(),
      entries: [],
    }
  if (value instanceof Map)
    return {
      kind: 'map',
      text: `Map(${value.size})`,
      entries: take(value.entries()).map((entry, index) => [index, entry]),
    }
  if (value instanceof Set)
    return {
      kind: 'set',
      text: `Set(${value.size})`,
      entries: take(value).map((entry, i) => [i, entry]),
    }
  if (Array.isArray(value))
    return {
      kind: 'array',
      text: `[${value.length} items]`,
      entries: Array.from({ length: Math.min(value.length, 10000) }, (_, i) => [i, value[i]]),
    }
  const descriptors = Object.getOwnPropertyDescriptors(value),
    keys = Object.keys(descriptors)
  return {
    kind: 'object',
    text: `{${keys.length} keys}`,
    entries: keys
      .slice(0, 10000)
      .map((key) => [key, 'value' in descriptors[key] ? descriptors[key].value : '[Getter]']),
  }
}
function outline(
  value: unknown,
  name: string,
  maxNodes: number,
  maxDepth: number,
  maxStringLength: number,
) {
  let count = 0,
    truncated = false
  const rows: JsonRow[] = []
  const visit = (
    value: unknown,
    path: JsonPath,
    depth: number,
    ancestors: Set<object>,
    parent?: string,
  ): JsonRow | undefined => {
    if (count++ >= maxNodes) {
      truncated = true
      return
    }
    const circular = !!value && typeof value === 'object' && ancestors.has(value)
    let summary: ReturnType<typeof describe>
    try {
      summary = circular
        ? { kind: 'circular', text: '[Circular]', entries: [] }
        : describe(value, maxStringLength)
    } catch {
      summary = { kind: 'unknown', text: '[Uninspectable]', entries: [] }
    }
    const row: JsonRow = {
      path,
      key: formatJsonPath(path),
      parent,
      name: path.length ? String(path.at(-1)) : name,
      value,
      depth,
      kind: summary.kind,
      text: summary.text,
      circular,
      children: [],
    }
    rows.push(row)
    if (summary.entries.length && depth >= maxDepth) {
      row.text += ' · depth limit'
      truncated = true
      return row
    }
    const next = new Set(ancestors)
    if (value && typeof value === 'object') next.add(value)
    for (const [key, child] of summary.entries) {
      if (rows.length >= maxNodes) {
        truncated = true
        break
      }
      const result = visit(child, [...path, key], depth + 1, next, row.key)
      if (result) row.children.push(result)
    }
    return row
  }
  const root = visit(value, [], 0, new Set())!
  return { root, rows, truncated }
}
interface JsonContext {
  root: JsonRow
  rows: JsonRow[]
  query: string
  setQuery: (value: string) => void
  isExpanded: (row: JsonRow) => boolean
  toggle: (row: JsonRow) => void
  expandAll: () => void
  collapseAll: () => void
  copy: (row: JsonRow, kind: 'path' | 'value') => void
  copyable: boolean
  pageSize: number
  active: string
  setActive: (key: string) => void
  tree: React.RefObject<HTMLDivElement | null>
  renderValue: JsonViewerProps['renderValue']
  included: Set<string> | null
}
const Context = React.createContext<JsonContext | null>(null)
function useJson() {
  const context = React.useContext(Context)
  if (!context) throw new Error('JSON viewer parts must be inside JsonViewer.')
  return context
}
/** Displays bounded, searchable JSON trees with safe extended-value handling and copy actions. */
export function JsonViewer({
  value,
  name = 'root',
  label = 'JSON viewer',
  defaultExpandDepth = 1,
  expandedPaths,
  onExpandedPathsChange,
  searchable = true,
  copyable = true,
  pageSize = 50,
  maxNodes = 2000,
  maxDepth = 12,
  maxStringLength = 200,
  onCopy,
  renderValue,
  children,
  className,
  ...props
}: JsonViewerProps) {
  const data = React.useMemo(
    () =>
      outline(
        value,
        name,
        bounded(maxNodes, 2000, 1, 10000),
        bounded(maxDepth, 12, 1, 50),
        bounded(maxStringLength, 200, 10, 10000),
      ),
    [value, name, maxNodes, maxDepth, maxStringLength],
  )
  const [query, setQuery] = React.useState(''),
    [overrides, setOverrides] = React.useState<Record<string, boolean>>({}),
    [active, setActive] = React.useState('$'),
    [message, setMessage] = React.useState('')
  const tree = React.useRef<HTMLDivElement>(null),
    expansion = React.useMemo(
      () => (expandedPaths ? new Set(expandedPaths) : null),
      [expandedPaths],
    ),
    depth = bounded(defaultExpandDepth, 1, 0, 50)
  const included = React.useMemo(() => {
    if (!query.trim()) return null
    const matched = new Set(
        data.rows
          .filter((row) => `${row.name} ${row.text}`.toLowerCase().includes(query.toLowerCase()))
          .map((row) => row.key),
      ),
      allowed = new Set<string>(),
      byKey = new Map(data.rows.map((row) => [row.key, row]))
    for (const row of data.rows) {
      let parent: JsonRow | undefined = row
      let match = matched.has(row.key)
      while (parent?.parent && !match) {
        parent = byKey.get(parent.parent)
        match = !!parent && matched.has(parent.key)
      }
      if (match) {
        parent = row
        while (parent) {
          allowed.add(parent.key)
          parent = parent.parent ? byKey.get(parent.parent) : undefined
        }
      }
    }
    return allowed
  }, [query, data.rows])
  const isExpanded = (row: JsonRow) =>
    included
      ? row.children.some((child) => included.has(child.key))
      : expansion
        ? expansion.has(row.key)
        : (overrides[row.key] ?? row.depth < depth)
  const change = (next: Record<string, boolean>) => {
    setOverrides(next)
    onExpandedPathsChange?.(
      data.rows
        .filter(
          (row) =>
            row.children.length &&
            (next[row.key] ?? (expansion ? expansion.has(row.key) : row.depth < depth)),
        )
        .map((row) => row.key),
    )
  }
  const toggle = (row: JsonRow) =>
    change({
      ...Object.fromEntries(data.rows.map((item) => [item.key, isExpanded(item)])),
      [row.key]: !isExpanded(row),
    })
  const copy = async (row: JsonRow, kind: 'path' | 'value') => {
    const text = kind === 'path' ? row.key : stringifyJsonValue(row.value)
    try {
      if (onCopy) await onCopy(text, kind, row.path)
      else await navigator.clipboard.writeText(text)
      setMessage(`Copied ${kind} for ${row.name}.`)
    } catch {
      setMessage('Could not copy. Clipboard access is unavailable.')
    }
  }
  React.useLayoutEffect(() => {
    const visible = Array.from(
      tree.current?.querySelectorAll<HTMLElement>('[data-json-node]') ?? [],
    )
    if (!visible.some((node) => node.dataset.jsonNode === active))
      setActive(visible[0]?.dataset.jsonNode ?? '$')
  }, [data, query, expandedPaths, overrides, depth, pageSize, active])
  return (
    <Context.Provider
      value={{
        ...data,
        query,
        setQuery,
        isExpanded,
        toggle,
        expandAll: () => change(Object.fromEntries(data.rows.map((row) => [row.key, true]))),
        collapseAll: () => change(Object.fromEntries(data.rows.map((row) => [row.key, false]))),
        copy,
        copyable,
        pageSize: bounded(pageSize, 50, 1, 1000),
        active,
        setActive,
        tree,
        renderValue,
        included,
      }}
    >
      <section
        {...props}
        data-slot="json-viewer"
        aria-label={label}
        className={cn('w-full min-w-0 overflow-hidden rounded-xl border bg-background', className)}
      >
        {children ?? (
          <>
            <JsonViewerToolbar searchable={searchable} />
            <JsonViewerContent label={label} />
          </>
        )}
        <p role="status" className="border-t px-3 py-2 text-xs text-muted-foreground">
          {message ||
            (data.truncated
              ? `Showing up to ${Math.min(data.rows.length, maxNodes)} nodes within the configured limits.`
              : `${data.rows.length} nodes`)}
        </p>
      </section>
    </Context.Provider>
  )
}
/** Provides search and expansion controls independently of the tree content. */
export function JsonViewerToolbar({ searchable = true }: { searchable?: boolean }) {
  const c = useJson()
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/25 p-2">
      {searchable && (
        <div className="relative min-w-32 flex-1">
          <Search
            size={14}
            className="absolute start-2.5 top-2.5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search JSON"
            type="search"
            value={c.query}
            onChange={(event) => c.setQuery(event.target.value)}
            placeholder="Find a key or value…"
            className="h-8 ps-8"
          />
        </div>
      )}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Expand all JSON nodes"
        disabled={!!c.query}
        onClick={c.expandAll}
      >
        <ChevronsUpDown />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Collapse all JSON nodes"
        disabled={!!c.query}
        onClick={c.collapseAll}
      >
        <ChevronsDownUp />
      </Button>
    </div>
  )
}
/** Renders the keyboard-navigable tree with pagination and optional custom value rendering. */
export function JsonViewerContent({ label = 'JSON data' }: { label?: string }) {
  const c = useJson()
  if (c.included?.size === 0)
    return (
      <p role="status" className="p-4 text-xs text-muted-foreground">
        No matching keys or values.
      </p>
    )
  return (
    <div
      ref={c.tree}
      dir="ltr"
      role="tree"
      aria-label={label}
      className="max-h-[32rem] overflow-auto p-2 text-left font-mono text-xs"
    >
      {c.included?.size === 0 ? (
        <p role="status" className="p-4 font-sans text-muted-foreground">
          No matching keys or values.
        </p>
      ) : (
        <JsonViewerNode row={c.root} />
      )}
    </div>
  )
}
function JsonViewerNode({ row }: { row: JsonRow }) {
  const c = useJson(),
    [shown, setShown] = React.useState(c.pageSize),
    expanded = c.isExpanded(row),
    expandable = row.children.length > 0,
    ref = React.useRef<HTMLDivElement>(null)
  const children = row.children.filter((child) => !c.included || c.included.has(child.key)),
    visible = children.slice(0, shown)
  React.useEffect(() => setShown(c.pageSize), [c.pageSize, c.query])
  return (
    <div
      ref={ref}
      role="treeitem"
      data-json-node={row.key}
      aria-level={row.depth + 1}
      aria-label={`${row.name}: ${row.text}`}
      aria-expanded={expandable ? expanded : undefined}
      tabIndex={c.active === row.key ? 0 : -1}
      onFocus={(event) => {
        if (event.target === event.currentTarget) c.setActive(row.key)
      }}
      className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        const nodes = [
            ...(c.tree.current?.querySelectorAll<HTMLElement>('[data-json-node]') ?? []),
          ],
          index = nodes.indexOf(event.currentTarget)
        let target: HTMLElement | undefined
        if (event.key === 'ArrowDown') target = nodes[index + 1]
        else if (event.key === 'ArrowUp') target = nodes[index - 1]
        else if (event.key === 'Home') target = nodes[0]
        else if (event.key === 'End') target = nodes.at(-1)
        else if (event.key === 'ArrowRight') {
          if (expandable && !expanded) c.toggle(row)
          else target = nodes[index + 1]
        } else if (event.key === 'ArrowLeft') {
          if (expandable && expanded) c.toggle(row)
          else target = nodes.find((node) => node.dataset.jsonNode === row.parent)
        } else if ((event.key === 'Enter' || event.key === ' ') && expandable) c.toggle(row)
        else return
        event.preventDefault()
        event.stopPropagation()
        target?.focus()
      }}
    >
      <div className="group/json flex min-w-max items-start gap-1 rounded px-1 py-1 hover:bg-muted/50">
        {expandable ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${row.name}`}
            className="mt-0.5 rounded focus-visible:outline-ring"
            onClick={() => {
              c.setActive(row.key)
              ref.current?.focus()
              c.toggle(row)
            }}
          >
            <ChevronRight
              size={13}
              className={cn('transition-transform', expanded && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-[13px]" />
        )}
        <span className="shrink-0 font-medium">{JSON.stringify(row.name)}:</span>
        <span
          className={cn(
            'min-w-0 whitespace-pre-wrap break-all',
            row.kind === 'string' || row.kind === 'date'
              ? 'text-emerald-700 dark:text-emerald-400'
              : row.kind === 'number' || row.kind === 'bigint'
                ? 'text-blue-700 dark:text-blue-400'
                : row.kind === 'boolean'
                  ? 'text-violet-700 dark:text-violet-400'
                  : 'text-muted-foreground',
          )}
        >
          {c.renderValue?.(row.value, row.path) ?? row.text}
        </span>
        {c.copyable && (
          <span className="ms-auto flex shrink-0 gap-0.5 ps-3">
            <button
              type="button"
              aria-label={`Copy path for ${row.name}`}
              title="Copy path"
              className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => void c.copy(row, 'path')}
            >
              <span aria-hidden="true">$</span>
            </button>
            <button
              type="button"
              aria-label={`Copy value for ${row.name}`}
              title="Copy value"
              className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => void c.copy(row, 'value')}
            >
              <Copy size={12} />
            </button>
          </span>
        )}
      </div>
      {expandable && expanded && (
        <div role="group" className="ms-2 border-s ps-3">
          {visible.map((child) => (
            <JsonViewerNode key={child.key} row={child} />
          ))}
          {children.length > shown && (
            <div role="treeitem" aria-label={`More items in ${row.name}`}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="my-1 text-xs"
                onClick={() => setShown((value) => value + c.pageSize)}
              >
                Show {Math.min(c.pageSize, children.length - shown)} more items
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
