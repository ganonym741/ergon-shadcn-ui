import * as React from 'react'
import { format, isSameDay, addDays, addMonths, startOfMonth, startOfWeek } from 'date-fns'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import type { DayButton } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { useUIConfig } from '@/components/ui/config-provider'
export interface CalendarEvent {
  id: string
  date: Date
  title: string
  color?: string
}
export function EventCalendar({
  events,
  value,
  onValueChange,
  mode = 'compact',
}: {
  events: CalendarEvent[]
  value?: Date
  onValueChange?: (date: Date | undefined) => void
  mode?: 'compact' | 'month' | 'year'
}) {
  const config = useUIConfig(),
    [view, setView] = React.useState(() => value ?? new Date()),
    root = React.useRef<HTMLDivElement>(null),
    start = startOfWeek(startOfMonth(view)),
    days = Array.from({ length: 42 }, (_, index) => addDays(start, index))
  const select = (date: Date) => {
    onValueChange?.(date)
  }
  const focus = (date: Date) => {
    select(date)
    if (date.getMonth() !== view.getMonth()) setView(date)
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(`[data-calendar-date="${format(date, 'yyyy-MM-dd')}"]`)
        ?.focus(),
    )
  }
  if (mode === 'compact')
    return (
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onValueChange}
          className="mx-auto rounded-xl border"
          components={{
            DayButton: (props: React.ComponentProps<typeof DayButton>) => {
              const matches = events.filter((event) => isSameDay(event.date, props.day.date))
              return (
                <CalendarDayButton
                  {...props}
                  title={matches.map((event) => event.title).join(', ')}
                >
                  {props.children}
                  {matches.length > 0 && (
                    <span className="flex gap-0.5">
                      {matches.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className="size-1 rounded-full"
                          style={{ background: event.color ?? 'var(--primary)' }}
                        />
                      ))}
                    </span>
                  )}
                </CalendarDayButton>
              )
            },
          }}
        />
        {value && (
          <ul className="space-y-2">
            {events
              .filter((event) => isSameDay(event.date, value))
              .map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: event.color ?? 'var(--primary)' }}
                  />
                  {event.title}
                </li>
              ))}
            {!events.some((event) => isSameDay(event.date, value)) && (
              <li className="text-center text-xs text-muted-foreground">
                No events on{' '}
                {new Intl.DateTimeFormat(config.locale, { dateStyle: 'medium' }).format(value)}.
              </li>
            )}
          </ul>
        )}
      </div>
    )
  return (
    <section className="w-full space-y-4">
      <header className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous period"
          onClick={() => setView((date) => addMonths(date, mode === 'year' ? -12 : -1))}
        >
          ←
        </Button>
        <h3 className="text-sm font-semibold">
          {new Intl.DateTimeFormat(
            config.locale,
            mode === 'year' ? { year: 'numeric' } : { year: 'numeric', month: 'long' },
          ).format(view)}
        </h3>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next period"
          onClick={() => setView((date) => addMonths(date, mode === 'year' ? 12 : 1))}
        >
          →
        </Button>
      </header>
      {mode === 'year' ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 12 }, (_, month) => {
            const date = new Date(view.getFullYear(), month, 1),
              matches = events.filter(
                (event) =>
                  event.date.getFullYear() === view.getFullYear() &&
                  event.date.getMonth() === month,
              )
            return (
              <button
                key={month}
                className="min-h-28 rounded-lg border p-4 text-left hover:border-primary"
                onClick={() => select(date)}
              >
                <span className="text-sm font-medium">
                  {new Intl.DateTimeFormat(config.locale, { month: 'long' }).format(date)}
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  {matches.length} events
                </span>
                {matches.slice(0, 2).map((event) => (
                  <span key={event.id} className="mt-1 block truncate text-[10px] text-primary">
                    {event.title}
                  </span>
                ))}
              </button>
            )
          })}
        </div>
      ) : (
        <div
          ref={root}
          role="grid"
          aria-label="Month calendar"
          className="overflow-x-auto rounded-lg border"
        >
          <div role="row" className="grid min-w-[490px] grid-cols-7">
            {days.slice(0, 7).map((day) => (
              <div
                role="columnheader"
                key={+day}
                className="border-b p-2 text-center text-xs text-muted-foreground"
              >
                {new Intl.DateTimeFormat(config.locale, { weekday: 'short' }).format(day)}
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, week) => (
            <div role="row" key={week} className="grid min-w-[490px] grid-cols-7">
              {days.slice(week * 7, week * 7 + 7).map((day) => (
                <button
                  role="gridcell"
                  aria-label={new Intl.DateTimeFormat(config.locale, { dateStyle: 'full' }).format(
                    day,
                  )}
                  aria-selected={!!value && isSameDay(value, day)}
                  tabIndex={isSameDay(value ?? view, day) ? 0 : -1}
                  data-calendar-date={format(day, 'yyyy-MM-dd')}
                  key={+day}
                  onClick={() => select(day)}
                  onKeyDown={(event) => {
                    const delta: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                      Home: -day.getDay(),
                      End: 6 - day.getDay(),
                    }
                    if (event.key in delta) {
                      event.preventDefault()
                      focus(addDays(day, delta[event.key]))
                    }
                    if (event.key === 'PageUp' || event.key === 'PageDown') {
                      event.preventDefault()
                      focus(addMonths(day, event.key === 'PageUp' ? -1 : 1))
                    }
                  }}
                  className={`min-h-24 border-b border-r p-2 text-left align-top hover:bg-muted/40 aria-selected:bg-primary/10 ${day.getMonth() !== view.getMonth() ? 'bg-muted/30 text-muted-foreground' : ''}`}
                >
                  <span className="text-xs">{day.getDate()}</span>
                  {events
                    .filter((event) => isSameDay(event.date, day))
                    .map((event) => (
                      <span
                        key={event.id}
                        className="mt-1 block truncate rounded bg-background/90 p-1 text-[10px] text-foreground"
                      >
                        {event.title}
                      </span>
                    ))}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
