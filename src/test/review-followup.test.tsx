import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationSettings } from '@/components/ui/generation-settings'
import { ModelComparison } from '@/components/ui/model-comparison'
import { ApprovalRequest, type ApprovalRequestData } from '@/components/ui/approval-request'
import { ToolCall, type ToolCallData } from '@/components/ui/tool-call'
import { ArtifactPanel } from '@/components/ui/artifact-panel'
import { AgentRunTrace } from '@/components/ui/agent-run-trace'
import {
  ConversationHistory,
  type ConversationHistoryItem,
} from '@/components/ui/conversation-history'
import { PhoneInput } from '@/components/ui/phone-input'
import { TagsInput } from '@/components/ui/tags-input'
import {
  SignaturePad,
  SignaturePadCanvas,
  signatureSVG,
  type SignatureStroke,
} from '@/components/ui/signature-pad'
import { WorkflowEditor, type WorkflowValue } from '@/components/ui/workflow-editor'
import { UploadPlus, type UploadQueueItem } from '@/components/ui/upload-plus'
import {
  canMoveFileEntries,
  FileBrowser,
  type FileBrowserEntry,
} from '@/components/ui/file-browser'
import { matchesFilter, type FilterGroup } from '@/components/ui/filter-builder'
import { ContextUsage } from '@/components/ui/context-usage'
import { PromptComposer } from '@/components/ui/prompt-composer'
import { productId } from '@/components/ui/product-utils'
import { ConfigProvider } from '@/components/ui/config-provider'
import { NotificationInbox } from '@/components/ui/notification-inbox'

const deferred = <T,>() => {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
const model = {
  id: 'one',
  name: 'One',
  provider: 'Test',
  parameters: { temperature: { min: 0, max: 2 }, topP: true, stop: true },
}

describe('follow-up review behavior', () => {
  it('composes drop handlers and honors a consumer-prevented drop', () => {
    const drop = vi.fn((event: React.DragEvent) => event.preventDefault()),
      over = vi.fn(),
      upload = vi.fn()
    const view = render(
      <PromptComposer
        onSubmit={vi.fn()}
        onDrop={drop}
        onDragOver={over}
        onAttachmentUpload={upload}
      />,
    )
    const root = view.container.querySelector('[data-slot=prompt-composer]')!
    fireEvent.dragOver(root)
    fireEvent.drop(root, { dataTransfer: { files: [new File(['x'], 'file.txt')] } })
    expect(drop).toHaveBeenCalledTimes(1)
    expect(over).toHaveBeenCalledTimes(1)
    expect(upload).not.toHaveBeenCalled()
  })

  it('cancels an active signature when locked and preserves original pointer ownership', () => {
    class Pointer extends MouseEvent {
      pointerId: number
      constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
        super(type, init)
        this.pointerId = init.pointerId ?? 0
      }
    }
    vi.stubGlobal('PointerEvent', Pointer)
    const change = vi.fn()
    const view = render(
      <SignaturePad onValueChange={change}>
        <SignaturePadCanvas />
      </SignaturePad>,
    )
    const surface = screen.getByRole('img', { name: 'Signature drawing surface' })
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 500,
      height: 200,
      right: 500,
      bottom: 200,
      toJSON: () => {},
    })
    fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: 10, clientY: 20 })
    fireEvent.pointerDown(surface, { pointerId: 2, button: 0, clientX: 30, clientY: 20 })
    fireEvent.pointerCancel(surface, { pointerId: 2 })
    fireEvent.pointerUp(surface, { pointerId: 1 })
    expect(change).toHaveBeenCalledTimes(1)
    fireEvent.pointerDown(surface, { pointerId: 3, button: 0, clientX: 20, clientY: 20 })
    view.rerender(
      <SignaturePad disabled onValueChange={change}>
        <SignaturePadCanvas />
      </SignaturePad>,
    )
    fireEvent.pointerUp(surface, { pointerId: 3 })
    expect(change).toHaveBeenCalledTimes(1)
    expect(surface).toHaveAttribute('data-empty', 'false')
    expect(surface.querySelectorAll('path')).toHaveLength(1)
  })

  it('uses own positions for prototype-like node IDs and clears deleted selections', async () => {
    const user = userEvent.setup()
    const graph: WorkflowValue = {
      nodes: [
        { id: 'constructor', label: 'Constructor', x: 20, y: 30 },
        { id: '__proto__', label: 'Prototype', x: 400, y: 30 },
      ],
      edges: [
        {
          id: 'edge',
          source: 'constructor',
          target: '__proto__',
          sourcePort: 'out',
          targetPort: 'in',
        },
      ],
    }
    const view = render(<WorkflowEditor defaultValue={graph} fitView={false} />)
    expect(view.container.querySelector('[data-workflow-edge]')?.getAttribute('d')).not.toMatch(
      /NaN|undefined/,
    )
    await user.click(screen.getByRole('group', { name: 'Step Constructor' }))
    await user.keyboard('{Delete}')
    expect(screen.getByRole('button', { name: 'Delete selection' })).toBeDisabled()
    expect(screen.queryByRole('group', { name: 'Step Constructor' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo workflow change' }))
    expect(screen.getByRole('group', { name: 'Step Constructor' })).toBeInTheDocument()
  })
  it('keeps decimal drafts, normalizes blur, and applies new controlled settings', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    function Harness() {
      const [value, setValue] = React.useState({ temperature: 1 })
      return (
        <>
          <GenerationSettings
            model={model}
            value={value}
            onValueChange={(v) => {
              change(v)
              setValue(v as typeof value)
            }}
          />
          <button onClick={() => setValue({ temperature: 1.5 })}>External</button>
        </>
      )
    }
    render(<Harness />)
    const input = screen.getByRole('spinbutton', { name: 'Temperature' })
    await user.clear(input)
    await user.type(input, '0.')
    expect(input).toHaveValue('0.')
    await user.type(input, '7')
    expect(change).toHaveBeenLastCalledWith({ temperature: 0.7 })
    await user.tab()
    expect(input).toHaveValue('0.7')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveValue('0.8')
    await user.click(screen.getByRole('button', { name: 'External' }))
    expect(input).toHaveValue('1.5')
  })

  it('truncates both committed and visible stop sequences even when the first eight did not change', () => {
    const lines = Array.from({ length: 8 }, (_, i) => `stop-${i}`),
      change = vi.fn()
    render(<GenerationSettings model={model} value={{ stop: lines }} onValueChange={change} />)
    const input = screen.getByLabelText('Stop sequences')
    fireEvent.change(input, { target: { value: [...lines, 'discarded'].join('\n') } })
    fireEvent.blur(input)
    expect(input).toHaveValue(lines.join('\n'))
    expect(change).toHaveBeenLastCalledWith({ stop: lines })
  })

  it('ignores deltas from failed and completed comparison attempts', async () => {
    const user = userEvent.setup(),
      first = deferred<{ text: string }>(),
      second = deferred<{ text: string }>()
    const deltas: ((text: string) => void)[] = []
    const generate = vi.fn((_request, options) => {
      deltas.push(options.onDelta)
      return deltas.length === 1 ? first.promise : second.promise
    })
    render(
      <ModelComparison
        models={[model]}
        defaultPrompt="Question"
        textAnimation="none"
        onGenerate={generate}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Compare models' }))
    await act(async () => first.reject(new Error('failed')))
    await user.click(screen.getByRole('button', { name: 'Retry One' }))
    act(() => {
      deltas[0]('obsolete')
      deltas[1]('fresh')
    })
    expect(screen.queryByText(/obsolete/)).not.toBeInTheDocument()
    expect(screen.getByText('fresh')).toBeInTheDocument()
    await act(async () => second.resolve({ text: 'finished' }))
    act(() => deltas[1]('late'))
    expect(screen.getByText('finished')).toBeInTheDocument()
    expect(screen.queryByText(/finishedlate/)).not.toBeInTheDocument()
  })

  it('rejects empty comparison IDs without calling adapters', () => {
    const generate = vi.fn()
    render(
      <ModelComparison
        models={[{ ...model, id: '' }]}
        defaultPrompt="Question"
        onGenerate={generate}
      />,
    )
    expect(screen.getByRole('button', { name: 'Compare models' })).toBeDisabled()
    expect(generate).not.toHaveBeenCalled()
  })

  it('allows rejecting invalid edited arguments using the original request', async () => {
    const user = userEvent.setup(),
      decide = vi.fn()
    const request: ApprovalRequestData = {
      id: 'a',
      revision: '1',
      title: 'Approve?',
      arguments: { safe: true },
      status: 'pending',
    }
    render(<ApprovalRequest request={request} onDecide={decide} editableArguments />)
    fireEvent.change(screen.getByLabelText('Approval arguments'), { target: { value: '{' } })
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Reject' }))
    expect(decide).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'reject', arguments: { safe: true } }),
      expect.any(Object),
    )
  })

  it('does not let an abandoned approval render replace the committed request', async () => {
    const user = userEvent.setup(),
      decision = deferred<void>(),
      suspended = new Promise(() => {})
    const request: ApprovalRequestData = {
      id: 'a',
      revision: '1',
      title: 'Original',
      arguments: { safe: true },
      status: 'pending',
    }
    function Suspend(): React.ReactNode {
      throw suspended
    }
    function Harness() {
      const [replacement, replace] = React.useState(false)
      return (
        <>
          <button onClick={() => React.startTransition(() => replace(true))}>Replace</button>
          <React.Suspense fallback="Waiting">
            <ApprovalRequest
              request={replacement ? { ...request, id: 'b' } : request}
              onDecide={() => decision.promise}
            >
              {replacement ? <Suspend /> : undefined}
            </ApprovalRequest>
          </React.Suspense>
        </>
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(screen.getByRole('button', { name: 'Replace' }))
    await act(async () => decision.resolve())
    expect(screen.getByRole('status', { name: 'Approval status' })).toHaveTextContent('approved')
  })

  it('cancels an in-flight retry even while its promise is pending', async () => {
    const user = userEvent.setup(),
      pending = deferred<void>(),
      cancel = vi.fn()
    let signal!: AbortSignal
    function Harness() {
      const [call, setCall] = React.useState<ToolCallData>({
        id: 'tool',
        name: 'Lookup',
        input: {},
        status: 'error',
      })
      return (
        <ToolCall
          call={call}
          defaultExpanded
          onRetry={(_call, options) => {
            signal = options.signal
            setCall({ ...call, status: 'running' })
            return pending.promise
          }}
          onCancel={() => {
            cancel()
            setCall({ ...call, status: 'cancelled' })
          }}
        />
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Retry tool' }))
    await user.click(screen.getByRole('button', { name: 'Cancel tool' }))
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(signal.aborted).toBe(true)
    await act(async () => pending.resolve())
  })

  it('keeps a keyboard-focusable artifact tab when diff becomes unavailable', async () => {
    const user = userEvent.setup()
    const artifact = {
      id: 'a',
      title: 'Artifact',
      kind: 'text' as const,
      versions: [{ id: '1', label: 'One', content: 'old' }],
    }
    const view = render(<ArtifactPanel artifact={artifact} defaultView="diff" />)
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Changes' })).toBeDisabled()
    view.rerender(
      <ArtifactPanel
        artifact={{
          ...artifact,
          versions: [...artifact.versions, { id: '2', label: 'Two', content: 'new' }],
        }}
        defaultView="diff"
      />,
    )
    await user.selectOptions(screen.getByLabelText('Artifact version'), '2')
    expect(screen.getByRole('tab', { name: 'Changes' })).toHaveAttribute('tabindex', '0')
    view.rerender(<ArtifactPanel artifact={artifact} defaultView="diff" />)
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('tabindex', '0')
  })

  it('labels cross-origin image navigation honestly', () => {
    render(
      <ArtifactPanel
        artifact={{
          id: 'a',
          title: 'Image',
          kind: 'image',
          versions: [{ id: '1', label: 'One', content: 'https://cdn.example.test/picture.png' }],
        }}
      />,
    )
    expect(screen.getByRole('button', { name: 'Open image' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Download artifact' })).not.toBeInTheDocument()
  })

  it('expands custom leaf steps and stops filtering when search is disabled', async () => {
    const user = userEvent.setup(),
      steps = [
        { id: 'a', title: 'Alpha', status: 'success' as const },
        { id: 'b', title: 'Bravo', status: 'success' as const },
      ]
    const view = render(<AgentRunTrace steps={steps} renderStep={(s) => <p>Custom {s.title}</p>} />)
    await user.click(screen.getByRole('button', { name: /Alpha/ }))
    expect(screen.getByText('Custom Alpha')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search trace'), 'Alpha')
    expect(screen.queryByRole('button', { name: /Bravo/ })).not.toBeInTheDocument()
    view.rerender(<AgentRunTrace steps={steps} searchable={false} />)
    expect(screen.getByRole('button', { name: /Bravo/ })).toBeInTheDocument()
  })

  it('supports onAction-owned controlled history updates without onItemsChange', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [items, setItems] = React.useState<ConversationHistoryItem[]>([
        { id: 'a', title: 'Owned', updatedAt: '2026-11-01' },
      ])
      return (
        <ConversationHistory
          items={items}
          onSelect={() => {}}
          onAction={async (item, action) => {
            if (action.kind === 'delete')
              setItems((current) => current.filter((x) => x.id !== item.id))
          }}
        />
      )
    }
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Delete Owned' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Owned' })).not.toBeInTheDocument(),
    )
  })

  it('reports allowlist failures and treats an empty allowlist as accepting no countries', async () => {
    const change = vi.fn(),
      view = render(<PhoneInput countries={['US']} onPhoneChange={change} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Phone number' }), {
      target: { value: '+442079460018' },
    })
    expect(change).toHaveBeenLastCalledWith(
      expect.objectContaining({ valid: false, country: 'GB' }),
    )
    view.rerender(<PhoneInput countries={[]} onPhoneChange={change} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Phone number' }), {
      target: { value: '+14155552671' },
    })
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ valid: false }))
    expect(
      (screen.getByRole('textbox', { name: 'Phone number' }) as HTMLInputElement).checkValidity(),
    ).toBe(false)
  })

  it('retains rejected paste fragments and invokes the caller blur handler', () => {
    const change = vi.fn(),
      blur = vi.fn()
    render(
      <TagsInput
        onValueChange={change}
        validateTag={(tag) => (tag === 'bad' ? 'Correct this' : undefined)}
        onBlur={blur}
      />,
    )
    const input = screen.getByRole('combobox')
    fireEvent.paste(input, { clipboardData: { getData: () => 'good,bad' } })
    expect(change).toHaveBeenLastCalledWith(['good'])
    expect(input).toHaveValue('bad')
    fireEvent.blur(input)
    expect(blur).toHaveBeenCalledTimes(1)
  })

  it('uses configured limits when validating large file moves', () => {
    const entries: FileBrowserEntry[] = [
      { id: 'folder', name: 'Folder', kind: 'folder' },
      ...Array.from({ length: 10000 }, (_, i) => ({
        id: `f${i}`,
        name: `File ${i}`,
        kind: 'file' as const,
      })),
    ]
    expect(canMoveFileEntries(entries, ['f0'], 'folder')).toBe(false)
    expect(canMoveFileEntries(entries, ['f0'], 'folder', 11000)).toBe(true)
  })

  it('blocks uploads into a current folder that becomes disabled', () => {
    const upload = vi.fn()
    const view = render(
      <FileBrowser
        defaultFolderId="a"
        entries={[{ id: 'a', name: 'A', kind: 'folder' }]}
        onUpload={upload}
        onCreateFolder={vi.fn()}
      />,
    )
    view.rerender(
      <FileBrowser
        defaultFolderId="a"
        entries={[{ id: 'a', name: 'A', kind: 'folder', disabled: true }]}
        onUpload={upload}
        onCreateFolder={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'New folder' })).toBeDisabled()
  })

  it('evaluates filters at the editor maximum rather than a smaller hidden limit', () => {
    const query: FilterGroup = {
      id: 'root',
      kind: 'group',
      combinator: 'and',
      children: Array.from({ length: 500 }, (_, i) => ({
        id: `r${i}`,
        kind: 'rule',
        field: 'x',
        operator: 'eq',
        value: 'ok',
      })),
    }
    expect(matchesFilter({ x: 'ok' }, query, [{ id: 'x', label: 'X', type: 'text' }])).toBe(true)
  })

  it('renders exactly the signature strokes that will be exported', () => {
    const strokes: SignatureStroke[] = Array.from({ length: 501 }, (_, i) => ({
      id: `s${i}`,
      color: '#123456',
      width: 2,
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    }))
    const view = render(<SignaturePad value={strokes} />)
    expect(
      view.container.querySelectorAll('svg[aria-label="Signature drawing surface"] path'),
    ).toHaveLength(500)
    expect(signatureSVG(strokes).match(/<path /g)).toHaveLength(500)
  })

  it('keeps completed uploads complete when the notification callback throws', async () => {
    const complete = vi.fn(async () => '/done'),
      changes = vi.fn()
    render(
      <UploadPlus
        defaultFiles={[new File(['x'], 'one.txt')]}
        autoStart
        transport={{ uploadPart: async (_chunk, { index }) => ({ index, token: 'ok' }), complete }}
        onComplete={() => {
          throw new Error('callback failed')
        }}
        onQueueChange={changes}
      />,
    )
    await screen.findByRole('alert')
    expect(complete).toHaveBeenCalledTimes(1)
    expect(changes.mock.lastCall![0][0] as UploadQueueItem).toMatchObject({ status: 'complete' })
    expect(screen.queryByRole('button', { name: /Retry one/ })).not.toBeInTheDocument()
  })

  it('generates distinct IDs without randomUUID and keeps tiny costs visibly nonzero', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    expect(productId()).toMatch(/^[0-9a-f-]{36}$/)
    expect(productId()).not.toBe(productId())
    render(<ContextUsage contextWindow={1000} inputTokens={0} cost={0.0000004} />)
    expect(screen.getByText(/0\.0000004/)).toBeInTheDocument()
  })

  it('formats notification timestamps using the configured locale', () => {
    const timestamp = '2026-11-01T13:30:00Z'
    render(
      <ConfigProvider locale="de-DE">
        <NotificationInbox items={[{ id: 'a', title: 'Notice', createdAt: timestamp }]} />
      </ConfigProvider>,
    )
    expect(screen.getByText(new Date(timestamp).toLocaleString('de-DE'))).toBeInTheDocument()
  })

  it('rejects a connection when validation throws an empty-message error', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    const graph: WorkflowValue = {
      nodes: [
        { id: 'a', label: 'A', x: 0, y: 0 },
        { id: 'b', label: 'B', x: 300, y: 0 },
      ],
      edges: [],
    }
    render(
      <WorkflowEditor
        defaultValue={graph}
        onValueChange={change}
        onBeforeConnect={() => {
          throw new Error()
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Connect from A/ }))
    await user.click(screen.getByRole('button', { name: /Connect to B/ }))
    expect(change).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('rejected')
  })
})
