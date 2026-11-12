import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  WorkflowEditor,
  validateWorkflow,
  type WorkflowValue,
} from '@/components/ui/workflow-editor'
import { SignaturePad, signatureSVG } from '@/components/ui/signature-pad'
import { NotificationInbox } from '@/components/ui/notification-inbox'
import { Presence } from '@/components/ui/presence'
import {
  UploadPlus,
  type UploadPlusHandle,
  type UploadTransport,
  type UploadQueueItem,
  type UploadPartContext,
  type UploadPartReceipt,
} from '@/components/ui/upload-plus'
import { productURL, useEditorHistory } from '@/components/ui/product-utils'
const deferred = <T,>() => {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const graph: WorkflowValue = {
  nodes: [
    { id: 'a', label: 'Start', x: 0, y: 20 },
    { id: 'b', label: 'Review', x: 300, y: 20 },
  ],
  edges: [],
}
describe('original graph and drawing interactions', () => {
  it('routes allowed self-connections above the node instead of hiding them through its body', () => {
    render(
      <WorkflowEditor
        defaultValue={{
          nodes: [graph.nodes[0]],
          edges: [
            {
              id: 'loop',
              source: 'a',
              target: 'a',
              sourcePort: 'out',
              targetPort: 'in',
              label: 'Repeat',
            },
          ],
        }}
        allowCycles
      />,
    )
    const path = screen
      .getByRole('button', { name: 'Connection Start to Start: Repeat' })
      .getAttribute('d')
    expect(path).toContain(' L')
    expect(path).toContain('-28')
    expect(screen.getByText('Repeat')).toHaveAttribute('y', '-37')
  })
  it('rejects missing ports, duplicate connections and directed cycles', () => {
    const edge = { id: 'ab', source: 'a', sourcePort: 'out', target: 'b', targetPort: 'in' }
    expect(validateWorkflow({ ...graph, edges: [edge] })).toBeUndefined()
    expect(validateWorkflow({ ...graph, edges: [{ ...edge, targetPort: 'missing' }] })).toMatch(
      /missing/,
    )
    expect(validateWorkflow({ ...graph, edges: [edge, { ...edge, id: 'other' }] })).toMatch(
      /Duplicate/,
    )
    const cycle = {
      ...graph,
      edges: [edge, { id: 'ba', source: 'b', sourcePort: 'out', target: 'a', targetPort: 'in' }],
    }
    expect(validateWorkflow(cycle)).toMatch(/cycle/)
    expect(validateWorkflow(cycle, true)).toBeUndefined()
  })
  it('creates a connection using accessible port controls, then undoes and redoes it', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<WorkflowEditor defaultValue={graph} onValueChange={change} />)
    await user.click(screen.getByRole('button', { name: 'Connect from Start, out' }))
    await user.click(screen.getByRole('button', { name: 'Connect to Review, in' }))
    expect(change.mock.lastCall?.[0].edges).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Undo workflow change' }))
    expect(change.mock.lastCall?.[0].edges).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Redo workflow change' }))
    expect(change.mock.lastCall?.[0].edges).toHaveLength(1)
  })
  it('moves a focused node with the keyboard and removes its connected edges', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(
      <WorkflowEditor
        defaultValue={{
          ...graph,
          edges: [{ id: 'ab', source: 'a', sourcePort: 'out', target: 'b', targetPort: 'in' }],
        }}
        onValueChange={change}
      />,
    )
    const node = screen.getByRole('group', { name: 'Step Start' })
    node.focus()
    await user.keyboard('{ArrowRight}')
    expect(change.mock.lastCall?.[0].nodes[0].x).toBe(16)
    await user.keyboard('{Delete}')
    expect(change.mock.lastCall?.[0].nodes.map((node: { id: string }) => node.id)).toEqual(['b'])
    expect(change.mock.lastCall?.[0].edges).toHaveLength(0)
  })
  it('calls a custom node factory once for each added step', async () => {
    const user = userEvent.setup(),
      factory = vi.fn(() => ({ label: 'Custom node', inputs: [] }))
    render(<WorkflowEditor createNode={factory} />)
    await user.click(screen.getByRole('button', { name: 'Add step' }))
    expect(factory).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('group', { name: 'Step Custom node' })).toBeInTheDocument()
  })
  it('keeps workflow mutations unavailable in read-only mode', () => {
    render(<WorkflowEditor defaultValue={graph} readOnly />)
    expect(screen.getByRole('button', { name: 'Add step' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Connect from Start, out' })).toBeDisabled()
  })
  it('exports only numeric coordinates and safe ink colors in signature SVG', () => {
    const svg = signatureSVG(
      [
        {
          id: 'x',
          color: '"/><script>bad()</script>',
          width: Infinity,
          points: [
            { x: -3, y: 5 },
            { x: NaN, y: Infinity },
          ],
        },
      ],
      '" onload="bad()',
      -4,
      Infinity,
    )
    expect(svg).not.toContain('<script>')
    expect(svg).not.toContain('onload=')
    expect(svg).not.toContain('NaN')
    expect(svg).not.toContain('Infinity')
  })
  it('clears and restores signature strokes through accessible controls', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(
      <SignaturePad
        defaultValue={[
          {
            id: 'ink',
            color: '#5579bd',
            width: 3,
            points: [
              { x: 0.1, y: 0.2 },
              { x: 0.2, y: 0.3 },
            ],
          },
        ]}
        onValueChange={change}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(change.mock.lastCall?.[0]).toEqual([])
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(change.mock.lastCall?.[0]).toHaveLength(1)
  })
  it('clears stale undo history after an external controlled replacement', async () => {
    const user = userEvent.setup()
    function Editor({ external }: { external: number }) {
      const h = useEditorHistory({ value: external, defaultValue: 0 })
      return (
        <>
          <button onClick={() => h.commit(2)}>Change</button>
          <button disabled={!h.canUndo} onClick={h.undo}>
            Undo value
          </button>
        </>
      )
    }
    const view = render(<Editor external={1} />)
    await user.click(screen.getByRole('button', { name: 'Change' }))
    expect(screen.getByRole('button', { name: 'Undo value' })).toBeEnabled()
    view.rerender(<Editor external={4} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Undo value' })).toBeDisabled())
  })
})
describe('collaboration data', () => {
  it('keeps remote cursor anchors at the reported edge coordinates', () => {
    const { container } = render(
      <Presence users={[{ id: 'remote', name: 'Remote', cursor: { x: 0.95, y: 0.95 } }]} />,
    )
    const cursor = container.querySelector<HTMLElement>('[data-slot=presence-cursor]')!
    expect(cursor.style.left).toBe('95%')
    expect(cursor.style.top).toBe('95%')
  })
  it('restores an archived notification through its application callback', async () => {
    const user = userEvent.setup(),
      persist = vi.fn(async () => {})
    render(
      <NotificationInbox
        defaultItems={[
          { id: 'a', title: 'Archived update', createdAt: '2026-11-04T09:00:00Z', archived: true },
        ]}
        defaultFilter="archived"
        onAction={persist}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Restore Archived update' }))
    await waitFor(() => expect(screen.queryByText('Archived update')).not.toBeInTheDocument())
    expect(persist.mock.calls[0]).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Archived update')).toBeInTheDocument()
  })
  it('hides offline and stale participants while retaining unknown last-seen values', () => {
    render(
      <Presence
        users={[
          { id: 'online', name: 'Maya', status: 'online' },
          { id: 'old', name: 'Old participant', lastSeen: Date.now() - 60000 },
          { id: 'offline', name: 'Offline participant', status: 'offline' },
        ]}
        staleAfter={1000}
      />,
    )
    expect(screen.queryByText('Old participant')).not.toBeInTheDocument()
    expect(screen.queryByText('Offline participant')).not.toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })
  it('filters unread notifications after a successful persistence callback', async () => {
    const user = userEvent.setup(),
      persist = vi.fn(async () => {})
    render(
      <NotificationInbox
        defaultItems={[{ id: 'a', title: 'Review ready', createdAt: '2026-11-04T09:00:00Z' }]}
        defaultFilter="unread"
        onAction={persist}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Mark Review ready read' }))
    await waitFor(() => expect(persist).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('Review ready')).not.toBeInTheDocument())
  })
  it('rejects executable URLs and accepts app-relative storage locations', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,bad',
      'java\nscript:bad',
      'vbscript:bad',
    ])
      expect(productURL(url)).toBeUndefined()
    expect(productURL('/uploads/photo.png')).toBe('/uploads/photo.png')
    expect(productURL('blob:https://example.test/123', true)).toBeDefined()
  })
})
describe('chunk transport lifecycle', () => {
  const file = () =>
    new File([new Uint8Array(2500)], 'notes.txt', { type: 'text/plain', lastModified: 1 })
  it('uploads ordered chunks and completes with verified receipts', async () => {
    const seen: number[] = [],
      complete = vi.fn(async (_parts: UploadPartReceipt[]) => '/uploads/notes.txt'),
      transport: UploadTransport = {
        uploadPart: async (chunk, c) => {
          seen.push(c.index)
          c.onProgress(chunk.size)
          return { index: c.index, token: `part-${c.index}` }
        },
        complete,
      }
    render(<UploadPlus defaultFiles={[file()]} chunkSize={1024} autoStart transport={transport} />)
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1))
    expect(seen).toEqual([0, 1, 2])
    expect(complete.mock.calls[0][0]).toEqual([
      { index: 0, token: 'part-0' },
      { index: 1, token: 'part-1' },
      { index: 2, token: 'part-2' },
    ])
  })
  it('retains completed chunks and the original chunk size across pause and prop changes', async () => {
    const user = userEvent.setup(),
      pending = deferred<{ index: number; token: string }>(),
      started = vi.fn(),
      complete = vi.fn(async () => {})
    let first = true,
      latest: UploadQueueItem[] = []
    const transport: UploadTransport = {
      uploadPart: async (_chunk, c) => {
        started(c.index, c.chunkSize, c.signal)
        if (c.index === 1 && first) {
          first = false
          return pending.promise
        }
        return { index: c.index, token: `p${c.index}` }
      },
      complete,
    }
    const view = render(
      <UploadPlus
        defaultFiles={[file()]}
        chunkSize={1024}
        autoStart
        transport={transport}
        onQueueChange={(items) => {
          latest = items
        }}
      />,
    )
    await waitFor(() => expect(started).toHaveBeenCalledTimes(2))
    await user.click(screen.getByRole('button', { name: 'Pause notes.txt' }))
    expect(started.mock.calls[1][2].aborted).toBe(true)
    view.rerender(
      <UploadPlus
        chunkSize={2048}
        autoStart
        transport={transport}
        onQueueChange={(items) => {
          latest = items
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Resume notes.txt' }))
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1))
    expect(started.mock.calls.map((call) => call[0])).toEqual([0, 1, 1, 2])
    expect(started.mock.calls.every((call) => call[1] === 1024)).toBe(true)
    await act(async () => pending.resolve({ index: 1, token: 'stale' }))
    expect(latest[0].parts.map((part) => part.token)).toEqual(['p0', 'p1', 'p2'])
  })
  it('retries a failed chunk and rejects invalid service receipts', async () => {
    const upload = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValue({ index: 99, token: 'bad' }),
      complete = vi.fn()
    render(
      <UploadPlus
        defaultFiles={[file()]}
        autoStart
        chunkSize={1024}
        retries={1}
        transport={{ uploadPart: upload, complete }}
      />,
    )
    await waitFor(() => expect(upload).toHaveBeenCalledTimes(2))
    expect(
      await screen.findByText('The upload service returned an invalid chunk receipt.'),
    ).toBeInTheDocument()
    expect(complete).not.toHaveBeenCalled()
  })
  it('aborts transport work on unmount and ignores late completion', async () => {
    const pending = deferred<{ index: number; token: string }>(),
      upload = vi.fn((_chunk: Blob, _context: UploadPartContext) => pending.promise),
      complete = vi.fn()
    const view = render(
      <UploadPlus defaultFiles={[file()]} autoStart transport={{ uploadPart: upload, complete }} />,
    )
    await waitFor(() => expect(upload).toHaveBeenCalled())
    const signal = upload.mock.calls[0][1].signal
    view.unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => pending.resolve({ index: 0, token: 'late' }))
    expect(complete).not.toHaveBeenCalled()
  })
  it('applies file limits even when additions occur in the same event batch', () => {
    const ref = React.createRef<UploadPlusHandle>(),
      reject = vi.fn()
    render(
      <UploadPlus
        ref={ref}
        maxFiles={1}
        onReject={reject}
        transport={{ uploadPart: async (_blob, c) => ({ index: c.index, token: 'ok' }) }}
      />,
    )
    act(() => {
      ref.current!.addFiles([file()])
      ref.current!.addFiles([new File(['other'], 'other.txt')])
    })
    expect(ref.current!.getQueue()).toHaveLength(1)
    expect(reject).toHaveBeenCalledTimes(1)
  })
  it('reports synchronous discard failures instead of throwing from the remove handler', async () => {
    const user = userEvent.setup()
    render(
      <UploadPlus
        defaultFiles={[file()]}
        transport={{
          uploadPart: async (_blob, c) => ({ index: c.index, token: 'ok' }),
          discard: () => {
            throw new Error('Discard service unavailable')
          },
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Remove notes.txt' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Discard service unavailable')
  })
})
