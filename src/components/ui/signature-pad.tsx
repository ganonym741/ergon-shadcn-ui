import * as React from 'react'
import { Undo2, Redo2, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorHistory, useAsyncAction, clamp, productId } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'

export interface SignaturePoint {
  x: number
  y: number
  pressure?: number
}
export interface SignatureStroke {
  id: string
  points: SignaturePoint[]
  color: string
  width: number
}
export interface SignaturePadProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'defaultValue'
> {
  value?: SignatureStroke[]
  defaultValue?: SignatureStroke[]
  onValueChange?: (strokes: SignatureStroke[]) => void
  onExport?: (blob: Blob, format: 'svg' | 'png') => void | Promise<void>
  color?: string
  penWidth?: number
  background?: string
  height?: number
  disabled?: boolean
  readOnly?: boolean
  label?: string
  format?: 'svg' | 'png'
}
const fallbackInk = '#202820'
const hex = (value: string, fallback: string) =>
  /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) ? value : fallback
/** Midpoint quadratic curves smooth pointer samples while keeping exported and on-screen ink identical. */
export function signaturePath(points: SignaturePoint[], width: number, height: number) {
  const p = points
    .slice(0, 20000)
    .map((point) => ({ x: clamp(point.x, 0, 1) * width, y: clamp(point.y, 0, 1) * height }))
  if (p.length < 2) return ''
  let path = `M${p[0].x} ${p[0].y}`
  for (let i = 1; i < p.length; i++) {
    const next = p[i + 1] ?? p[i]
    path += ` Q${p[i].x} ${p[i].y} ${(p[i].x + next.x) / 2} ${(p[i].y + next.y) / 2}`
  }
  return path
}
/** Serializes bounded normalized strokes into an inert SVG image. */
export function signatureSVG(
  strokes: SignatureStroke[],
  background = 'transparent',
  width = 1000,
  height = 400,
) {
  width = clamp(width, 1, 4096)
  height = clamp(height, 1, 4096)
  const paths = strokes
    .slice(0, 500)
    .map((stroke) => {
      return `<path d="${signaturePath(stroke.points, width, height)}" fill="none" stroke="${hex(stroke.color, fallbackInk)}" stroke-width="${clamp(stroke.width, 1, 20)}" stroke-linecap="round" stroke-linejoin="round"/>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background === 'transparent' ? 'none' : hex(background, '#ffffff')}"/>${paths}</svg>`
}
interface SignatureContext {
  dimensions: React.RefObject<{ width: number; height: number }>
  strokes: SignatureStroke[]
  draft: SignatureStroke | null
  setDraft: (stroke: SignatureStroke | null) => void
  commit: (strokes: SignatureStroke[]) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  color: string
  penWidth: number
  background: string
  disabled: boolean
  readOnly: boolean
  height: number
  label: string
  exportImage: () => void
  busy: boolean
  error: string
}
const Context = React.createContext<SignatureContext | null>(null)
const useSignature = () => {
  const value = React.useContext(Context)
  if (!value) throw new Error('Signature parts need SignaturePad.')
  return value
}
/** A responsive vector signature surface with original pointer input and bounded undo history. */
export function SignaturePad({
  value,
  defaultValue = [],
  onValueChange,
  onExport,
  color = '#5579bd',
  penWidth = 3,
  background = 'transparent',
  height = 220,
  disabled = false,
  readOnly = false,
  label = 'Signature',
  format = 'png',
  children,
  className,
  ...props
}: SignaturePadProps) {
  const history = useEditorHistory({ value, defaultValue, onChange: onValueChange }),
    action = useAsyncAction(),
    dimensions = React.useRef({ width: 1000, height: 400 })
  const [draft, setDraft] = React.useState<SignatureStroke | null>(null)
  const exportImage = () =>
    void action.run(async (signal) => {
      const { width, height } = dimensions.current,
        svg = signatureSVG(history.value, background, width, height)
      let blob = new Blob([svg], { type: 'image/svg+xml' })
      if (format === 'png') {
        const url = URL.createObjectURL(blob)
        try {
          const image = new Image()
          image.src = url
          await image.decode()
          if (signal.aborted) return
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(width * 2)
          canvas.height = Math.round(height * 2)
          const context = canvas.getContext('2d')
          if (!context) throw new Error('Canvas export is unavailable.')
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (value) => (value ? resolve(value) : reject(new Error('Image export failed.'))),
              'image/png',
            ),
          )
        } finally {
          URL.revokeObjectURL(url)
        }
      }
      if (signal.aborted) return
      if (onExport) await onExport(blob, format)
      else {
        const url = URL.createObjectURL(blob),
          link = document.createElement('a')
        link.href = url
        link.download = `signature.${format}`
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    })
  return (
    <Context.Provider
      value={{
        dimensions,
        strokes: history.value,
        draft,
        setDraft,
        commit: history.commit,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        color,
        penWidth,
        background,
        disabled,
        readOnly,
        height: clamp(height, 120, 1000),
        label,
        exportImage,
        busy: action.busy,
        error: action.error,
      }}
    >
      <section
        {...props}
        data-slot="signature-pad"
        className={cn('w-full min-w-0 space-y-3', className)}
        aria-label={label}
      >
        {children ?? (
          <>
            <SignaturePadCanvas />
            <SignaturePadToolbar />
          </>
        )}
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
/** Named drawing surface; read-only users can inspect existing strokes without input capture. */
export function SignaturePadCanvas({ className, ...props }: React.ComponentProps<'svg'>) {
  const c = useSignature(),
    pointer = React.useRef<number | null>(null),
    pending = React.useRef<SignatureStroke | null>(null),
    host = React.useRef<SVGSVGElement>(null),
    [size, setSize] = React.useState(c.dimensions.current)
  React.useLayoutEffect(() => {
    if (!c.disabled && !c.readOnly) return
    pointer.current = null
    pending.current = null
    c.setDraft(null)
  }, [c.disabled, c.readOnly])
  React.useEffect(() => {
    const el = host.current
    if (!el) return
    const resize = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width && rect.height) {
        const next = { width: rect.width, height: rect.height }
        c.dimensions.current = next
        setSize((previous) =>
          previous.width === next.width && previous.height === next.height ? previous : next,
        )
      }
    }
    resize()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [c.height, c.dimensions])
  const point = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
      pressure: event.pressure,
    }
  }
  return (
    <svg
      {...props}
      ref={host}
      viewBox={`0 0 ${size.width} ${size.height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`${c.label} drawing surface`}
      data-empty={!c.strokes.length && !c.draft}
      style={{ height: c.height, ...props.style }}
      className={cn(
        'w-full rounded-xl border bg-card',
        !c.disabled && !c.readOnly && 'touch-none cursor-crosshair',
        className,
      )}
      onPointerDown={(event) => {
        props.onPointerDown?.(event)
        if (
          event.defaultPrevented ||
          c.disabled ||
          c.readOnly ||
          event.button !== 0 ||
          pointer.current !== null
        )
          return
        pointer.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        const p = point(event)
        pending.current = {
          id: productId(),
          points: [p, { ...p, x: Math.min(1, p.x + 0.0001) }],
          color: hex(c.color, fallbackInk),
          width: clamp(c.penWidth, 1, 20),
        }
        c.setDraft(pending.current)
      }}
      onPointerMove={(event) => {
        props.onPointerMove?.(event)
        if (c.disabled || c.readOnly || pointer.current !== event.pointerId || !pending.current)
          return
        pending.current = {
          ...pending.current,
          points: [...pending.current.points, point(event)].slice(-20000),
        }
        c.setDraft(pending.current)
      }}
      onPointerUp={(event) => {
        props.onPointerUp?.(event)
        if (pointer.current !== event.pointerId) return
        pointer.current = null
        if (!c.disabled && !c.readOnly && pending.current)
          c.commit([...c.strokes, pending.current].slice(-500))
        pending.current = null
        c.setDraft(null)
      }}
      onPointerCancel={(event) => {
        props.onPointerCancel?.(event)
        if (pointer.current !== event.pointerId) return
        pointer.current = null
        pending.current = null
        c.setDraft(null)
      }}
    >
      <rect
        width={size.width}
        height={size.height}
        fill={c.background === 'transparent' ? 'transparent' : hex(c.background, '#ffffff')}
      />
      <line
        x1={size.width * 0.06}
        x2={size.width * 0.94}
        y1={size.height * 0.775}
        y2={size.height * 0.775}
        stroke="var(--border)"
        strokeDasharray="8 8"
      />
      {[...c.strokes.slice(0, 500), ...(c.draft ? [c.draft] : [])].map((stroke) => (
        <path
          key={stroke.id}
          d={signaturePath(stroke.points, size.width, size.height)}
          fill="none"
          stroke={hex(stroke.color, fallbackInk)}
          strokeWidth={clamp(stroke.width, 1, 20)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {!c.strokes.length && !c.draft && (
        <text
          x={size.width / 2}
          y={size.height / 2}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="14"
        >
          Draw your signature here
        </text>
      )}
    </svg>
  )
}
/** Supplies keyboard-accessible history, clearing and PNG/SVG export actions. */
export function SignaturePadToolbar() {
  const c = useSignature()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={c.disabled || c.readOnly || !c.canUndo}
        onClick={c.undo}
      >
        <Undo2 />
        Undo
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={c.disabled || c.readOnly || !c.canRedo}
        onClick={c.redo}
      >
        <Redo2 />
        Redo
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={c.disabled || c.readOnly || !c.strokes.length}
        onClick={() => c.commit([])}
      >
        <Trash2 />
        Clear
      </Button>
      <Button
        type="button"
        size="sm"
        className="ms-auto"
        disabled={c.disabled || c.busy || !c.strokes.length}
        onClick={c.exportImage}
      >
        <Download />
        {c.busy ? 'Exporting…' : 'Export signature'}
      </Button>
    </div>
  )
}
