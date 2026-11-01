import * as React from 'react'
import { it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ComponentPlayground from '@/playground'
import { ThemeProvider } from '@/components/ui/theme-provider'

afterEach(() => {
  sessionStorage.removeItem('ergonui:preview-motion')
  vi.unstubAllGlobals()
})
function reducedBrowser() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}
const playground = (id: string) => (
  <ThemeProvider defaultTheme="light">
    <ComponentPlayground id={id} />
  </ThemeProvider>
)

it.each(['skeleton', 'skeleton-plus', 'border-beam'])(
  'automatically enables %s preview motion despite the browser preference',
  (id) => {
    reducedBrowser()
    sessionStorage.setItem('ergonui:preview-motion', 'reduced')
    render(playground(id))
    expect(document.querySelector('[data-playground-canvas]')).toHaveAttribute(
      'data-preview-motion',
      'full',
    )
    expect(document.documentElement).not.toHaveAttribute('data-preview-motion')
    expect(document.body).not.toHaveAttribute('data-preview-motion')
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
    expect(screen.queryByRole('button', { name: 'Play animations' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use device setting' })).not.toBeInTheDocument()
  },
)

it.each(['skeleton', 'skeleton-plus'])(
  'keeps the explicit Animate control working for %s',
  async (id) => {
    reducedBrowser()
    render(playground(id))
    const placeholders = () => Array.from(document.querySelectorAll('[data-slot="skeleton"]'))
    expect(placeholders().length).toBeGreaterThan(0)
    expect(placeholders().every((node) => node.getAttribute('data-animation') === 'wave')).toBe(
      true,
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Animate' }))
    expect(placeholders().every((node) => node.getAttribute('data-animation') === 'none')).toBe(
      true,
    )
    expect(document.querySelector('[data-playground-canvas]')).toHaveAttribute(
      'data-preview-motion',
      'full',
    )
  },
)
