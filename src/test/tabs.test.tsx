import * as React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { WorkspaceTabs, type TabItem } from '@/components/ui/tabs'

const initialItems: TabItem[] = [
  { value: 'a', label: 'Overview', content: 'Overview content', closable: true },
  { value: 'b', label: 'Activity', content: 'Activity content', closable: true },
  { value: 'c', label: 'Settings', content: 'Settings content', closable: true },
]

function Harness({
  initialValue = 'a',
  items: startingItems = initialItems,
  orientation = 'horizontal',
}: {
  initialValue?: string
  items?: TabItem[]
  orientation?: 'horizontal' | 'vertical'
}) {
  const [items, setItems] = React.useState(startingItems)
  const [value, setValue] = React.useState(initialValue)
  return (
    <WorkspaceTabs
      items={items}
      value={value}
      onItemsChange={setItems}
      onValueChange={setValue}
      orientation={orientation}
    />
  )
}

describe('workspace tabs', () => {
  it('keeps pointer close affordances within their tab without nested interactive controls', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    for (const item of initialItems) {
      const tab = screen.getByRole('tab', { name: String(item.label) })
      const close = within(tab).getByTitle(`Close ${item.label}`)
      expect(tab).toContainElement(close)
      expect(within(tab).queryByRole('button')).not.toBeInTheDocument()
      expect(tab).toHaveAttribute('aria-keyshortcuts', 'Delete')
    }
    await user.click(screen.getByTitle('Close Activity'))
    expect(screen.queryByRole('tab', { name: 'Activity' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Overview content')
  })

  it.each(['a', 'c'])('skips disabled neighbors when closing active tab %s', async (value) => {
    const user = userEvent.setup()
    render(
      <Harness
        initialValue={value}
        items={initialItems.map((item) => ({ ...item, disabled: item.value === 'b' }))}
      />,
    )
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeDisabled()
    await user.click(screen.getByTitle(value === 'a' ? 'Close Overview' : 'Close Settings'))
    const neighbor = screen.getByRole('tab', { name: value === 'a' ? 'Settings' : 'Overview' })
    expect(neighbor).toHaveAttribute('aria-selected', 'true')
    expect(neighbor).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      value === 'a' ? 'Settings content' : 'Overview content',
    )
  })

  it.each(['horizontal', 'vertical'] as const)(
    'preserves %s arrow-key navigation with close controls',
    async (orientation) => {
      const user = userEvent.setup()
      render(<Harness orientation={orientation} />)
      await user.click(screen.getByRole('tab', { name: 'Overview' }))
      await user.keyboard(orientation === 'vertical' ? '{ArrowDown}' : '{ArrowRight}')
      expect(screen.getByRole('tab', { name: 'Activity' })).toHaveFocus()
      expect(screen.getByRole('tabpanel')).toHaveTextContent('Activity content')
    },
  )

  it('keeps close controls associated after reordering', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const data = new Map<string, string>()
    const dataTransfer = {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? '',
    }
    fireEvent.dragStart(screen.getByRole('tab', { name: 'Overview' }).parentElement!, {
      dataTransfer,
    })
    fireEvent.drop(screen.getByRole('tab', { name: 'Settings' }).parentElement!, {
      dataTransfer,
    })
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Activity',
      'Settings',
      'Overview',
    ])
    await user.click(screen.getByTitle('Close Overview'))
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Settings content')
  })

  it('provides a focused empty state after the final tab closes', async () => {
    const user = userEvent.setup()
    render(<Harness items={initialItems.slice(0, 1)} />)
    await user.click(screen.getByTitle('Close Overview'))
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('No open tabs')
    expect(screen.getByRole('status')).toHaveFocus()
  })

  it('omits close controls when changes are not enabled', () => {
    render(<WorkspaceTabs items={initialItems} value="a" onValueChange={() => {}} />)
    expect(screen.queryByTitle(/Close/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('keeps focus in navigation when only disabled tabs remain', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        items={initialItems.slice(0, 2).map((item) => ({ ...item, disabled: item.value === 'b' }))}
      />,
    )
    await user.click(screen.getByTitle('Close Overview'))
    expect(screen.getByRole('tablist')).toHaveFocus()
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeDisabled()
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument()
  })

  it('closes the focused tab with Delete and focuses the next available tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const activity = screen.getByRole('tab', { name: 'Activity' })
    expect(activity).toHaveAccessibleDescription('Press Delete to close a closable tab.')
    await user.click(activity)
    await user.keyboard('{Delete}')
    expect(screen.queryByRole('tab', { name: 'Activity' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveFocus()
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Settings content')
  })
})
