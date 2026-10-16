import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
export interface MasonryProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: number
  minWidth?: number
  virtual?: boolean
  measured?: boolean
  height?: number
  estimateHeight?: (index: number) => number
}
export function Masonry({
  className,
  gap = 16,
  minWidth = 180,
  children,
  style,
  virtual = false,
  measured = false,
  height = 480,
  estimateHeight = () => 220,
  ...props
}: MasonryProps) {
  const ref = React.useRef<HTMLDivElement>(null),
    [width, setWidth] = React.useState(600)
  React.useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setWidth(element.clientWidth || 600)
    const observer = new ResizeObserver(update)
    observer.observe(element)
    update()
    return () => observer.disconnect()
  }, [])
  const items = React.Children.toArray(children),
    lanes = Math.max(1, Math.floor((width + gap) / (minWidth + gap))),
    columnWidth = (width - (lanes - 1) * gap) / lanes,
    enabled = virtual || measured
  const list = useVirtualizer({
    count: items.length,
    getScrollElement: () => ref.current,
    estimateSize: (index) => estimateHeight(index),
    lanes,
    gap,
    overscan: virtual ? 6 : items.length,
    initialRect: { width: 600, height },
    enabled,
  })
  if (enabled)
    return (
      <div
        ref={ref}
        tabIndex={virtual ? 0 : undefined}
        aria-label={virtual ? 'Masonry viewport' : undefined}
        className={cn('relative w-full overflow-auto', className)}
        style={{ height: virtual ? height : list.getTotalSize(), ...style }}
        {...props}
      >
        <div className="relative" style={{ height: list.getTotalSize() }}>
          {list.getVirtualItems().map((item) => (
            <div
              key={item.key}
              ref={list.measureElement}
              data-index={item.index}
              className="absolute top-0 left-0"
              style={{
                width: columnWidth,
                transform: `translate(${item.lane * (columnWidth + gap)}px,${item.start}px)`,
              }}
            >
              {items[item.index]}
            </div>
          ))}
        </div>
      </div>
    )
  return (
    <div
      ref={ref}
      className={cn('[&>*]:mb-(--masonry-gap) [&>*]:break-inside-avoid', className)}
      style={
        {
          '--masonry-gap': `${gap}px`,
          columnWidth: minWidth,
          columnGap: gap,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}
