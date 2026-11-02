import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlaygroundPreview } from '@/playground/preview'
import { defaultConfig, playgrounds } from '@/playground/schema'
describe('loading playground behavior', () => {
  it('starts loading with the demo button when the initial loading control is off', async () => {
    render(
      <PlaygroundPreview
        id="spin"
        config={{ ...defaultConfig('spin'), loading: false, delay: 0, minimum: 0 }}
        onEvent={vi.fn()}
      />,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Toggle loading' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Preparing your workspace')
    expect(screen.getByRole('button', { name: 'Toggle loading' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Toggle loading' }))
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  })
  it.each(['Default', 'Showcase'])('shows the spinner in the %s preset', async (name) => {
    const preset = playgrounds.spin.presets.find((preset) => preset.name === name)!
    render(<PlaygroundPreview id="spin" config={preset.values} onEvent={vi.fn()} />)
    expect(await screen.findByRole('status')).toHaveTextContent('Preparing your workspace')
  })
})
