import { enUS, id, de, fr, ja } from 'date-fns/locale'
export const dateLocales = { 'en-US': enUS, 'id-ID': id, 'de-DE': de, 'fr-FR': fr, 'ja-JP': ja }
export const getDateLocale = (locale: string) =>
  dateLocales[locale as keyof typeof dateLocales] ?? enUS
export function toZonedInput(date: Date, timeZone: string) {
  if (!Number.isFinite(+date)) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date),
    part = (type: string) => parts.find((p) => p.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`
}
export function fromZonedInput(text: string, timeZone: string) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(text))
    throw new Error('Enter a valid date and time')
  const normalized = text.length === 16 ? text + ':00' : text,
    wall = Date.parse(normalized + 'Z'),
    matches: number[] = []
  for (let offset = -36; offset <= 36; offset += 6) {
    const sample = wall + offset * 3600000,
      zoneWall = Date.parse(toZonedInput(new Date(sample), timeZone) + 'Z'),
      candidate = wall - (zoneWall - sample)
    if (toZonedInput(new Date(candidate), timeZone) === normalized) matches.push(candidate)
  }
  if (!matches.length) throw new Error('This local time does not exist in the selected time zone')
  return new Date(Math.min(...matches))
}
