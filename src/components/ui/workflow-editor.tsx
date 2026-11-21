import * as React from 'react'
import { Plus, Minus, Maximize, Undo2, Redo2, Trash2, GitBranch, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIConfig } from '@/components/ui/config-provider'
import { useEditorHistory, clamp, productId } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'
export interface WorkflowPort {
  id: string
  label?: string
}
export interface WorkflowNode {
  id: string
  label: string
  description?: string
  type?: string
  x: number
  y: number
  width?: number
  inputs?: WorkflowPort[]
  outputs?: WorkflowPort[]
  data?: unknown
}
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourcePort: string
  targetPort: string
  label?: string
}
export interface WorkflowValue {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}
export interface WorkflowViewport {
  x: number
  y: number
  zoom: number
}
export interface WorkflowEditorProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'defaultValue'
> {
  value?: WorkflowValue
  defaultValue?: WorkflowValue
  onValueChange?: (value: WorkflowValue) => void
  onBeforeConnect?: (edge: WorkflowEdge, value: WorkflowValue) => string | undefined
  onSelectionChange?: (selection: { kind: 'node' | 'edge'; id: string } | null) => void
  renderNode?: (node: WorkflowNode) => React.ReactNode
  createNode?: () => Omit<WorkflowNode, 'id' | 'x' | 'y'>
  readOnly?: boolean
  disabled?: boolean
  allowCycles?: boolean
  snapGrid?: number
  height?: number
  label?: string
  viewport?: WorkflowViewport
  defaultViewport?: WorkflowViewport
  onViewportChange?: (viewport: WorkflowViewport) => void
  fitView?: boolean
}
const ports = (node: WorkflowNode, kind: 'inputs' | 'outputs') =>
  node[kind] ?? [{ id: kind === 'inputs' ? 'in' : 'out' }]
const nodeWidth = (node: WorkflowNode) => clamp(node.width ?? 220, 140, 400)
const minimumZoom = Number.EPSILON
const nodePosition = (positions: Record<string, { x: number; y: number }>, node: WorkflowNode) =>
  Object.hasOwn(positions, node.id) ? positions[node.id] : node
const nodeHeight = (node: WorkflowNode) =>
  92 + Math.max(ports(node, 'inputs').length, ports(node, 'outputs').length) * 24
/** Validates IDs, endpoints, explicit ports and optional directed-cycle constraints. */
export function validateWorkflow(value: WorkflowValue, allowCycles = false): string | undefined {
  if (value.nodes.length > 1000 || value.edges.length > 5000)
    return 'Workflow exceeds the 1,000-node or 5,000-edge limit.'
  if (
    value.nodes.some(
      (node) => !node.id || !node.label || !Number.isFinite(node.x) || !Number.isFinite(node.y),
    ) ||
    new Set(value.nodes.map((node) => node.id)).size !== value.nodes.length
  )
    return 'Nodes need unique IDs, labels and finite positions.'
  if (
    value.nodes.some((node) =>
      ['inputs', 'outputs'].some((kind) => {
        const p = ports(node, kind as 'inputs' | 'outputs')
        return p.some((port) => !port.id) || new Set(p.map((port) => port.id)).size !== p.length
      }),
    )
  )
    return 'Ports need unique IDs within each side of a node.'
  if (new Set(value.edges.map((edge) => edge.id)).size !== value.edges.length)
    return 'Edges need unique IDs.'
  const nodes = new Map(value.nodes.map((node) => [node.id, node])),
    connections = new Set<string>()
  for (const edge of value.edges) {
    const source = nodes.get(edge.source),
      target = nodes.get(edge.target),
      key = JSON.stringify([edge.source, edge.sourcePort, edge.target, edge.targetPort])
    if (
      !edge.id ||
      !source ||
      !target ||
      !ports(source, 'outputs').some((p) => p.id === edge.sourcePort) ||
      !ports(target, 'inputs').some((p) => p.id === edge.targetPort)
    )
      return 'An edge refers to a missing node or port.'
    if (connections.has(key)) return 'Duplicate connections are not allowed.'
    connections.add(key)
  }
  if (!allowCycles) {
    const adjacency = new Map(value.nodes.map((node) => [node.id, [] as string[]]))
    for (const edge of value.edges) adjacency.get(edge.source)!.push(edge.target)
    const visited = new Set<string>(),
      visiting = new Set<string>()
    const visit = (id: string): boolean => {
      if (visiting.has(id)) return true
      if (visited.has(id)) return false
      visiting.add(id)
      for (const next of adjacency.get(id) ?? []) if (visit(next)) return true
      visiting.delete(id)
      visited.add(id)
      return false
    }
    if (value.nodes.some((node) => visit(node.id))) return 'This connection would create a cycle.'
  }
}
interface WorkflowContext {
  graph: WorkflowValue
  positions: Record<string, { x: number; y: number }>
  setPositions: React.Dispatch<React.SetStateAction<Record<string, { x: number; y: number }>>>
  commit: (value: WorkflowValue) => void
  readOnly: boolean
  disabled: boolean
  height: number
  snapGrid: number
  selection: { kind: 'node' | 'edge'; id: string } | null
  select: (selection: { kind: 'node' | 'edge'; id: string } | null) => void
  pending: { node: string; port: string } | null
  setPending: (pending: { node: string; port: string } | null) => void
  connect: (node: string, port: string) => void
  error: string
  renderNode?: WorkflowEditorProps['renderNode']
  view: { x: number; y: number; zoom: number }
  setView: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>
  host: React.RefObject<HTMLDivElement | null>
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  remove: () => void
  add: () => void
  fit: () => void
}
const Context = React.createContext<WorkflowContext | null>(null)
const useWorkflow = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Workflow parts need WorkflowEditor.')
  return c
}
/** Original SVG workflow editor; applications own node execution and persistence. */
export function WorkflowEditor({
  value,
  defaultValue = { nodes: [], edges: [] },
  onValueChange,
  onBeforeConnect,
  onSelectionChange,
  renderNode,
  createNode,
  readOnly = false,
  disabled = false,
  allowCycles = false,
  snapGrid = 16,
  height = 460,
  label = 'Workflow editor',
  viewport,
  defaultViewport = { x: 24, y: 24, zoom: 1 },
  onViewportChange,
  fitView = true,
  children,
  className,
  ...props
}: WorkflowEditorProps) {
  const history = useEditorHistory({ value, defaultValue, onChange: onValueChange }),
    graph = history.value,
    host = React.useRef<HTMLDivElement>(null)
  const [selection, setSelection] = React.useState<WorkflowContext['selection']>(null),
    [pending, setPending] = React.useState<WorkflowContext['pending']>(null),
    [view, setView] = useControllableState({
      value: viewport,
      defaultValue: defaultViewport,
      onChange: onViewportChange,
    }),
    [error, setError] = React.useState(''),
    [positions, setPositions] = React.useState<Record<string, { x: number; y: number }>>({})
  const validation = React.useMemo(
      () => validateWorkflow(graph, allowCycles),
      [graph, allowCycles],
    ),
    locked = disabled || readOnly || !!validation
  const select = (next: WorkflowContext['selection']) => {
    setSelection(next)
    onSelectionChange?.(next)
  }
  React.useEffect(() => {
    if (
      selection &&
      !(selection.kind === 'node' ? graph.nodes : graph.edges).some(
        (item) => item.id === selection.id,
      )
    )
      select(null)
  }, [graph, selection])
  React.useEffect(() => {
    if (locked) setPending(null)
  }, [locked])
  const commit = (next: WorkflowValue) => {
    const issue = validateWorkflow(next, allowCycles)
    setError(issue ?? '')
    if (!issue) history.commit(next)
  }
  const connect = (node: string, port: string) => {
    if (!pending || locked) return
    const edge = {
      id: productId(),
      source: pending.node,
      sourcePort: pending.port,
      target: node,
      targetPort: port,
    }
    let issue = validateWorkflow({ ...graph, edges: [...graph.edges, edge] }, allowCycles)
    try {
      issue ??= onBeforeConnect?.(edge, graph)
    } catch (failure) {
      issue = (failure instanceof Error ? failure.message : '') || 'The connection was rejected.'
    }
    if (issue) setError(issue)
    else {
      commit({ ...graph, edges: [...graph.edges, edge] })
      setPending(null)
    }
  }
  const remove = () => {
    if (locked || !selection) return
    commit(
      selection.kind === 'node'
        ? {
            nodes: graph.nodes.filter((node) => node.id !== selection.id),
            edges: graph.edges.filter(
              (edge) => edge.source !== selection.id && edge.target !== selection.id,
            ),
          }
        : { ...graph, edges: graph.edges.filter((edge) => edge.id !== selection.id) },
    )
    select(null)
  }
  const fit = () => {
    const rect = host.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || !graph.nodes.length) return
    const left = Math.min(...graph.nodes.map((node) => node.x)),
      top = Math.min(...graph.nodes.map((node) => node.y)),
      right = Math.max(...graph.nodes.map((node) => node.x + nodeWidth(node))),
      bottom = Math.max(...graph.nodes.map((node) => node.y + nodeHeight(node))),
      zoom = clamp(
        Math.min(
          (rect.width - 64) / Math.max(1, right - left),
          (rect.height - 64) / Math.max(1, bottom - top),
        ),
        minimumZoom,
        2,
      )
    setView({
      zoom,
      x: (rect.width - (right - left) * zoom) / 2 - left * zoom,
      y: (rect.height - (bottom - top) * zoom) / 2 - top * zoom,
    })
  }
  const fitted = React.useRef(false)
  React.useLayoutEffect(() => {
    if (!fitted.current && fitView && viewport === undefined && graph.nodes.length) {
      fit()
      fitted.current = true
    }
  }, [fitView, viewport, graph.nodes.length])
  const add = () => {
    if (locked || graph.nodes.length >= 1000) return
    const node: WorkflowNode = {
      id: productId(),
      label: `Step ${graph.nodes.length + 1}`,
      x: Math.max(0, (80 - view.x) / view.zoom),
      y: Math.max(0, (80 - view.y) / view.zoom),
    }
    if (createNode) {
      const { label, description, type, width, inputs, outputs, data } = createNode()
      Object.assign(node, { label, description, type, width, inputs, outputs, data })
    }
    commit({ ...graph, nodes: [...graph.nodes, node] })
    select({ kind: 'node', id: node.id })
  }
  return (
    <Context.Provider
      value={{
        graph,
        positions,
        setPositions,
        commit,
        readOnly: locked,
        disabled,
        height: clamp(height, 240, 1200),
        snapGrid: clamp(snapGrid, 1, 100),
        selection,
        select,
        pending,
        setPending,
        connect,
        error: validation ?? error,
        renderNode,
        view,
        setView,
        host,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        remove,
        add,
        fit,
      }}
    >
      <section
        {...props}
        data-slot="workflow-editor"
        aria-label={label}
        className={cn('w-full min-w-0 overflow-hidden rounded-xl border bg-background', className)}
      >
        {children ?? (
          <>
            <WorkflowToolbar />
            <WorkflowCanvas />
          </>
        )}
        {(validation || error) && (
          <div className="space-y-2 border-t p-3">
            <p role="alert" className="text-xs text-destructive">
              {validation ?? error}
            </p>
            {validation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || readOnly}
                onClick={() => {
                  commit({ nodes: [], edges: [] })
                  select(null)
                  setPending(null)
                  setPositions({})
                }}
              >
                Reset invalid workflow
              </Button>
            )}
          </div>
        )}
      </section>
    </Context.Provider>
  )
}
export function WorkflowToolbar() {
  const c = useWorkflow()
  return (
    <div
      role="toolbar"
      aria-label="Workflow actions"
      className="flex flex-wrap items-center gap-1 border-b p-2"
    >
      <GitBranch className="mx-2 size-4 text-muted-foreground" />
      <Button type="button" variant="outline" size="sm" disabled={c.readOnly} onClick={c.add}>
        <Plus />
        Add step
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Undo workflow change"
        disabled={c.readOnly || !c.canUndo}
        onClick={c.undo}
      >
        <Undo2 />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Redo workflow change"
        disabled={c.readOnly || !c.canRedo}
        onClick={c.redo}
      >
        <Redo2 />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Delete selection"
        disabled={c.readOnly || !c.selection}
        onClick={c.remove}
      >
        <Trash2 />
      </Button>
      <div className="ms-auto flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out workflow"
          disabled={c.disabled}
          onClick={() => c.setView((v) => ({ ...v, zoom: clamp(v.zoom * 0.8, minimumZoom, 2) }))}
        >
          <Minus />
        </Button>
        <span className="w-10 text-center text-[10px] tabular-nums">
          {c.view.zoom < 0.01 ? '<1' : Math.round(c.view.zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in workflow"
          disabled={c.disabled}
          onClick={() => c.setView((v) => ({ ...v, zoom: clamp(v.zoom * 1.25, minimumZoom, 2) }))}
        >
          <Plus />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fit workflow"
          disabled={c.disabled}
          onClick={c.fit}
        >
          <Maximize />
        </Button>
      </div>
      {c.pending && (
        <div
          role="status"
          className="flex w-full items-center justify-between gap-2 px-2 text-xs text-muted-foreground"
        >
          Choose an input port to connect.
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Cancel connection"
            onClick={() => c.setPending(null)}
          >
            <X />
          </Button>
        </div>
      )}
    </div>
  )
}
export function WorkflowCanvas() {
  const c = useWorkflow(),
    { direction } = useUIConfig(),
    drag = React.useRef<{ id: number; x: number; y: number; view: WorkflowContext['view'] } | null>(
      null,
    ),
    marker = React.useId().replace(/:/g, ''),
    nodesById = React.useMemo(
      () => new Map(c.graph.nodes.map((node) => [node.id, node])),
      [c.graph.nodes],
    )
  const anchor = (node: WorkflowNode, port: string, kind: 'inputs' | 'outputs') => ({
    x: nodePosition(c.positions, node).x + (kind === 'outputs' ? nodeWidth(node) : 0),
    y:
      nodePosition(c.positions, node).y +
      95 +
      ports(node, kind).findIndex((p) => p.id === port) * 24,
  })
  return (
    <div
      ref={c.host}
      dir="ltr"
      role="application"
      aria-label="Workflow canvas. Use step arrow keys to move, output then input buttons to connect, and Delete to remove selections."
      tabIndex={0}
      className="relative isolate overflow-hidden bg-muted/20 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      style={{
        height: c.height,
        backgroundImage: 'radial-gradient(var(--border) 1px,transparent 1px)',
        backgroundSize: '18px 18px',
        touchAction: 'none',
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          c.setPending(null)
          c.select(null)
        }
        if (event.target !== event.currentTarget) return
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault()
          c.remove()
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !c.readOnly) {
          event.preventDefault()
          if (event.shiftKey) c.redo()
          else c.undo()
        }
      }}
      onPointerDown={(event) => {
        if (
          c.disabled ||
          event.button !== 0 ||
          (event.target as Element).closest(
            '[data-workflow-node],[data-workflow-edge],[data-workflow-minimap]',
          )
        )
          return
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view: c.view }
        event.currentTarget.setPointerCapture(event.pointerId)
        c.select(null)
      }}
      onPointerMove={(event) => {
        const p = drag.current
        if (p?.id === event.pointerId)
          c.setView({
            ...p.view,
            x: p.view.x + event.clientX - p.x,
            y: p.view.y + event.clientY - p.y,
          })
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
    >
      <div
        style={{
          transform: `translate(${c.view.x}px,${c.view.y}px) scale(${c.view.zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0"
      >
        <svg
          aria-label="Workflow connections"
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width="1"
          height="1"
        >
          <defs>
            <marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0 0 L8 4 L0 8" fill="currentColor" />
            </marker>
          </defs>
          {c.graph.edges.map((edge) => {
            const source = nodesById.get(edge.source),
              target = nodesById.get(edge.target)
            if (!source || !target) return null
            const a = anchor(source, edge.sourcePort, 'outputs'),
              b = anchor(target, edge.targetPort, 'inputs'),
              offset = Math.max(48, Math.abs(b.x - a.x) / 2),
              backward = b.x <= a.x,
              upper =
                Math.min(nodePosition(c.positions, source).y, nodePosition(c.positions, target).y) -
                48,
              path = backward
                ? `M${a.x} ${a.y} C${a.x + 48} ${a.y},${a.x + 48} ${upper},${a.x + 48} ${upper} L${b.x - 48} ${upper} C${b.x - 48} ${upper},${b.x - 48} ${b.y},${b.x} ${b.y}`
                : `M${a.x} ${a.y} C${a.x + offset} ${a.y},${b.x - offset} ${b.y},${b.x} ${b.y}`
            return (
              <g
                key={edge.id}
                className={
                  c.selection?.kind === 'edge' && c.selection.id === edge.id
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }
              >
                <path
                  data-workflow-edge
                  role="button"
                  tabIndex={c.disabled ? -1 : 0}
                  aria-label={`Connection ${source.label} to ${target.label}${edge.label ? `: ${edge.label}` : ''}`}
                  onClick={() => c.select({ kind: 'edge', id: edge.id })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      c.select({ kind: 'edge', id: edge.id })
                    }
                    if (event.key === 'Delete') {
                      event.preventDefault()
                      if (!c.readOnly)
                        c.commit({
                          ...c.graph,
                          edges: c.graph.edges.filter((e) => e.id !== edge.id),
                        })
                    }
                  }}
                  d={path}
                  stroke="currentColor"
                  strokeWidth={c.selection?.kind === 'edge' && c.selection.id === edge.id ? 3 : 2}
                  fill="none"
                  markerEnd={`url(#${marker})`}
                  className="pointer-events-auto cursor-pointer outline-none focus:stroke-primary"
                  style={{ pointerEvents: 'stroke' }}
                />
                {edge.label && (
                  <text
                    x={(a.x + b.x) / 2}
                    y={backward ? upper - 9 : (a.y + b.y) / 2 - 9}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[11px]"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        {c.graph.nodes.map((node) => (
          <WorkflowNodeCard key={node.id} node={node} direction={direction} />
        ))}
      </div>
      {!c.graph.nodes.length && (
        <p className="pointer-events-none absolute inset-0 grid place-content-center text-sm text-muted-foreground">
          Add a step to start your workflow.
        </p>
      )}
      {c.graph.nodes.length > 0 && <WorkflowMinimap />}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 end-3 rounded-md border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground"
      >
        {c.graph.nodes.length} steps · {c.graph.edges.length} connections
      </div>
    </div>
  )
}
/** Click the overview to center the viewport; Enter fits the complete graph. */
export function WorkflowMinimap() {
  const c = useWorkflow(),
    nodes = c.graph.nodes.map((node) => ({ ...node, ...nodePosition(c.positions, node) }))
  if (!nodes.length) return null
  const left = Math.min(...nodes.map((node) => node.x)) - 40,
    top = Math.min(...nodes.map((node) => node.y)) - 40,
    width = Math.max(1, Math.max(...nodes.map((node) => node.x + nodeWidth(node))) - left + 40),
    height = Math.max(1, Math.max(...nodes.map((node) => node.y + nodeHeight(node))) - top + 40)
  return (
    <svg
      data-workflow-minimap
      tabIndex={c.disabled ? -1 : 0}
      role="button"
      aria-label="Workflow overview. Click to center; Enter to fit."
      viewBox={`${left} ${top} ${width} ${height}`}
      preserveAspectRatio="none"
      className="absolute bottom-3 start-3 h-20 w-32 cursor-crosshair rounded-lg border bg-background/90 p-1 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (c.disabled) return
        const rect = event.currentTarget.getBoundingClientRect(),
          x = left + ((event.clientX - rect.left) / rect.width) * width,
          y = top + ((event.clientY - rect.top) / rect.height) * height
        c.setView((v) => ({
          ...v,
          x: (c.host.current?.clientWidth ?? 0) / 2 - x * v.zoom,
          y: (c.host.current?.clientHeight ?? 0) / 2 - y * v.zoom,
        }))
      }}
      onKeyDown={(event) => {
        if (!c.disabled && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          c.fit()
        }
      }}
    >
      {nodes.map((node) => (
        <rect
          key={node.id}
          x={node.x}
          y={node.y}
          width={nodeWidth(node)}
          height={nodeHeight(node)}
          rx={8}
          fill="var(--muted)"
          stroke="var(--muted-foreground)"
          strokeWidth={2}
        />
      ))}
      <rect
        x={-c.view.x / c.view.zoom}
        y={-c.view.y / c.view.zoom}
        width={(c.host.current?.clientWidth ?? 1) / c.view.zoom}
        height={(c.host.current?.clientHeight ?? 1) / c.view.zoom}
        fill="var(--primary)"
        fillOpacity={0.08}
        stroke="var(--primary)"
        strokeWidth={3}
      />
    </svg>
  )
}
export function WorkflowNodeCard({
  node,
  direction = 'ltr',
}: {
  node: WorkflowNode
  direction?: 'ltr' | 'rtl'
}) {
  const c = useWorkflow(),
    drag = React.useRef<{
      pointer: number
      x: number
      y: number
      origin: { x: number; y: number }
    } | null>(null),
    [draft, setDraft] = React.useState<{ x: number; y: number } | null>(null),
    draftRef = React.useRef(draft)
  const position = draft ?? node,
    move = (x: number, y: number) => {
      draftRef.current = {
        x: Math.round(x / c.snapGrid) * c.snapGrid,
        y: Math.round(y / c.snapGrid) * c.snapGrid,
      }
      setDraft(draftRef.current)
      c.setPositions((previous) => ({ ...previous, [node.id]: draftRef.current! }))
    }
  const finish = () => {
    if (!c.disabled && !c.readOnly && drag.current && draftRef.current)
      c.commit({
        ...c.graph,
        nodes: c.graph.nodes.map((item) =>
          item.id === node.id ? { ...item, ...draftRef.current } : item,
        ),
      })
    drag.current = null
    c.setPositions((previous) => {
      const next = { ...previous }
      delete next[node.id]
      return next
    })
    draftRef.current = null
    setDraft(null)
  }
  return (
    <div
      data-workflow-node
      tabIndex={c.disabled ? -1 : 0}
      role="group"
      aria-label={`Step ${node.label}`}
      aria-roledescription="Draggable workflow step"
      dir={direction}
      className={cn(
        'absolute rounded-xl border bg-card text-card-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
        c.selection?.kind === 'node' && c.selection.id === node.id && 'ring-2 ring-primary',
      )}
      style={{
        left: position.x,
        top: position.y,
        width: nodeWidth(node),
        minHeight: nodeHeight(node),
      }}
      onFocus={() => c.select({ kind: 'node', id: node.id })}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || c.readOnly) return
        const d = event.shiftKey ? c.snapGrid * 5 : c.snapGrid,
          delta: Record<string, [number, number]> = {
            ArrowLeft: [-d, 0],
            ArrowRight: [d, 0],
            ArrowUp: [0, -d],
            ArrowDown: [0, d],
          }
        if (delta[event.key]) {
          event.preventDefault()
          c.commit({
            ...c.graph,
            nodes: c.graph.nodes.map((item) =>
              item.id === node.id
                ? {
                    ...item,
                    x: item.x + delta[event.key][0],
                    y: item.y + delta[event.key][1],
                  }
                : item,
            ),
          })
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault()
          c.commit({
            nodes: c.graph.nodes.filter((item) => item.id !== node.id),
            edges: c.graph.edges.filter(
              (edge) => edge.source !== node.id && edge.target !== node.id,
            ),
          })
        }
      }}
    >
      <div
        className={cn(
          'h-[76px] overflow-hidden rounded-t-xl border-b px-3 py-3',
          !c.readOnly && 'cursor-grab active:cursor-grabbing',
        )}
        onPointerDown={(event) => {
          if (
            c.readOnly ||
            event.button !== 0 ||
            (event.target as Element).closest('button,input,textarea,a,select')
          )
            return
          drag.current = {
            pointer: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            origin: { x: node.x, y: node.y },
          }
          event.currentTarget.setPointerCapture(event.pointerId)
          c.select({ kind: 'node', id: node.id })
        }}
        onPointerMove={(event) => {
          const d = drag.current
          if (d?.pointer === event.pointerId)
            move(
              d.origin.x + (event.clientX - d.x) / c.view.zoom,
              d.origin.y + (event.clientY - d.y) / c.view.zoom,
            )
        }}
        onPointerUp={finish}
        onPointerCancel={() => {
          drag.current = null
          c.setPositions((previous) => {
            const next = { ...previous }
            delete next[node.id]
            return next
          })
          draftRef.current = null
          setDraft(null)
        }}
      >
        {c.renderNode?.(node) ?? (
          <>
            <p className="truncate text-sm font-medium">{node.label}</p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {node.description ?? node.type ?? 'Workflow step'}
            </p>
          </>
        )}
      </div>
      <div className="flex justify-between gap-2 py-1.5" dir="ltr">
        {(['inputs', 'outputs'] as const).map((kind) => (
          <div
            key={kind}
            className={cn('min-w-0 max-w-1/2 space-y-0', kind === 'outputs' && 'ms-auto')}
          >
            {ports(node, kind).map((port) => (
              <button
                key={port.id}
                type="button"
                disabled={c.readOnly}
                aria-label={`${kind === 'inputs' ? 'Connect to' : 'Connect from'} ${node.label}, ${port.label ?? port.id}`}
                aria-pressed={
                  kind === 'outputs'
                    ? c.pending?.node === node.id && c.pending.port === port.id
                    : undefined
                }
                className={cn(
                  'flex h-6 max-w-full items-center gap-1.5 text-[10px] text-muted-foreground outline-none hover:text-primary focus-visible:text-primary disabled:cursor-default',
                  kind === 'outputs' && 'ms-auto flex-row-reverse',
                )}
                onClick={() =>
                  kind === 'outputs'
                    ? c.setPending({ node: node.id, port: port.id })
                    : c.connect(node.id, port.id)
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-2.5 shrink-0 rounded-full border-2 bg-background',
                    c.pending?.node === node.id && c.pending.port === port.id
                      ? 'border-primary'
                      : 'border-muted-foreground',
                  )}
                  style={{
                    marginLeft: kind === 'inputs' ? -5 : 0,
                    marginRight: kind === 'outputs' ? -5 : 0,
                  }}
                />
                <span className="max-w-24 truncate px-1" dir={direction}>
                  {port.label ?? (kind === 'inputs' ? 'Input' : 'Output')}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
