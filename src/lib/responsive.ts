import type { CSSProperties } from 'react'
export const breakpoints = { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 } as const
export type Breakpoint = keyof typeof breakpoints
export type Responsive<T> = T | Partial<Record<Breakpoint, T>>
export function responsiveStyle<T>(value: Responsive<T> | undefined, name: string): CSSProperties {
  if (value === undefined) return {}
  const values = typeof value === 'object' && value !== null ? value : { xs: value }
  return Object.fromEntries(
    Object.entries(values).map(([key, v]) => [`--${name}-${key}`, v]),
  ) as CSSProperties
}
export const responsiveCSS = Object.entries(breakpoints)
  .map(([point, min], index) => {
    const fallback = (name: string, initial: string) =>
      Object.keys(breakpoints)
        .slice(0, index + 1)
        .reduce((result, key) => `var(--${name}-${key},${result})`, initial)
    return `@media(min-width:${min}px){.ergon-col{width:calc(${fallback('span', '24')} / 24 * 100%);margin-inline-start:calc(${fallback('offset', '0')} / 24 * 100%);order:${fallback('order', '0')}}.ergon-flex{gap:${fallback('gap', '12px')};flex-direction:${fallback('direction', 'row')}}}`
  })
  .join('')
