import { Kanban, type KanbanColumnData } from '@/components/ui/kanban'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { kanbanData } from '../expansion-data'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-muted-foreground">
        Drag a handle or use its keyboard controls. Move cards into Ready with the card menu.
        Building has a three-card limit.
      </p>
      <Kanban
        defaultValue={parseData(v, 'data', kanbanData) as KanbanColumnData[]}
        disabled={!!v.disabled}
        readOnly={!!v.readOnly}
        onValueChange={(value) => report(props, 'board-change', value)}
        onCardMove={(value) => report(props, 'card-move', value)}
        onColumnReorder={(value) => report(props, 'column-reorder', value)}
        onCardClick={(value) => report(props, 'card-open', value)}
        renderCard={
          v.customCard
            ? (card, column) => (
                <div className="space-y-2 rounded-md bg-primary/5 p-2">
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                  <p className="text-[10px] font-medium text-primary">
                    {column.title} · {card.priority ?? 'normal'} priority
                  </p>
                </div>
              )
            : undefined
        }
      />
    </div>
  )
}
