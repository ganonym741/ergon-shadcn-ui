import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '@/components/ui/data-table'
import { TablePlus } from '@/components/ui/table-plus'
import { FormPlus, FormPlusList } from '@/components/ui/form-plus'
import { InputNumber } from '@/components/ui/input-number'
import { Tree } from '@/components/ui/tree'
import { Combobox } from '@/components/ui/combobox'
import { Upload } from '@/components/ui/upload'
import { EditableTablePlus } from '@/components/ui/editable-table-plus'
import { TooltipProvider } from '@/components/ui/tooltip'
import { makeProjects, projectColumns, treeData } from '@/docs/demo-data'
import { csvEscape } from '@/lib/data-utils'
const wrap = (ui: React.ReactNode) => render(<TooltipProvider>{ui}</TooltipProvider>)
describe('data workspaces', () => {
  it('filters across rows, paginates, and retains stable selection', async () => {
    const user = userEvent.setup()
    const selected = vi.fn()
    wrap(
      <DataTable
        data={makeProjects(24)}
        columns={projectColumns}
        getRowId={(r) => r.id}
        onSelectionChange={selected}
      />,
    )
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Select row PRJ-0001' }))
    expect(selected.mock.lastCall?.[0][0].id).toBe('PRJ-0001')
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search all rows' }), 'Sarah Kim')
    await waitFor(() => expect(screen.getByText(/4 records/)).toBeInTheDocument())
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
  })
  it('sorts numerically and supports inline validation', async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    wrap(<DataTable data={makeProjects(4)} columns={projectColumns} onDataChange={save} />)
    await user.click(screen.getByRole('button', { name: 'Budget' }))
    expect(screen.getByRole('columnheader', { name: 'Budget Resize budget' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    await user.click(screen.getByRole('button', { name: 'Website redesign' }))
    const input = screen.getByRole('textbox', { name: 'Edit name' })
    await user.clear(input)
    await user.keyboard('{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('A project name is required')
    expect(save).not.toHaveBeenCalled()
    await user.type(input, 'A better project')
    await user.keyboard('{Enter}')
    expect(save.mock.lastCall?.[0][0].name).toBe('A better project')
  })
  it('adds and deletes editable records', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [rows, setRows] = React.useState(makeProjects(2))
      return (
        <EditableTablePlus
          value={rows}
          onValueChange={setRows}
          columns={projectColumns}
          getRowId={(r) => r.id}
          createRecord={() => ({ ...makeProjects(1)[0], id: 'new', name: 'A fresh idea' })}
        />
      )
    }
    wrap(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Add row' }))
    expect(screen.getByRole('button', { name: 'A fresh idea' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete row new' }))
    expect(screen.queryByRole('button', { name: 'A fresh idea' })).not.toBeInTheDocument()
  })
  it('aborts obsolete server requests and passes pagination/search state', async () => {
    const user = userEvent.setup()
    const signals: AbortSignal[] = []
    const request = vi.fn(async (params, signal: AbortSignal) => {
      signals.push(signal)
      return { data: makeProjects(10), total: 40 }
    })
    wrap(<TablePlus columns={projectColumns} request={request} />)
    await waitFor(() => expect(screen.getByText('Page 1 of 4')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await waitFor(() => expect(request.mock.lastCall?.[0].page).toBe(2))
    expect(signals[0].aborted).toBe(true)
    await user.type(screen.getByRole('textbox', { name: 'Search all rows' }), 'Design')
    await waitFor(() => expect(request.mock.lastCall?.[0].keyword).toBe('Design'))
    expect(request.mock.lastCall?.[0].page).toBe(1)
  })
})
describe('form and selection behavior', () => {
  it('validates before submitting and keeps dynamic field data', async () => {
    const user = userEvent.setup(),
      submit = vi.fn()
    wrap(
      <FormPlus
        fields={[{ name: 'name', label: 'Name', required: true }]}
        defaultValues={{ name: '', members: [] }}
        onSubmit={submit}
      >
        <FormPlusList
          name="members"
          fields={[{ name: 'email', placeholder: 'Email' }]}
          defaultItem={{ email: '' }}
        />
      </FormPlus>,
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Name is required')
    expect(submit).not.toHaveBeenCalled()
    await user.type(screen.getByLabelText('Name', { exact: false }), 'New workspace')
    await user.click(screen.getByRole('button', { name: 'Add item' }))
    await user.type(screen.getByRole('textbox', { name: 'Email 1' }), 'sarah@example.com')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({
        name: 'New workspace',
        members: [{ email: 'sarah@example.com' }],
      }),
    )
  })
  it('enforces numeric bounds and decimal precision', async () => {
    const user = userEvent.setup()
    wrap(<InputNumber defaultValue={0.2} step={0.1} min={0} max={0.3} />)
    await user.click(screen.getByRole('button', { name: 'Increase Quantity' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(0.3)
    expect(screen.getByRole('button', { name: 'Increase Quantity' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Decrease Quantity' }))
    expect(screen.getByRole('spinbutton')).toHaveValue(0.2)
  })
  it('checks descendants and exposes a mixed parent state', async () => {
    const user = userEvent.setup()
    const change = vi.fn()
    wrap(
      <Tree
        nodes={treeData}
        checkable
        onValueChange={change}
        defaultExpandedKeys={['workspace', 'design']}
      />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Select Brand guidelines.pdf' }))
    expect(change.mock.lastCall?.[0]).toEqual(['brand'])
    expect(screen.getByRole('treeitem', { name: /Your workspace/ })).toHaveAttribute(
      'aria-checked',
      'mixed',
    )
    await user.click(screen.getByRole('checkbox', { name: 'Select Design' }))
    expect(change.mock.lastCall?.[0]).toEqual(['brand', 'icons'])
  })
  it('supports searchable multi-selection and clear', async () => {
    const user = userEvent.setup()
    const change = vi.fn()
    wrap(
      <Combobox
        options={[
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue' },
        ]}
        multiple
        onValueChange={change}
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /React/ }))
    expect(change.mock.lastCall?.[0]).toEqual(['react'])
    await user.click(screen.getByRole('option', { name: /Vue/ }))
    expect(change.mock.lastCall?.[0]).toEqual(['react', 'vue'])
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(change.mock.lastCall?.[0]).toEqual([])
  })
  it('rejects oversize files and cancels removed uploads', async () => {
    const user = userEvent.setup({ applyAccept: false })
    const upload = vi.fn((_file: File, _signal: AbortSignal) => new Promise<void>(() => {}))
    wrap(<Upload maxSize={8} accept=".txt" customRequest={upload} />)
    const input = screen.getByLabelText('Choose files')
    await user.upload(
      input,
      new File(['too large for this control'], 'large.txt', { type: 'text/plain' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('exceeds')
    expect(upload).not.toHaveBeenCalled()
    await user.upload(input, new File(['ok'], 'small.txt', { type: 'text/plain' }))
    expect(upload).toHaveBeenCalledTimes(1)
    const signal = upload.mock.calls[0][1] as AbortSignal
    await user.click(screen.getByRole('button', { name: 'Remove small.txt' }))
    expect(signal.aborted).toBe(true)
  })
})
it('escapes CSV quotes and neutralizes spreadsheet formulas', () => {
  expect(csvEscape('hello, "world"')).toBe('"hello, ""world"""')
  expect(csvEscape('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"')
  expect(csvEscape(' +cmd')).toBe('"\' +cmd"')
})
