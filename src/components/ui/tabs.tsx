import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { X } from 'lucide-react'

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col', className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex h-10 w-fit shrink-0 items-center justify-center rounded-lg p-1 text-muted-foreground group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-8 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
        'data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground',
        'after:pointer-events-none after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-0 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:end-0 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('min-w-0 flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
export interface TabItem {
  value: string
  label: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
  closable?: boolean
}
export function WorkspaceTabs({
  items,
  value,
  onValueChange,
  onItemsChange,
  reorderable = true,
  orientation = 'horizontal',
}: {
  items: TabItem[]
  value: string
  onValueChange: (value: string) => void
  onItemsChange?: (items: TabItem[]) => void
  reorderable?: boolean
  orientation?: 'horizontal' | 'vertical'
}) {
  const triggers = React.useRef(new Map<string, HTMLButtonElement>())
  const pendingFocus = React.useRef<string | null>(null)
  const emptyState = React.useRef<HTMLParagraphElement>(null)
  const navigation = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (pendingFocus.current === null) return
    const target =
      triggers.current.get(pendingFocus.current) ?? emptyState.current ?? navigation.current
    target?.focus()
    pendingFocus.current = null
  }, [items, value])

  return (
    <Tabs
      className="w-full min-w-0"
      orientation={orientation}
      value={value}
      onValueChange={onValueChange}
    >
      {items.length > 0 ? (
        <div
          data-slot="tabs-viewport"
          className={cn(
            'min-w-0 p-1',
            orientation === 'vertical'
              ? 'max-h-80 w-48 max-w-1/2 shrink-0 overflow-y-auto'
              : 'max-w-full overflow-x-auto',
          )}
        >
          <TabsList
            ref={navigation}
            className={cn('h-auto', orientation === 'vertical' ? 'w-full' : 'min-w-max')}
          >
            {items.map((item, index) => (
              <div
                key={item.value}
                data-slot="workspace-tab"
                className={cn(
                  'relative flex h-8 shrink-0 items-center',
                  orientation === 'vertical' && 'w-full',
                )}
                draggable={!!onItemsChange && reorderable}
                onDragStart={(event) => event.dataTransfer.setData('text/plain', item.value)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const from = items.findIndex(
                    (i) => i.value === event.dataTransfer.getData('text/plain'),
                  )
                  if (from < 0 || from === index) return
                  const next = [...items],
                    moved = next.splice(from, 1)[0]
                  next.splice(index, 0, moved)
                  onItemsChange?.(next)
                }}
              >
                <TabsTrigger
                  ref={(node) => {
                    if (node) triggers.current.set(item.value, node)
                    else triggers.current.delete(item.value)
                  }}
                  className={cn('min-w-0', item.closable && onItemsChange && 'pe-8')}
                  value={item.value}
                  disabled={item.disabled}
                >
                  <span className="truncate">{item.label}</span>
                </TabsTrigger>
                {item.closable && onItemsChange && (
                  <button
                    type="button"
                    className="absolute end-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
                    aria-label={`Close ${typeof item.label === 'string' ? item.label : 'tab'}`}
                    disabled={item.disabled}
                    onClick={() => {
                      const next = items.filter((tab) => tab.value !== item.value)
                      const nextValue =
                        value === item.value
                          ? ([...items.slice(0, index)].reverse().find((tab) => !tab.disabled)
                              ?.value ??
                            items.slice(index + 1).find((tab) => !tab.disabled)?.value ??
                            '')
                          : value
                      pendingFocus.current = nextValue
                      onItemsChange(next)
                      if (value === item.value) onValueChange(nextValue)
                    }}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </TabsList>
        </div>
      ) : (
        <p
          ref={emptyState}
          tabIndex={-1}
          role="status"
          className="p-4 text-sm text-muted-foreground"
        >
          No open tabs
        </p>
      )}
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
