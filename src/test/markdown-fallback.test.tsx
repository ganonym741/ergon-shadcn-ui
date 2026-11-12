import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StreamingMarkdown } from '@/components/ui/streaming-markdown'

vi.mock('marked', () => {
  throw new Error('Parser unavailable')
})

describe('Markdown loading failure', () => {
  it('keeps the escaped answer visible when the lazy parser fails', async () => {
    const content = 'Keep this answer: <img src=x onerror=alert(1)>'
    const view = render(<StreamingMarkdown content={content} />)
    expect(await screen.findByRole('alert')).not.toBeEmptyDOMElement()
    expect(screen.getByText(content)).toBeInTheDocument()
    expect(view.container.querySelector('img')).toBeNull()
  })
})
