import { describe, expect, it } from 'vitest'
import { calculateBoxplotStatistics } from '@/components/ui/boxplot-chart'

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
})
