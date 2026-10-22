import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
export function Spin({
  spinning = true,
  children,
  label = 'Loading',
  className,
  delay = 0,
  minimumDuration = 0,
}: {
  spinning?: boolean
  children?: React.ReactNode
  label?: string
  className?: string
  delay?: number
  minimumDuration?: number
}) {
  const [visible, setVisible] = React.useState(spinning && delay === 0),
    shown = React.useRef(visible ? Date.now() : 0)
  React.useEffect(() => {
    const duration = spinning ? delay : Math.max(0, minimumDuration - (Date.now() - shown.current)),
      timer = setTimeout(() => {
        setVisible(spinning)
        if (spinning) shown.current = Date.now()
      }, duration)
    return () => clearTimeout(timer)
  }, [spinning, delay, minimumDuration])
  const indicator = (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      {label}
    </span>
  )
  return children ? (
    <div className={cn('relative', className)} aria-busy={spinning}>
      {children}
      {visible && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/75 backdrop-blur-[1px]">
          {indicator}
        </div>
      )}
    </div>
  ) : visible ? (
    <span className={className}>{indicator}</span>
  ) : null
}
