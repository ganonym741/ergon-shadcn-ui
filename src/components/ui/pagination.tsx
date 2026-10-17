import * as React from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

import { buttonVariants, type Button } from '@/components/ui/button'

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
  asChild?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  asChild = false,
  ...props
}: PaginationLinkProps) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        className,
      )}
      {...props}
    />
  )
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
export function PaginationControl({
  page,
  total,
  pageSize = 10,
  onChange,
  onPageSizeChange,
  sizes = [10, 20, 50, 100],
}: {
  page: number
  total: number
  pageSize?: number
  onChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  sizes?: number[]
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <button
              type="button"
              disabled={page <= 1}
              className="rounded border px-3 py-1.5 disabled:opacity-40"
              onClick={() => onChange(Math.max(1, page - 1))}
            >
              Previous
            </button>
          </PaginationItem>
          {Array.from(
            { length: Math.min(5, pages) },
            (_, i) => Math.max(1, Math.min(page - 2, pages - 4)) + i,
          ).map((n) => (
            <PaginationItem key={n}>
              <PaginationLink asChild isActive={n === page}>
                <button type="button" onClick={() => onChange(n)}>
                  {n}
                </button>
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <button
              type="button"
              disabled={page >= pages}
              className="rounded border px-3 py-1.5 disabled:opacity-40"
              onClick={() => onChange(Math.min(pages, page + 1))}
            >
              Next
            </button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <label className="flex items-center gap-2">
        Go to
        <input
          aria-label="Jump to page"
          type="number"
          min={1}
          max={pages}
          className="h-8 w-16 rounded border bg-background px-2"
          key={page}
          defaultValue={page}
          onKeyDown={(event) => {
            if (event.key === 'Enter')
              onChange(Math.max(1, Math.min(pages, Number(event.currentTarget.value) || 1)))
          }}
        />
      </label>
      {onPageSizeChange && (
        <select
          aria-label="Page size"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value))
            onChange(1)
          }}
          className="rounded border bg-background p-1.5"
        >
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      )}
      <span className="text-xs text-muted-foreground">{total} items</span>
    </div>
  )
}
