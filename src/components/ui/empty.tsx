import { Inbox, Search, Folder, Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'
export function Empty({
  title = 'Nothing here yet',
  description = 'Your next great idea starts here.',
  icon,
  children,
  className,
  illustration = 'inbox',
}: {
  title?: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
  illustration?: 'inbox' | 'search' | 'folder' | 'cloud'
}) {
  const Glyph = { inbox: Inbox, search: Search, folder: Folder, cloud: Cloud }[illustration]
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl border bg-muted/60 text-muted-foreground">
        {icon ?? <Glyph size={22} />}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-64 text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
