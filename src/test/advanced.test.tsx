import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, waitFor, renderHook, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '@/components/ui/data-table'
import { makeProjects, projectColumns } from '@/docs/demo-data'
import { YearPicker } from '@/components/ui/date-picker'
import { Rate } from '@/components/ui/rate'
import { Cascader } from '@/components/ui/cascader'
import { Combobox } from '@/components/ui/combobox'
import { Upload } from '@/components/ui/upload'
import { Statistic } from '@/components/ui/statistic'
import { ConfigProvider } from '@/components/ui/config-provider'
import { useControllableState } from '@/components/ui/util'
import { canDropTreeNode } from '@/components/ui/tree'
import { treeData } from '@/docs/demo-data'
import { readTableView } from '@/lib/table-view'
import { FormPlus } from '@/components/ui/form-plus'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
describe('advanced data behavior', () => {
  it('restores column visibility and safely handles corrupted saved views', () => {
    localStorage.setItem(
      'test-view',
      JSON.stringify({
        visibility: { budget: false },
        order: ['name', 'id'],
        sizing: { name: 260 },
        pinning: { left: ['name'], right: [] },
      }),
    )
    render(<DataTable data={makeProjects(2)} columns={projectColumns} storageKey="test-view" />)
    expect(screen.queryByRole('button', { name: 'Budget' })).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Project Resize name' })).toHaveStyle({
      width: '260px',
    })
    localStorage.setItem('bad-view', '{bad')
    expect(readTableView('bad-view')).toEqual({})
    localStorage.removeItem('test-view')
    localStorage.removeItem('bad-view')
  })
  it('reorders top-level records with a keyboard operation', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [rows, setRows] = React.useState(makeProjects(3))
      return (
        <DataTable
          data={rows}
          columns={projectColumns}
          getRowId={(r) => r.id}
          onDataChange={setRows}
          reorderable
        />
      )
    }
    render(<Harness />)
    screen.getByRole('button', { name: 'Move row PRJ-0001; Alt Arrow Up or Down' }).focus()
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-row-id', 'PRJ-0002')
  })
  it('edits nested records through the explicit cell callback', async () => {
    const user = userEvent.setup(),
      edit = vi.fn()
    type Node = { id: string; name: string; children?: Node[] }
    render(
      <DataTable<Node>
        data={[{ id: 'root', name: 'Parent', children: [{ id: 'leaf', name: 'Child' }] }]}
        columns={[{ accessorKey: 'name', header: 'Name', meta: { editable: true } }]}
        getSubRows={(r) => r.children}
        getRowId={(r) => r.id}
        onCellEdit={edit}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Expand row root' }))
    await user.click(screen.getByRole('button', { name: 'Child' }))
    await user.clear(screen.getByRole('textbox', { name: 'Edit name' }))
    await user.type(screen.getByRole('textbox', { name: 'Edit name' }), 'Updated child{Enter}')
    expect(edit).toHaveBeenCalledWith({ id: 'leaf', name: 'Child' }, 'name', 'Updated child')
  })
  it('updates summary content with the filtered collection', async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        data={makeProjects(8)}
        columns={projectColumns}
        summary={(rows) => <span>Summary: {rows.length} projects</span>}
      />,
    )
    expect(screen.getByText('Summary: 8 projects')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search all rows' }), 'Nina Patel')
    expect(screen.getByText('Summary: 1 projects')).toBeInTheDocument()
  })
})
describe('composite input edge cases', () => {
  it('lets a year be typed from empty without clamping intermediate keystrokes', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<YearPicker onValueChange={change} />)
    await user.type(screen.getByRole('spinbutton'), '2027')
    expect(screen.getByRole('spinbutton')).toHaveValue(2027)
    expect(change).toHaveBeenLastCalledWith(2027)
  })
  it('supports half-star keyboard steps and end/home', async () => {
    const user = userEvent.setup()
    render(<Rate allowHalf defaultValue={2} />)
    screen.getByRole('slider').focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '2.5')
    await user.keyboard('{End}')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '5')
    await user.keyboard('{Home}')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0')
  })
  it('skips disabled options during keyboard selection', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(
      <Combobox
        options={[
          { value: 'disabled', label: 'Unavailable', disabled: true },
          { value: 'react', label: 'React' },
        ]}
        onValueChange={change}
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{Enter}')
    expect(change).toHaveBeenLastCalledWith(['react'])
  })
  it('loads cascader children and returns the full path', async () => {
    const user = userEvent.setup(),
      change = vi.fn(),
      load = vi.fn(async (_path: string[], _signal: AbortSignal) => [
        { value: 'leaf', label: 'A loaded choice', isLeaf: true },
      ])
    render(
      <Cascader
        options={[{ value: 'root', label: 'Load this branch', isLeaf: false }]}
        onValueChange={change}
        loadChildren={load}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Choose a location' }))
    await user.click(screen.getByRole('button', { name: 'Load this branch' }))
    await user.click(await screen.findByRole('button', { name: 'A loaded choice' }))
    expect(change).toHaveBeenCalledWith(['root', 'leaf'])
    expect(load.mock.calls[0][0]).toEqual(['root'])
  })
  it('keeps disabled ancestors disabled during path search', async () => {
    const user = userEvent.setup()
    render(
      <Cascader
        options={[
          {
            value: 'root',
            label: 'Restricted',
            disabled: true,
            children: [{ value: 'leaf', label: 'A hidden option' }],
          },
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Choose a location' }))
    await user.type(screen.getByRole('textbox', { name: 'Search cascader options' }), 'hidden')
    expect(screen.getByRole('button', { name: 'Restricted / A hidden option' })).toBeDisabled()
  })
  it('retries a failed request and reports upload completion', async () => {
    const user = userEvent.setup()
    let attempt = 0
    const request = vi.fn(
      async (_file: File, _signal: AbortSignal, onProgress: (n: number) => void) => {
        attempt++
        if (attempt === 1) throw new Error('Connection interrupted')
        onProgress(100)
      },
    )
    render(<Upload customRequest={request} showThumbnails={false} />)
    await user.upload(
      screen.getByLabelText('Choose files'),
      new File(['hello'], 'notes.txt', { type: 'text/plain' }),
    )
    await screen.findByText('Connection interrupted')
    await user.click(screen.getByRole('button', { name: 'Retry notes.txt' }))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Retry notes.txt' })).not.toBeInTheDocument(),
    )
  })
})
it('uses configured locale for number formatting', () => {
  render(
    <ConfigProvider locale="de-DE">
      <Statistic title="Revenue" value={1234.5} precision={1} />
    </ConfigProvider>,
  )
  expect(screen.getByText('1.234,5')).toBeInTheDocument()
})
it('preserves consecutive functional state updates', () => {
  const hook = renderHook(() => useControllableState({ defaultValue: 0 }))
  act(() => {
    hook.result.current[1]((v) => v + 1)
    hook.result.current[1]((v) => v + 1)
  })
  expect(hook.result.current[0]).toBe(2)
})
it('prevents tree cycles and disabled-node drops', () => {
  expect(canDropTreeNode(treeData, 'workspace', 'design')).toBe(false)
  expect(canDropTreeNode(treeData, 'brand', 'engineering')).toBe(true)
  expect(canDropTreeNode(treeData, 'brand', 'archive')).toBe(false)
})
it('renders virtual options when a popup mounts and remounts', async () => {
  const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(280)
  const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
  try {
    const user = userEvent.setup()
    render(
      <Combobox
        label="Large choices"
        options={Array.from({ length: 10000 }, (_, i) => ({
          value: String(i),
          label: `Choice ${i + 1}`,
        }))}
      />,
    )
    await user.click(screen.getByRole('combobox', { name: 'Large choices' }))
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
    expect(screen.getAllByRole('option').length).toBeLessThan(40)
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('combobox', { name: 'Large choices' }))
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))
  } finally {
    height.mockRestore()
    width.mockRestore()
  }
})
it('accepts a typed Zod resolver and submits typed values', async () => {
  const user = userEvent.setup(),
    submit = vi.fn()
  const schema = z.object({
    name: z.string().min(3, 'Give this idea a longer name'),
    budget: z.number().min(1, 'Add a positive budget'),
  })
  type Values = z.infer<typeof schema>
  render(
    <FormPlus<Values>
      fields={[
        { name: 'name', label: 'Project name' },
        { name: 'budget', label: 'Budget', type: 'money' },
      ]}
      defaultValues={{ name: '', budget: 0 }}
      resolver={zodResolver(schema)}
      onSubmit={(values) => {
        const budget: number = values.budget
        submit({ ...values, budget })
      }}
    />,
  )
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(await screen.findByText('Give this idea a longer name')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Project name'), 'New idea')
  await user.clear(screen.getByLabelText('Budget'))
  await user.type(screen.getByLabelText('Budget'), '100')
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
  await waitFor(() => expect(submit).toHaveBeenCalledWith({ name: 'New idea', budget: 100 }))
})
