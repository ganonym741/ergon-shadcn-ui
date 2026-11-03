import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DatePicker, DateRangePicker, MultiDatePicker } from '@/components/ui/date-picker'
import { DescriptionsPlus } from '@/components/ui/descriptions-plus'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.removeItem('ergon-appearance')
  document.documentElement.classList.remove('dark')
  document.documentElement.style.removeProperty('color-scheme')
})

describe('release regressions', () => {
  it.each(['single', 'range', 'multiple'] as const)(
    'opens the %s date picker in the selected month',
    async (mode) => {
      const selected = new Date(2034, 2, 14, 12)
      render(
        mode === 'single' ? (
          <DatePicker value={selected} />
        ) : mode === 'range' ? (
          <DateRangePicker value={{ from: selected }} />
        ) : (
          <MultiDatePicker value={[selected]} />
        ),
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('March 2034')).toBeInTheDocument()
    },
  )

  it('uses a newly controlled selected month when reopening the date picker', async () => {
    const user = userEvent.setup()
    const view = render(<DatePicker value={new Date(2034, 2, 14, 12)} />)
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByText('April 2034')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    view.rerender(<DatePicker value={new Date(2035, 0, 2, 12)} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('January 2035')).toBeInTheDocument()
  })

  it('names description editing controls and saves their labeled values', async () => {
    const user = userEvent.setup(),
      save = vi.fn()
    render(
      <DescriptionsPlus
        record={{ name: 'Sarah', role: 'designer', active: true }}
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'active', label: 'Active', type: 'switch' },
        ]}
        onSave={save}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByRole('textbox', { name: 'Name' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Nina')
    expect(screen.getByRole('textbox', { name: 'Role' })).toHaveValue('designer')
    await user.click(screen.getByRole('switch', { name: 'Active' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        { name: 'Nina', role: 'designer', active: false },
        expect.any(AbortSignal),
      ),
    )
  })
})
