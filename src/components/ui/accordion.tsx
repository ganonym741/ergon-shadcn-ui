'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDownIcon } from 'lucide-react'
import { Accordion as AccordionPrimitive } from 'radix-ui'

function Accordion({
  variant = 'bordered',
  className,
  collapsible,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root> & {
  variant?: 'bordered' | 'ghost' | 'borderless'
  collapsible?: boolean
}) {
  const classes = cn(
    variant === 'bordered'
      ? 'rounded-lg border px-4'
      : variant === 'ghost'
        ? 'rounded-lg bg-muted/40 px-4 [&>[data-slot=accordion-item]]:border-0'
        : '[&>[data-slot=accordion-item]]:border-0',
    className,
  )
  return props.type === 'single' ? (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={classes}
      {...props}
      collapsible={collapsible}
    />
  ) : (
    <AccordionPrimitive.Root data-slot="accordion" className={classes} {...props} />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
