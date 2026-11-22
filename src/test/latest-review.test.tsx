import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'
import {
  FilterBuilder,
  FilterBuilderToolbar,
  matchesFilter,
  type FilterGroup,
} from '@/components/ui/filter-builder'
import { PhoneInput } from '@/components/ui/phone-input'
import { TagsInput, TagsInputTag } from '@/components/ui/tags-input'
import {
  GenerationSettings,
  normalizeGenerationParameters,
} from '@/components/ui/generation-settings'
import { WorkflowEditor, type WorkflowValue } from '@/components/ui/workflow-editor'
import { Conversation } from '@/components/ui/conversation'
import { FileBrowser, type FileBrowserEntry } from '@/components/ui/file-browser'
import { ApprovalRequest, type ApprovalRequestData } from '@/components/ui/approval-request'
import { Presence, PresenceCanvas } from '@/components/ui/presence'
import { SignaturePad, signatureSVG } from '@/components/ui/signature-pad'
import { ArtifactPanel } from '@/components/ui/artifact-panel'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
const fields = [{ id: 'age', label: 'Age', type: 'number' as const }]
const query: FilterGroup = {
  id: 'root',
  kind: 'group',
  combinator: 'and',
  children: [{ id: 'age', kind: 'rule', field: 'age', operator: 'neq', value: 10 }],
}
const graph: WorkflowValue = {
  nodes: [
    { id: 'one', label: 'One', x: -160, y: -32 },
    { id: 'two', label: 'Two', x: 5000, y: 0 },
  ],
  edges: [{ id: 'one', source: 'one', sourcePort: 'out', target: 'two', targetPort: 'in' }],
}
const entry: FileBrowserEntry = { id: 'file', kind: 'file', name: 'Report.txt', parentId: null }

describe('latest review regressions', () => {
  it('does not offer a clear action for a read-only input', () => {
    const change = vi.fn()
    render(<Input defaultValue="Keep" readOnly allowClear onValueChange={change} />)
    expect(screen.queryByRole('button', { name: 'Clear input' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('Keep')
    expect(change).not.toHaveBeenCalled()
  })

  it.each(['unknown', Infinity, NaN])('does not match a numeric inequality against %s', (age) => {
    expect(matchesFilter({ age }, query, fields)).toBe(false)
    expect(matchesFilter({ age: 11 }, query, fields)).toBe(true)
  })

  it('allows fractional filters in native form validation and counts the configured limit', () => {
    const full: FilterGroup = {
      ...query,
      children: Array.from({ length: 500 }, (_, i) => ({
        id: `rule-${i}`,
        kind: 'rule',
        field: 'age',
        operator: 'eq',
        value: 1.5,
      })),
    }
    const view = render(<FilterBuilder fields={fields} defaultValue={query} />)
    const input = screen.getByRole('spinbutton', { name: 'Age value' }) as HTMLInputElement
    fireEvent.change(input, { target: { value: '1.5' } })
    expect(input.checkValidity()).toBe(true)
    view.unmount()
    render(
      <FilterBuilder fields={fields} defaultValue={full} maxRules={500}>
        <FilterBuilderToolbar />
      </FilterBuilder>,
    )
    expect(screen.getByText('500 conditions')).toBeInTheDocument()
  })

  it.each([false, true])(
    'normalizes untouched phone form values (controlled: %s)',
    (controlled) => {
      const value = '+1 (415) 555-2671 ext. 42'
      const view = render(
        <form>
          <PhoneInput name="phone" {...(controlled ? { value } : { defaultValue: value })} />
        </form>,
      )
      expect(new FormData(view.container.querySelector('form')!).get('phone')).toBe(
        '+14155552671 ext. 42',
      )
    },
  )

  it('keeps custom tag state attached to its value after keyboard reordering', async () => {
    const user = userEvent.setup()
    const view = render(
      <form>
        <TagsInput
          name="tags"
          defaultValue={['alpha', 'beta', 'beta']}
          allowDuplicates
          renderTag={(tag, index) => (
            <TagsInputTag index={index}>
              <input aria-label={`Edit ${tag} ${index}`} defaultValue={tag} />
            </TagsInputTag>
          )}
        />
      </form>,
    )
    await user.clear(screen.getByLabelText('Edit alpha 0'))
    await user.type(screen.getByLabelText('Edit alpha 0'), 'Edited alpha')
    screen.getByRole('button', { name: 'Remove alpha' }).focus()
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}')
    expect(screen.getByLabelText('Edit alpha 1')).toHaveValue('Edited alpha')
    expect(new FormData(view.container.querySelector('form')!).getAll('tags')).toEqual([
      'beta',
      'alpha',
      'beta',
    ])
  })

  it('splits the retained paste draft when Enter is pressed after capacity becomes available', async () => {
    const user = userEvent.setup()
    render(<TagsInput maxTags={1} />)
    const input = screen.getByRole('combobox', { name: 'Tags' })
    fireEvent.paste(input, { clipboardData: { getData: () => 'a,b,c' } })
    await user.click(screen.getByRole('button', { name: 'Remove a' }))
    await user.click(input)
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Remove b' })).toBeInTheDocument()
    expect(input).toHaveValue('c')
  })

  it('gates stop sequence overrides and editing on model capabilities', () => {
    const model = { id: 'custom', name: 'Custom', provider: 'Test' }
    const view = render(<GenerationSettings model={model} defaultValue={{ stop: ['END'] }} />)
    expect(screen.queryByLabelText('Stop sequences')).not.toBeInTheDocument()
    expect(normalizeGenerationParameters({ stop: ['END'] }, model)).toEqual({})
    view.rerender(
      <GenerationSettings
        model={{ ...model, parameters: { stop: true } }}
        defaultValue={{ stop: ['END'] }}
      />,
    )
    expect(screen.getByLabelText('Stop sequences')).toHaveValue('END')
    expect(
      normalizeGenerationParameters({ stop: ['END'] }, { ...model, parameters: { stop: true } }),
    ).toEqual({ stop: ['END'] })
  })

  it('preserves edited approval arguments when the parent publishes a completed status', async () => {
    const user = userEvent.setup(),
      decide = vi.fn()
    const request: ApprovalRequestData = {
      id: 'request',
      revision: '1',
      title: 'Confirm',
      arguments: { count: 1 },
      status: 'pending',
    }
    const view = render(<ApprovalRequest request={request} onDecide={decide} editableArguments />)
    const editor = screen.getByRole('textbox', { name: /arguments/i })
    fireEvent.change(editor, { target: { value: '{"count":2}' } })
    await user.click(screen.getByRole('button', { name: /approve/i }))
    await waitFor(() => expect(decide).toHaveBeenCalled())
    view.rerender(
      <ApprovalRequest
        request={{ ...request, status: 'approved' }}
        onDecide={decide}
        editableArguments
      />,
    )
    expect(decide.mock.calls[0][0].arguments).toEqual({ count: 2 })
    expect(screen.getByRole('tree', { name: 'Requested arguments' })).toHaveTextContent('2')
    expect(screen.queryByRole('textbox', { name: /arguments/i })).not.toBeInTheDocument()
  })

  it('moves negative-position nodes without clamping and isolates node and edge selections', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    const view = render(
      <WorkflowEditor defaultValue={graph} fitView={false} onValueChange={change} />,
    )
    const node = screen.getByRole('group', { name: 'Step One' })
    node.focus()
    await user.keyboard('{ArrowLeft}')
    expect(change.mock.calls.at(-1)?.[0].nodes[0].x).toBe(-176)
    const edge = view.container.querySelector('[data-workflow-edge]')!
    expect(edge.parentElement).not.toHaveClass('text-primary')
    await user.click(edge)
    expect(edge.parentElement).toHaveClass('text-primary')
    expect(node).not.toHaveClass('ring-primary')
  })

  it('uses a node template without copying its identity or position', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(
      <WorkflowEditor
        defaultValue={{ nodes: [graph.nodes[0]], edges: [] }}
        createNode={() => graph.nodes[0]}
        onValueChange={change}
        fitView={false}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Add step' }))
    const nodes = change.mock.calls[0][0].nodes
    expect(nodes).toHaveLength(2)
    expect(nodes[1].id).not.toBe(nodes[0].id)
    expect(nodes[1].x).not.toBe(nodes[0].x)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('offers an explicit reset for invalid imported workflows and honors read-only mode', async () => {
    const user = userEvent.setup(),
      change = vi.fn(),
      invalid = { ...graph, edges: [{ ...graph.edges[0], target: 'missing' }] }
    const view = render(<WorkflowEditor defaultValue={invalid} onValueChange={change} readOnly />)
    expect(screen.getByRole('button', { name: 'Reset invalid workflow' })).toBeDisabled()
    view.rerender(<WorkflowEditor defaultValue={invalid} onValueChange={change} />)
    await user.click(screen.getByRole('button', { name: 'Reset invalid workflow' }))
    expect(change).toHaveBeenCalledWith({ nodes: [], edges: [] })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add step' })).toBeEnabled()
  })

  it('fits a wide graph completely instead of clipping it at 25 percent zoom', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 800,
      height: 460,
    } as DOMRect)
    const user = userEvent.setup()
    const view = render(<WorkflowEditor defaultValue={graph} fitView={false} />)
    await user.click(screen.getByRole('button', { name: 'Fit workflow' }))
    const transform = view.container
      .querySelector('[role="application"] > div')!
      .getAttribute('style')!
    const zoom = Number(transform.match(/scale\(([^)]+)\)/)?.[1])
    expect(zoom).toBeGreaterThan(0)
    expect((5000 + 220 + 160) * zoom).toBeLessThanOrEqual(800 - 64)
  })

  it('blocks uploads while the file entry tree is invalid', () => {
    const upload = vi.fn()
    const view = render(<FileBrowser entries={[entry, entry]} onUpload={upload} />)
    fireEvent.drop(view.container.querySelector('[data-slot="file-browser"]')!, {
      dataTransfer: { files: [new File(['x'], 'x.txt')] },
    })
    expect(upload).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/unique/i)
  })

  it.each(['rename', 'delete'] as const)(
    'rechecks a disabled entry before submitting %s',
    async (kind) => {
      const user = userEvent.setup(),
        rename = vi.fn(),
        remove = vi.fn()
      const view = render(
        <FileBrowser
          entries={[entry]}
          defaultSelectedIds={[entry.id]}
          onRename={rename}
          onDelete={remove}
        />,
      )
      await user.click(
        screen.getByRole('button', {
          name: kind === 'rename' ? 'Rename selected item' : 'Delete selected items',
        }),
      )
      view.rerender(
        <FileBrowser
          entries={[{ ...entry, disabled: true }]}
          defaultSelectedIds={[entry.id]}
          onRename={rename}
          onDelete={remove}
        />,
      )
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: kind === 'rename' ? 'Save' : 'Delete',
        }),
      )
      expect(rename).not.toHaveBeenCalled()
      expect(remove).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent('no longer available')
    },
  )

  it('announces appended completed messages once and excludes history and streaming updates', () => {
    const first = { id: 'one', role: 'assistant' as const, content: 'Existing history' }
    const view = render(<Conversation messages={[first]} textAnimation="none" />)
    const log = screen.getByRole('log', { name: 'Conversation updates' })
    expect(log).toBeEmptyDOMElement()
    const earlier = { ...first, id: 'earlier', content: 'Earlier history' }
    view.rerender(<Conversation messages={[earlier, first]} />)
    expect(log).toBeEmptyDOMElement()
    const next = { ...first, id: 'two', content: 'Partial', status: 'streaming' as const }
    view.rerender(<Conversation messages={[earlier, first, next]} />)
    expect(log).toBeEmptyDOMElement()
    view.rerender(
      <Conversation
        messages={[earlier, first, { ...next, content: 'The complete answer', status: 'complete' }]}
      />,
    )
    expect(log).toHaveTextContent('The complete answer')
    const announcement = log.firstChild
    view.rerender(
      <Conversation
        messages={[earlier, first, { ...next, content: 'Edited answer', status: 'complete' }]}
      />,
    )
    expect(log.firstChild).toBe(announcement)
    expect(log).not.toHaveTextContent('Edited answer')
  })

  it('shows jump-to-latest after content grows without a scroll event', () => {
    let height = 100
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => height)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100)
    const first = { id: 'one', role: 'assistant' as const, content: 'First' }
    const view = render(<Conversation autoScroll={false} messages={[first]} />)
    expect(screen.queryByRole('button', { name: /new message/ })).not.toBeInTheDocument()
    height = 1000
    view.rerender(
      <Conversation
        autoScroll={false}
        messages={[first, { ...first, id: 'two', content: 'Second' }]}
      />,
    )
    expect(screen.getByRole('button', { name: '1 new message' })).toBeInTheDocument()
  })

  it('clears a published presence cursor when its canvas unmounts', () => {
    const publish = vi.fn()
    const view = render(
      <Presence users={[]} onCursorChange={publish}>
        <PresenceCanvas />
      </Presence>,
    )
    publish.mockClear()
    view.unmount()
    expect(publish).toHaveBeenCalledWith(null)
  })

  it('uses identical fallback ink on screen and in exported signatures', () => {
    const strokes = [
      {
        id: 'ink',
        color: 'red',
        width: 2,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      },
    ]
    const view = render(<SignaturePad defaultValue={strokes} />)
    const color = view.container.querySelector('svg path')!.getAttribute('stroke')
    expect(signatureSVG(strokes, 'transparent', 500, 200)).toContain(`stroke="${color}"`)
  })

  it('disables artifact differences for the first version', () => {
    render(
      <ArtifactPanel
        artifact={{
          id: 'a',
          title: 'A',
          kind: 'text',
          versions: [
            { id: 'v1', label: 'One', content: 'First' },
            { id: 'v2', label: 'Two', content: 'Second' },
          ],
        }}
        versionId="v1"
        defaultView="diff"
      />,
    )
    expect(screen.getByRole('tab', { name: 'Changes' })).toBeDisabled()
    expect(screen.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true')
  })
})
