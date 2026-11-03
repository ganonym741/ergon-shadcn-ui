import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDecimal, compareDecimal } from '@/lib/decimal'
import { toZonedInput, fromZonedInput } from '@/lib/date-adapter'
import { planCellSpans } from '@/lib/cell-spans'
import { colorChannels, channelsToHex } from '@/lib/color'
import { DecimalInputNumber } from '@/components/ui/input-number'
import { OTPInput } from '@/components/ui/input'
import { moveTreeNode } from '@/components/ui/tree'
import { AutoComplete } from '@/components/ui/auto-complete'
import { Combobox } from '@/components/ui/combobox'
import { EditableTablePlus, recordChanges } from '@/components/ui/editable-table-plus'
import { TablePlus, type TablePlusParams } from '@/components/ui/table-plus'
import { ConfigProvider } from '@/components/ui/config-provider'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { FormPlus } from '@/components/ui/form-plus'
import { DescriptionsPlus } from '@/components/ui/descriptions-plus'
import { CheckCardGroup } from '@/components/ui/check-card-plus'
import { Popconfirm } from '@/components/ui/popconfirm'
import { useConfirm } from '@/components/ui/confirm'
import { WorkspaceTabs, type TabItem } from '@/components/ui/tabs'
import { DataTable } from '@/components/ui/data-table'
import { components, categories } from '@/catalog'
import { playgrounds, defaultConfig } from '@/playground/schema'

describe('precise values and adapters', () => {
  it('adds decimals beyond JavaScript integer precision', () => {
    expect(addDecimal('9007199254740993.1', '.2')).toBe('9007199254740993.3')
    expect(addDecimal('-0.3', '0.1')).toBe('-0.2')
    expect(compareDecimal('1.000', '1')).toBe(0)
  })
  it('round trips wall times and picks the earlier repeated DST instant', () => {
    const date = new Date('2026-10-24T05:30:00Z')
    expect(toZonedInput(date, 'Asia/Jakarta')).toBe('2026-10-24T12:30:00')
    expect(fromZonedInput('2026-10-24T12:30', 'Asia/Jakarta').toISOString()).toBe(
      date.toISOString(),
    )
    expect(fromZonedInput('2026-11-01T01:30', 'America/New_York').toISOString()).toBe(
      '2026-11-01T05:30:00.000Z',
    )
  })
  it('rejects nonexistent DST wall times', () => {
    expect(() => fromZonedInput('2026-03-08T02:30', 'America/New_York')).toThrow(/does not exist/)
  })
  it('round trips RGB, HSL and brightness color channels', () => {
    for (const format of ['rgb', 'hsl', 'hsb'] as const)
      for (const hex of ['#e66043', '#000000', '#ffffff', '#6976c5'])
        expect(channelsToHex(colorChannels(hex, format), format)).toBe(hex)
  })
  it('clamps spans and suppresses covered cells', () => {
    const spans = planCellSpans([{}, {}, {}], ['a', 'b', 'c'], (_, column, index) =>
      index === 0 && column === 'a' ? { rowSpan: 8, colSpan: 2 } : {},
    )
    expect(spans.get('0:0')).toEqual({ rowSpan: 3, colSpan: 2 })
    expect(spans.get('2:1')).toBeNull()
    expect(spans.get('2:2')).toEqual({ rowSpan: 1, colSpan: 1 })
  })
  it('parses a German decimal without losing precise digits on blur', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(
      <DecimalInputNumber
        defaultValue="9007199254740993.1"
        locale="de-DE"
        onValueChange={change}
      />,
    )
    const input = screen.getByLabelText('Precise decimal value')
    expect(input).toHaveValue('9007199254740993,1')
    await user.click(input)
    await user.tab()
    expect(input).toHaveValue('9007199254740993,1')
    await user.click(screen.getByLabelText('Increase precise value'))
    expect(change).toHaveBeenLastCalledWith('9007199254740993.2')
  })
  it('sanitizes a pasted OTP and focuses the final slot', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<OTPInput onValueChange={change} />)
    await user.click(screen.getByLabelText('Code digit 1'))
    await user.paste('12x3456')
    expect(change).toHaveBeenLastCalledWith('123456')
    expect(screen.getByLabelText('Code digit 6')).toHaveFocus()
  })
})
describe('composable workflows', () => {
  it('moves tree nodes before, after and into branches without mutation or cycles', () => {
    const nodes = [
      { key: 'a', label: 'A', children: [{ key: 'child', label: 'Child' }] },
      { key: 'b', label: 'B' },
    ]
    const moved = moveTreeNode(nodes, 'child', 'b', 'inside')
    expect(moved[0].children).toEqual([])
    expect(moved[1].children?.[0].key).toBe('child')
    expect(nodes[0].children).toHaveLength(1)
    expect(moveTreeNode(nodes, 'a', 'child', 'inside')).toBe(nodes)
    expect(moveTreeNode(nodes, 'b', 'a', 'before')[0].key).toBe('b')
    expect(moveTreeNode(nodes, 'a', 'b', 'after')[1].key).toBe('a')
  })
  it('creates a custom select option from keyboard input', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<Combobox options={[]} creatable onValueChange={change} />)
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByLabelText('Search options'), 'New tag')
    await user.keyboard('{Enter}')
    expect(change).toHaveBeenCalledWith(['New tag'])
  })
  it('loads asynchronous autocomplete options and selects with the keyboard', async () => {
    const user = userEvent.setup(),
      change = vi.fn(),
      load = vi.fn(async () => ['Remote option'])
    render(
      <AutoComplete
        options={[]}
        loadOptions={load}
        onValueChange={change}
        aria-label="Framework"
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('option', { name: 'Remote option' })
    await user.keyboard('{Enter}')
    expect(change).toHaveBeenLastCalledWith('Remote option')
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
  })
  it('keeps popup elements inside their configuration scope', async () => {
    const user = userEvent.setup()
    render(
      <ConfigProvider accent="#123456" locale="id-ID">
        <Popover>
          <PopoverTrigger>Open scoped</PopoverTrigger>
          <PopoverContent>Scoped content</PopoverContent>
        </Popover>
      </ConfigProvider>,
    )
    await user.click(screen.getByText('Open scoped'))
    const popup = screen.getByText('Scoped content')
    expect(popup.closest('[data-ergon-portals]')).toBeInTheDocument()
    expect(popup.closest('.ergon-root')).toHaveStyle({ '--primary': '#123456' })
    expect(popup.closest('.ergon-root')).toHaveAttribute('lang', 'id-ID')
  })
  it('keeps async confirmation open on error and allows retry', async () => {
    const user = userEvent.setup()
    let attempt = 0
    render(
      <Popconfirm
        onConfirm={async () => {
          if (attempt++ === 0) throw new Error('Try once more')
        }}
      >
        <button>Remove</button>
      </Popconfirm>,
    )
    await user.click(screen.getByText('Remove'))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Try once more')
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })
  it('resolves an imperative confirmation through its rendered holder', async () => {
    const user = userEvent.setup(),
      result = vi.fn()
    function Harness() {
      const [confirm, holder] = useConfirm()
      return (
        <>
          {holder}
          <button onClick={async () => result(await confirm({ title: 'Continue?' }))}>Ask</button>
        </>
      )
    }
    render(<Harness />)
    await user.click(screen.getByText('Ask'))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(result).toHaveBeenCalledWith(true)
  })
  it('enforces selectable-card group limits', async () => {
    const user = userEvent.setup()
    render(
      <CheckCardGroup
        options={[
          { value: 'a', title: 'A' },
          { value: 'b', title: 'B' },
          { value: 'c', title: 'C' },
        ]}
        defaultValue={['a']}
        min={1}
        max={2}
      />,
    )
    expect(screen.getByRole('checkbox', { name: 'A' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'B' }))
    expect(screen.getByRole('checkbox', { name: 'C' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'A' })).not.toBeDisabled()
  })
  it('moves selection when the active workspace tab closes', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [items, setItems] = React.useState<TabItem[]>([
          { value: 'a', label: 'A', content: 'First', closable: true },
          { value: 'b', label: 'B', content: 'Second', closable: true },
        ]),
        [value, setValue] = React.useState('a')
      return (
        <WorkspaceTabs
          items={items}
          value={value}
          onValueChange={setValue}
          onItemsChange={setItems}
        />
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('tab', { name: 'A' }))
    await user.keyboard('{Delete}')
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second')
  })
  it('reloads schema options when a dependency changes', async () => {
    const user = userEvent.setup(),
      load = vi.fn(async (values: Record<string, any>) => [
        { value: values.name || 'empty', label: values.name || 'Empty' },
      ])
    render(
      <FormPlus
        fields={[
          { name: 'name', label: 'Name' },
          {
            name: 'choice',
            label: 'Choice',
            type: 'select',
            dependencies: ['name'],
            loadOptions: load,
          },
        ]}
        defaultValues={{ name: '', choice: '' }}
        onSubmit={() => {}}
      />,
    )
    await waitFor(() => expect(load).toHaveBeenCalled())
    await user.type(screen.getByLabelText('Name'), 'B')
    await waitFor(() => expect(load.mock.calls.at(-1)?.[0].name).toBe('B'))
  })
  it('validates individual description fields before saving', async () => {
    const user = userEvent.setup(),
      save = vi.fn()
    render(
      <DescriptionsPlus
        record={{ name: 'Sarah' }}
        fields={[
          {
            key: 'name',
            label: 'Name',
            validate: (value) => (String(value).length < 3 ? 'Name is too short' : undefined),
          },
        ]}
        onFieldSave={save}
      />,
    )
    await user.click(screen.getByText('Edit Name'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'A')
    await user.click(screen.getByText('Save field'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Name is too short')
    expect(save).not.toHaveBeenCalled()
  })
})
describe('data transactions', () => {
  const initial = [
      { id: 'a', name: 'First' },
      { id: 'b', name: 'Second' },
    ],
    columns = [{ accessorKey: 'name', header: 'Name', meta: { editable: true } }]
  it('plans insert, update and deletion mutations by stable ID', () => {
    expect(
      recordChanges(
        initial,
        [
          { id: 'a', name: 'Changed' },
          { id: 'c', name: 'New' },
        ],
        (row) => row.id,
      ).map((change) => [change.id, change.type]),
    ).toEqual([
      ['a', 'update'],
      ['c', 'insert'],
      ['b', 'delete'],
    ])
  })
  it('stages deletion, cancels it, and rolls back a failed optimistic commit', async () => {
    const user = userEvent.setup(),
      commit = vi.fn(async () => {
        throw new Error('Service rejected changes')
      })
    function Harness() {
      const [rows, setRows] = React.useState(initial)
      return (
        <>
          <output data-testid="persisted">{rows.length}</output>
          <EditableTablePlus
            value={rows}
            onValueChange={setRows}
            columns={columns}
            getRowId={(row) => row.id}
            createRecord={() => ({ id: 'c', name: 'New' })}
            transactional
            optimistic
            onCommit={commit}
          />
        </>
      )
    }
    render(<Harness />)
    await user.click(screen.getByLabelText('Delete row a'))
    expect(screen.getByTestId('persisted')).toHaveTextContent('2')
    await user.click(screen.getByText('Cancel changes'))
    expect(screen.getByText('First')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Delete row a'))
    await user.click(screen.getByRole('button', { name: /Save all/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Service rejected changes')
    expect(screen.getByTestId('persisted')).toHaveTextContent('2')
    expect(screen.queryByText('First')).not.toBeInTheDocument()
    expect(commit).toHaveBeenCalledOnce()
  })
  it('retains selected keys across server pages for a batch action', async () => {
    const user = userEvent.setup(),
      batch = vi.fn(),
      request = vi.fn(async (params: TablePlusParams) => ({
        data: initial.slice(params.page - 1, params.page),
        total: 2,
      }))
    render(
      <TablePlus
        columns={columns}
        getRowId={(row) => row.id}
        request={request}
        pageSize={1}
        batchActions={[{ key: 'save', label: 'Process selected', onAction: batch }]}
      />,
    )
    await screen.findByText('First')
    await user.click(screen.getByLabelText('Select row a'))
    await user.click(screen.getByLabelText('Next page'))
    await screen.findByText('Second')
    await user.click(screen.getByLabelText('Select row b'))
    await user.click(screen.getByText('Process selected'))
    await waitFor(() => expect(batch).toHaveBeenCalled())
    expect(batch.mock.calls[0][0]).toEqual(['a', 'b'])
    expect(batch.mock.calls[0][1]).toEqual(initial)
  })
  it('renders real merged table cells and suppresses covered cells', () => {
    render(
      <DataTable
        data={initial}
        columns={columns}
        selection={false}
        getCellProps={(_, column, index) => (index === 0 ? { rowSpan: 2 } : undefined)}
      />,
    )
    const cell = screen.getByText('First').closest('td')
    expect(cell).toHaveAttribute('rowspan', '2')
    expect(screen.queryByText('Second')).not.toBeInTheDocument()
  })
  it('stages a batch field edit and commits both selected records', async () => {
    const user = userEvent.setup(),
      save = vi.fn()
    function Harness() {
      const [rows, setRows] = React.useState(initial)
      return (
        <EditableTablePlus
          value={rows}
          onValueChange={setRows}
          columns={columns}
          getRowId={(row) => row.id}
          createRecord={() => ({ id: 'c', name: 'New' })}
          transactional
          batchEditing
          onCommit={save}
        />
      )
    }
    render(<Harness />)
    await user.click(screen.getByLabelText('Select all rows on this page'))
    await user.selectOptions(screen.getByLabelText('Bulk edit column'), 'name')
    await user.type(screen.getByLabelText('Bulk edit value'), 'Batch')
    await user.click(screen.getByRole('button', { name: 'Apply to selected (2)' }))
    expect(screen.getAllByRole('button', { name: 'Batch' })).toHaveLength(2)
    expect(save).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Save all/ }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    expect(save.mock.calls[0][1]).toHaveLength(2)
  })
  it('updates and resets controlled column visibility in Table+', async () => {
    const user = userEvent.setup()
    render(<TablePlus data={initial} columns={columns} getRowId={(row) => row.id} />)
    await user.click(screen.getByLabelText('Configure columns'))
    await user.click(screen.getByRole('checkbox', { name: 'Name' }))
    expect(screen.queryByText('First')).not.toBeInTheDocument()
    await user.click(screen.getByText('Reset column view'))
    expect(screen.getByText('First')).toBeInTheDocument()
  })
})
describe('catalog and playground contract', () => {
  it('keeps enhanced components in functional categories and supplies typed control recipes', () => {
    expect(categories).toHaveLength(8)
    for (const component of components) {
      const spec = playgrounds[component.id]
      expect(spec.controls.length, component.id).toBeGreaterThan(0)
      expect(spec.presets.some((preset) => preset.name === 'Showcase')).toBe(true)
      expect(Object.keys(defaultConfig(component.id))).toEqual(
        expect.arrayContaining(spec.controls.map((control) => control.key)),
      )
      if (component.id.endsWith('-plus')) expect(component.name.endsWith('+')).toBe(true)
    }
  })
})
