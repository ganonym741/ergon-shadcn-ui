import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdvancedDataPreview } from '@/playground/table-preview'
import { defaultConfig } from '@/playground/schema'
import { TablePlus } from '@/components/ui/table-plus'
describe.each(['table', 'table-plus'])('%s row content playground', (id) => {
  it('expands grandchildren, edits child records and adds a child with stable IDs', async () => {
    const user = userEvent.setup(),
      event = vi.fn()
    render(
      <AdvancedDataPreview
        id={id}
        config={{
          ...defaultConfig(id),
          rowMode: 'Nested rows',
          rows: 2,
          childCount: 2,
          childLevels: 2,
          expandFirst: true,
          editing: true,
          virtual: false,
          query: false,
          views: false,
          batch: false,
        }}
        onEvent={event}
      />,
    )
    const child = document.querySelector('[data-row-id="PRJ-0001.1"]') as HTMLElement
    expect(child).not.toBeNull()
    await user.click(within(child).getByRole('button', { name: 'Expand row PRJ-0001.1' }))
    expect(document.querySelector('[data-row-id="PRJ-0001.1.1"]')).not.toBeNull()
    await user.click(within(child).getByRole('button', { name: /Phase 1/ }))
    const input = screen.getByRole('textbox', { name: 'Edit name' })
    await user.clear(input)
    await user.type(input, 'Updated child{Enter}')
    await user.click(screen.getByRole('button', { name: 'Collapse row PRJ-0001' }))
    await user.click(screen.getByRole('button', { name: 'Expand row PRJ-0001' }))
    expect(screen.getByRole('button', { name: 'Updated child' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add child to PRJ-0001' }))
    expect(screen.getByRole('button', { name: 'New task 3' })).toBeInTheDocument()
    expect(event.mock.calls.some(([event]) => event.type === 'add-child')).toBe(true)
  })
  it('renders custom row details with working actions', async () => {
    const event = vi.fn()
    render(
      <AdvancedDataPreview
        id={id}
        config={{
          ...defaultConfig(id),
          rowMode: 'Row details',
          rows: 2,
          expandFirst: true,
          query: false,
          views: false,
        }}
        onEvent={event}
      />,
    )
    const section = screen.getByRole('region', { name: 'Details for PRJ-0001' })
    await userEvent.click(within(section).getByRole('button', { name: 'Open project' }))
    expect(
      event.mock.calls.some(
        ([event]) => event.type === 'details-action' && event.value.id === 'PRJ-0001',
      ),
    ).toBe(true)
  })
  it('renders a child table with editable tasks and a custom add action', async () => {
    render(
      <AdvancedDataPreview
        id={id}
        config={{
          ...defaultConfig(id),
          rowMode: 'Nested table',
          rows: 2,
          childCount: 2,
          childLevels: 1,
          expandFirst: true,
          editing: true,
          query: false,
          views: false,
        }}
        onEvent={() => {}}
      />,
    )
    const section = screen.getByRole('region', { name: 'Tasks for PRJ-0001' })
    await userEvent.click(within(section).getByRole('button', { name: 'Add task' }))
    expect(within(section).getByRole('button', { name: 'New task 3' })).toBeInTheDocument()
  })
})
it('includes selected child records in Table+ batch action payloads', async () => {
  type Node = { id: string; name: string; children?: Node[] }
  const child = { id: 'child', name: 'Child' },
    action = vi.fn()
  render(
    <TablePlus<Node>
      data={[{ id: 'parent', name: 'Parent', children: [child] }]}
      columns={[{ accessorKey: 'name', header: 'Name' }]}
      getRowId={(row) => row.id}
      getSubRows={(row) => row.children}
      batchActions={[{ key: 'collect', label: 'Collect records', onAction: action }]}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Expand row parent' }))
  await userEvent.click(screen.getByRole('checkbox', { name: 'Select row child' }))
  await userEvent.click(screen.getByRole('button', { name: 'Collect records' }))
  await waitFor(() => expect(action).toHaveBeenCalled())
  expect(action.mock.calls[0][0]).toEqual(['child'])
  expect(action.mock.calls[0][1]).toEqual([child])
})
it('expands server-paginated trees when pagination counts parent records', async () => {
  type Node = { id: string; name: string; children?: Node[] }
  const request = vi.fn(async () => ({
    data: [{ id: 'parent', name: 'Parent', children: [{ id: 'child', name: 'Server child' }] }],
    total: 20,
  }))
  render(
    <TablePlus<Node>
      request={request}
      columns={[{ accessorKey: 'name', header: 'Name' }]}
      getRowId={(row) => row.id}
      getSubRows={(row) => row.children}
      tableOptions={{ paginateExpandedRows: false, initialState: { expanded: { parent: true } } }}
    />,
  )
  expect(await screen.findByText('Server child')).toBeInTheDocument()
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Reload records' }))
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
  expect(await screen.findByText('Server child')).toBeInTheDocument()
})
