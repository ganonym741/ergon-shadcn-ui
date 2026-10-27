import { cn } from '@/lib/utils'
export function BorderBeam({
  className,
  children,
  duration = 8,
  beamColor = 'var(--primary)',
  borderWidth = 1,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  duration?: number
  beamColor?: string
  borderWidth?: number
}) {
  return (
    <div
      {...props}
      style={{ padding: borderWidth, ...style }}
      className={cn('relative isolate overflow-hidden rounded-xl', className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-100%] -z-10 animate-[spin_8s_linear_infinite] motion-reduce:animate-none"
        style={{
          animationDuration: `${duration}s`,
          background: `conic-gradient(from 0deg,transparent 60%,${beamColor} 90%,transparent)`,
        }}
      />
      <div className="h-full rounded-[inherit] bg-background p-5">{children}</div>
    </div>
  )
}
