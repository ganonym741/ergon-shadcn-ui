import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tree, flattenTree, type TreeNode } from '@/components/ui/tree'
import { useControllableState } from '@/components/ui/util'
export function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  return nodes.flatMap((node) => {
    if (node.label.toLowerCase().includes(query.toLowerCase())) return [node]
    const children = node.children ? filterTree(node.children, query) : []
    return children.length ? [{ ...node, children }] : []
  })
}
export function TreeSelect({
  nodes,
  value,
  defaultValue = [],
  onValueChange,
  multiple,
  placeholder = 'Select from tree',
  disabled,
  searchable = true,
  virtual,
  loadChildren,
  maxTags = 3,
}: {
  nodes: TreeNode[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (keys: string[]) => void
  multiple?: boolean
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  virtual?: boolean
  loadChildren?: (key: string) => Promise<void>
  maxTags?: number
}) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [open, setOpen] = React.useState(false),
    [query, setQuery] = React.useState('')
  const all = flattenTree(nodes),
    filtered = query ? filterTree(nodes, query) : nodes
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-label={placeholder}
          aria-expanded={open}
          className="min-w-56 max-w-full justify-between font-normal"
          disabled={disabled}
        >
          <span className="truncate">
            {selected.length
              ? selected
                  .slice(0, maxTags)
                  .map((k) => all.find((n) => n.node.key === k)?.node.label)
                  .filter(Boolean)
                  .join(', ')
              : placeholder}
            {selected.length > maxTags ? ` +${selected.length - maxTags}` : ''}
          </span>
          <ChevronsUpDown size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-1">
        {searchable && (
          <Input
            aria-label="Search tree options"
            placeholder="Search options…"
            className="mb-1 border-0 shadow-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        <Tree
          key={query ? 'search' : 'browse'}
          className="border-0"
          nodes={filtered}
          virtual={virtual}
          loadChildren={loadChildren}
          checkable={multiple}
          value={selected}
          onValueChange={setSelected}
          selectedKey={selected[0]}
          onSelect={(key) => {
            if (!multiple) {
              setSelected([key])
              setOpen(false)
            }
          }}
          defaultExpandedKeys={
            query ? flattenTree(filtered).map((n) => n.node.key) : nodes.map((n) => n.key)
          }
        />
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">No options found.</p>
        )}
        {selected.length > 0 && (
          <Button size="sm" variant="ghost" className="w-full" onClick={() => setSelected([])}>
            Clear selection
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
