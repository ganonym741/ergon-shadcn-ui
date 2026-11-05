import * as React from 'react'
import { ArrowLeftRight, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'

export interface ComparisonImage {
  src: string
  alt: string
  label?: string
}
export interface ImageComparisonProps extends Omit<React.ComponentProps<'div'>, 'onChange'> {
  before: ComparisonImage
  after: ComparisonImage
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  orientation?: 'horizontal' | 'vertical'
  disabled?: boolean
  label?: string
  aspectRatio?: number
  objectFit?: 'cover' | 'contain'
}
interface ComparisonContext {
  before: ComparisonImage
  after: ComparisonImage
  value: number
  setValue: (value: number) => void
  orientation: 'horizontal' | 'vertical'
  objectFit: 'cover' | 'contain'
  disabled?: boolean
  label: string
}
const Context = React.createContext<ComparisonContext | null>(null)
function useComparison() {
  const context = React.useContext(Context)
  if (!context) throw new Error('Image comparison parts must be inside ImageComparison.')
  return context
}
/** Shows two images with an adjustable, keyboard-accessible reveal boundary. */
export function ImageComparison({
  before,
  after,
  value,
  defaultValue = 50,
  onValueChange,
  orientation = 'horizontal',
  disabled,
  label = 'Image comparison',
  aspectRatio = 16 / 9,
  objectFit = 'cover',
  children,
  className,
  style,
  ...props
}: ImageComparisonProps) {
  const [position, setPosition] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const bounded = Number.isFinite(position) ? Math.min(100, Math.max(0, position)) : 50
  return (
    <Context.Provider
      value={{
        before,
        after,
        value: bounded,
        setValue: setPosition,
        orientation,
        disabled,
        label,
        objectFit,
      }}
    >
      <div
        {...props}
        data-slot="image-comparison"
        role="group"
        aria-label={label}
        className={cn(
          'relative isolate w-full overflow-hidden rounded-xl border bg-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
          className,
        )}
        style={{
          aspectRatio: Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 16 / 9,
          ...style,
        }}
      >
        {children ?? (
          <>
            <ImageComparisonImage side="after" />
            <ImageComparisonImage side="before" />
            <ImageComparisonHandle />
          </>
        )}
      </div>
    </Context.Provider>
  )
}
/** Renders one comparison image; the before layer is clipped at the selected percentage. */
export function ImageComparisonImage({
  side,
  className,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & { side: 'before' | 'after' }) {
  const context = useComparison(),
    image = context[side]
  return (
    <div
      {...props}
      data-slot={`comparison-${side}`}
      className={cn('pointer-events-none absolute inset-0', side === 'before' && 'z-1', className)}
      style={{
        ...props.style,
        ...(side === 'before'
          ? {
              clipPath:
                context.orientation === 'horizontal'
                  ? `inset(0 ${100 - context.value}% 0 0)`
                  : `inset(0 0 ${100 - context.value}% 0)`,
            }
          : {}),
      }}
    >
      <img
        src={image.src}
        alt={image.alt}
        draggable={false}
        className="h-full w-full"
        style={{ objectFit: context.objectFit }}
      />
      {image.label && (
        <span
          className={cn(
            'absolute top-3 max-w-[45%] rounded-md bg-black/65 px-2 py-1 text-xs text-white',
            side === 'before'
              ? 'left-3'
              : context.orientation === 'horizontal'
                ? 'right-3'
                : 'bottom-3 top-auto right-3',
          )}
        >
          {image.label}
        </span>
      )}
    </div>
  )
}
/** Supplies the native range input and visual divider for pointer, touch, and keyboard input. */
export function ImageComparisonHandle({ className }: { className?: string }) {
  const context = useComparison(),
    vertical = context.orientation === 'vertical'
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute z-2 bg-white shadow-sm',
          vertical ? 'inset-x-0 h-0.5 -translate-y-1/2' : 'inset-y-0 w-0.5 -translate-x-1/2',
        )}
        style={vertical ? { top: `${context.value}%` } : { left: `${context.value}%` }}
      >
        <span
          className={cn(
            'absolute flex size-10 items-center justify-center rounded-full border bg-background text-foreground shadow-md',
            vertical
              ? 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'
              : 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2',
          )}
        >
          {vertical ? <ArrowUpDown size={18} /> : <ArrowLeftRight size={18} />}
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={context.value}
        disabled={context.disabled}
        aria-label={context.label}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        aria-valuetext={`${context.value}% ${context.before.label ?? 'before image'}`}
        onChange={(event) => context.setValue(event.target.valueAsNumber)}
        className={cn(
          'absolute inset-0 z-3 m-0 h-full w-full opacity-0 disabled:cursor-not-allowed',
          vertical ? 'cursor-ns-resize' : 'cursor-ew-resize',
          className,
        )}
        style={{ direction: 'ltr', ...(vertical ? { writingMode: 'vertical-lr' } : {}) }}
      />
    </>
  )
}
