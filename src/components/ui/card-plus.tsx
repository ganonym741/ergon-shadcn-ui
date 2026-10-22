import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Spin } from '@/components/ui/spin'
export function CardPlus({
  title,
  description,
  extra,
  collapsible,
  defaultCollapsed,
  children,
  className,
  footer,
  tabs,
  checked,
  onCheckedChange,
  loading,
}: {
  title: React.ReactNode
  description?: string
  extra?: React.ReactNode
  collapsible?: boolean
  defaultCollapsed?: boolean
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
  tabs?: { key: string; label: string; children: React.ReactNode }[]
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  loading?: boolean
}) {
  const [collapsed, setCollapsed] = React.useState(!!defaultCollapsed)
  return (
    <section
      className={cn('overflow-hidden rounded-xl border bg-card text-card-foreground', className)}
    >
      <header className="flex items-center justify-between gap-3 border-b p-5">
        {onCheckedChange && (
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => onCheckedChange(!!value)}
            aria-label="Select card"
          />
        )}
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {extra}
          {collapsible && (
            <button
              type="button"
              aria-label={collapsed ? 'Expand card' : 'Collapse card'}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((v) => !v)}
            >
              <ChevronDown size={16} className={cn('transition', collapsed && '-rotate-90')} />
            </button>
          )}
        </div>
      </header>
      {!collapsed && (
        <>
          <Spin spinning={!!loading}>
            <div className="p-5">
              {tabs?.length ? (
                <Tabs defaultValue={tabs[0].key}>
                  <TabsList>
                    {tabs.map((tab) => (
                      <TabsTrigger key={tab.key} value={tab.key}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {tabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key}>
                      {tab.children}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                children
              )}
            </div>
          </Spin>
          {footer && (
            <footer className="border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
              {footer}
            </footer>
          )}
        </>
      )}
    </section>
  )
}
