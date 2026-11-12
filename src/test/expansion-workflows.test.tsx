import * as React from 'react'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigProvider } from '@/components/ui/config-provider'
import { describe, it, expect, vi } from 'vitest'
import {
  Kanban,
  moveKanbanCard,
  validateKanban,
  type KanbanColumnData,
} from '@/components/ui/kanban'
import {
  FileBrowser,
  canMoveFileEntries,
  validateFileEntries,
  formatFileSize,
  type FileBrowserEntry,
} from '@/components/ui/file-browser'
import {
  OrganizationChart,
  validateOrganization,
  type OrganizationNode,
} from '@/components/ui/organization-chart'
import {
  CommandPalette,
  CommandPaletteTrigger,
  CommandPaletteContent,
  type PaletteAction,
} from '@/components/ui/command-palette'

const board: KanbanColumnData[] = [
  {
    id: 'todo',
    title: 'To do',
    cards: [
      { id: 'a', title: 'Alpha' },
      { id: 'b', title: 'Bravo' },
    ],
  },
  { id: 'done', title: 'Done', limit: 1, cards: [] },
]
describe('kanban workflows', () => {
  it('moves columns in the displayed physical direction in RTL and respects explicit direction', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    const { rerender } = render(
      <ConfigProvider direction="rtl">
        <Kanban defaultValue={board} onColumnReorder={change} />
      </ConfigProvider>,
    )
    expect(screen.getByRole('button', { name: 'Move To do column right' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Move To do column left' }))
    expect(change).toHaveBeenLastCalledWith(['done', 'todo'])
    await user.click(screen.getByRole('button', { name: 'Move To do column right' }))
    expect(change).toHaveBeenLastCalledWith(['todo', 'done'])
    rerender(
      <ConfigProvider direction="rtl">
        <Kanban dir="ltr" defaultValue={board} onColumnReorder={change} />
      </ConfigProvider>,
    )
    expect(screen.getByRole('button', { name: 'Move To do column left' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Move To do column right' }))
    expect(change).toHaveBeenLastCalledWith(['done', 'todo'])
  })
  it('moves immutably into an empty column and enforces capacity and disabled cards', () => {
    const result = moveKanbanCard(board, 'a', 'done', 0)!
    expect(result.move).toMatchObject({ fromIndex: 0, toIndex: 0, toColumnId: 'done' })
    expect(result.columns[1].cards[0].id).toBe('a')
    expect(board[0].cards).toHaveLength(2)
    expect(moveKanbanCard(result.columns, 'b', 'done', 0)).toBeUndefined()
    expect(
      moveKanbanCard(
        [{ ...board[0], cards: [{ id: 'a', title: 'A', disabled: true }] }, board[1]],
        'a',
        'done',
        0,
      ),
    ).toBeUndefined()
  })
  it('detects duplicate IDs and invalid capacities', () => {
    expect(validateKanban([board[0], { ...board[1], cards: [board[0].cards[0]] }])).toContain(
      'unique',
    )
    expect(validateKanban([{ ...board[0], limit: NaN }])).toContain('limits')
  })
  it('moves into an empty column through its keyboard-accessible form', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<Kanban defaultValue={board} onCardMove={change} />)
    await user.click(screen.getByRole('button', { name: 'Move Alpha' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Column' }), 'done')
    await user.click(screen.getByRole('button', { name: 'Move card' }))
    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ cardId: 'a', toColumnId: 'done' }),
    )
    expect(within(screen.getByLabelText('Done cards')).getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('reorders columns and hides editing in read-only mode', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    const { rerender } = render(<Kanban defaultValue={board} onColumnReorder={change} />)
    await user.click(screen.getByRole('button', { name: 'Move To do column right' }))
    expect(change).toHaveBeenCalledWith(['done', 'todo'])
    rerender(<Kanban defaultValue={board} readOnly />)
    expect(screen.queryByRole('button', { name: 'Move Alpha' })).not.toBeInTheDocument()
  })
})
const files: FileBrowserEntry[] = [
  { id: 'docs', name: 'Documents', kind: 'folder' },
  { id: 'archive', parentId: 'docs', name: 'Archive', kind: 'folder' },
  { id: 'readme', parentId: 'docs', name: 'Readme.md', kind: 'file', size: 0 },
  { id: 'photo', name: 'Photo.png', kind: 'file', size: 1024 },
  { id: 'notes', name: 'Notes.txt', kind: 'file', size: 12 },
]
describe('file browser workflows', () => {
  it('rejects file drops without navigating away when uploads are disabled', () => {
    const upload = vi.fn()
    const { container } = render(<FileBrowser entries={files} disabled onUpload={upload} />)
    const browser = container.querySelector('[data-slot="file-browser"]')!,
      dataTransfer = {
        types: ['Files'],
        files: [new File(['a'], 'a.txt', { type: 'text/plain' })],
        dropEffect: 'copy',
      }
    expect(fireEvent.dragOver(browser, { dataTransfer })).toBe(false)
    expect(dataTransfer.dropEffect).toBe('none')
    expect(fireEvent.drop(browser, { dataTransfer })).toBe(false)
    expect(upload).not.toHaveBeenCalled()
  })
  it('rejects invalid folder graphs and descendant moves and formats zero/fractional sizes', () => {
    expect(
      validateFileEntries([
        { id: 'a', parentId: 'b', name: 'A', kind: 'folder' },
        { id: 'b', parentId: 'a', name: 'B', kind: 'folder' },
      ]),
    ).toContain('cycles')
    expect(
      validateFileEntries([{ id: 'a', parentId: 'missing', name: 'A', kind: 'file' }]),
    ).toContain('parent')
    expect(canMoveFileEntries(files, ['docs'], 'archive')).toBe(false)
    expect(canMoveFileEntries(files, ['photo'], 'archive')).toBe(true)
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(0.5)).toMatch(/^0[.,]5 B$/)
    expect(formatFileSize(Infinity)).toBe('—')
  })
  it('navigates folders, shows zero-byte files and returns through breadcrumbs', async () => {
    const user = userEvent.setup()
    render(<FileBrowser entries={files} />)
    await user.click(screen.getByRole('button', { name: 'Open Documents' }))
    expect(screen.getByRole('button', { name: 'Open Readme.md' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open Archive' }))
    expect(screen.getByText('This folder is empty.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Files' }))
    expect(screen.getByRole('button', { name: 'Open Photo.png' })).toBeInTheDocument()
  })
  it('keeps selection keyed by IDs through sorting and real grid/list switches', async () => {
    const user = userEvent.setup(),
      selection = vi.fn()
    render(<FileBrowser entries={files} onSelectionChange={selection} />)
    await user.click(screen.getByRole('checkbox', { name: 'Select Photo.png' }))
    await user.click(screen.getByRole('button', { name: 'Sort descending' }))
    expect(screen.getByRole('checkbox', { name: 'Select Photo.png' })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'List view' }))
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(selection).toHaveBeenLastCalledWith(['photo'])
  })
  it('filters, paginates and opens details', async () => {
    const user = userEvent.setup()
    render(<FileBrowser entries={files} pageSize={1} />)
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search files' }), 'Photo')
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Details for Photo.png' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('1 KiB')
  })
  it('dispatches create/rename callbacks and displays application updates', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [entries, setEntries] = React.useState(files)
      return (
        <FileBrowser
          entries={entries}
          onCreateFolder={(name, parentId) =>
            setEntries((old) => [...old, { id: 'new-folder', name, parentId, kind: 'folder' }])
          }
          onRename={(entry, name) =>
            setEntries((old) =>
              old.map((item) => (item.id === entry.id ? { ...item, name } : item)),
            )
          }
        />
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'New folder' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Research')
    await user.click(screen.getByRole('button', { name: 'Create folder' }))
    expect(screen.getByRole('button', { name: 'Open Research' })).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Select Research' }))
    await user.click(screen.getByRole('button', { name: 'Rename selected item' }))
    await user.clear(screen.getByRole('textbox', { name: 'Name' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Discovery')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Open Discovery' })).toBeInTheDocument()
  })
  it('keeps cancellation reachable inside the active modal', async () => {
    const user = userEvent.setup()
    let signal: AbortSignal | undefined, finish: (() => void) | undefined
    const create = vi.fn(
      (_name: string, _parent: string | null, context: { signal: AbortSignal }) => {
        signal = context.signal
        return new Promise<void>((resolve) => {
          finish = resolve
        })
      },
    )
    render(<FileBrowser entries={files} onCreateFolder={create} />)
    await user.click(screen.getByRole('button', { name: 'New folder' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Pending')
    await user.click(screen.getByRole('button', { name: 'Create folder' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel operation' }),
    )
    expect(signal?.aborted).toBe(true)
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeDisabled()
    await act(async () => finish?.())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'completed after cancellation was requested',
    )
  })
  it('announces callback failures in the dialog and permits retry', async () => {
    const user = userEvent.setup()
    render(
      <FileBrowser
        entries={files}
        onCreateFolder={async () => {
          throw new Error('Storage unavailable')
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'New folder' }))
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Retry')
    await user.click(screen.getByRole('button', { name: 'Create folder' }))
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(
      'Storage unavailable',
    )
    expect(screen.getByRole('button', { name: 'Create folder' })).toBeEnabled()
  })
})
const people: OrganizationNode[] = [
  { id: 'lead', name: 'Maya', role: 'Lead' },
  { id: 'engineer', parentId: 'lead', name: 'Rio', role: 'Engineer' },
  { id: 'designer', parentId: 'lead', name: 'Ava', role: 'Designer' },
]
describe('organization chart workflows', () => {
  it('rejects cycles, duplicate IDs and missing parents', () => {
    expect(validateOrganization([{ ...people[0], parentId: 'engineer' }, people[1]])).toContain(
      'cycles',
    )
    expect(validateOrganization([people[0], people[0]])).toContain('unique')
    expect(validateOrganization([people[1]])).toContain('Unknown parent')
  })
  it('navigates/selects the tree and links child groups through ARIA ownership', async () => {
    const user = userEvent.setup(),
      select = vi.fn()
    render(<OrganizationChart nodes={people} fitOnMount={false} onSelectionChange={select} />)
    const root = screen.getByRole('treeitem', { name: /Maya/ })
    expect(document.getElementById(root.getAttribute('aria-owns')!)).toHaveAttribute(
      'role',
      'group',
    )
    root.focus()
    await user.keyboard('{ArrowDown}{Enter}')
    expect(select).toHaveBeenLastCalledWith('engineer')
    await user.keyboard('{ArrowLeft}')
    expect(root).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(root).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('treeitem', { name: /Rio/ })).not.toBeInTheDocument()
  })
  it('retains a tabbable root when a descendant is hidden', async () => {
    const user = userEvent.setup()
    render(<OrganizationChart nodes={people} fitOnMount={false} />)
    screen.getByRole('treeitem', { name: /Rio/ }).focus()
    await user.click(screen.getByRole('button', { name: 'Collapse all' }))
    await waitFor(() =>
      expect(screen.getByRole('treeitem', { name: /Maya/ })).toHaveAttribute('tabindex', '0'),
    )
  })
  it('pans/zooms by keyboard and disables editing controls', async () => {
    const user = userEvent.setup(),
      pan = vi.fn(),
      zoom = vi.fn()
    const { rerender } = render(
      <OrganizationChart nodes={people} fitOnMount={false} onPanChange={pan} onZoomChange={zoom} />,
    )
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(zoom).toHaveBeenCalledWith(1.1)
    screen.getByRole('region', { name: 'Organization chart canvas' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(pan).toHaveBeenLastCalledWith(expect.objectContaining({ x: -40 }))
    rerender(<OrganizationChart nodes={people} disabled fitOnMount={false} />)
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
  })
})
const commands: PaletteAction[] = [
  { id: 'overview', label: 'Overview', group: 'Pages' },
  { id: 'settings', label: 'Settings', children: [{ id: 'appearance', label: 'Appearance' }] },
]
describe('command palette workflows', () => {
  it('handles its shortcut inside its own search input and consumes the event before app shortcuts', async () => {
    const user = userEvent.setup(),
      outer = vi.fn((event: KeyboardEvent) => event.defaultPrevented)
    render(<CommandPalette actions={commands} />)
    window.addEventListener('keydown', outer)
    try {
      await user.click(screen.getByRole('button', { name: /Search commands/ }))
      fireEvent.keyDown(screen.getByRole('combobox', { name: 'Search commands' }), {
        key: 'k',
        ctrlKey: true,
      })
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(outer).toHaveLastReturnedWith(true)
    } finally {
      window.removeEventListener('keydown', outer)
    }
  })
  it('navigates nested actions with Escape and restores trigger focus', async () => {
    const user = userEvent.setup(),
      selected = vi.fn()
    render(<CommandPalette actions={commands} onAction={selected} />)
    const trigger = screen.getByRole('button', { name: /Search commands/ })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'Settings' }))
    expect(screen.getByRole('option', { name: 'Appearance' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: 'Overview' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(selected).toHaveBeenCalledWith(expect.objectContaining({ id: 'overview' }))
    expect(trigger).toHaveFocus()
  })
  it('opens by shortcut without intercepting text fields', async () => {
    const user = userEvent.setup()
    render(
      <>
        <input aria-label="Other input" />
        <CommandPalette actions={commands} />
      </>,
    )
    await user.click(screen.getByRole('textbox', { name: 'Other input' }))
    await user.keyboard('{Control>}k{/Control}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('cancels old search on query changes with custom composition', async () => {
    const user = userEvent.setup()
    let signal: AbortSignal | undefined, finish: ((items: PaletteAction[]) => void) | undefined
    const load = vi.fn((_query: string, context: { signal: AbortSignal }) => {
      signal = context.signal
      return new Promise<PaletteAction[]>((resolve) => {
        finish = resolve
      })
    })
    render(
      <CommandPalette actions={[]} loadActions={load}>
        <CommandPaletteTrigger />
        <CommandPaletteContent />
      </CommandPalette>,
    )
    await user.click(screen.getByRole('button', { name: /Search commands/ }))
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
    fireEvent.change(screen.getByRole('combobox', { name: 'Search commands' }), {
      target: { value: 'new' },
    })
    expect(signal?.aborted).toBe(true)
    await act(async () => finish?.([{ id: 'old', label: 'Old result' }]))
    expect(screen.queryByRole('option', { name: 'Old result' })).not.toBeInTheDocument()
  })
  it('disables commands during pending actions and aborts on close', async () => {
    const user = userEvent.setup()
    let signal: AbortSignal | undefined
    render(
      <CommandPalette
        actions={[
          {
            id: 'slow',
            label: 'Slow action',
            onSelect: ({ signal: s }) => {
              signal = s
              return new Promise(() => {})
            },
          },
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Search commands/ }))
    await user.click(screen.getByRole('option', { name: 'Slow action' }))
    expect(screen.getByText('Running command…')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Slow action' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await user.keyboard('{Escape}')
    await waitFor(() => expect(signal?.aborted).toBe(true))
  })
})
