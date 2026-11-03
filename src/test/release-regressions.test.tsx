import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DatePicker, DateRangePicker, MultiDatePicker } from '@/components/ui/date-picker'

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
})
