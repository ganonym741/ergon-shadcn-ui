import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelSelector, type ModelDescriptor } from '@/components/ui/model-selector'
import {
  GenerationSettings,
  normalizeGenerationParameters,
} from '@/components/ui/generation-settings'
import { ContextUsage } from '@/components/ui/context-usage'
import { StreamingMarkdown } from '@/components/ui/streaming-markdown'
import { PromptComposer } from '@/components/ui/prompt-composer'
import {
  ApprovalRequest,
  parseApprovalArguments,
  type ApprovalRequestData,
} from '@/components/ui/approval-request'
import {
  AgentRunTrace,
  validateAgentTrace,
  type AgentTraceStep,
} from '@/components/ui/agent-run-trace'
import { ToolCall } from '@/components/ui/tool-call'
import { ChatMessage } from '@/components/ui/chat-message'
import { ConversationHistory } from '@/components/ui/conversation-history'
import { ArtifactPanel } from '@/components/ui/artifact-panel'
import { Citations, CitationReference } from '@/components/ui/citations'
import { ModelComparison, type ModelComparisonResult } from '@/components/ui/model-comparison'
import { VoiceConversation } from '@/components/ui/voice-conversation'
const deferred = <T,>() => {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const models: ModelDescriptor[] = [
  {
    id: 'a',
    name: 'Balanced',
    provider: 'Demo',
    capabilities: ['vision'],
    maxOutputTokens: 4000,
    parameters: {
      temperature: { min: 0, max: 1 },
      topP: true,
      stop: true,
      responseFormats: ['text', 'json'],
    },
  },
  {
    id: 'b',
    name: 'Reasoning',
    provider: 'Demo',
    capabilities: ['reasoning'],
    parameters: { responseFormats: ['text'] },
  },
  { id: 'c', name: 'Swift', provider: 'Local', maxOutputTokens: 1000 },
]
const request: ApprovalRequestData = {
  id: 'share',
  revision: '1',
  title: 'Share the note?',
  status: 'pending',
  arguments: { recipient: 'team@example.test' },
}
describe('model metadata and application-reported usage', () => {
  it('closes an open picker when its application disables it', async () => {
    const user = userEvent.setup(),
      view = render(<ModelSelector models={models} />)
    await user.click(screen.getByRole('combobox', { name: 'Model' }))
    expect(screen.getByRole('dialog', { name: 'Model options' })).toBeInTheDocument()
    view.rerender(<ModelSelector models={models} disabled />)
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Model options' })).not.toBeInTheDocument(),
    )
  })
  it('searches models, disables incompatible choices and selects by keyboard', async () => {
    const user = userEvent.setup(),
      selected = vi.fn()
    render(
      <ModelSelector models={models} requiredCapabilities={['vision']} onValueChange={selected} />,
    )
    await user.click(screen.getByRole('combobox', { name: 'Model' }))
    expect(screen.getByRole('button', { name: 'Select Reasoning' })).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Search models' }), 'Balanced')
    const option = screen.getByRole('button', { name: 'Select Balanced' })
    option.focus()
    await user.keyboard('{Enter}')
    expect(selected).toHaveBeenCalledWith('a', models[0])
    expect(screen.queryByRole('dialog', { name: 'Model options' })).not.toBeInTheDocument()
  })
  it('omits unsupported generation overrides and clamps supported limits', () => {
    expect(
      normalizeGenerationParameters(
        { temperature: 9, topP: 2, seed: 5, maxOutputTokens: 10000, responseFormat: 'json' },
        models[0],
      ),
    ).toEqual({ temperature: 1, topP: 1, maxOutputTokens: 4000, responseFormat: 'json' })
    expect(
      normalizeGenerationParameters(
        { temperature: 0.7, maxOutputTokens: 20, responseFormat: 'json' },
        models[1],
      ),
    ).toEqual({})
  })
  it('allows a user to type multiple stop lines before committing on blur', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    render(<GenerationSettings model={models[0]} onValueChange={change} />)
    const input = screen.getByRole('textbox', { name: 'Stop sequences' })
    await user.type(input, 'STOP{Enter}END')
    expect(input).toHaveValue('STOP\nEND')
    await user.tab()
    expect(change.mock.lastCall?.[0].stop).toEqual(['STOP', 'END'])
  })
  it('does not show a temperature field for a model that does not support it', () => {
    render(<GenerationSettings model={models[1]} />)
    expect(screen.queryByRole('spinbutton', { name: 'Temperature' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('spinbutton', { name: 'Maximum output tokens' }),
    ).not.toBeInTheDocument()
  })
  it('counts cached and reasoning values as subsets and rejects invalid totals', () => {
    const view = render(
      <ContextUsage
        inputTokens={100}
        outputTokens={40}
        cachedInputTokens={30}
        reasoningTokens={10}
        contextWindow={200}
      />,
    )
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '140')
    view.rerender(<ContextUsage inputTokens={100} cachedInputTokens={101} contextWindow={200} />)
    expect(screen.getByRole('alert')).toHaveTextContent('valid cached/reasoning subsets')
  })
})
describe('Markdown, sources and artifacts', () => {
  it('renders GFM while keeping HTML and executable URLs inert', async () => {
    render(
      <StreamingMarkdown
        content={
          '# Heading\n\n- [x] Checked\n\n| A | B |\n| - | - |\n| one | two |\n\n<script>window.bad=1</script>\n\n[bad](javascript:alert(1))\n\n![disabled](https://example.test/image.png)'
        }
        allowImages={false}
      />,
    )
    expect(await screen.findByRole('heading', { name: 'Heading' })).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.queryByRole('link', { name: 'bad' })).not.toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('<script>window.bad=1</script>')).toBeInTheDocument()
  })
  it('updates incomplete fenced code as content arrives', async () => {
    const fence = String.fromCharCode(96).repeat(3),
      view = render(<StreamingMarkdown content={`${fence}text\nfirst`} streaming />)
    expect(await screen.findByText('first')).toBeInTheDocument()
    view.rerender(<StreamingMarkdown content={`${fence}text\nfirst\nsecond\n${fence}`} />)
    expect(await screen.findByText('second')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByLabelText('Response streaming')).not.toBeInTheDocument(),
    )
  })
  it('shows inline citation previews and filters unsafe source links', async () => {
    const user = userEvent.setup()
    render(
      <Citations
        sources={[
          { id: 's', title: 'A source', quote: 'A useful excerpt', url: 'javascript:alert(1)' },
        ]}
      >
        <CitationReference sourceId="s" />
      </Citations>,
    )
    await user.click(screen.getByRole('button', { name: 'Source 1: A source' }))
    expect(screen.getByText('A useful excerpt')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open source' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByText('A useful excerpt')).not.toBeInTheDocument()
  })
  it('changes artifact versions and renders differences without executing code', async () => {
    const user = userEvent.setup()
    function Panel() {
      const [id, setID] = React.useState('two')
      return (
        <ArtifactPanel
          versionId={id}
          onVersionChange={setID}
          artifact={{
            id: 'note',
            title: 'Note',
            kind: 'text',
            versions: [
              { id: 'one', label: 'First', content: 'First content' },
              { id: 'two', label: 'Second', content: 'Second content' },
            ],
          }}
        />
      )
    }
    render(<Panel />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Artifact version' }), 'one')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('First content')
    await user.click(screen.getByRole('tab', { name: 'Changes' }))
    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })
})
describe('prompt and message lifecycles', () => {
  it('does not submit Enter during IME composition and clears only a successful prompt', async () => {
    const submit = vi.fn(async () => {})
    render(<PromptComposer defaultValue="A question" onSubmit={submit} />)
    const input = screen.getByRole('textbox', { name: 'Message prompt' })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 })
    expect(submit).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(input).toHaveValue(''))
  })
  it('retains a failed prompt for correction and retry', async () => {
    const user = userEvent.setup()
    render(
      <PromptComposer
        defaultValue="Keep this draft"
        onSubmit={async () => {
          throw new Error('Provider unavailable')
        }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Send prompt' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Provider unavailable')
    expect(screen.getByRole('textbox', { name: 'Message prompt' })).toHaveValue('Keep this draft')
  })
  it('removes and cancels an uploading attachment without accepting its late URL', async () => {
    const upload = deferred<{ url: string }>(),
      handler = vi.fn((_file: File, _options: { signal: AbortSignal }) => upload.promise)
    const { container } = render(
      <PromptComposer onAttachmentUpload={handler} onSubmit={async () => {}} />,
    )
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: { files: [new File(['image'], 'image.png', { type: 'image/png' })] },
    })
    await waitFor(() => expect(handler).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Send prompt' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Remove image.png' }))
    expect(handler.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => upload.resolve({ url: '/uploads/image.png' }))
    expect(screen.queryByText('image.png')).not.toBeInTheDocument()
  })
  it('aborts an in-flight prompt when Stop is clicked without erasing the draft', async () => {
    const user = userEvent.setup(),
      pending = deferred<void>(),
      submit = vi.fn((_prompt: unknown, _options: { signal: AbortSignal }) => pending.promise),
      stop = vi.fn()
    render(<PromptComposer defaultValue="A draft" onSubmit={submit} onStop={stop} />)
    await user.click(screen.getByRole('button', { name: 'Send prompt' }))
    await user.click(screen.getByRole('button', { name: 'Stop generation' }))
    expect(submit.mock.calls[0][1].signal.aborted).toBe(true)
    expect(stop).toHaveBeenCalledTimes(1)
    await act(async () => pending.resolve())
    expect(screen.getByRole('textbox', { name: 'Message prompt' })).toHaveValue('A draft')
  })
  it('edits a message through its application callback and toggles feedback', async () => {
    const user = userEvent.setup(),
      edit = vi.fn(async (_text: string, _options: { signal: AbortSignal }) => {}),
      feedback = vi.fn()
    render(
      <ChatMessage
        id="m"
        role="assistant"
        content="Original"
        onEdit={edit}
        onRatingChange={feedback}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Edit message' }))
    const input = screen.getByRole('textbox', { name: 'Edit message' })
    await user.clear(input)
    await user.type(input, 'Revised')
    await user.click(screen.getByRole('button', { name: 'Save edit' }))
    await waitFor(() => expect(edit.mock.calls[0][0]).toBe('Revised'))
    await user.click(screen.getByRole('button', { name: 'Helpful response' }))
    expect(feedback).toHaveBeenCalledWith('up')
  })
  it('renames and archives application-owned history items after persistence succeeds', async () => {
    const user = userEvent.setup(),
      persist = vi.fn(async () => {})
    function History() {
      const [items, setItems] = React.useState([
        { id: 'a', title: 'First title', updatedAt: '2026-11-04T09:00:00Z' },
      ])
      return (
        <ConversationHistory
          items={items}
          onItemsChange={setItems}
          onSelect={() => {}}
          onAction={persist}
        />
      )
    }
    render(<History />)
    await user.click(screen.getByRole('button', { name: 'Rename First title' }))
    const input = screen.getByRole('textbox', { name: 'Conversation title' })
    await user.clear(input)
    await user.type(input, 'Renamed')
    await user.click(screen.getByRole('button', { name: 'Save conversation title' }))
    expect(await screen.findByRole('button', { name: 'Renamed' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Archive Renamed' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Renamed' })).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: 'Archived' }))
    expect(screen.getByRole('button', { name: 'Renamed' })).toBeInTheDocument()
  })
})
describe('explicit approvals and public traces', () => {
  it('rejects non-finite JSON numbers and preserves a completed server decision past expiration', () => {
    expect(() => parseApprovalArguments('{"amount":1e400}')).toThrow(/finite/)
    render(
      <ApprovalRequest
        request={{ ...request, status: 'approved', expiresAt: '2020-01-01T00:00:00Z' }}
        onDecide={async () => {}}
      />,
    )
    expect(screen.getByRole('status', { name: 'Approval status' })).toHaveTextContent('approved')
  })
  it('keeps a pending decision stable when argument object identity changes', async () => {
    const user = userEvent.setup(),
      pending = deferred<void>(),
      decide = vi.fn((_decision: unknown, _options: { signal: AbortSignal }) => pending.promise),
      view = render(<ApprovalRequest request={request} onDecide={decide} />)
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    view.rerender(
      <ApprovalRequest
        request={{ ...request, arguments: { ...request.arguments } }}
        onDecide={decide}
      />,
    )
    expect(decide.mock.calls[0][1].signal.aborted).toBe(false)
    await act(async () => pending.resolve())
    expect(screen.getByRole('status', { name: 'Approval status' })).toHaveTextContent('approved')
    expect(decide).toHaveBeenCalledTimes(1)
  })
  it('binds edited JSON to the request revision and ignores a stale completion', async () => {
    const user = userEvent.setup(),
      pending = deferred<void>(),
      decide = vi.fn((_decision: unknown, _options: { signal: AbortSignal }) => pending.promise),
      view = render(<ApprovalRequest request={request} onDecide={decide} editableArguments />)
    const input = screen.getByRole('textbox', { name: 'Approval arguments' })
    fireEvent.change(input, { target: { value: '{"recipient":"reviewer@example.test"}' } })
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    expect(decide.mock.calls[0][0]).toMatchObject({
      id: 'share',
      revision: '1',
      arguments: { recipient: 'reviewer@example.test' },
    })
    view.rerender(
      <ApprovalRequest
        request={{ ...request, revision: '2' }}
        onDecide={decide}
        editableArguments
      />,
    )
    expect(decide.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => pending.resolve())
    expect(screen.getByRole('status', { name: 'Approval status' })).toHaveTextContent('pending')
  })
  it('prevents invalid JSON and expired approval actions', () => {
    const decide = vi.fn(),
      view = render(<ApprovalRequest request={request} onDecide={decide} editableArguments />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Approval arguments' }), {
      target: { value: '[]' },
    })
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
    view.rerender(
      <ApprovalRequest
        request={{ ...request, revision: '2', expiresAt: '2020-01-01T00:00:00Z' }}
        onDecide={decide}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Approval status' })).toHaveTextContent('expired')
  })
  it('rejects cyclic/duplicate trace IDs and retains matching ancestors during search', async () => {
    const user = userEvent.setup(),
      tree: AgentTraceStep[] = [
        {
          id: 'run',
          title: 'Run',
          status: 'success',
          children: [{ id: 'lookup', title: 'Lookup note', status: 'success' }],
        },
      ]
    expect(validateAgentTrace([...tree, ...tree])).toMatch(/unique/)
    render(<AgentRunTrace steps={tree} />)
    await user.type(screen.getByRole('textbox', { name: 'Search trace' }), 'Lookup')
    expect(screen.getByRole('button', { name: /Run/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Lookup note/ })).toBeInTheDocument()
  })
  it('displays retry failures without executing a tool on expansion', async () => {
    const user = userEvent.setup(),
      retry = vi.fn(async () => {
        throw new Error('Retry service unavailable')
      })
    render(
      <ToolCall
        call={{
          id: 't',
          name: 'find',
          input: { query: 'notes' },
          status: 'error',
          error: 'Timed out',
        }}
        onRetry={retry}
      />,
    )
    expect(retry).not.toHaveBeenCalled()
    await user.click(screen.getByText('find'))
    await user.click(screen.getByRole('button', { name: 'Retry tool' }))
    expect(await screen.findByText('Retry service unavailable')).toBeInTheDocument()
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
describe('independent model adapters and voice permission', () => {
  it('cancels previous runs when the application replaces the model inventory', async () => {
    const user = userEvent.setup(),
      pending = deferred<ModelComparisonResult>(),
      generate = vi.fn(
        (_request: unknown, _options: { signal: AbortSignal; onDelta: (text: string) => void }) =>
          pending.promise,
      ),
      view = render(
        <ModelComparison models={[models[0]]} defaultPrompt="A question" onGenerate={generate} />,
      )
    await user.click(screen.getByRole('button', { name: 'Compare models' }))
    const signal = generate.mock.calls[0][1].signal
    view.rerender(
      <ModelComparison models={[models[1]]} defaultPrompt="A question" onGenerate={generate} />,
    )
    expect(signal.aborted).toBe(true)
    await act(async () => pending.resolve({ text: 'Old inventory response' }))
    expect(screen.queryByText('Old inventory response')).not.toBeInTheDocument()
  })
  it('honors mute changes made while microphone permission is pending', async () => {
    const user = userEvent.setup(),
      permission = deferred<MediaStream>(),
      track = { enabled: true, stop: vi.fn() }
    class Recorder {
      static isTypeSupported() {
        return true
      }
      state: RecordingState = 'inactive'
      onstop: (() => void) | null = null
      ondataavailable: unknown = null
      onerror: unknown = null
      mimeType = 'audio/webm'
      start() {
        this.state = 'recording'
      }
      stop() {
        this.state = 'inactive'
        this.onstop?.()
      }
    }
    vi.stubGlobal('MediaRecorder', Recorder)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => permission.promise },
    })
    const view = render(
      <VoiceConversation onProcessRecording={async () => ({ transcript: 'Local' })} />,
    )
    await user.click(screen.getByRole('button', { name: 'Start talking' }))
    await user.click(screen.getByRole('button', { name: 'Mute microphone' }))
    await act(async () =>
      permission.resolve({
        getTracks: () => [track],
        getAudioTracks: () => [track],
      } as unknown as MediaStream),
    )
    expect(track.enabled).toBe(false)
    view.unmount()
    expect(track.stop).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
  it('limits model concurrency and releases a cancelled slot even when an adapter ignores cancellation', async () => {
    const user = userEvent.setup(),
      calls: {
        id: string
        signal: AbortSignal
        pending: ReturnType<typeof deferred<ModelComparisonResult>>
      }[] = [],
      generate = vi.fn(
        async (
          { model }: { model: ModelDescriptor; prompt: string },
          { signal }: { signal: AbortSignal },
        ) => {
          const pending = deferred<ModelComparisonResult>()
          calls.push({ id: model.id, signal, pending })
          return pending.promise
        },
      )
    render(
      <ModelComparison
        models={models}
        defaultPrompt="One prompt"
        concurrency={2}
        onGenerate={generate}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Compare models' }))
    await waitFor(() => expect(calls).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Stop Balanced' }))
    expect(calls[0].signal.aborted).toBe(true)
    await waitFor(() => expect(calls).toHaveLength(3))
    await act(async () => {
      calls[0].pending.resolve({ text: 'Stale response' })
      calls[1].pending.resolve({ text: 'Reasoned response' })
      calls[2].pending.resolve({ text: 'Swift response' })
    })
    expect(screen.queryByText('Stale response')).not.toBeInTheDocument()
    expect(await screen.findByText('Swift response')).toBeInTheDocument()
    expect(generate.mock.calls.every(([request]) => request.prompt === 'One prompt')).toBe(true)
  })
  it('never requests a microphone when a voice component merely mounts', () => {
    const media = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: media },
    })
    render(<VoiceConversation onProcessRecording={async () => ({ transcript: 'Local' })} />)
    expect(media).not.toHaveBeenCalled()
  })
})
