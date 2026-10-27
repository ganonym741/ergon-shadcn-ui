import * as React from 'react'
export function Affix({
  offsetTop = 16,
  offsetBottom,
  target,
  onAffixChange,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  offsetTop?: number
  offsetBottom?: number
  target?: () => HTMLElement | null
  onAffixChange?: (affixed: boolean) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null),
    previous = React.useRef(false)
  React.useEffect(() => {
    const container = target?.() ?? window
    const update = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect(),
        bounds =
          container instanceof HTMLElement
            ? container.getBoundingClientRect()
            : { top: 0, bottom: innerHeight }
      const affixed =
        offsetBottom === undefined
          ? rect.top <= bounds.top + offsetTop + 1
          : rect.bottom >= bounds.bottom - offsetBottom - 1
      if (affixed !== previous.current) {
        previous.current = affixed
        onAffixChange?.(affixed)
      }
    }
    container.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      container.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [target, offsetTop, offsetBottom, onAffixChange])
  return (
    <div
      {...props}
      ref={ref}
      style={{
        position: 'sticky',
        ...(offsetBottom === undefined ? { top: offsetTop } : { bottom: offsetBottom }),
        zIndex: 10,
        ...style,
      }}
    />
  )
}
