import * as React from 'react'
import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'
import { SkeletonPlus, type SkeletonPlusProps } from '@/components/ui/skeleton-plus'

it('passes animation choices to every text row while preserving wrapper props', () => {
  const { container, rerender } = render(
    <Skeleton
      type="text"
      rows={3}
      animation="pulse"
      id="loading-summary"
      aria-label="Loading summary"
    />,
  )
  expect(container.querySelector('#loading-summary')).toHaveAttribute(
    'aria-label',
    'Loading summary',
  )
  const rows = () => Array.from(container.querySelectorAll('[data-slot="skeleton"]'))
  expect(rows()).toHaveLength(3)
  expect(rows().every((row) => row.getAttribute('data-animation') === 'pulse')).toBe(true)
  rerender(<Skeleton type="text" rows={3} animated={false} />)
  expect(rows().every((row) => row.getAttribute('data-animation') === 'none')).toBe(true)
})
it.each(['dashboard', 'list', 'form', 'table', 'chart'] as const)(
  'applies wave, pulse and disabled states to all %s placeholders',
  (type: SkeletonPlusProps['type']) => {
    const { container, rerender } = render(<SkeletonPlus type={type} />)
    const rows = () => Array.from(container.querySelectorAll('[data-slot="skeleton"]'))
    expect(rows().length).toBeGreaterThan(0)
    expect(rows().every((row) => row.getAttribute('data-animation') === 'wave')).toBe(true)
    rerender(<SkeletonPlus type={type} animation="pulse" />)
    expect(rows().every((row) => row.getAttribute('data-animation') === 'pulse')).toBe(true)
    rerender(<SkeletonPlus type={type} animation="wave" animated={false} />)
    expect(rows().every((row) => row.getAttribute('data-animation') === 'none')).toBe(true)
  },
)
