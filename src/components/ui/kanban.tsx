import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { GripVertical, MoreHorizontal, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useControllableState } from '@/components/ui/util'
import { useUIConfig } from '@/components/ui/config-provider'
import { cn } from '@/lib/utils'

export interface KanbanCardData {
  id: string
  title: string
  description?: string
  labels?: { label: string; color?: string }[]
  assignee?: { name: string; avatar?: string }
  priority?: 'low' | 'medium' | 'high'
  disabled?: boolean
  data?: unknown
}
export interface KanbanColumnData {
  id: string
  title: string
  cards: KanbanCardData[]
  color?: string
  limit?: number
  disabled?: boolean
  data?: unknown
}
export interface KanbanMove {
  cardId: string
  fromColumnId: string
  toColumnId: string
  fromIndex: number
  toIndex: number
}
export interface KanbanProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'defaultValue'
> {
  value?: KanbanColumnData[]
  defaultValue?: KanbanColumnData[]
  onValueChange?: (columns: KanbanColumnData[]) => void
  onCardMove?: (move: KanbanMove) => void
  onColumnReorder?: (ids: string[]) => void
  renderCard?: (card: KanbanCardData, column: KanbanColumnData) => React.ReactNode
  onCardClick?: (card: KanbanCardData) => void
  disabled?: boolean
  readOnly?: boolean
  label?: string
}
/** Validates stable IDs before registering nested drag/drop targets. */
export function validateKanban(columns: readonly KanbanColumnData[]): string | undefined {
  const ids = new Set<string>(),
    cards = new Set<string>()
  for (const column of columns) {
    if (!column.id || ids.has(column.id)) return 'Column IDs must be unique.'
    ids.add(column.id)
    if (column.limit !== undefined && (!Number.isInteger(column.limit) || column.limit < 0))
      return 'Column limits must be nonnegative integers.'
    for (const card of column.cards) {
      if (!card.id || cards.has(card.id)) return 'Card IDs must be unique across the board.'
      cards.add(card.id)
    }
  }
}
/** Moves a card immutably, enforcing disabled items/columns and destination capacity. */
export function moveKanbanCard(
  columns: readonly KanbanColumnData[],
  cardId: string,
  toColumnId: string,
  index: number,
): { columns: KanbanColumnData[]; move: KanbanMove } | undefined {
  if (validateKanban(columns) || !Number.isFinite(index)) return
  const origin = columns.find((column) => column.cards.some((card) => card.id === cardId)),
    destination = columns.find((column) => column.id === toColumnId)
  if (!origin || !destination || origin.disabled || destination.disabled) return
  const fromIndex = origin.cards.findIndex((card) => card.id === cardId),
    card = origin.cards[fromIndex]
  if (
    card.disabled ||
    (origin !== destination &&
      destination.limit !== undefined &&
      destination.cards.length >= destination.limit)
  )
    return
  const target = destination.cards.filter((item) => item.id !== cardId),
    toIndex = Math.max(0, Math.min(target.length, Math.floor(index)))
  if (origin === destination && fromIndex === toIndex) return
  target.splice(toIndex, 0, card)
  return {
    columns: columns.map((column) =>
      column === destination
        ? { ...column, cards: target }
        : column === origin
          ? { ...column, cards: column.cards.filter((item) => item.id !== cardId) }
          : column,
    ),
    move: { cardId, fromColumnId: origin.id, toColumnId, fromIndex, toIndex },
  }
}
interface KanbanContext {
  direction: 'ltr' | 'rtl'
  columns: KanbanColumnData[]
  disabled: boolean
  readOnly: boolean
  move: (cardId: string, columnId: string, index: number) => boolean
  reorder: (from: number, to: number) => void
  renderCard: KanbanProps['renderCard']
  onCardClick: KanbanProps['onCardClick']
}
const Context = React.createContext<KanbanContext | null>(null)
function useKanban() {
  const c = React.useContext(Context)
  if (!c) throw new Error('Kanban parts need Kanban.')
  return c
}
/** Provides controlled board state with pointer/touch/keyboard sorting and explicit move controls. */
export function Kanban({
  value,
  defaultValue = [],
  onValueChange,
  onCardMove,
  onColumnReorder,
  renderCard,
  onCardClick,
  disabled = false,
  readOnly = false,
  label = 'Kanban board',
  children,
  className,
  ...props
}: KanbanProps) {
  const config = useUIConfig(),
    direction = props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : config.direction
  const [columns, setColumns] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    }),
    [active, setActive] = React.useState<{ kind: string; id: string } | null>(null),
    [message, setMessage] = React.useState('')
  const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    ),
    error = validateKanban(columns)
  const move = (cardId: string, columnId: string, index: number) => {
    if (disabled || readOnly) return false
    const result = moveKanbanCard(columns, cardId, columnId, index)
    if (!result) {
      setMessage('Move unavailable. Check the column capacity or card permissions.')
      return false
    }
    setColumns(result.columns)
    onCardMove?.(result.move)
    setMessage(
      `Moved ${columns.flatMap((column) => column.cards).find((card) => card.id === cardId)?.title ?? 'card'} to ${columns.find((column) => column.id === columnId)?.title ?? 'column'}, position ${result.move.toIndex + 1}.`,
    )
    return true
  }
  const reorder = (from: number, to: number) => {
    if (
      disabled ||
      readOnly ||
      from === to ||
      from < 0 ||
      to < 0 ||
      to >= columns.length ||
      columns[from]?.disabled ||
      columns[to]?.disabled
    )
      return
    const next = [...columns]
    next.splice(to, 0, next.splice(from, 1)[0])
    setColumns(next)
    onColumnReorder?.(next.map((column) => column.id))
    setMessage(`Moved ${columns[from].title} to column ${to + 1}.`)
  }
  const end = (event: DragEndEvent) => {
    setActive(null)
    if (!event.over || disabled || readOnly) return
    const from = event.active.data.current,
      to = event.over.data.current
    if (!from || !to) return
    if (from.kind === 'column') {
      if (to.columnId)
        reorder(
          columns.findIndex((column) => column.id === from.columnId),
          columns.findIndex((column) => column.id === to.columnId),
        )
      return
    }
    const destination = columns.find((column) => column.id === to.columnId)
    if (!destination) return
    move(
      from.cardId,
      destination.id,
      to.kind === 'card'
        ? destination.cards.findIndex((card) => card.id === to.cardId)
        : destination.cards.length,
    )
  }
  const activeColumn = columns.find((column) => column.id === active?.id),
    activeCard = columns.flatMap((column) => column.cards).find((card) => card.id === active?.id)
  return (
    <Context.Provider
      value={{ columns, disabled, readOnly, move, reorder, renderCard, onCardClick, direction }}
    >
      <section
        {...props}
        dir={direction}
        data-slot="kanban"
        aria-label={label}
        className={cn('w-full min-w-0', className)}
      >
        {error ? (
          <p role="alert" className="p-4 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={(event) => {
              const data = event.active.data.current
              if (data)
                setActive({
                  kind: data.kind,
                  id: data.kind === 'card' ? data.cardId : data.columnId,
                })
            }}
            onDragCancel={() => {
              setActive(null)
              setMessage('Reordering cancelled.')
            }}
            onDragEnd={end}
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  'Press Space to pick up. Use arrow keys to move, Space to drop, or Escape to cancel. The Move card menu also supports moving between columns.',
              },
            }}
          >
            {children ?? <KanbanBoard />}
            <DragOverlay>
              {active && (
                <div className="max-w-80 rotate-2 rounded-xl border bg-card p-4 shadow-xl">
                  {active.kind === 'card' ? activeCard?.title : activeColumn?.title}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
        <p role="status" className="sr-only">
          {message}
        </p>
      </section>
    </Context.Provider>
  )
}
/** Renders a scrollable column collection without coupling board data to a backend. */
export function KanbanBoard({ className, ...props }: React.ComponentProps<'div'>) {
  const c = useKanban()
  return (
    <SortableContext
      items={c.columns.map((column) => `column:${column.id}`)}
      strategy={horizontalListSortingStrategy}
    >
      <div {...props} className={cn('flex items-start gap-4 overflow-x-auto pb-4', className)}>
        {c.columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </SortableContext>
  )
}
/** Exposes a sortable column, card count, work limit, and keyboard column-order actions. */
export function KanbanColumn({
  column,
  className,
  ...props
}: { column: KanbanColumnData } & React.ComponentProps<'div'>) {
  const c = useKanban(),
    index = c.columns.findIndex((item) => item.id === column.id),
    leftIndex = index + (c.direction === 'rtl' ? 1 : -1),
    rightIndex = index + (c.direction === 'rtl' ? -1 : 1),
    locked = c.disabled || c.readOnly || !!column.disabled,
    { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
      id: `column:${column.id}`,
      data: { kind: 'column', columnId: column.id },
      disabled: locked,
    })
  return (
    <div
      {...props}
      ref={setNodeRef}
      data-column-id={column.id}
      className={cn(
        'w-72 min-w-0 max-w-full shrink-0 rounded-xl border bg-muted/35',
        isDragging && 'opacity-40',
        className,
      )}
      style={{
        ...props.style,
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0) scale(${transform.scaleX},${transform.scaleY})`
          : undefined,
        transition,
      }}
    >
      <header className="flex items-center gap-2 border-b p-3">
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-primary"
          style={column.color ? { backgroundColor: column.color } : undefined}
        />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{column.title}</h3>
        <span
          dir="ltr"
          className={cn(
            'rounded-md border bg-background px-1.5 text-[10px]',
            column.limit !== undefined && column.cards.length > column.limit && 'text-destructive',
          )}
        >
          {column.cards.length}
          {column.limit !== undefined ? ` / ${column.limit}` : ''}
        </span>
        {!c.readOnly && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label={`Move ${column.title} column left`}
              disabled={locked || !c.columns[leftIndex] || c.columns[leftIndex]?.disabled}
              onClick={() => c.reorder(index, leftIndex)}
            >
              <ArrowLeft className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label={`Move ${column.title} column right`}
              disabled={locked || !c.columns[rightIndex] || c.columns[rightIndex]?.disabled}
              onClick={() => c.reorder(index, rightIndex)}
            >
              <ArrowRight className="size-3" />
            </Button>
            <button
              type="button"
              {...attributes}
              {...listeners}
              disabled={locked}
              aria-label={`Reorder ${column.title} column`}
              className="touch-none rounded p-1 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <GripVertical className="size-4" />
            </button>
          </>
        )}
      </header>
      <SortableContext
        items={column.cards.map((card) => `card:${card.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div aria-label={`${column.title} cards`} className="min-h-24 space-y-2 p-2">
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} column={column} />
          ))}
          {!column.cards.length && (
            <p className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">
              No cards yet
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
/** Renders one composable card with a dedicated drag handle and an accessible move dialog. */
export function KanbanCard({
  card,
  column,
  className,
  ...props
}: { card: KanbanCardData; column: KanbanColumnData } & React.ComponentProps<'article'>) {
  const c = useKanban(),
    locked = c.disabled || c.readOnly || !!card.disabled || !!column.disabled,
    { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
      id: `card:${card.id}`,
      data: { kind: 'card', cardId: card.id, columnId: column.id },
      disabled: locked,
    })
  return (
    <article
      {...props}
      ref={setNodeRef}
      aria-label={card.title}
      className={cn(
        'rounded-lg border bg-card p-3 shadow-xs',
        isDragging && 'opacity-30',
        className,
      )}
      style={{
        ...props.style,
        transform: transform
          ? `translate3d(${transform.x}px,${transform.y}px,0) scale(${transform.scaleX},${transform.scaleY})`
          : undefined,
        transition,
      }}
    >
      <div className="mb-2 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          {c.onCardClick ? (
            <button
              type="button"
              className="text-left text-sm font-medium hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              disabled={c.disabled || card.disabled}
              onClick={() => c.onCardClick?.(card)}
            >
              {card.title}
            </button>
          ) : (
            <h4 className="text-sm font-medium">{card.title}</h4>
          )}
        </div>
        {!c.readOnly && (
          <>
            <button
              type="button"
              {...attributes}
              {...listeners}
              disabled={locked}
              aria-label={`Reorder ${card.title}`}
              className="touch-none rounded p-0.5 text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <GripVertical className="size-4" />
            </button>
            <KanbanCardActions card={card} column={column} />
          </>
        )}
      </div>
      {c.renderCard ? (
        c.renderCard(card, column)
      ) : (
        <>
          {card.description && (
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{card.description}</p>
          )}
          {!!card.labels?.length && (
            <div className="mb-3 flex flex-wrap gap-1">
              {card.labels.map((tag, index) => (
                <span
                  key={`${tag.label}-${index}`}
                  className="rounded-md border bg-muted px-1.5 py-0.5 text-[10px]"
                  style={
                    tag.color
                      ? {
                          color: `color-mix(in srgb,${tag.color} 60%,var(--foreground))`,
                          borderColor: `color-mix(in srgb,${tag.color} 25%,transparent)`,
                          backgroundColor: `color-mix(in srgb,${tag.color} 8%,transparent)`,
                        }
                      : undefined
                  }
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
            {card.priority && <span className="capitalize">{card.priority} priority</span>}
            {card.assignee && (
              <span className="ms-auto flex items-center gap-1.5">
                {card.assignee.avatar ? (
                  <img
                    src={card.assignee.avatar}
                    alt=""
                    className="size-5 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex size-5 items-center justify-center rounded-full bg-primary/10 font-medium text-primary"
                  >
                    {card.assignee.name.slice(0, 1)}
                  </span>
                )}
                {card.assignee.name}
              </span>
            )}
          </div>
        </>
      )}
    </article>
  )
}
/** Moves cards using a labeled form, including empty columns and precise insertion positions. */
export function KanbanCardActions({
  card,
  column,
}: {
  card: KanbanCardData
  column: KanbanColumnData
}) {
  const c = useKanban(),
    [open, setOpen] = React.useState(false),
    [destination, setDestination] = React.useState(column.id),
    [position, setPosition] = React.useState(
      column.cards.findIndex((item) => item.id === card.id) + 1,
    ),
    [error, setError] = React.useState(''),
    id = React.useId(),
    target = c.columns.find((item) => item.id === destination),
    max = Math.max(1, (target?.cards.length ?? 0) + (destination === column.id ? 0 : 1))
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setDestination(column.id)
          setPosition(column.cards.findIndex((item) => item.id === card.id) + 1)
          setError('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-5"
          aria-label={`Move ${card.title}`}
          disabled={c.disabled || c.readOnly || card.disabled || column.disabled}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {card.title}</DialogTitle>
          <DialogDescription>Choose the destination and position for this card.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (
              destination === column.id &&
              position === column.cards.findIndex((item) => item.id === card.id) + 1
            ) {
              setOpen(false)
              return
            }
            if (c.move(card.id, destination, Math.min(max, position) - 1)) setOpen(false)
            else setError('This card cannot move to that position.')
          }}
        >
          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor={`${id}-column`}>
              Column
            </label>
            <select
              id={`${id}-column`}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value)
                setPosition(1)
              }}
            >
              {c.columns.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  disabled={
                    item.disabled ||
                    (item.id !== column.id &&
                      item.limit !== undefined &&
                      item.cards.length >= item.limit)
                  }
                >
                  {item.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium" htmlFor={`${id}-position`}>
              Position
            </label>
            <input
              id={`${id}-position`}
              type="number"
              min={1}
              max={max}
              value={Math.min(max, position)}
              onChange={(event) => setPosition(Number(event.target.value))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Move card</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
