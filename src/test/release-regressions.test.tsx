import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Anchor } from '@/components/ui/anchor'
import { DatePicker, DateRangePicker, MultiDatePicker } from '@/components/ui/date-picker'
import { DescriptionsPlus } from '@/components/ui/descriptions-plus'
import { Mentions } from '@/components/ui/mentions'

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

  it('dismisses mentions with Escape and blur, and reopens after typing', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Mentions options={[{ value: 'sarah', label: 'Sarah Kim' }]} />
        <button>Outside</button>
      </>,
    )
    const field = screen.getByRole('textbox', { name: 'Message' })
    await user.type(field, 'Hello @sa')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await user.keyboard('r')
    expect(screen.getByRole('option', { name: /^Sarah Kim/ })).toBeInTheDocument()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('preserves text after an inserted mention and restores the insertion caret', async () => {
    const user = userEvent.setup()
    render(
      <Mentions defaultValue="Before  after" options={[{ value: 'sarah', label: 'Sarah Kim' }]} />,
    )
    const field = screen.getByRole('textbox', { name: 'Message' })
    await user.click(field)
    await user.keyboard('{Home}{ArrowRight>7/}@sa')
    await user.click(screen.getByRole('option', { name: /^Sarah Kim/ }))
    expect(field).toHaveValue('Before @sarah  after')
    await user.keyboard('now')
    expect(field).toHaveValue('Before @sarah now after')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('cancels a dismissed async mention request and ignores its late result', async () => {
    const user = userEvent.setup()
    const requests: {
      query: string
      signal: AbortSignal
      resolve: (value: { value: string; label: string }[]) => void
    }[] = []
    const load = vi.fn(
      (query: string, signal: AbortSignal) =>
        new Promise<{ value: string; label: string }[]>((resolve) =>
          requests.push({ query, signal, resolve }),
        ),
    )
    render(<Mentions options={[]} loadOptions={load} />)
    await user.type(screen.getByRole('textbox'), '@sa')
    await waitFor(() => expect(requests.some((request) => request.query === 'sa')).toBe(true))
    const request = requests.find((request) => request.query === 'sa')!
    await user.keyboard('{Escape}')
    expect(request.signal.aborted).toBe(true)
    await act(async () => request.resolve([{ value: 'sarah', label: 'Sarah Kim' }]))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('tracks a nested scroller relative to its own top and selects the final section at the bottom', async () => {
    const user = userEvent.setup(),
      changed = vi.fn()
    let container: HTMLDivElement
    const items = [
      {
        href: '#audit-first',
        title: 'First',
        children: [{ href: '#audit-second', title: 'Second' }],
      },
      { href: '#audit-last', title: 'Last' },
    ]
    render(
      <>
        <Anchor items={items} getContainer={() => container} offset={0} onActiveChange={changed} />
        <div
          ref={(node) => {
            if (!node) return
            container = node
            Object.defineProperties(node, {
              clientHeight: { value: 256 },
              scrollHeight: { value: 660 },
            })
            node.getBoundingClientRect = () => new DOMRect(0, 1000, 300, 256)
            node.scrollTo = vi.fn((options: ScrollToOptions | number = {}) => {
              node.scrollTop = Math.min(
                404,
                typeof options === 'number' ? options : (options.top ?? 0),
              )
              fireEvent.scroll(node)
            })
          }}
        >
          {['first', 'second', 'last'].map((key, index) => (
            <section
              key={key}
              id={`audit-${key}`}
              ref={(node) => {
                if (node)
                  node.getBoundingClientRect = () =>
                    new DOMRect(0, 1000 + index * 220 - (container?.scrollTop ?? 0), 300, 220)
              }}
            />
          ))}
        </div>
      </>,
    )
    expect(screen.getByRole('link', { name: 'First' })).toHaveAttribute('aria-current', 'location')
    await user.click(screen.getByRole('link', { name: 'Last' }))
    expect(container!.scrollTop).toBe(404)
    expect(screen.getByRole('link', { name: 'Last' })).toHaveAttribute('aria-current', 'location')
    act(() => {
      container.scrollTop = 220
      fireEvent.scroll(container)
    })
    expect(screen.getByRole('link', { name: 'Second' })).toHaveAttribute('aria-current', 'location')
    expect(document.querySelectorAll('[aria-current="location"]')).toHaveLength(1)
    expect(changed).toHaveBeenLastCalledWith('#audit-second')
  })
})
