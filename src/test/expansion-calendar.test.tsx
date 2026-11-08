import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CalendarPlus } from '@/components/ui/calendar-plus'
import { ConfigProvider } from '@/components/ui/config-provider'
describe('Calendar+ scheduler', () => {
  it('inherits RTL in the scheduler and retains navigation when direction changes', async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(
      <ConfigProvider direction="rtl">
        <CalendarPlus defaultDate="2026-11-03" />
      </ConfigProvider>,
    )
    expect(container.querySelector('.fc-direction-rtl')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next period' }))
    expect(screen.getByRole('heading', { name: 'December 2026' })).toBeInTheDocument()
    rerender(
      <ConfigProvider direction="ltr">
        <CalendarPlus defaultDate="2026-11-03" />
      </ConfigProvider>,
    )
    expect(container.querySelector('.fc-direction-ltr')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Previous period' }))
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeInTheDocument()
  })
  it('edits UTC-sourced events in local display time and infers all-day date-only events', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <CalendarPlus
        defaultDate="2026-11-03"
        defaultEvents={[
          {
            id: 'utc',
            title: 'UTC meeting',
            start: '2026-11-03T10:00:00Z',
            end: '2026-11-03T11:00:00Z',
          },
        ]}
        editable
      />,
    )
    await user.click(screen.getByText('UTC meeting'))
    const date = new Date('2026-11-03T10:00:00Z'),
      expected = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    expect(screen.getByLabelText('Start')).toHaveValue(expected)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    rerender(
      <CalendarPlus
        defaultDate="2026-11-03"
        events={[{ id: 'all-day', title: 'All-day review', start: '2026-11-03' }]}
        editable
      />,
    )
    await user.click(screen.getByText('All-day review'))
    expect(screen.getByRole('checkbox', { name: 'All-day event' })).toBeChecked()
    expect(screen.getByLabelText('Start')).toHaveAttribute('type', 'date')
  })
  it('keeps its actual initial date and switches between real scheduler views', async () => {
    const user = userEvent.setup(),
      date = vi.fn(),
      view = vi.fn()
    render(<CalendarPlus defaultDate="2026-11-03" onDateChange={date} onViewChange={view} />)
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeInTheDocument()
    expect(date).not.toHaveBeenCalledWith('2026-11-01')
    await user.click(screen.getByRole('button', { name: 'Week' }))
    expect(view).toHaveBeenLastCalledWith('week')
    expect(document.querySelector('.fc-timeGridWeek-view')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agenda' }))
    expect(document.querySelector('.fc-listWeek-view')).toBeInTheDocument()
  })
  it('creates an all-day event with an exclusive API end and inclusive editor last day', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<CalendarPlus defaultDate="2026-11-03" editable onEventsChange={change} />)
    await user.click(screen.getByRole('button', { name: 'New event' }))
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Launch')
    expect(screen.getByLabelText('Start')).toHaveValue('2026-11-03')
    expect(screen.getByLabelText('Last day')).toHaveValue('2026-11-03')
    fireEvent.change(screen.getByLabelText('Last day'), { target: { value: '2026-11-05' } })
    await user.click(screen.getByRole('button', { name: 'Create event' }))
    expect(change).toHaveBeenLastCalledWith([
      expect.objectContaining({
        title: 'Launch',
        start: '2026-11-03',
        end: '2026-11-06',
        allDay: true,
      }),
    ])
    expect(screen.getByText('Launch')).toBeInTheDocument()
  })
  it('edits and deletes existing events and emits typed change kinds', async () => {
    const user = userEvent.setup(),
      edit = vi.fn()
    render(
      <CalendarPlus
        defaultDate="2026-11-03"
        editable
        defaultEvents={[
          { id: 'event', title: 'Review', start: '2026-11-03', end: '2026-11-04', allDay: true },
        ]}
        onEventEdit={edit}
      />,
    )
    await user.click(screen.getByText('Review'))
    await user.clear(screen.getByRole('textbox', { name: 'Title' }))
    await user.type(screen.getByRole('textbox', { name: 'Title' }), 'Team review')
    await user.click(screen.getByRole('button', { name: 'Save event' }))
    expect(edit).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'event', title: 'Team review' }),
      'edit',
    )
    await user.click(screen.getByText('Team review'))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(edit).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'event' }), 'delete')
    expect(screen.queryByText('Team review')).not.toBeInTheDocument()
  })
  it('makes read-only details available without editing and rejects invalid event data', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <CalendarPlus
        defaultDate="2026-11-03"
        defaultEvents={[{ id: 'event', title: 'Review', start: '2026-11-03' }]}
      />,
    )
    await user.click(screen.getByText('Review'))
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute('readonly')
    expect(screen.queryByRole('button', { name: 'Save event' })).not.toBeInTheDocument()
    await user.click(screen.getByText('Close', { selector: 'button' }))
    rerender(<CalendarPlus events={[{ id: 'event', title: 'Invalid', start: '2026-02-30' }]} />)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('valid dates'))
  })
})
