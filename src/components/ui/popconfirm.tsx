import * as React from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
export function Popconfirm({
  children,
  title = 'Are you sure?',
  description = 'Please confirm this action.',
  onConfirm,
  destructive,
  side = 'top',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: {
  children: React.ReactNode
  title?: string
  description?: string
  onConfirm: () => unknown | Promise<unknown>
  destructive?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  confirmLabel?: string
  cancelLabel?: string
}) {
  const [open, setOpen] = React.useState(false),
    [pending, setPending] = React.useState(false),
    [error, setError] = React.useState('')
  const titleId = React.useId(),
    descriptionId = React.useId()
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setOpen(next)
          setError('')
        }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onEscapeKeyDown={(e) => {
          if (pending) e.preventDefault()
        }}
        onInteractOutside={(e) => {
          if (pending) e.preventDefault()
        }}
      >
        <h3 id={titleId} className="text-sm font-semibold">
          {title}
        </h3>
        <p id={descriptionId} className="mt-2 text-xs text-muted-foreground">
          {description}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            variant={destructive ? 'destructive' : 'default'}
            loading={pending}
            onClick={async () => {
              setPending(true)
              setError('')
              try {
                await onConfirm()
                setOpen(false)
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Please try again')
              } finally {
                setPending(false)
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
