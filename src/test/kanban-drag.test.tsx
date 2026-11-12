import * as React from 'react'
import { render, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Kanban } from '@/components/ui/kanban'
import type { DndContextProps } from '@dnd-kit/core'

const drag = vi.hoisted(() => ({ end: undefined as DndContextProps['onDragEnd'] }))
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    DndContext: (props: DndContextProps) => {
      drag.end = props.onDragEnd
      return <actual.DndContext {...props} />
    },
  }
})

describe('kanban drag destinations', () => {
  it.each(['column', 'card'])('reorders a column when dropped over a %s', (kind) => {
    const reorder = vi.fn(),
      move = vi.fn()
    render(
      <Kanban
        defaultValue={[
          { id: 'a', title: 'First', cards: [] },
          { id: 'b', title: 'Second', cards: [{ id: 'card', title: 'Task' }] },
        ]}
        onColumnReorder={reorder}
        onCardMove={move}
      />,
    )
    act(() =>
      drag.end?.({
        active: { id: 'column:a', data: { current: { kind: 'column', columnId: 'a' } } },
        over: {
          id: kind === 'card' ? 'card' : 'column:b',
          data: { current: { kind, columnId: 'b', cardId: 'card' } },
        },
      } as unknown as Parameters<NonNullable<DndContextProps['onDragEnd']>>[0]),
    )
    expect(reorder).toHaveBeenCalledWith(['b', 'a'])
    expect(move).not.toHaveBeenCalled()
  })
})
