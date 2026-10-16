import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { responsiveStyle, responsiveCSS, type Responsive } from '@/lib/responsive'
export function Grid({
  minWidth = 180,
  gap = 16,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { minWidth?: number; gap?: number }) {
  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit,minmax(min(${minWidth}px,100%),1fr))`,
        gap,
        ...style,
      }}
      {...props}
    />
  )
}
export function Row({
  gutter = 16,
  children,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { gutter?: number | [number, number] }) {
  const [x, y] = Array.isArray(gutter) ? gutter : [gutter, gutter]
  return (
    <div
      className={cn('flex flex-wrap', className)}
      style={
        {
          marginInline: -x / 2,
          rowGap: y,
          '--grid-gutter': `${x}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}
export interface ColProps extends HTMLAttributes<HTMLDivElement> {
  span?: Responsive<number>
  offset?: Responsive<number>
  order?: Responsive<number>
}
export function Col({
  span = 24,
  offset = 0,
  order = 0,
  style,
  className,
  children,
  ...props
}: ColProps) {
  return (
    <div
      className={cn('ergon-col min-w-0', className)}
      style={{
        ...responsiveStyle(span, 'span'),
        ...responsiveStyle(offset, 'offset'),
        ...responsiveStyle(order, 'order'),
        paddingInline: 'calc(var(--grid-gutter,16px) / 2)',
        ...style,
      }}
      {...props}
    >
      <style>{responsiveCSS}</style>
      {children}
    </div>
  )
}
