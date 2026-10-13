import * as React from 'react'
import { breakpoints, type Breakpoint } from '@/lib/responsive'
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
}) {
  const [internal, setInternal] = React.useState(defaultValue)
  const current = value === undefined ? internal : value
  const currentRef = React.useRef(current),
    valueRef = React.useRef(value),
    changeRef = React.useRef(onChange)
  currentRef.current = current
  valueRef.current = value
  changeRef.current = onChange
  const set = React.useCallback((next: T | ((previous: T) => T)) => {
    const previous = currentRef.current
    const result = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next
    if (Object.is(previous, result)) return
    currentRef.current = result
    if (valueRef.current === undefined) setInternal(result)
    changeRef.current?.(result)
  }, [])
  return [current, set] as const
}
export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  React.useEffect(() => {
    const m = window.matchMedia(query)
    const update = () => setMatches(m.matches)
    update()
    m.addEventListener('change', update)
    return () => m.removeEventListener('change', update)
  }, [query])
  return matches
}
export function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, set] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => set(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}
export function useBreakpoints() {
  const [width, setWidth] = React.useState(() =>
    typeof window === 'undefined' ? 0 : window.innerWidth,
  )
  React.useEffect(() => {
    const update = () => setWidth(window.innerWidth)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return Object.fromEntries(
    Object.entries(breakpoints).map(([key, min]) => [key, width >= min]),
  ) as Record<Breakpoint, boolean>
}
