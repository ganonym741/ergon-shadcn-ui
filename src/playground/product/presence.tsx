import * as React from 'react'
import {
  Presence,
  PresenceAvatars,
  PresenceCanvas,
  PresenceTyping,
  type PresenceUser,
} from '@/components/ui/presence'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { presenceData } from '../product-data'
import { DemoNote, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [users, setUsers] = React.useState(parseData(v, 'data', presenceData) as PresenceUser[]),
    last = React.useRef(0)
  React.useEffect(() => {
    if (!v.live) return
    let tick = 0
    const timer = setInterval(() => {
      tick++
      setUsers((previous) =>
        previous.map((user) =>
          user.id === 'maya'
            ? {
                ...user,
                cursor: { x: 0.32 + Math.sin(tick / 3) * 0.13, y: 0.35 + Math.cos(tick / 4) * 0.1 },
                typing: tick % 7 < 4,
              }
            : user,
        ),
      )
    }, 900)
    return () => clearInterval(timer)
  }, [v.live])
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        Participants and remote cursors are simulated locally. Move over the shared area to emit
        normalized cursor coordinates. Your application supplies presence data and its realtime
        transport.
      </DemoNote>
      <Presence
        users={users}
        currentUserId="you"
        connection={v.connection as 'online' | 'reconnecting' | 'offline'}
        maxVisible={+v.max}
        staleAfter={+v.stale * 1000}
        onCursorChange={(cursor) => {
          if (Date.now() - last.current > 350 || !cursor) {
            last.current = Date.now()
            report(props, 'local-cursor', cursor)
          }
        }}
        renderAvatar={
          v.customAvatar
            ? (user) => (
                <span className="grid h-full w-full place-content-center bg-primary/10 text-[10px] font-semibold text-primary">
                  {user.name.slice(0, 2)}
                </span>
              )
            : undefined
        }
      >
        <PresenceAvatars />
        <PresenceCanvas className="min-h-64">
          <div className="pointer-events-none grid min-h-64 place-content-center gap-3 px-10 text-center">
            <span className="mx-auto rounded-full border bg-background px-3 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              A shared canvas
            </span>
            <h3 className="text-xl font-semibold tracking-tight">Better ideas, together.</h3>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              A little room for everyone to explore the next useful thing.
            </p>
          </div>
        </PresenceCanvas>
        <PresenceTyping />
      </Presence>
    </div>
  )
}
