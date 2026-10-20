import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronRight, Folder, File, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'
export interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
  disabled?: boolean
  isLeaf?: boolean
  icon?: React.ReactNode
}
export function flattenTree(
  nodes: TreeNode[],
  expanded?: string[],
  level = 0,
  parent?: string,
): { node: TreeNode; level: number; parent?: string }[] {
  return nodes.flatMap((node) => [
    { node, level, parent },
    ...(node.children && (!expanded || expanded.includes(node.key))
      ? flattenTree(node.children, expanded, level + 1, node.key)
      : []),
  ])
}
export function treeLeaves(node: TreeNode): string[] {
  return node.disabled ? [] : node.children?.length ? node.children.flatMap(treeLeaves) : [node.key]
}
export function canDropTreeNode(nodes: TreeNode[], source: string, target: string) {
  const flat = flattenTree(nodes),
    sourceNode = flat.find((n) => n.node.key === source)?.node,
    targetNode = flat.find((n) => n.node.key === target)?.node
  return (
    !!sourceNode &&
    !!targetNode &&
    !sourceNode.disabled &&
    !targetNode.disabled &&
    source !== target &&
    !flattenTree(sourceNode.children ?? []).some((n) => n.node.key === target)
  )
}
export interface TreeProps {
  nodes: TreeNode[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (keys: string[]) => void
  expandedKeys?: string[]
  defaultExpandedKeys?: string[]
  onExpandedChange?: (keys: string[]) => void
  selectedKey?: string
  onSelect?: (key: string) => void
  checkable?: boolean
  virtual?: boolean
  height?: number
  className?: string
  loadChildren?: (key: string) => Promise<void>
  onNodeDrop?: (source: string, target: string, position: TreeDropPosition) => void
  onNodesChange?: (nodes: TreeNode[]) => void
  label?: string
}
export function Tree({
  nodes,
  value,
  defaultValue = [],
  onValueChange,
  expandedKeys,
  defaultExpandedKeys = [],
  onExpandedChange,
  selectedKey,
  onSelect,
  checkable,
  virtual,
  height = 300,
  className,
  loadChildren,
  onNodeDrop,
  onNodesChange,
  label = 'Tree',
}: TreeProps) {
  const [checked, setChecked] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [expanded, setExpanded] = useControllableState({
    value: expandedKeys,
    defaultValue: defaultExpandedKeys,
    onChange: onExpandedChange,
  })
  const [loading, setLoading] = React.useState<string[]>([])
  const [error, setError] = React.useState('')
  const [focused, setFocused] = React.useState<string>()
  const [drop, setDrop] = React.useState<{ key: string; position: TreeDropPosition }>()
  const container = React.useRef<HTMLDivElement>(null)
  const flat = flattenTree(nodes, expanded)
  const rowVirtualizer = useVirtualizer({
    count: flat.length,
    getScrollElement: () => container.current,
    estimateSize: () => 36,
    overscan: 6,
    enabled: !!virtual,
  })
  const toggle = async (node: TreeNode) => {
    if (expanded.includes(node.key)) {
      setExpanded(expanded.filter((k) => k !== node.key))
      return
    }
    if (!node.children?.length && !node.isLeaf && loadChildren) {
      setLoading((p) => [...p, node.key])
      try {
        await loadChildren(node.key)
      } catch (e) {
        setError(String(e))
        return
      } finally {
        setLoading((p) => p.filter((k) => k !== node.key))
      }
    }
    setExpanded([...expanded, node.key])
  }
  const focusNode = (index: number) => {
    const target = flat[Math.max(0, Math.min(flat.length - 1, index))]
    if (!target) return
    setFocused(target.node.key)
    if (virtual) rowVirtualizer.scrollToIndex(index)
    requestAnimationFrame(() =>
      container.current
        ?.querySelector<HTMLElement>(`[data-tree-key="${CSS.escape(target.node.key)}"]`)
        ?.focus(),
    )
  }
  const render = ({ node, level }: (typeof flat)[number], index: number) => {
    const leaves = treeLeaves(node)
    const full = leaves.length > 0 && leaves.every((k) => checked.includes(k))
    const partial = leaves.some((k) => checked.includes(k))
    const branch = !!node.children?.length || (!node.isLeaf && !!loadChildren)
    return (
      <div
        key={node.key}
        role="treeitem"
        data-tree-key={node.key}
        aria-level={level + 1}
        aria-selected={selectedKey === node.key}
        aria-expanded={branch ? expanded.includes(node.key) : undefined}
        aria-checked={checkable ? (full ? true : partial ? 'mixed' : false) : undefined}
        aria-disabled={node.disabled}
        tabIndex={(focused ?? flat[0]?.node.key) === node.key ? 0 : -1}
        draggable={!!(onNodeDrop || onNodesChange) && !node.disabled}
        onDragStart={(e) => e.dataTransfer.setData('text/plain', node.key)}
        onDragEnd={() => setDrop(undefined)}
        onDragOver={(e) => {
          if (onNodeDrop || onNodesChange) {
            e.preventDefault()
            const rect = e.currentTarget.getBoundingClientRect(),
              ratio = (e.clientY - rect.top) / rect.height
            setDrop({
              key: node.key,
              position: ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside',
            })
          }
        }}
        onDrop={(e) => {
          e.preventDefault()
          const key = e.dataTransfer.getData('text/plain')
          const position = drop?.key === node.key ? drop.position : 'inside'
          if (canDropTreeNode(nodes, key, node.key)) {
            onNodeDrop?.(key, node.key, position)
            onNodesChange?.(moveTreeNode(nodes, key, node.key, position))
          }
          setDrop(undefined)
        }}
        onFocus={() => setFocused(node.key)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          const current = flat.findIndex((n) => n.node.key === node.key)
          if (
            e.altKey &&
            ['ArrowUp', 'ArrowDown'].includes(e.key) &&
            (onNodeDrop || onNodesChange)
          ) {
            e.preventDefault()
            const siblings = flat.filter((item) => item.parent === flat[current].parent),
              at = siblings.findIndex((item) => item.node.key === node.key),
              target = siblings[at + (e.key === 'ArrowUp' ? -1 : 1)]?.node,
              position = e.key === 'ArrowUp' ? 'before' : 'after'
            if (target && canDropTreeNode(nodes, node.key, target.key)) {
              onNodeDrop?.(node.key, target.key, position)
              onNodesChange?.(moveTreeNode(nodes, node.key, target.key, position))
            }
            return
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            focusNode(current + 1)
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            focusNode(current - 1)
          }
          if (e.key === 'Home') {
            e.preventDefault()
            focusNode(0)
          }
          if (e.key === 'End') {
            e.preventDefault()
            focusNode(flat.length - 1)
          }
          if (e.key === 'ArrowRight' && branch) {
            e.preventDefault()
            if (!expanded.includes(node.key)) void toggle(node)
            else focusNode(current + 1)
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            if (expanded.includes(node.key)) void toggle(node)
            else {
              const parent = flat[current].parent
              if (parent) focusNode(flat.findIndex((n) => n.node.key === parent))
            }
          }
          if ((e.key === 'Enter' || e.key === ' ') && !node.disabled) {
            e.preventDefault()
            if (checkable) {
              setChecked(
                full
                  ? checked.filter((k) => !leaves.includes(k))
                  : [...new Set([...checked, ...leaves])],
              )
            } else onSelect?.(node.key)
          }
        }}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-md pr-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
          selectedKey === node.key && 'bg-primary/10 text-primary',
          node.disabled && 'opacity-40',
          drop?.key === node.key &&
            (drop.position === 'inside'
              ? 'bg-primary/15 ring-1 ring-primary'
              : drop.position === 'before'
                ? 'border-t-2 border-primary'
                : 'border-b-2 border-primary'),
        )}
        style={{
          paddingInlineStart: level * 20 + 4,
          ...(virtual ? { position: 'absolute', top: index * 36, width: '100%' } : {}),
        }}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={!branch || node.disabled}
          aria-label={`${expanded.includes(node.key) ? 'Collapse' : 'Expand'} ${node.label}`}
          onClick={() => void toggle(node)}
          className={cn('flex size-6 items-center justify-center', !branch && 'invisible')}
        >
          {loading.includes(node.key) ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <ChevronRight
              size={14}
              className={cn('transition', expanded.includes(node.key) && 'rotate-90')}
            />
          )}
        </button>
        {checkable && (
          <Checkbox
            tabIndex={-1}
            aria-label={`Select ${node.label}`}
            disabled={node.disabled}
            checked={full ? true : partial ? 'indeterminate' : false}
            onCheckedChange={() =>
              setChecked(
                full
                  ? checked.filter((k) => !leaves.includes(k))
                  : [...new Set([...checked, ...leaves])],
              )
            }
          />
        )}
        <span className="text-muted-foreground">
          {node.icon ?? (branch ? <Folder size={15} /> : <File size={15} />)}
        </span>
        <button
          type="button"
          tabIndex={-1}
          disabled={node.disabled}
          onClick={() => {
            onSelect?.(node.key)
            if (branch && !checkable) void toggle(node)
          }}
          className="flex-1 truncate text-left"
        >
          {node.label}
        </button>
      </div>
    )
  }
  return (
    <div>
      <div
        ref={container}
        role="tree"
        aria-label={label}
        aria-multiselectable={checkable}
        className={cn('overflow-auto rounded-lg border p-2', className)}
        style={{ height: virtual ? height : undefined, maxHeight: height }}
      >
        <div
          className="relative"
          style={{ height: virtual ? rowVirtualizer.getTotalSize() : undefined }}
        >
          {virtual
            ? rowVirtualizer.getVirtualItems().map((row) => render(flat[row.index], row.index))
            : flat.map(render)}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
export type TreeDropPosition = 'before' | 'inside' | 'after'
export function moveTreeNode(
  nodes: TreeNode[],
  source: string,
  target: string,
  position: TreeDropPosition,
): TreeNode[] {
  if (!canDropTreeNode(nodes, source, target)) return nodes
  let moving: TreeNode | undefined
  const remove = (items: TreeNode[]): TreeNode[] =>
    items.flatMap((node) => {
      if (node.key === source) {
        moving = node
        return []
      }
      return [{ ...node, ...(node.children ? { children: remove(node.children) } : {}) }]
    })
  const stripped = remove(nodes)
  if (!moving) return nodes
  const insert = (items: TreeNode[]): TreeNode[] =>
    items.flatMap((node) =>
      node.key === target
        ? position === 'before'
          ? [moving!, node]
          : position === 'after'
            ? [node, moving!]
            : [{ ...node, isLeaf: false, children: [...(node.children ?? []), moving!] }]
        : [{ ...node, ...(node.children ? { children: insert(node.children) } : {}) }],
    )
  return insert(stripped)
}
