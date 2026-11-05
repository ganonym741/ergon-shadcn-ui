import * as React from 'react'
import { ChevronDown, ChevronRight, Minus, Plus, Scan, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'

export interface OrganizationNode {
  id: string
  parentId?: string
  name: string
  role?: string
  department?: string
  avatar?: string
  color?: string
  disabled?: boolean
  data?: unknown
}
export interface OrganizationPoint {
  x: number
  y: number
}
export interface OrganizationChartProps extends Omit<React.ComponentProps<'section'>, 'onChange'> {
  nodes: OrganizationNode[]
  orientation?: 'vertical' | 'horizontal'
  label?: string
  height?: number
  disabled?: boolean
  maxNodes?: number
  selectedId?: string
  defaultSelectedId?: string
  onSelectionChange?: (id: string) => void
  onNodeSelect?: (node: OrganizationNode) => void
  collapsedIds?: string[]
  defaultCollapsedIds?: string[]
  onCollapsedIdsChange?: (ids: string[]) => void
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (zoom: number) => void
  minZoom?: number
  maxZoom?: number
  pan?: OrganizationPoint
  defaultPan?: OrganizationPoint
  onPanChange?: (pan: OrganizationPoint) => void
  fitOnMount?: boolean
  renderNode?: (
    node: OrganizationNode,
    state: { selected: boolean; collapsed: boolean; hasChildren: boolean },
  ) => React.ReactNode
}
/** Rejects duplicate IDs, missing parents, cycles, and excessive nesting before rendering the hierarchy. */
export function validateOrganization(
  nodes: readonly OrganizationNode[],
  maxNodes = 2000,
): string | undefined {
  if (nodes.length > (Number.isFinite(maxNodes) ? Math.min(5000, Math.max(1, maxNodes)) : 2000))
    return 'The hierarchy exceeds the configured node limit.'
  const byId = new Map(nodes.map((node) => [node.id, node]))
  if (byId.size !== nodes.length || nodes.some((node) => !node.id))
    return 'Organization node IDs must be unique.'
  for (const node of nodes) {
    let current: OrganizationNode | undefined = node
    const visited = new Set<string>()
    while (current) {
      if (visited.has(current.id)) return 'The organization hierarchy must not contain cycles.'
      visited.add(current.id)
      if (visited.size > 100) return 'Use at most 100 hierarchy levels.'
      if (current.parentId && !byId.has(current.parentId))
        return `Unknown parent: ${current.parentId}.`
      current = current.parentId ? byId.get(current.parentId) : undefined
    }
  }
}
const styles = `.ergon-org .org-tree{display:flex;align-items:flex-start;gap:20px}.ergon-org .org-branch{position:relative;display:flex;flex-direction:column;align-items:center;padding:0 10px}.ergon-org .org-children{display:flex;position:relative;padding-top:30px;margin-top:20px}.ergon-org .org-children:before{content:'';position:absolute;top:-20px;inset-inline-start:50%;height:20px;border-inline-start:1px solid var(--border)}.ergon-org .org-children>.org-branch:before{content:'';position:absolute;top:-30px;inset-inline-start:50%;height:30px;border-inline-start:1px solid var(--border)}.ergon-org .org-children>.org-branch:after{content:'';position:absolute;top:-30px;inset-inline-start:0;width:100%;border-top:1px solid var(--border)}.ergon-org .org-children>.org-branch:first-child:after{inset-inline-start:50%;width:50%}.ergon-org .org-children>.org-branch:last-child:after{width:50%}.ergon-org .org-children>.org-branch:only-child:after{display:none}.ergon-org[data-orientation=horizontal] .org-tree{flex-direction:column;align-items:flex-start}.ergon-org[data-orientation=horizontal] .org-branch{flex-direction:row;align-items:center;padding:10px 0}.ergon-org[data-orientation=horizontal] .org-children{flex-direction:column;padding:0;padding-inline-start:30px;margin:0;margin-inline-start:20px}.ergon-org[data-orientation=horizontal] .org-children:before{top:50%;inset-inline-start:-20px;width:20px;height:0;border-inline-start:0;border-top:1px solid var(--border)}.ergon-org[data-orientation=horizontal] .org-children>.org-branch:before{top:50%;inset-inline-start:-30px;width:30px;height:0;border-inline-start:0;border-top:1px solid var(--border)}.ergon-org[data-orientation=horizontal] .org-children>.org-branch:after{top:0;inset-inline-start:-30px;width:0;height:100%;border-top:0;border-inline-start:1px solid var(--border)}.ergon-org[data-orientation=horizontal] .org-children>.org-branch:first-child:after{top:50%;height:50%}.ergon-org[data-orientation=horizontal] .org-children>.org-branch:last-child:after{height:50%}`
interface OrgContext {
  nodes: OrganizationNode[]
  byId: Map<string, OrganizationNode>
  children: Map<string, OrganizationNode[]>
  roots: OrganizationNode[]
  visible: OrganizationNode[]
  selected: string
  select: (node: OrganizationNode) => void
  collapsed: Set<string>
  toggle: (id: string) => void
  setCollapsed: (ids: string[]) => void
  active: string
  setActive: (id: string) => void
  disabled: boolean
  renderNode: OrganizationChartProps['renderNode']
  zoom: number
  pan: OrganizationPoint
  setPan: (point: OrganizationPoint) => void
  changeZoom: (zoom: number) => void
  fit: () => void
  viewport: React.RefObject<HTMLDivElement | null>
  content: React.RefObject<HTMLDivElement | null>
  height: number
  fitOnMount: boolean
}
const Context = React.createContext<OrgContext | null>(null)
function useOrg() {
  const c = React.useContext(Context)
  if (!c) throw new Error('Organization chart parts need OrganizationChart.')
  return c
}
/** Displays a validated hierarchy with controlled collapse/selection and an accessible pan/zoom viewport. */
export function OrganizationChart({
  nodes,
  orientation = 'vertical',
  label = 'Organization chart',
  height = 480,
  disabled = false,
  maxNodes = 2000,
  selectedId,
  defaultSelectedId = '',
  onSelectionChange,
  onNodeSelect,
  collapsedIds,
  defaultCollapsedIds = [],
  onCollapsedIdsChange,
  zoom,
  defaultZoom = 1,
  onZoomChange,
  minZoom = 0.25,
  maxZoom = 2,
  pan,
  defaultPan = { x: 0, y: 0 },
  onPanChange,
  fitOnMount = true,
  renderNode,
  className,
  children,
  ...props
}: OrganizationChartProps) {
  const [selected, setSelected] = useControllableState({
      value: selectedId,
      defaultValue: defaultSelectedId,
      onChange: onSelectionChange,
    }),
    [collapsed, setCollapsed] = useControllableState({
      value: collapsedIds,
      defaultValue: defaultCollapsedIds,
      onChange: onCollapsedIdsChange,
    }),
    [scale, setZoom] = useControllableState({
      value: zoom,
      defaultValue: defaultZoom,
      onChange: onZoomChange,
    }),
    [offset, setPan] = useControllableState({
      value: pan,
      defaultValue: defaultPan,
      onChange: onPanChange,
    }),
    [active, setActive] = React.useState(nodes[0]?.id ?? '')
  const viewport = React.useRef<HTMLDivElement>(null),
    content = React.useRef<HTMLDivElement>(null),
    error = validateOrganization(nodes, maxNodes),
    lower = Number.isFinite(minZoom) ? Math.min(1, Math.max(0.05, minZoom)) : 0.25,
    upper = Number.isFinite(maxZoom) ? Math.max(lower, Math.min(4, maxZoom)) : 2,
    effectiveZoom = Number.isFinite(scale) ? Math.max(lower, Math.min(upper, scale)) : 1,
    effectivePan = {
      x: Number.isFinite(offset.x) ? offset.x : 0,
      y: Number.isFinite(offset.y) ? offset.y : 0,
    }
  const data = React.useMemo(() => {
    const byId = new Map(nodes.map((node) => [node.id, node])),
      map = new Map<string, OrganizationNode[]>(),
      roots: OrganizationNode[] = []
    if (!error)
      for (const node of nodes) {
        if (node.parentId) {
          const list = map.get(node.parentId) ?? []
          list.push(node)
          map.set(node.parentId, list)
        } else roots.push(node)
      }
    return { byId, map, roots }
  }, [nodes, error])
  const collapsedSet = React.useMemo(() => new Set(collapsed), [collapsed]),
    visible = React.useMemo(() => {
      const result: OrganizationNode[] = [],
        pending = [...data.roots].reverse()
      while (pending.length) {
        const node = pending.pop()!
        result.push(node)
        if (!collapsedSet.has(node.id))
          pending.push(...[...(data.map.get(node.id) ?? [])].reverse())
      }
      return result
    }, [data, collapsedSet])
  React.useEffect(() => {
    if (!visible.some((node) => node.id === active))
      setActive(visible.find((node) => !node.disabled)?.id ?? '')
  }, [visible, active])
  const fit = () => {
    if (!viewport.current || !content.current || disabled) return
    const w = content.current.offsetWidth,
      h = content.current.offsetHeight
    if (!w || !h) return
    const next = Math.max(
      lower,
      Math.min(
        upper,
        (viewport.current.clientWidth - 24) / w,
        (viewport.current.clientHeight - 24) / h,
      ),
    )
    setZoom(next)
    setPan({
      x: (viewport.current.clientWidth - w * next) / 2,
      y: (viewport.current.clientHeight - h * next) / 2,
    })
  }
  const changeZoom = (next: number) => {
    if (disabled || !Number.isFinite(next)) return
    const clamped = Math.max(lower, Math.min(upper, next)),
      x = (viewport.current?.clientWidth ?? 0) / 2,
      y = (viewport.current?.clientHeight ?? 0) / 2
    setPan({
      x: x - ((x - effectivePan.x) * clamped) / effectiveZoom,
      y: y - ((y - effectivePan.y) * clamped) / effectiveZoom,
    })
    setZoom(clamped)
  }
  return (
    <Context.Provider
      value={{
        nodes,
        byId: data.byId,
        children: data.map,
        roots: data.roots,
        visible,
        selected,
        select: (node) => {
          if (disabled || node.disabled) return
          setSelected(node.id)
          onNodeSelect?.(node)
        },
        collapsed: collapsedSet,
        toggle: (id) => {
          if (!disabled)
            setCollapsed(
              collapsedSet.has(id) ? collapsed.filter((value) => value !== id) : [...collapsed, id],
            )
        },
        setCollapsed,
        active,
        setActive,
        disabled,
        renderNode,
        zoom: effectiveZoom,
        pan: effectivePan,
        setPan,
        changeZoom,
        fit,
        viewport,
        content,
        height: Number.isFinite(height) ? Math.max(200, Math.min(1200, height)) : 480,
        fitOnMount,
      }}
    >
      <section
        {...props}
        data-slot="organization-chart"
        data-orientation={orientation}
        aria-label={label}
        className={cn('ergon-org w-full min-w-0 space-y-3', className)}
      >
        <style nonce={props.nonce}>{styles}</style>
        {error ? (
          <p role="alert" className="p-4 text-sm text-destructive">
            {error}
          </p>
        ) : (
          (children ?? (
            <>
              <OrganizationChartToolbar />
              <OrganizationChartViewport />
            </>
          ))
        )}
      </section>
    </Context.Provider>
  )
}
/** Provides zoom, fit, and hierarchy expansion without requiring pointer gestures. */
export function OrganizationChartToolbar() {
  const c = useOrg()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="me-auto flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="size-4" />
        {c.visible.length} of {c.nodes.length} people
      </span>
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="Zoom out"
        disabled={c.disabled}
        onClick={() => c.changeZoom(c.zoom - 0.1)}
      >
        <Minus />
      </Button>
      <span className="w-10 text-center text-xs tabular-nums">{Math.round(c.zoom * 100)}%</span>
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="Zoom in"
        disabled={c.disabled}
        onClick={() => c.changeZoom(c.zoom + 0.1)}
      >
        <Plus />
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={c.disabled} onClick={c.fit}>
        <Scan />
        Fit
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={c.disabled}
        onClick={() => c.setCollapsed([])}
      >
        Expand all
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={c.disabled}
        onClick={() => c.setCollapsed([...c.children.keys()])}
      >
        Collapse all
      </Button>
    </div>
  )
}
/** Pans background drags and exposes keyboard viewport controls without consuming page-scroll wheel gestures. */
export function OrganizationChartViewport({ className, ...props }: React.ComponentProps<'div'>) {
  const c = useOrg(),
    drag = React.useRef<{ id: number; x: number; y: number; pan: OrganizationPoint } | null>(null),
    help = React.useId(),
    fit = React.useRef(c.fit)
  React.useLayoutEffect(() => {
    fit.current = c.fit
  })
  React.useLayoutEffect(() => {
    if (!c.fitOnMount) return
    const frame = requestAnimationFrame(() => fit.current())
    return () => cancelAnimationFrame(frame)
  }, [c.fitOnMount, c.roots.length])
  return (
    <div
      {...props}
      ref={c.viewport}
      tabIndex={0}
      role="region"
      aria-label="Organization chart canvas"
      aria-describedby={help}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-muted/20 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      style={{ height: c.height, ...props.style }}
      onPointerDown={(event) => {
        props.onPointerDown?.(event)
        if (
          event.defaultPrevented ||
          c.disabled ||
          event.button !== 0 ||
          (event.target as HTMLElement).closest('[data-org-id],button,a,input,select')
        )
          return
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, pan: c.pan }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event)
        const start = drag.current
        if (start?.id === event.pointerId)
          c.setPan({
            x: start.pan.x + event.clientX - start.x,
            y: start.pan.y + event.clientY - start.y,
          })
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event)
        drag.current = null
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onKeyDown={(event) => {
        props.onKeyDown?.(event)
        if (event.defaultPrevented || event.target !== event.currentTarget || c.disabled) return
        const offsets: Record<string, OrganizationPoint> = {
          ArrowLeft: { x: 40, y: 0 },
          ArrowRight: { x: -40, y: 0 },
          ArrowUp: { x: 0, y: 40 },
          ArrowDown: { x: 0, y: -40 },
        }
        if (offsets[event.key]) {
          event.preventDefault()
          c.setPan({ x: c.pan.x + offsets[event.key].x, y: c.pan.y + offsets[event.key].y })
        } else if (['+', '=', '-', 'Home'].includes(event.key)) {
          event.preventDefault()
          if (event.key === 'Home') c.fit()
          else c.changeZoom(c.zoom + (event.key === '-' ? -0.1 : 0.1))
        }
      }}
    >
      <p id={help} className="sr-only">
        Drag the background to pan. On this canvas use arrow keys to pan, plus or minus to zoom, and
        Home to fit. Within the tree use arrow keys to navigate and Enter to select.
      </p>
      <div
        ref={c.content}
        className="absolute left-0 top-0 w-max origin-top-left p-6"
        style={{ transform: `translate(${c.pan.x}px,${c.pan.y}px) scale(${c.zoom})` }}
      >
        <div role="tree" aria-label="People hierarchy" className="org-tree">
          {c.roots.map((node, index) => (
            <OrganizationChartNode
              key={node.id}
              node={node}
              level={1}
              position={index + 1}
              siblings={c.roots.length}
            />
          ))}
        </div>
      </div>
      {!c.nodes.length && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          No people to display.
        </p>
      )}
    </div>
  )
}
/** Renders a tree item with roving keyboard focus, hierarchy connectors, selection, and collapse actions. */
export function OrganizationChartNode({
  node,
  level = 1,
  position = 1,
  siblings = 1,
}: {
  node: OrganizationNode
  level?: number
  position?: number
  siblings?: number
}) {
  const c = useOrg(),
    children = c.children.get(node.id) ?? [],
    collapsed = c.collapsed.has(node.id),
    selected = c.selected === node.id,
    disabled = c.disabled || node.disabled,
    groupId = React.useId()
  const focus = (id?: string) => {
    if (!id) return
    c.setActive(id)
    const element = Array.from(
      c.viewport.current?.querySelectorAll<HTMLElement>('[data-org-id]') ?? [],
    ).find((element) => element.dataset.orgId === id)
    element?.focus()
  }
  return (
    <div className="org-branch" role="none">
      <div
        role="treeitem"
        data-org-id={node.id}
        aria-label={`${node.name}${node.role ? `, ${node.role}` : ''}`}
        aria-owns={children.length && !collapsed ? groupId : undefined}
        aria-level={level}
        aria-posinset={position}
        aria-setsize={siblings}
        aria-expanded={children.length ? !collapsed : undefined}
        aria-selected={selected}
        aria-disabled={disabled || undefined}
        tabIndex={c.active === node.id ? 0 : -1}
        onFocus={() => c.setActive(node.id)}
        onClick={() => c.select(node)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          const index = c.visible.findIndex((item) => item.id === node.id)
          if (
            [
              'ArrowDown',
              'ArrowUp',
              'ArrowRight',
              'ArrowLeft',
              'Home',
              'End',
              'Enter',
              ' ',
            ].includes(event.key)
          )
            event.preventDefault()
          if (event.key === 'ArrowDown') focus(c.visible[index + 1]?.id)
          else if (event.key === 'ArrowUp') focus(c.visible[index - 1]?.id)
          else if (event.key === 'Home') focus(c.visible[0]?.id)
          else if (event.key === 'End') focus(c.visible.at(-1)?.id)
          else if (event.key === 'ArrowRight') {
            if (children.length && collapsed) c.toggle(node.id)
            else focus(children[0]?.id)
          } else if (event.key === 'ArrowLeft') {
            if (children.length && !collapsed) c.toggle(node.id)
            else focus(node.parentId)
          } else if (event.key === 'Enter' || event.key === ' ') c.select(node)
        }}
        className={cn(
          'relative w-52 rounded-xl border bg-card p-4 text-start shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
          selected && 'border-primary bg-primary/5',
          disabled && 'opacity-50',
        )}
        style={node.color ? { borderTopColor: node.color, borderTopWidth: 3 } : undefined}
      >
        {c.renderNode ? (
          c.renderNode(node, { selected, collapsed, hasChildren: !!children.length })
        ) : (
          <>
            <div className="mb-2 flex items-center gap-3">
              {node.avatar ? (
                <img src={node.avatar} alt="" className="size-10 rounded-full object-cover" />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                >
                  {node.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{node.name}</p>
                {node.role && <p className="truncate text-xs text-muted-foreground">{node.role}</p>}
              </div>
            </div>
            {node.department && (
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {node.department}
              </p>
            )}
          </>
        )}
        {children.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${node.name}`}
            aria-expanded={!collapsed}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border bg-background py-1 text-[10px] text-muted-foreground hover:bg-accent"
            onClick={(event) => {
              event.stopPropagation()
              c.toggle(node.id)
              focus(node.id)
            }}
          >
            {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
            {children.length} direct reports
          </button>
        )}
      </div>
      {children.length > 0 && !collapsed && (
        <div id={groupId} role="group" className="org-children">
          {children.map((child, index) => (
            <OrganizationChartNode
              key={child.id}
              node={child}
              level={level + 1}
              position={index + 1}
              siblings={children.length}
            />
          ))}
        </div>
      )}
    </div>
  )
}
