import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ts from 'typescript'
import ChatPreview from '@/playground/product/chat-message'
import PromptPreview from '@/playground/product/prompt-composer'
import StreamPreview from '@/playground/product/streaming-markdown'
import GenerationPreview from '@/playground/product/generation-settings'
import HistoryPreview from '@/playground/product/conversation-history'
import ArtifactPreview from '@/playground/product/artifact-panel'
import TracePreview from '@/playground/product/agent-run-trace'
import ComparisonPreview from '@/playground/product/model-comparison'
import ToolPreview from '@/playground/product/tool-call'
import ModelPreview from '@/playground/product/model-selector'
import { uniqueDemoId } from '@/playground/product/shared'
import { defaultConfig } from '@/playground/schema'
import { productExamples } from '@/docs/product-examples'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
const props = (id: string, config: Record<string, unknown> = {}) => ({
  id,
  config: { ...defaultConfig(id), ...config } as ReturnType<typeof defaultConfig>,
  onEvent: vi.fn(),
})

describe('reviewed playground behaviors', () => {
  it('expands edited trace IDs instead of fixture IDs', () => {
    render(
      <TracePreview
        {...props('agent-run-trace', {
          expanded: true,
          data: JSON.stringify([
            {
              id: 'run',
              title: 'Custom run',
              status: 'success',
              children: [
                {
                  id: 'child',
                  title: 'Custom child',
                  status: 'success',
                  summary: 'Visible child details',
                },
              ],
            },
          ]),
        })}
      />,
    )
    expect(screen.getByRole('button', { name: /Custom run/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('Visible child details')).toBeInTheDocument()
  })

  it('rejects artifact JSON without a versions array', () => {
    render(<ArtifactPreview {...props('artifact-panel', { data: '{}' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('versions array')
  })

  it('shows the limit when the stream simulation bounds its input', () => {
    render(
      <StreamPreview
        {...props('streaming-markdown', {
          content: 'Long text '.repeat(100),
          maxChars: 100,
          streaming: false,
        })}
      />,
    )
    expect(screen.getByText('Preview limited to 100 characters.')).toBeInTheDocument()
  })

  it('supports a custom initial model ID', () => {
    render(
      <ModelPreview
        {...props('model-selector', {
          value: 'custom',
          data: JSON.stringify([{ id: 'custom', name: 'Custom model', provider: 'Test' }]),
        })}
      />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('Custom model')
  })

  it('simulates a failure for custom comparison model IDs', async () => {
    const user = userEvent.setup()
    render(
      <ComparisonPreview
        {...props('model-comparison', {
          failure: true,
          data: JSON.stringify([
            { id: 'a', name: 'First', provider: 'Test' },
            { id: 'b', name: 'Second', provider: 'Test' },
          ]),
        })}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Compare models' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Simulated operation failure')
  })

  it('shows one error when a simulated tool retry fails', async () => {
    const user = userEvent.setup()
    render(
      <ToolPreview
        {...props('tool-call', { status: 'error', expanded: true, failure: true, actions: true })}
      />,
    )
    await user.click(screen.getByRole('button', { name: /retry/i }))
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1))
    expect(await screen.findByText('Simulated retry failed.')).toBeInTheDocument()
  })
  it('downloads the selected artifact version as well as reporting the action', async () => {
    const user = userEvent.setup(),
      data = {
        id: 'artifact',
        title: 'Download example',
        kind: 'text',
        filename: 'selected.txt',
        versions: [
          { id: 'one', label: 'One', content: 'First text' },
          { id: 'two', label: 'Two', content: 'Second text' },
        ],
      }
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const create = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:https://ergon.test/artifact')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const preview = props('artifact-panel', { data: JSON.stringify(data), download: true })
    render(<ArtifactPreview {...preview} />)
    await user.selectOptions(screen.getByLabelText('Artifact version'), 'one')
    await user.click(screen.getByRole('button', { name: 'Download artifact' }))
    expect(click).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith(expect.any(Blob))
    expect((create.mock.calls[0][0] as Blob).size).toBe(new Blob(['First text']).size)
    expect(preview.onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'download-request',
        value: expect.objectContaining({ version: 'one' }),
      }),
    )
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:https://ergon.test/artifact'))
  })
  it('finishes the message status after typing and can restart it', async () => {
    const user = userEvent.setup()
    render(
      <ChatPreview
        {...props('chat-message', {
          content: 'Short text',
          status: 'streaming',
          markdown: false,
          textAnimation: 'typewriter',
          charactersPerSecond: 1000,
          actions: true,
        })}
      />,
    )
    await waitFor(() => expect(screen.queryByText('Writing…')).not.toBeInTheDocument())
    expect(screen.getByText('Short text')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Regenerate message' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Restart typing' }))
    await waitFor(() => expect(screen.queryByText('Writing…')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Regenerate message' })).toBeEnabled()
  })

  it('stops the streaming demo without discarding its draft', async () => {
    const user = userEvent.setup()
    render(
      <PromptPreview
        {...props('prompt-composer', { status: 'streaming', value: 'Keep my draft' })}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Stop generation' }))
    expect(screen.getByRole('textbox', { name: 'Message prompt' })).toHaveValue('Keep my draft')
    expect(screen.getByRole('button', { name: 'Send prompt' })).toBeEnabled()
  })

  it('releases owned blob URLs when an attachment is removed or submitted', async () => {
    const create = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:https://ergon.test/one')
      .mockReturnValueOnce('blob:https://ergon.test/two')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const user = userEvent.setup(),
      view = render(
        <PromptPreview
          {...props('prompt-composer', {
            status: 'idle',
            value: 'Draft',
            upload: true,
            accept: '.txt',
            maxSize: 5,
          })}
        />,
      )
    const input = view.container.querySelector('input[type=file]')!
    fireEvent.change(input, {
      target: { files: [new File(['one'], 'one.txt', { type: 'text/plain' })] },
    })
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'Remove one.txt' }))
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:https://ergon.test/one'))
    fireEvent.change(input, {
      target: { files: [new File(['two'], 'two.txt', { type: 'text/plain' })] },
    })
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send prompt' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Send prompt' }))
    await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:https://ergon.test/two'))
    view.unmount()
    expect(revoke).toHaveBeenCalledTimes(2)
  })
  it('keeps simultaneous attachment uploads alive until they are removed', async () => {
    const create = vi
        .spyOn(URL, 'createObjectURL')
        .mockReturnValueOnce('blob:https://ergon.test/first')
        .mockReturnValueOnce('blob:https://ergon.test/second'),
      revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const view = render(
      <PromptPreview
        {...props('prompt-composer', { upload: true, accept: '.txt', maxFiles: 5 })}
      />,
    )
    fireEvent.change(view.container.querySelector('input[type=file]')!, {
      target: {
        files: [
          new File(['first'], 'first.txt', { type: 'text/plain' }),
          new File(['second'], 'second.txt', { type: 'text/plain' }),
        ],
      },
    })
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send prompt' })).toBeEnabled())
    expect(revoke).not.toHaveBeenCalled()
    view.unmount()
    expect(revoke).toHaveBeenCalledTimes(2)
  })

  it('bounds large stream simulations by the display limit and at most 200 timer ticks', async () => {
    vi.useFakeTimers()
    const view = render(
      <StreamPreview
        {...props('streaming-markdown', {
          content: 'x'.repeat(500000),
          streaming: true,
          maxChars: 10000,
          delay: 20,
          textAnimation: 'none',
        })}
      />,
    )
    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    expect(vi.getTimerCount()).toBe(0)
    // The completion flag lives on the renderer independently of asynchronous Markdown loading.
    expect(view.container.querySelector('[data-slot=streaming-markdown]')).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })

  it('selects any model from editable application metadata', async () => {
    const user = userEvent.setup()
    const models = [
      { id: 'custom-a', name: 'Custom A', provider: 'App' },
      { id: 'custom-b', name: 'Custom B', provider: 'App', parameters: { seed: true } },
    ]
    render(
      <GenerationPreview
        {...props('generation-settings', { models: JSON.stringify(models), model: 'custom-b' })}
      />,
    )
    expect(screen.getByLabelText('Settings model')).toHaveValue('custom-b')
    expect(screen.getByRole('spinbutton', { name: 'Seed' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Settings model'), 'custom-a')
    expect(screen.queryByRole('spinbutton', { name: 'Seed' })).not.toBeInTheDocument()
  })

  it('avoids collisions with edited seed IDs in new and paginated history', async () => {
    const user = userEvent.setup()
    const data = [
      { id: 'new-1', title: 'Existing', updatedAt: '2026-11-01' },
      { id: 'older-conversation', title: 'Existing older', updatedAt: '2026-10-30' },
    ]
    render(
      <HistoryPreview
        {...props('conversation-history', { data: JSON.stringify(data), pagination: true })}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'New conversation' }))
    expect(screen.getAllByRole('button', { name: 'New conversation' })).toHaveLength(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(
      uniqueDemoId([{ id: 'demo-response-1' }, { id: 'demo-response-1-1' }], 'demo-response-1'),
    ).toBe('demo-response-1-2')
  })

  it.each(['upload-plus', 'model-selector'])('parses the %s usage example as valid TSX', (id) => {
    const source = ts.createSourceFile(
      'example.tsx',
      productExamples[id],
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const diagnostics = (source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
      .parseDiagnostics
    expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([])
  })
})
