import * as React from 'react'
import {
  ConversationHistory,
  type ConversationHistoryItem,
} from '@/components/ui/conversation-history'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { historyData } from '../product-data'
import { DemoNote, simulate, report, uniqueDemoId } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [items, setItems] = React.useState(
      parseData(v, 'data', historyData) as ConversationHistoryItem[],
    ),
    [selected, setSelected] = React.useState('workspace'),
    [loaded, setLoaded] = React.useState(false),
    count = React.useRef(0)
  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      <DemoNote>
        Conversation history, edits, archive actions and pagination are local examples with stable
        IDs. Connect callbacks to your own persistence layer.
      </DemoNote>
      <ConversationHistory
        items={items}
        selectedId={selected}
        onSelect={(item) => {
          setSelected(item.id)
          report(props, 'open-conversation', item.id)
        }}
        onNew={() => {
          const id = uniqueDemoId(items, `new-${++count.current}`)
          setItems((current) => [
            { id, title: 'New conversation', updatedAt: new Date().toISOString(), group: 'Today' },
            ...current,
          ])
          setSelected(id)
          report(props, 'new-conversation', id)
        }}
        onItemsChange={v.actions ? setItems : undefined}
        onAction={
          v.actions
            ? async (item, action, { signal }) => {
                await simulate(signal, !!v.failure)
                report(props, 'history-action', { id: item.id, action })
              }
            : undefined
        }
        disabled={!!v.disabled}
        hasMore={!!v.pagination && !loaded}
        onLoadMore={async ({ signal }) => {
          await simulate(signal, !!v.failure)
          if (!signal.aborted) {
            setItems((current) => [
              ...current,
              {
                id: uniqueDemoId(current, 'older-conversation'),
                title: 'A useful empty state',
                updatedAt: '2026-10-30T10:00:00+07:00',
                group: 'Earlier',
              },
            ])
            setLoaded(true)
            report(props, 'history-pagination', 'One local entry')
          }
        }}
      />
    </div>
  )
}
