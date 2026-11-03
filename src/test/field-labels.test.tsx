import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DescriptionsPlus, type DescriptionField } from '@/components/ui/descriptions-plus'

const fields: DescriptionField[] = [
  { key: 'name', label: 'Name' },
  { key: 'rating', label: 'Satisfaction', type: 'rate' },
  { key: 'budget', label: 'Budget', type: 'slider' },
  { key: 'plan', label: 'Plan', type: 'radio', options: [{ value: 'a', label: 'Basic' }] },
  {
    key: 'permissions',
    label: 'Permissions',
    type: 'checkbox-group',
    options: [{ value: 'read', label: 'Read' }],
  },
  {
    key: 'team',
    label: 'Team',
    type: 'tree-select',
    treeNodes: [{ key: 'engineering', label: 'Engineering' }],
  },
  { key: 'schedule', label: 'Schedule', type: 'date-range' },
  { key: 'release', label: 'Release window', type: 'datetime-range' },
  { key: 'documents', label: 'Documents', type: 'upload' },
]
const record = {
  name: 'Nina',
  rating: 3,
  budget: 40,
  plan: 'a',
  permissions: ['read'],
  team: ['engineering'],
}

describe('description field labels', () => {
  it('uses plain description terms in read mode and names every composite editor', async () => {
    const user = userEvent.setup()
    const view = render(<DescriptionsPlus record={record} fields={fields} onSave={vi.fn()} />)
    expect(view.container.querySelectorAll('label[for]')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Satisfaction' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Budget' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Permissions' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Team' })).toBeInTheDocument()
    for (const name of ['Schedule', 'Release window', 'Documents'])
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    for (const label of view.container.querySelectorAll<HTMLLabelElement>('label[for]'))
      expect(label.control).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(view.container.querySelectorAll('label[for]')).toHaveLength(0)
  })

  it('associates only the editor being edited when saving one field at a time', async () => {
    const user = userEvent.setup()
    const view = render(
      <DescriptionsPlus record={record} fields={fields.slice(0, 2)} onFieldSave={vi.fn()} />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit Name' }))
    const labels = view.container.querySelectorAll<HTMLLabelElement>('label[for]')
    expect(labels).toHaveLength(1)
    expect(labels[0].control).toBe(screen.getByRole('textbox', { name: 'Name' }))
  })
})
