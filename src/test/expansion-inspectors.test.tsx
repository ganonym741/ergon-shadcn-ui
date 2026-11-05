import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { JsonViewer, formatJsonPath, stringifyJsonValue } from '@/components/ui/json-viewer'
import { CodeBlock } from '@/components/ui/code-block'
import { highlightCode } from '@/components/ui/code-highlighter'
import { DiffViewer, createDiffRows } from '@/components/ui/diff-viewer'
import { diffLines } from 'diff'

describe('JSON viewer', () => {
  it('copies bounded extended values without invoking getters', () => {
    const getter = vi.fn(() => {
      throw new Error('Do not evaluate')
    })
    const value: { count: bigint; self?: unknown; secret?: unknown } = { count: 12n }
    value.self = value
    Object.defineProperty(value, 'secret', { enumerable: true, get: getter })
    expect(stringifyJsonValue(value)).toContain('"12n"')
    expect(stringifyJsonValue(value)).toContain('[Circular]')
    expect(stringifyJsonValue(value)).toContain('[Getter]')
    expect(getter).not.toHaveBeenCalled()
    expect(formatJsonPath(['a.b', 'quote"', 0])).toBe('$["a.b"]["quote\\""][0]')
  })
  it('gives colliding Map keys distinct indexed paths', async () => {
    const user = userEvent.setup(),
      copy = vi.fn()
    render(
      <JsonViewer
        value={
          new Map<unknown, unknown>([
            [1, 'numeric'],
            ['1', 'string'],
          ])
        }
        defaultExpandDepth={4}
        onCopy={copy}
      />,
    )
    await user.click(screen.getAllByRole('button', { name: 'Copy path for 1' })[0])
    expect(copy).toHaveBeenCalledWith(
      expect.stringMatching(/^\$\[\d\]\[1\]$/),
      'path',
      expect.any(Array),
    )
    expect(
      screen
        .getAllByRole('treeitem')
        .map((node) => node.getAttribute('data-json-node'))
        .filter(Boolean),
    ).toEqual(expect.arrayContaining(['$[0][0]', '$[1][0]']))
  })
  it('searches collapsed descendants and restores a tabbable root after collapse', async () => {
    const user = userEvent.setup()
    render(
      <JsonViewer
        value={{ account: { name: 'Needle', active: true }, other: 'Elsewhere' }}
        defaultExpandDepth={0}
      />,
    )
    await user.type(screen.getByRole('searchbox', { name: 'Search JSON' }), 'Needle')
    expect(screen.getByRole('treeitem', { name: 'name: "Needle"' })).toBeInTheDocument()
    await user.clear(screen.getByRole('searchbox', { name: 'Search JSON' }))
    await user.click(screen.getByRole('button', { name: 'Expand all JSON nodes' }))
    const child = screen.getByRole('treeitem', { name: 'name: "Needle"' })
    fireEvent.focus(child)
    await user.click(screen.getByRole('button', { name: 'Collapse all JSON nodes' }))
    expect(screen.getByRole('treeitem')).toHaveAttribute('tabindex', '0')
  })
  it('paginates children, caps inspection and announces empty searches', async () => {
    const user = userEvent.setup()
    render(<JsonViewer value={[1, 2, 3, 4, 5]} pageSize={2} maxNodes={5} />)
    expect(screen.getByRole('button', { name: 'Show 2 more items' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show 2 more items' }))
    expect(screen.getByRole('treeitem', { name: '3: 4' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('5 nodes')
    await user.type(screen.getByRole('searchbox', { name: 'Search JSON' }), 'missing')
    expect(screen.queryByRole('tree')).not.toBeInTheDocument()
    expect(screen.getByText('No matching keys or values.')).toBeInTheDocument()
  })
  it('supports arrow-key expansion and parent navigation', async () => {
    const user = userEvent.setup()
    render(<JsonViewer value={{ child: { value: 1 } }} defaultExpandDepth={0} />)
    const root = screen.getByRole('treeitem')
    root.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('treeitem', { name: 'child: {1 keys}' })).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(root).toHaveFocus()
  })
})
describe('code block', () => {
  it('escapes hostile source and excludes line numbers from copied text', async () => {
    const user = userEvent.setup(),
      copy = vi.fn(),
      code = '<img src=x onerror=alert(1)>\nconst n = 0'
    const { container } = render(
      <CodeBlock code={code} startLine={10} highlightedLines={[11]} onCopy={copy} />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(container.querySelector('[data-line="11"]')).toHaveClass('bg-primary/10')
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(copy).toHaveBeenCalledWith(code)
    await user.click(screen.getByRole('button', { name: 'Wrap code' }))
    expect(screen.getByRole('button', { name: 'Wrap code' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
  it('loads the actual grammar-specific JavaScript engine and preserves token text', async () => {
    const code = 'export const count: number = 0'
    const tokens = await highlightCode(code, 'typescript')
    expect(
      tokens
        .flat()
        .map((token) => token.content)
        .join(''),
    ).toBe(code)
    expect(
      tokens.flat().some((token) => !!token.variants.light.color && !!token.variants.dark.color),
    ).toBe(true)
  })
  it('shows a plain-text fallback when highlighting exceeds its bound', async () => {
    render(
      <CodeBlock code="const longContent = true" language="typescript" maxHighlightLength={5} />,
    )
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('skipped'))
    expect(screen.getByText('const longContent = true')).toBeInTheDocument()
  })
})
describe('diff viewer', () => {
  it('makes a trailing-newline-only change visible', async () => {
    render(<DiffViewer before={'same\n'} after="same" />)
    expect(await screen.findByText('No newline at end of file')).toBeInTheDocument()
  })
  it('aligns replacements and preserves blank-line line numbers', () => {
    const rows = createDiffRows(diffLines('one\n\nold\n', 'one\n\nnew\nextra\n'))
    expect(rows[1]).toMatchObject({
      oldLine: 2,
      newLine: 2,
      oldText: '',
      newText: '',
      kind: 'equal',
    })
    expect(rows[2]).toMatchObject({
      oldLine: 3,
      newLine: 3,
      oldText: 'old',
      newText: 'new',
      kind: 'change',
    })
    expect(rows[3]).toMatchObject({ newLine: 4, newText: 'extra', kind: 'add' })
  })
  it('switches layouts and expands unchanged runs', async () => {
    const user = userEvent.setup()
    render(<DiffViewer before={'a\nb\nc\nd\nold\n'} after={'a\nb\nc\nd\nnew\n'} contextLines={1} />)
    await screen.findByRole('button', { name: 'Show 3 unchanged lines' })
    await user.click(screen.getByRole('button', { name: 'Show 3 unchanged lines' }))
    expect(screen.getAllByText('a')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Inline' }))
    expect(screen.getByRole('button', { name: 'Inline' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Removed')).toBeInTheDocument()
    expect(screen.getByLabelText('Added')).toBeInTheDocument()
  })
  it('reports oversized comparisons instead of producing an inaccurate result', async () => {
    render(<DiffViewer before="abcdef" after="uvwxyz" maxCharacters={5} />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('exceeds'))
    expect(screen.queryByText('abcdef')).not.toBeInTheDocument()
  })
  it('copies the requested side and honors whitespace comparison changes', async () => {
    const user = userEvent.setup(),
      copy = vi.fn()
    render(<DiffViewer before={'a\n'} after={'  a\n'} ignoreWhitespace onCopy={copy} />)
    await waitFor(() => expect(screen.queryByText('Comparing text…')).not.toBeInTheDocument())
    expect(screen.getByText(/No changes/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Copy after' }))
    expect(copy).toHaveBeenCalledWith('  a\n', 'after')
  })
})
