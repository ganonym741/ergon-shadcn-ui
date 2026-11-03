import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from '@/components/ui/date-picker'

// Retain the calendar across close/reopen, as it remains mounted during an exit animation.
vi.mock('@/components/ui/popover', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/popover')>()
  return {
    ...actual,
    PopoverContent: (props: React.ComponentProps<typeof actual.PopoverContent>) => (
      <actual.PopoverContent {...props} forceMount />
    ),
  }
})

describe('date picker retained calendar', () => {
  it('resets a navigated month even when reopening before the content unmounts', async () => {
    const user = userEvent.setup()
    render(<DatePicker value={new Date(2034, 2, 14, 12)} />)
    const trigger = screen.getByRole('button', { name: 'Mar 14, 2034' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: /next month/i }))
    expect(screen.getByText('April 2034')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(trigger)
    expect(screen.getByText('March 2034')).toBeInTheDocument()
  })

  it('follows an externally changed date while the calendar is open', async () => {
    const user = userEvent.setup()
    const view = render(<DatePicker value={new Date(2034, 2, 14, 12)} />)
    await user.click(screen.getByRole('button', { name: 'Mar 14, 2034' }))
    view.rerender(<DatePicker value={new Date(2035, 0, 2, 12)} />)
    expect(screen.getByText('January 2035')).toBeInTheDocument()
  })
})
