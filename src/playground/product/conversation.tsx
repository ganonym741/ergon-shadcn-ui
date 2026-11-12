import * as React from 'react'
import { Conversation } from '@/components/ui/conversation'
import type { ChatMessageProps } from '@/components/ui/chat-message'
import { ChatMessage } from '@/components/ui/chat-message'
import { StreamingMarkdown } from '@/components/ui/streaming-markdown'
import { Button } from '@/components/ui/button'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { messageData } from '../product-data'
import { DemoNote, simulate, report, uniqueDemoId } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [messages, setMessages] = React.useState(
      parseData(v, 'data', messageData) as ChatMessageProps[],
    ),
    [earlier, setEarlier] = React.useState(false),
    [streaming, setStreaming] = React.useState(false),
    counter = React.useRef(0),
    abort = React.useRef<AbortController | null>(null)
  React.useEffect(() => () => abort.current?.abort(), [])
  const append = async () => {
    if (streaming) return
    const controller = new AbortController()
    abort.current = controller
    setStreaming(true)
    const id = uniqueDemoId(messages, `demo-response-${++counter.current}`),
      chunks = [
        'A calmer workspace starts with **one clear priority**.',
        '\n\nGroup related details and give each decision enough room.',
        '\n\n- Keep actions close\n- Make feedback timely\n- Support the keyboard',
      ]
    setMessages((current) => [
      ...current,
      { id, role: 'assistant', content: '', status: 'streaming' },
    ])
    try {
      for (const chunk of chunks) {
        await simulate(controller.signal)
        setMessages((current) =>
          current.map((message) =>
            message.id === id ? { ...message, content: String(message.content) + chunk } : message,
          ),
        )
      }
      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, status: 'complete' } : message,
        ),
      )
      report(props, 'simulated-response', id)
    } catch (failure) {
      if (!controller.signal.aborted) {
        setMessages((current) =>
          current.map((message) => (message.id === id ? { ...message, status: 'error' } : message)),
        )
        report(
          props,
          'simulation-error',
          failure instanceof Error ? failure.message : String(failure),
        )
      }
    } finally {
      if (!controller.signal.aborted) setStreaming(false)
    }
  }
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        Local messages and simulated responses. Scroll upward before appending a response to try the
        jump-to-latest control; load earlier messages to check position anchoring.
      </DemoNote>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={streaming}
          onClick={() => void append()}
        >
          Append streamed example
        </Button>
      </div>
      <Conversation
        messages={messages}
        height={+v.height}
        autoScroll={!!v.autoScroll}
        textAnimation={v.textAnimation as 'typewriter' | 'none'}
        charactersPerSecond={+v.charactersPerSecond}
        hasEarlier={!!v.earlier && !earlier}
        onLoadEarlier={async ({ signal }) => {
          await simulate(signal, !!v.failure)
          if (!signal.aborted) {
            setMessages((current) => [
              {
                id: uniqueDemoId(current, 'earlier-context'),
                role: 'user',
                content: 'We are collecting a few ideas for the next design review.',
              },
              ...current,
            ])
            setEarlier(true)
            report(props, 'history-loaded', 'One local earlier message')
          }
        }}
        renderMessage={(message) => (
          <ChatMessage
            {...message}
            textAnimation={v.textAnimation as 'typewriter' | 'none'}
            charactersPerSecond={+v.charactersPerSecond}
            content={
              v.markdown && message.role === 'assistant' ? (
                <StreamingMarkdown
                  content={String(message.content)}
                  streaming={message.status === 'streaming'}
                  textAnimation={v.textAnimation as 'typewriter' | 'none'}
                  charactersPerSecond={+v.charactersPerSecond}
                />
              ) : (
                message.content
              )
            }
            copyText={String(message.content)}
          />
        )}
      />
    </div>
  )
}
