import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useControllableState } from '@/components/ui/util'
export interface TransferItem {
  key: string
  label: string
  disabled?: boolean
}
interface TransferPanelProps {
  items: TransferItem[]
  title: string
  checked: string[]
  onCheck: (keys: string[]) => void
  virtual?: boolean
  pageSize?: number
  disabled?: boolean
  renderItem?: (item: TransferItem) => React.ReactNode
  filterOption?: (query: string, item: TransferItem) => boolean
  draggable?: boolean
  onDropItem?: (key: string) => void
}
function TransferPanel({
  items,
  title,
  checked,
  onCheck,
  virtual,
  pageSize,
  disabled,
  renderItem,
  filterOption,
  draggable,
  onDropItem,
}: TransferPanelProps) {
  const [query, setQuery] = React.useState(''),
    [page, setPage] = React.useState(0)
  const filtered = items.filter((i) =>
      filterOption ? filterOption(query, i) : i.label.toLowerCase().includes(query.toLowerCase()),
    ),
    pages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1,
    actualPage = Math.min(page, pages - 1),
    visible = pageSize
      ? filtered.slice(actualPage * pageSize, (actualPage + 1) * pageSize)
      : filtered,
    selectable = visible.filter((i) => !i.disabled).map((i) => i.key),
    all = selectable.length > 0 && selectable.every((k) => checked.includes(k)),
    some = selectable.some((k) => checked.includes(k))
  const ref = React.useRef<HTMLDivElement>(null),
    isVirtual = virtual ?? visible.length > 100,
    list = useVirtualizer({
      count: visible.length,
      getScrollElement: () => ref.current,
      estimateSize: () => 36,
      overscan: 5,
      enabled: isVirtual,
    })
  const render = (item: TransferItem, start?: number) => (
    <label
      draggable={draggable && !disabled && !item.disabled}
      onDragStart={(event) => event.dataTransfer.setData('application/ergonui-transfer', item.key)}
      key={item.key}
      className="flex h-9 cursor-pointer items-center gap-2 rounded px-2 text-sm hover:bg-muted"
      style={
        isVirtual
          ? { position: 'absolute', top: 0, width: '100%', transform: `translateY(${start}px)` }
          : undefined
      }
    >
      <Checkbox
        disabled={disabled || item.disabled}
        checked={checked.includes(item.key)}
        onCheckedChange={(c) =>
          onCheck(c ? [...checked, item.key] : checked.filter((k) => k !== item.key))
        }
      />
      <span className="truncate">{renderItem?.(item) ?? item.label}</span>
    </label>
  )
  return (
    <div
      className="min-w-0 flex-1 rounded-lg border"
      onDragOver={(event) => {
        if (draggable && !disabled) event.preventDefault()
      }}
      onDrop={(event) => {
        event.preventDefault()
        if (!disabled && draggable)
          onDropItem?.(event.dataTransfer.getData('application/ergonui-transfer'))
      }}
    >
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
        <Checkbox
          aria-label={`Select all ${title}`}
          disabled={disabled || !selectable.length}
          checked={all ? true : some ? 'indeterminate' : false}
          onCheckedChange={() =>
            onCheck(
              all
                ? checked.filter((k) => !selectable.includes(k))
                : [...new Set([...checked, ...selectable])],
            )
          }
        />
        <span>{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="p-2">
        <Input
          aria-label={`Search ${title}`}
          placeholder="Search…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
        />
      </div>
      <div ref={ref} className="h-48 overflow-auto px-2">
        <div className="relative" style={{ height: isVirtual ? list.getTotalSize() : undefined }}>
          {isVirtual
            ? list.getVirtualItems().map((item) => render(visible[item.index], item.start))
            : visible.map((item) => render(item))}
          {!visible.length && (
            <p className="py-10 text-center text-xs text-muted-foreground">No items found.</p>
          )}
        </div>
      </div>
      {pageSize && (
        <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Previous ${title} page`}
            disabled={actualPage === 0}
            onClick={() => setPage(actualPage - 1)}
          >
            <ChevronLeft />
          </Button>
          {actualPage + 1} / {pages}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Next ${title} page`}
            disabled={actualPage >= pages - 1}
            onClick={() => setPage(actualPage + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
export interface TransferProps {
  items: TransferItem[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (keys: string[]) => void
  titles?: [string, string]
  virtual?: boolean
  pageSize?: number
  disabled?: boolean
  renderItem?: (item: TransferItem) => React.ReactNode
  filterOption?: (query: string, item: TransferItem) => boolean
  draggable?: boolean
}
export function Transfer({
  items,
  value,
  defaultValue = [],
  onValueChange,
  titles = ['Available', 'Selected'],
  ...props
}: TransferProps) {
  const [target, setTarget] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    }),
    [checked, setChecked] = React.useState<string[]>([])
  const move = (right: boolean) => {
    const movable = new Set(items.filter((i) => !i.disabled).map((i) => i.key))
    setTarget(
      right
        ? [...new Set([...target, ...checked.filter((k) => !target.includes(k) && movable.has(k))])]
        : target.filter((k) => !checked.includes(k) || !movable.has(k)),
    )
    setChecked([])
  }
  return (
    <div className="flex w-full max-w-xl items-center gap-3">
      <TransferPanel
        {...props}
        items={items.filter((i) => !target.includes(i.key))}
        title={titles[0]}
        checked={checked}
        onCheck={setChecked}
        onDropItem={(key) => {
          if (items.some((item) => item.key === key && !item.disabled))
            setTarget((current) => current.filter((item) => item !== key))
        }}
      />
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Move selected right"
          disabled={props.disabled || !checked.some((k) => !target.includes(k))}
          onClick={() => move(true)}
        >
          <ArrowRight />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Move selected left"
          disabled={props.disabled || !checked.some((k) => target.includes(k))}
          onClick={() => move(false)}
        >
          <ArrowLeft />
        </Button>
      </div>
      <TransferPanel
        {...props}
        items={items.filter((i) => target.includes(i.key))}
        title={titles[1]}
        checked={checked}
        onCheck={setChecked}
        onDropItem={(key) => {
          if (items.some((item) => item.key === key && !item.disabled))
            setTarget((current) => [...new Set([...current, key])])
        }}
      />
    </div>
  )
}
