import { describe, expect, it } from 'vitest'
import { calculateBoxplotStatistics } from '@/components/ui/boxplot-chart'

import { calendarDateExtent } from '@/components/ui/calendar-heatmap-chart'
import { validateSankeyData } from '@/components/ui/sankey-chart'
describe('chart data processing', () => {
  it('calculates quartiles and Tukey outliers without mutating observations', () => {
    const data = [100, 4, 2, 1, 3]
    expect(calculateBoxplotStatistics(data)).toEqual({ summary: [1, 2, 3, 4, 4], outliers: [100] })
    expect(data).toEqual([100, 4, 2, 1, 3])
    expect(calculateBoxplotStatistics([0])).toEqual({ summary: [0, 0, 0, 0, 0], outliers: [] })
    expect(() => calculateBoxplotStatistics([])).toThrow()
    expect(() => calculateBoxplotStatistics([1, NaN])).toThrow()
    expect(() => calculateBoxplotStatistics([1, 2], -1)).toThrow()
  })
  it('resolves calendar ranges and validates leap days without time-zone conversion', () => {
    expect(calendarDateExtent('2024-02')).toEqual(['2024-02-01', '2024-02-29'])
    expect(calendarDateExtent(2026)).toEqual(['2026-01-01', '2026-12-31'])
    expect(calendarDateExtent('2026-03-04')).toEqual(['2026-03-04', '2026-03-04'])
    expect(calendarDateExtent(['2026-01-01', '2026-03-31'])).toEqual(['2026-01-01', '2026-03-31'])
    expect(() => calendarDateExtent('2026-02-29')).toThrow()
    expect(() => calendarDateExtent(['2026-03-31', '2026-01-01'])).toThrow()
  })
  it('rejects cyclic, missing-endpoint, duplicate and negative Sankey data', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'isolated' }]
    const link = { id: 'ab', source: 'a', target: 'b', value: 2 }
    expect(validateSankeyData(nodes, [link])).toBeUndefined()
    expect(
      validateSankeyData(nodes, [link, { id: 'ba', source: 'b', target: 'a', value: 1 }]),
    ).toMatch(/cycles/)
    expect(validateSankeyData(nodes, [{ ...link, target: 'missing' }])).toMatch(/existing node/)
    expect(validateSankeyData(nodes, [{ ...link, value: -1 }])).toMatch(/nonnegative/)
    expect(validateSankeyData(nodes, [link, link])).toMatch(/unique/)
    expect(validateSankeyData([{ id: 'a' }, { id: 'a' }], [])).toMatch(/unique/)
  })
})
