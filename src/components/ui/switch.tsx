import * as React from 'react'
import { cn } from '@/lib/utils'
import { Switch as SwitchPrimitive } from 'radix-ui'

function Switch({
  className,
  size = 'default',
  checkedLabel,
  uncheckedLabel,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default'
  checkedLabel?: React.ReactNode
  uncheckedLabel?: React.ReactNode
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80',
        className,
      )}
      {...props}
      style={{
        ...(checkedLabel || uncheckedLabel
          ? { width: 'auto', minWidth: 54, position: 'relative', paddingInline: 3 }
          : {}),
        ...props.style,
      }}
    >
      {(checkedLabel || uncheckedLabel) && (
        <>
          <span className="px-4 text-[10px] text-primary-foreground group-data-[state=unchecked]/switch:hidden">
            {checkedLabel}
          </span>
          <span className="px-4 text-[10px] group-data-[state=checked]/switch:hidden">
            {uncheckedLabel}
          </span>
        </>
      )}
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground',
          (checkedLabel || uncheckedLabel) &&
            'absolute data-[state=checked]:right-1 data-[state=checked]:translate-x-0 data-[state=unchecked]:left-1',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
