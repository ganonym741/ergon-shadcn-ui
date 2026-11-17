import * as React from 'react'
import { NotificationInbox, type InboxNotification } from '@/components/ui/notification-inbox'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { inboxData } from '../product-data'
import { DemoNote, simulate, report, uniqueDemoId } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [items, setItems] = React.useState(parseData(v, 'data', inboxData) as InboxNotification[]),
    [loaded, setLoaded] = React.useState(false)
  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <DemoNote>
        Read, archive, delete or use a notification action. Persistence and pagination below are
        simulated local callbacks.
      </DemoNote>
      <NotificationInbox
        items={items}
        onItemsChange={setItems}
        defaultFilter={v.filter as 'all' | 'unread' | 'archived'}
        disabled={!!v.disabled}
        hasMore={!!v.pagination && !loaded}
        onLoadMore={async ({ signal }) => {
          await simulate(signal, !!v.failure)
          if (!signal.aborted) {
            setItems((previous) => [
              ...previous,
              {
                id: uniqueDemoId(previous, 'loaded-notice'),
                title: 'A little more context',
                description: 'Loaded from the simulated pagination callback.',
                createdAt: '2026-11-02T10:00:00+07:00',
                read: false,
              },
            ])
            setLoaded(true)
            report(props, 'pagination', 'Added one local notification')
          }
        }}
        onAction={
          v.actions
            ? async (item, action, { signal }) => {
                await simulate(signal, !!v.failure)
                report(props, 'notification-action', { id: item.id, action })
              }
            : undefined
        }
      />
    </div>
  )
}
