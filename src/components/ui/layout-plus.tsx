import * as React from 'react'
import { MenuIcon, PanelLeftClose, PanelLeftOpen, Settings, ChevronRight } from 'lucide-react'
import { Menu, type MenuItem } from '@/components/ui/menu'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { WorkspaceTabs, type TabItem } from '@/components/ui/tabs'
import { ConfigProvider, useUIConfig } from '@/components/ui/config-provider'
import { useControllableState } from '@/components/ui/util'
export interface LayoutPlusProps {
  logo: React.ReactNode
  items: MenuItem[]
  value: string
  onNavigate: (key: string) => void
  title?: string
  breadcrumb?: string[]
  actions?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  allow?: (item: MenuItem) => boolean
  route?: { pathname: string; navigate: (path: string) => void }
  settings?: boolean
  tabs?: TabItem[]
  onTabsChange?: (tabs: TabItem[]) => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}
export function LayoutPlus({
  logo,
  items,
  value,
  onNavigate,
  title,
  breadcrumb = [],
  actions,
  footer,
  children,
  className,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  allow,
  route,
  settings,
  tabs,
  onTabsChange,
  activeTab,
  onTabChange,
}: LayoutPlusProps) {
  const config = useUIConfig(),
    [density, setDensity] = React.useState(config.density),
    [direction, setDirection] = React.useState(config.direction),
    [accent, setAccent] = React.useState<string>(),
    [mobile, setMobile] = React.useState(false),
    [compact, setCompact] = useControllableState({
      value: collapsed,
      defaultValue: defaultCollapsed,
      onChange: onCollapsedChange,
    })
  const flatten = (items: MenuItem[]): MenuItem[] =>
      items.flatMap((item) => [item, ...flatten(item.children ?? [])]),
    current = route
      ? (flatten(items).find((item) => item.href === route.pathname)?.key ?? value)
      : value
  const navigate = (key: string) => {
    onNavigate(key)
    if (route) {
      const item = flatten(items).find((item) => item.key === key)
      route.navigate(item?.href ?? key)
    }
    setMobile(false)
  }
  const nav = (small = false) => (
    <Menu items={items} value={current} onValueChange={navigate} collapsed={small} allow={allow} />
  )
  return (
    <ConfigProvider
      density={density}
      direction={direction}
      accent={settings ? accent : undefined}
      className={`flex min-h-96 w-full overflow-hidden rounded-xl border bg-background ${className ?? ''}`}
    >
      <aside
        className={`hidden shrink-0 flex-col border-e bg-muted/30 transition-[width] md:flex ${compact ? 'w-16' : 'w-48'}`}
      >
        <div className="flex h-14 items-center justify-center border-b px-3 font-semibold">
          {compact ? 'E' : logo}
        </div>
        <div className="flex-1 p-2">{nav(compact)}</div>
        {footer && !compact && (
          <div className="border-t p-4 text-xs text-muted-foreground">{footer}</div>
        )}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <Button
            className="md:hidden"
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <MenuIcon />
          </Button>
          <Button
            className="hidden md:inline-flex"
            variant="ghost"
            size="icon-sm"
            aria-label={compact ? 'Expand navigation' : 'Collapse navigation'}
            onClick={() => setCompact(!compact)}
          >
            {compact ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <nav
            aria-label="Breadcrumb"
            className="flex flex-1 items-center gap-2 text-xs text-muted-foreground"
          >
            {breadcrumb.map((label, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight size={12} />}
                <span>{label}</span>
              </React.Fragment>
            ))}
          </nav>
          {actions}
          {settings && (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon-sm" variant="ghost" aria-label="Workspace appearance settings">
                  <Settings />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Workspace appearance</SheetTitle>
                  <SheetDescription>Customize this workspace.</SheetDescription>
                </SheetHeader>
                <div className="space-y-5 p-5">
                  <label className="block text-sm">
                    Density
                    <select
                      aria-label="Workspace density"
                      className="mt-2 block w-full rounded border p-2"
                      value={density}
                      onChange={(e) => setDensity(e.target.value as typeof density)}
                    >
                      <option>comfortable</option>
                      <option>compact</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    Direction
                    <select
                      aria-label="Workspace direction"
                      className="mt-2 block w-full rounded border p-2"
                      value={direction}
                      onChange={(e) => setDirection(e.target.value as typeof direction)}
                    >
                      <option>ltr</option>
                      <option>rtl</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    Accent
                    <input
                      aria-label="Workspace accent"
                      type="color"
                      className="mt-2 block"
                      value={accent ?? '#b93e28'}
                      onChange={(e) => setAccent(e.target.value)}
                    />
                  </label>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </header>
        <main className="p-5">
          {title && <h2 className="mb-5 text-xl font-semibold tracking-tight">{title}</h2>}
          {tabs?.length ? (
            <WorkspaceTabs
              items={tabs}
              value={activeTab ?? tabs[0].value}
              onValueChange={onTabChange ?? (() => {})}
              onItemsChange={onTabsChange}
            />
          ) : (
            children
          )}
        </main>
      </div>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-64 p-4">
          <SheetHeader>
            <SheetTitle>{logo}</SheetTitle>
            <SheetDescription>Workspace navigation</SheetDescription>
          </SheetHeader>
          {nav()}
        </SheetContent>
      </Sheet>
    </ConfigProvider>
  )
}
