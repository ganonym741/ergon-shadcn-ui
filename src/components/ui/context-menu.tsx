import * as React from 'react'
import { ContextMenu as Primitive } from 'radix-ui'
import { usePortalContainer } from '@/components/ui/config-provider'
import { cn } from '@/lib/utils'
export const ContextMenu = Primitive.Root
export const ContextMenuTrigger = Primitive.Trigger
export const ContextMenuSub = Primitive.Sub
export const ContextMenuSubTrigger = Primitive.SubTrigger
export function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  const container = usePortalContainer()
  return (
    <Primitive.Portal container={container}>
      <Primitive.Content
        {...props}
        className={cn(
          'z-50 min-w-40 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg',
          className,
        )}
      />
    </Primitive.Portal>
  )
}
export function ContextMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      {...props}
      className={cn(
        'cursor-default rounded px-3 py-2 text-xs outline-none focus:bg-accent data-[disabled]:opacity-40',
        className,
      )}
    />
  )
}
export function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.SubContent>) {
  return (
    <Primitive.SubContent
      {...props}
      className={cn('z-50 min-w-40 rounded-lg border bg-popover p-1 shadow-lg', className)}
    />
  )
}
