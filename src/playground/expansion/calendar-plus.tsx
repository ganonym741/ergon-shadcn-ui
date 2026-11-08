import {
  CalendarPlus,
  type CalendarPlusEvent,
  type CalendarPlusView,
} from '@/components/ui/calendar-plus'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { calendarData } from '../expansion-data'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-muted-foreground">
        Sample events only. Switch to Week to see overlapping meetings. Select a time range to
        create an event, or open an event to edit its schedule.
      </p>
      <CalendarPlus
        defaultEvents={parseData(v, 'data', calendarData) as CalendarPlusEvent[]}
        defaultDate={String(v.date)}
        defaultView={v.view as CalendarPlusView}
        editable={!!v.editable}
        creatable={!!v.creatable}
        weekends={!!v.weekends}
        firstDay={Number(v.firstDay) as 0 | 1 | 2 | 3 | 4 | 5 | 6}
        height={Number(v.height)}
        onEventsChange={(value) => report(props, 'events-change', value)}
        onViewChange={(value) => report(props, 'view-change', value)}
        onEventClick={(value) => report(props, 'event-open', value)}
        onEventMove={(event, previous) => report(props, 'event-move', { event, previous })}
        onEventResize={(event, previous) => report(props, 'event-resize', { event, previous })}
        onEventEdit={(event, kind) => report(props, `event-${kind}`, event)}
        onDateSelect={(value) => report(props, 'range-selected', value)}
        renderEvent={
          v.customEvent
            ? (event, time) => (
                <span className="flex items-center gap-1 font-medium">
                  <span aria-hidden="true">✦</span>
                  {time} {event.title}
                </span>
              )
            : undefined
        }
      />
    </div>
  )
}
