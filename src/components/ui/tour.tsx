import * as React from 'react'
import { createPortal } from 'react-dom'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
export interface TourStep {
  title: string
  description: string
  target?: string
  placement?: 'top' | 'right' | 'bottom' | 'left'
  beforeEnter?: (signal: AbortSignal) => void | Promise<void>
}
export function Tour({
  steps,
  open,
  onOpenChange,
  onFinish,
}: {
  steps: TourStep[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onFinish?: () => void
}) {
  const [current, setCurrent] = React.useState(0),
    [target, setTarget] = React.useState<HTMLElement | null>(null),
    [bounds, setBounds] = React.useState<DOMRect | null>(null)
  const returnFocus = React.useRef<HTMLElement | null>(null)
  const titleId = React.useId(),
    descriptionId = React.useId()
  React.useEffect(() => {
    if (open) {
      setCurrent(0)
      returnFocus.current = document.activeElement as HTMLElement
    } else returnFocus.current?.focus()
  }, [open])
  const step = steps[current]
  const [preparing, setPreparing] = React.useState(false),
    [error, setError] = React.useState('')
  const enter = React.useRef(step?.beforeEnter)
  enter.current = step?.beforeEnter
  React.useEffect(() => {
    if (!open || !enter.current) return
    const controller = new AbortController()
    setPreparing(true)
    setError('')
    Promise.resolve(enter.current(controller.signal))
      .catch((error) => {
        if (!controller.signal.aborted) setError(String(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setPreparing(false)
      })
    return () => controller.abort()
  }, [open, current])
  React.useEffect(() => {
    if (!open || !step?.target || preparing) {
      setTarget(null)
      setBounds(null)
      return
    }
    let element: HTMLElement | null = null
    try {
      element = document.querySelector<HTMLElement>(step.target)
    } catch {
      return
    }
    setTarget(element)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const update = () => setBounds(element!.getBoundingClientRect())
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [open, current, step?.target, preparing])
  if (!step) return null
  const controls = (
    <div className="mt-5 flex items-center justify-between gap-3">
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
        Skip tour
      </Button>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={preparing || current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={preparing}
          onClick={() => {
            if (current === steps.length - 1) {
              onOpenChange(false)
              onFinish?.()
            } else setCurrent((c) => c + 1)
          }}
        >
          {current === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  )
  if (target && open)
    return (
      <>
        <Popover open={open} onOpenChange={onOpenChange} modal>
          <PopoverAnchor virtualRef={{ current: target }} />
          <PopoverContent
            side={step.placement ?? 'bottom'}
            sideOffset={14}
            className="z-[70] w-80 max-w-[calc(100vw-24px)] p-5"
            role="dialog"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              if (!open) returnFocus.current?.focus()
            }}
          >
            <span className="text-xs font-medium text-primary">
              A quick introduction · {current + 1} of {steps.length}
            </span>
            <h3 id={titleId} className="mt-3 font-semibold">
              {step.title}
            </h3>
            <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
            {controls}
          </PopoverContent>
        </Popover>
        {bounds &&
          createPortal(
            <div
              aria-hidden
              className="pointer-events-none fixed z-[60] rounded-lg border-2 border-primary transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
              style={{
                top: bounds.top - 5,
                left: bounds.left - 5,
                width: bounds.width + 10,
                height: bounds.height + 10,
                boxShadow: '0 0 0 9999px rgb(0 0 0 / .25)',
              }}
            />,
            document.body,
          )}
      </>
    )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <span className="text-xs font-medium text-primary">
          A quick introduction · {current + 1} of {steps.length}
        </span>
        <DialogTitle>{step.title}</DialogTitle>
        <DialogDescription>{step.description}</DialogDescription>
        {controls}
      </DialogContent>
    </Dialog>
  )
}
