import type { HTMLAttributes, CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { responsiveStyle, responsiveCSS, type Responsive } from '@/lib/responsive'
export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  vertical?: boolean
  gap?: Responsive<number>
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  wrap?: boolean
  direction?: Responsive<CSSProperties['flexDirection']>
}
export function Flex({
  vertical,
  gap = 12,
  align = 'center',
  justify = 'flex-start',
  wrap,
  className,
  style,
  direction,
  children,
  ...props
}: FlexProps) {
  const spacing =
    typeof gap === 'number'
      ? `${gap}px`
      : Object.fromEntries(Object.entries(gap).map(([key, value]) => [key, `${value}px`]))
  return (
    <div
      className={cn('ergon-flex flex', className)}
      style={{
        ...responsiveStyle(spacing, 'gap'),
        ...responsiveStyle(direction ?? (vertical ? 'column' : 'row'), 'direction'),
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...props}
    >
      <style>{responsiveCSS}</style>
      {children}
    </div>
  )
}
