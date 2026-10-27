import { Skeleton } from '@/components/ui/skeleton'
export function SkeletonPlus({
  type = 'dashboard',
  rows = 4,
}: {
  type?: 'dashboard' | 'list' | 'form' | 'table' | 'chart'
  rows?: number
}) {
  return (
    <div role="status" aria-label="Loading content" className="space-y-5">
      <Skeleton className="h-5 w-40" />
      {type === 'chart' && (
        <div className="flex h-48 items-end gap-3 rounded-lg border p-4">
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${30 + ((i * 37) % 70)}%` }} />
          ))}
        </div>
      )}
      {type === 'table' && (
        <div className="overflow-hidden rounded-lg border">
          {Array.from({ length: rows + 1 }, (_, i) => (
            <div key={i} className="flex gap-4 border-b p-4">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-3 flex-1" />
              ))}
            </div>
          ))}
        </div>
      )}
      {type === 'dashboard' && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}
      {type !== 'table' &&
        type !== 'chart' &&
        Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            {type === 'list' && <Skeleton className="size-10 shrink-0 rounded-full" />}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className={type === 'form' ? 'h-9 w-full' : 'h-3 w-3/4'} />
            </div>
          </div>
        ))}
    </div>
  )
}
