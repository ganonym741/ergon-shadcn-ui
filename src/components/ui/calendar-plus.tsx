import * as React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions, EventApi, EventContentArg, EventDropArg } from '@fullcalendar/core'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useControllableState } from '@/components/ui/util'
import { useUIConfig } from '@/components/ui/config-provider'
import { cn } from '@/lib/utils'
import { contrastForeground } from '@/lib/contrast'

export type CalendarPlusView = 'month' | 'week' | 'day' | 'agenda'
export interface CalendarPlusEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  color?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  editable?: boolean
  extendedProps?: Record<string, unknown>
}
export interface CalendarPlusProps extends Omit<React.ComponentProps<'section'>, 'onChange'> {
  events?: CalendarPlusEvent[]
  defaultEvents?: CalendarPlusEvent[]
  onEventsChange?: (events: CalendarPlusEvent[]) => void
  view?: CalendarPlusView
  defaultView?: CalendarPlusView
  onViewChange?: (view: CalendarPlusView) => void
  date?: string
  defaultDate?: string
  onDateChange?: (date: string) => void
  editable?: boolean
  creatable?: boolean
  weekends?: boolean
  firstDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  locale?: string
  height?: number | 'auto'
  label?: string
  onEventClick?: (event: CalendarPlusEvent) => void
  onEventMove?: (event: CalendarPlusEvent, previous: CalendarPlusEvent) => void
  onEventResize?: (event: CalendarPlusEvent, previous: CalendarPlusEvent) => void
  onEventEdit?: (event: CalendarPlusEvent, kind: 'create' | 'edit' | 'delete') => void
  onRangeChange?: (range: { start: string; end: string; view: CalendarPlusView }) => void
  onDateSelect?: (selection: { start: string; end: string; allDay: boolean }) => void
  renderEvent?: (event: CalendarPlusEvent, timeText: string) => React.ReactNode
  options?: Omit<
    CalendarOptions,
    | 'plugins'
    | 'events'
    | 'eventSources'
    | 'initialView'
    | 'initialDate'
    | 'editable'
    | 'headerToolbar'
    | 'eventContent'
  >
}
const viewNames = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
  agenda: 'listWeek',
} as const
const viewKey = (name: string) =>
  (Object.entries(viewNames).find(([, value]) => value === name)?.[0] as CalendarPlusView) ??
  'month'
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value) &&
    !Number.isNaN(new Date(value).getTime()) &&
    new Date(value.slice(0, 10)).toISOString().slice(0, 10) === value.slice(0, 10)
  )
}
function shiftDay(value: string, days: number) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
function fromApi(event: EventApi): CalendarPlusEvent {
  return {
    id: event.id,
    title: event.title,
    start: event.startStr,
    end: event.endStr || undefined,
    allDay: event.allDay,
    backgroundColor: event.backgroundColor || undefined,
    borderColor: event.borderColor || undefined,
    textColor: event.textColor || undefined,
    extendedProps: event.extendedProps,
  }
}
const styles = `.ergon-calendar{--fc-border-color:var(--border);--fc-page-bg-color:var(--background);--fc-neutral-bg-color:var(--muted);--fc-list-event-hover-bg-color:var(--accent);--fc-today-bg-color:color-mix(in srgb,var(--primary) 7%,transparent);--fc-event-bg-color:var(--primary);--fc-event-border-color:var(--primary);--fc-event-text-color:var(--primary-foreground)}.ergon-calendar .fc{font:inherit;font-size:12px}.ergon-calendar .fc .fc-scrollgrid{border-radius:10px;overflow:hidden}.ergon-calendar .fc .fc-col-header-cell-cushion{padding:10px 4px;font-weight:500;color:var(--muted-foreground)}.ergon-calendar .fc .fc-daygrid-day-number{padding:7px 9px}.ergon-calendar .fc .fc-day-other .fc-daygrid-day-top{opacity:1;color:var(--muted-foreground)}.ergon-calendar .fc .fc-event{border-radius:5px;padding:2px 4px;cursor:pointer}.ergon-calendar .fc .fc-daygrid-event{margin:2px 4px}.ergon-calendar .fc .fc-list-day-cushion{background:var(--muted)}.ergon-calendar .fc a:focus-visible{outline:2px solid var(--ring);outline-offset:2px}.ergon-calendar .fc .fc-timegrid-slot{height:2.1rem}`
interface CalendarContext {
  calendar: React.RefObject<FullCalendar | null>
  engine: CalendarOptions
  view: CalendarPlusView
  setView: (view: CalendarPlusView) => void
  date: string
  title: string
  editable: boolean
  creatable: boolean
  setDraft: (event: CalendarPlusEvent | null) => void
  events: CalendarPlusEvent[]
  commit: (event: CalendarPlusEvent, kind: 'create' | 'edit' | 'delete') => void
  draft: CalendarPlusEvent | null
}
const Context = React.createContext<CalendarContext | null>(null)
function useCalendarPlus() {
  const c = React.useContext(Context)
  if (!c) throw new Error('Calendar+ parts need CalendarPlus.')
  return c
}
/** Composes the free FullCalendar views with controlled event data, themed controls, and injected change callbacks. */
export function CalendarPlus({
  events,
  defaultEvents = [],
  onEventsChange,
  view,
  defaultView = 'month',
  onViewChange,
  date,
  defaultDate = dateKey(new Date()),
  onDateChange,
  editable = false,
  creatable = true,
  weekends = true,
  firstDay = 1,
  locale,
  height = 580,
  label = 'Event calendar',
  onEventClick,
  onEventMove,
  onEventResize,
  onEventEdit,
  onRangeChange,
  onDateSelect,
  renderEvent,
  options,
  className,
  children,
  ...props
}: CalendarPlusProps) {
  const config = useUIConfig(),
    calendar = React.useRef<FullCalendar>(null)
  const [items, setItems] = useControllableState({
      value: events,
      defaultValue: defaultEvents,
      onChange: onEventsChange,
    }),
    [activeView, setView] = useControllableState({
      value: view,
      defaultValue: defaultView,
      onChange: onViewChange,
    }),
    [activeDate, setDate] = useControllableState({
      value: date,
      defaultValue: defaultDate,
      onChange: onDateChange,
    })
  const [title, setTitle] = React.useState(''),
    [draft, setDraft] = React.useState<CalendarPlusEvent | null>(null)
  const error = !validDate(activeDate)
    ? 'Provide a valid calendar date.'
    : new Set(items.map((event) => event.id)).size !== items.length ||
        items.some((event) => !event.id)
      ? 'Calendar event IDs must be unique.'
      : items.some(
            (event) =>
              !validDate(event.start) ||
              (event.end &&
                (!validDate(event.end) || new Date(event.end) <= new Date(event.start))),
          )
        ? 'Events need valid dates with the end after the start.'
        : undefined
  React.useEffect(() => {
    const api = calendar.current?.getApi()
    if (api && api.view.type !== viewNames[activeView]) api.changeView(viewNames[activeView])
  }, [activeView, error])
  React.useEffect(() => {
    const api = calendar.current?.getApi()
    if (api && !error && dateKey(api.getDate()) !== activeDate.slice(0, 10))
      api.gotoDate(activeDate)
  }, [activeDate, error])
  const commit = (event: CalendarPlusEvent, kind: 'create' | 'edit' | 'delete') => {
    setItems(
      kind === 'delete'
        ? items.filter((item) => item.id !== event.id)
        : kind === 'create'
          ? [...items, event]
          : items.map((item) => (item.id === event.id ? event : item)),
    )
    onEventEdit?.(event, kind)
    setDraft(null)
  }
  const changed = (info: Pick<EventDropArg, 'event' | 'oldEvent'>, kind: 'move' | 'resize') => {
    const next = fromApi(info.event),
      previous = items.find((item) => item.id === next.id) ?? fromApi(info.oldEvent)
    setItems(items.map((item) => (item.id === next.id ? { ...item, ...next } : item)))
    ;(kind === 'move' ? onEventMove : onEventResize)?.(next, previous)
  }
  const engine: CalendarOptions = {
    ...options,
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView: viewNames[activeView],
    initialDate: error ? undefined : activeDate,
    headerToolbar: false,
    events: items.map((event) => ({
      ...event,
      textColor:
        event.textColor ??
        (event.backgroundColor || event.color
          ? contrastForeground(event.backgroundColor || event.color!)
          : undefined),
    })),
    editable,
    selectable: editable && creatable,
    weekends,
    firstDay,
    direction:
      options?.direction ??
      (props.dir === 'rtl' || props.dir === 'ltr' ? props.dir : config.direction),
    locale: locale ?? config.locale,
    height,
    nowIndicator: true,
    dayMaxEvents: true,
    datesSet: (info) => {
      setTitle(info.view.title)
      setDate(dateKey(info.view.calendar.getDate()))
      setView(viewKey(info.view.type))
      onRangeChange?.({ start: info.startStr, end: info.endStr, view: viewKey(info.view.type) })
    },
    eventClick: (info) => {
      info.jsEvent.preventDefault()
      const event = { ...items.find((item) => item.id === info.event.id), ...fromApi(info.event) }
      onEventClick?.(event)
      setDraft({ ...event })
    },
    eventDidMount: (info) => {
      info.el.setAttribute('role', 'button')
      info.el.setAttribute(
        'aria-label',
        `${info.event.title}, ${info.event.start?.toLocaleString(locale ?? config.locale, info.event.allDay ? { year: 'numeric', month: 'long', day: 'numeric' } : { dateStyle: 'medium', timeStyle: 'short' }) ?? info.event.startStr}`,
      )
      options?.eventDidMount?.(info)
    },
    eventDrop: (info) => changed(info, 'move'),
    eventResize: (info) => changed(info, 'resize'),
    select: (info) => {
      const selection = { start: info.startStr, end: info.endStr, allDay: info.allDay }
      onDateSelect?.(selection)
      if (editable && creatable) setDraft({ id: crypto.randomUUID(), title: '', ...selection })
      calendar.current?.getApi().unselect()
    },
    eventContent: renderEvent
      ? (info: EventContentArg) =>
          renderEvent(
            items.find((item) => item.id === info.event.id) ?? fromApi(info.event),
            info.timeText,
          )
      : undefined,
  }
  return (
    <Context.Provider
      value={{
        calendar,
        engine,
        view: activeView,
        setView,
        date: activeDate,
        title,
        editable,
        creatable,
        setDraft,
        events: items,
        commit,
        draft,
      }}
    >
      <section
        {...props}
        aria-label={label}
        data-slot="calendar-plus"
        className={cn('ergon-calendar w-full min-w-0 space-y-4', className)}
      >
        <style nonce={props.nonce}>{styles}</style>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        ) : (
          (children ?? (
            <>
              <CalendarPlusToolbar />
              <CalendarPlusContent />
            </>
          ))
        )}
        <CalendarPlusEventEditor key={draft?.id ?? 'closed'} />
      </section>
    </Context.Provider>
  )
}
/** Provides month/week/day/agenda selection and date navigation outside the calendar grid. */
export function CalendarPlusToolbar() {
  const c = useCalendarPlus()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Previous period"
          onClick={() => c.calendar.current?.getApi().prev()}
        >
          <ChevronLeft className="rtl:rotate-180" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Next period"
          onClick={() => c.calendar.current?.getApi().next()}
        >
          <ChevronRight className="rtl:rotate-180" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => c.calendar.current?.getApi().today()}
        >
          Today
        </Button>
      </div>
      <h3 aria-live="polite" className="min-w-0 flex-1 text-base font-semibold">
        {c.title}
      </h3>
      <div
        role="group"
        aria-label="Calendar view"
        className="flex flex-wrap rounded-lg border p-0.5"
      >
        {(Object.keys(viewNames) as CalendarPlusView[]).map((view) => (
          <Button
            type="button"
            key={view}
            size="sm"
            variant={c.view === view ? 'secondary' : 'ghost'}
            aria-pressed={c.view === view}
            onClick={() => c.setView(view)}
          >
            {view[0].toUpperCase() + view.slice(1)}
          </Button>
        ))}
      </div>
      {c.editable && c.creatable && (
        <Button
          type="button"
          size="sm"
          onClick={() =>
            c.setDraft({
              id: crypto.randomUUID(),
              title: '',
              start: c.date.slice(0, 10),
              end: shiftDay(c.date, 1),
              allDay: true,
            })
          }
        >
          <Plus />
          New event
        </Button>
      )}
    </div>
  )
}
/** Mounts the actual scheduler inside a horizontally scrollable surface for compact screens. */
export function CalendarPlusContent() {
  const c = useCalendarPlus()
  return (
    <div className="overflow-x-auto rounded-xl">
      <div
        className={
          c.view === 'month'
            ? 'min-w-[480px]'
            : c.view === 'week'
              ? 'min-w-[640px]'
              : c.view === 'day'
                ? 'min-w-[360px]'
                : undefined
        }
      >
        <FullCalendar ref={c.calendar} {...c.engine} />
      </div>
    </div>
  )
}
/** Edits event details with keyboard-accessible date inputs as an alternative to dragging or resizing. */
export function CalendarPlusEventEditor() {
  const c = useCalendarPlus(),
    initial = c.draft,
    [draft, setDraft] = React.useState(initial),
    [error, setError] = React.useState(''),
    id = React.useId(),
    exists = !!initial && c.events.some((event) => event.id === initial.id)
  const allDay = draft?.allDay ?? false,
    canEdit = c.editable && draft?.editable !== false
  const utc = c.engine.timeZone === 'UTC'
  const inputDate = (value?: string, end = false) => {
    if (!value) return ''
    if (allDay) return end ? shiftDay(value, -1) : value.slice(0, 10)
    const date = new Date(value + (utc && !/(Z|[+-]\d{2}:\d{2})$/.test(value) ? 'Z' : ''))
    if (Number.isNaN(date.getTime())) return ''
    return utc
      ? date.toISOString().slice(0, 16)
      : `${dateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
  return (
    <Dialog
      open={!!initial}
      onOpenChange={(open) => {
        if (!open) c.setDraft(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {canEdit ? (exists ? 'Edit event' : 'New event') : 'Event details'}
          </DialogTitle>
          <DialogDescription>
            {canEdit
              ? 'Choose the title and schedule for this event.'
              : 'View the schedule and event details.'}
          </DialogDescription>
        </DialogHeader>
        {draft && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!canEdit) return
              const next = { ...draft, title: draft.title.trim() }
              if (
                !next.title ||
                !validDate(next.start) ||
                (next.end && new Date(next.end) <= new Date(next.start))
              ) {
                setError('Add a title and choose an end after the start.')
                return
              }
              c.commit(next, exists ? 'edit' : 'create')
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label htmlFor={`${id}-title`} className="text-xs font-medium">
                Title
              </label>
              <Input
                id={`${id}-title`}
                value={draft.title}
                readOnly={!canEdit}
                onValueChange={(title) => setDraft({ ...draft, title })}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allDay}
                disabled={!canEdit}
                onChange={(event) => {
                  const next = event.target.checked
                  setDraft({
                    ...draft,
                    allDay: next,
                    start: next ? draft.start.slice(0, 10) : `${draft.start.slice(0, 10)}T09:00`,
                    end: next ? shiftDay(draft.start, 1) : `${draft.start.slice(0, 10)}T10:00`,
                  })
                }}
              />
              All-day event
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['start', 'end'] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <label htmlFor={`${id}-${field}`} className="text-xs font-medium">
                    {field === 'start' ? 'Start' : allDay ? 'Last day' : 'End'}
                  </label>
                  <Input
                    id={`${id}-${field}`}
                    type={allDay ? 'date' : 'datetime-local'}
                    value={inputDate(draft[field], field === 'end')}
                    readOnly={!canEdit}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        [field]: allDay
                          ? field === 'end' && value
                            ? shiftDay(value, 1)
                            : value
                          : value
                            ? new Date(value + (utc ? 'Z' : '')).toISOString()
                            : value,
                      })
                    }
                    required={field === 'start'}
                  />
                </div>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              {canEdit && exists && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => c.commit(draft, 'delete')}
                >
                  <Trash2 />
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => c.setDraft(null)}>
                {canEdit ? 'Cancel' : 'Close'}
              </Button>
              {canEdit && <Button type="submit">{exists ? 'Save event' : 'Create event'}</Button>}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
