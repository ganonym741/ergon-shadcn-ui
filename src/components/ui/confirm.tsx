import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm?: () => unknown | Promise<unknown>
}
export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, React.ReactNode] {
  const [queue, setQueue] = React.useState<
      { options: ConfirmOptions; resolve: (accepted: boolean) => void }[]
    >([]),
    [pending, setPending] = React.useState(false),
    [error, setError] = React.useState('')
  const requests = React.useRef(queue)
  requests.current = queue
  React.useEffect(() => () => requests.current.forEach((request) => request.resolve(false)), [])
  const confirm = React.useCallback(
      (options: ConfirmOptions) =>
        new Promise<boolean>((resolve) =>
          setQueue((previous) => [...previous, { options, resolve }]),
        ),
      [],
    ),
    current = queue[0]
  const close = (accepted: boolean) => {
    current?.resolve(accepted)
    setQueue((previous) => previous.slice(1))
    setError('')
  }
  return [
    confirm,
    <Dialog
      key="ergonui-confirm"
      open={!!current}
      onOpenChange={(open) => {
        if (!open && !pending) close(false)
      }}
    >
      <DialogContent showCloseButton={!pending}>
        <DialogTitle>{current?.options.title}</DialogTitle>
        <DialogDescription>
          {current?.options.description ?? 'Please confirm this action.'}
        </DialogDescription>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" disabled={pending} onClick={() => close(false)}>
            Cancel
          </Button>
          <Button
            loading={pending}
            variant={current?.options.destructive ? 'destructive' : 'default'}
            onClick={async () => {
              setPending(true)
              try {
                await current?.options.onConfirm?.()
                close(true)
              } catch (error) {
                setError(String(error))
              } finally {
                setPending(false)
              }
            }}
          >
            {current?.options.confirmLabel ?? 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  ]
}
