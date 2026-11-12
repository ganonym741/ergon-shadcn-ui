import * as React from 'react'
import { ChatMessage, type ChatMessageProps } from '@/components/ui/chat-message'
import { StreamingMarkdown } from '@/components/ui/streaming-markdown'
import { Button } from '@/components/ui/button'
import { useTextStream } from '@/components/ui/text-stream'
import type { PreviewProps } from '../preview'
import { DemoNote, simulate, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [text, setText] = React.useState(String(v.content)),
    [rating, setRating] = React.useState<'up' | 'down' | null>(null),
    [branch, setBranch] = React.useState('first'),
    [restart, setRestart] = React.useState(0),
    [status, setStatus] = React.useState(v.status as ChatMessageProps['status'])
  const revealed = useTextStream(text, {
    streaming: status === 'streaming',
    textAnimation: v.textAnimation as 'typewriter' | 'none',
    charactersPerSecond: +v.charactersPerSecond,
    streamKey: `${restart}-${branch}`,
    immediate: status === 'error' || status === 'cancelled',
  })
  React.useEffect(() => {
    if (status === 'streaming' && !revealed.isRevealing) setStatus('complete')
  }, [status, revealed.isRevealing])
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        Message edits, regeneration, feedback and branch selection are local examples. Copy uses
        your browser clipboard.
      </DemoNote>
      {v.status === 'streaming' && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setRestart((value) => value + 1)
            setStatus('streaming')
          }}
        >
          Restart typing
        </Button>
      )}
      <ChatMessage
        key={restart}
        id="example-message"
        role={v.role as ChatMessageProps['role']}
        author={String(v.author)}
        textAnimation="none"
        charactersPerSecond={+v.charactersPerSecond}
        content={
          v.markdown ? (
            <StreamingMarkdown
              key={branch}
              content={revealed.text}
              streaming={status === 'streaming'}
              textAnimation="none"
              charactersPerSecond={+v.charactersPerSecond}
            />
          ) : (
            revealed.text
          )
        }
        copyText={text}
        status={status}
        metadata="Example metadata · app-reported values belong here"
        onEdit={
          v.actions
            ? async (text, { signal }) => {
                await simulate(signal, !!v.failure)
                if (!signal.aborted) {
                  setText(text)
                  report(props, 'edited', text)
                }
              }
            : undefined
        }
        onRetry={
          v.actions
            ? async ({ signal }) => {
                await simulate(signal, !!v.failure)
                if (!signal.aborted) {
                  setText(
                    'A regenerated local example: give the next useful action a clear place, and keep related details together.',
                  )
                  report(props, 'regenerated', 'Local example')
                  setStatus('complete')
                }
              }
            : undefined
        }
        rating={rating}
        onRatingChange={
          v.actions
            ? (next) => {
                setRating(next)
                report(props, 'feedback', next)
              }
            : undefined
        }
        branches={
          v.branches
            ? [
                { id: 'first', label: 'Concise' },
                { id: 'second', label: 'Detailed' },
              ]
            : undefined
        }
        branchId={branch}
        onBranchChange={(next) => {
          setBranch(next)
          setText(
            next === 'first'
              ? String(v.content)
              : 'A different local response branch: start with hierarchy, bring related controls closer together, and use a consistent rhythm of spacing.',
          )
          report(props, 'branch', next)
        }}
      />
    </div>
  )
}
