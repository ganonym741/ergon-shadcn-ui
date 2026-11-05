import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Anchor } from '@/components/ui/anchor'

it('keeps the committed callback when a replacement render suspends', async () => {
  const committed = vi.fn(),
    speculative = vi.fn(),
    attempted = vi.fn()
  const pending = new Promise<void>(() => {})
  let container: HTMLDivElement
  function Suspend({ active }: { active: boolean }) {
    if (active) {
      attempted()
      throw pending
    }
    return null
  }
  function Fixture() {
    const [active, setActive] = React.useState(false)
    return (
      <>
        <button onClick={() => React.startTransition(() => setActive(true))}>
          Start suspended render
        </button>
        <React.Suspense fallback="Loading">
          <Anchor
            offset={0}
            getContainer={() => container}
            onActiveChange={active ? speculative : committed}
            items={[
              { href: '#callback-first', title: 'First' },
              { href: '#callback-last', title: 'Last' },
            ]}
          />
          <Suspend active={active} />
        </React.Suspense>
        <div
          ref={(node) => {
            if (!node) return
            container = node
            node.getBoundingClientRect = () => new DOMRect(0, 0, 300, 100)
            Object.defineProperties(node, {
              clientHeight: { value: 100 },
              scrollHeight: { value: 1000 },
            })
          }}
        >
          {['first', 'last'].map((key, i) => (
            <section
              key={key}
              id={`callback-${key}`}
              ref={(node) => {
                if (node)
                  node.getBoundingClientRect = () =>
                    new DOMRect(0, i * 200 - container.scrollTop, 300, 200)
              }}
            />
          ))}
        </div>
      </>
    )
  }
  const user = userEvent.setup()
  render(<Fixture />)
  await user.click(screen.getByRole('button', { name: 'Start suspended render' }))
  await waitFor(() => expect(attempted).toHaveBeenCalled())
  committed.mockClear()
  container!.scrollTop = 200
  fireEvent.scroll(container!)
  expect(committed).toHaveBeenCalledWith('#callback-last')
  expect(speculative).not.toHaveBeenCalled()
})
