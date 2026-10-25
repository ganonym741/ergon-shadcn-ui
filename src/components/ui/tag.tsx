import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
export function Tag({
  children,
  color = 'neutral',
  onClose,
  selected,
  onSelectedChange,
  className,
}: {
  children: React.ReactNode
  color?: 'neutral' | 'coral' | 'green' | 'blue' | 'purple' | 'amber'
  onClose?: () => void
  selected?: boolean
  onSelectedChange?: (value: boolean) => void
  className?: string
}) {
  const classes = {
    neutral: 'bg-muted text-muted-foreground',
    coral: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    purple: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium',
        classes[color],
        selected && 'border-current',
        className,
      )}
    >
      {onSelectedChange ? (
        <button
          type="button"
          aria-label={typeof children === 'string' ? undefined : 'Toggle tag'}
          aria-pressed={selected}
          onClick={() => onSelectedChange(!selected)}
        >
          {children}
        </button>
      ) : (
        children
      )}
      {onClose && (
        <button
          type="button"
          aria-label={`Remove ${typeof children === 'string' ? children : 'tag'}`}
          onClick={onClose}
        >
          <X size={11} />
        </button>
      )}
    </span>
  )
}
