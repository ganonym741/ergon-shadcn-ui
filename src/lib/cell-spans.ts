export interface CellSpan {
  rowSpan: number
  colSpan: number
}
export function planCellSpans<T>(
  rows: T[],
  columns: string[],
  getSpan: (row: T, column: string, index: number) => Partial<CellSpan> | undefined,
) {
  const plan = new Map<string, CellSpan | null>(),
    covered = new Set<string>()
  rows.forEach((row, r) =>
    columns.forEach((column, c) => {
      const key = `${r}:${c}`
      if (covered.has(key)) {
        plan.set(key, null)
        return
      }
      const requested = getSpan(row, column, r),
        rowSpan = Math.min(rows.length - r, Math.max(0, requested?.rowSpan ?? 1)),
        colSpan = Math.min(columns.length - c, Math.max(0, requested?.colSpan ?? 1))
      if (!rowSpan || !colSpan) {
        plan.set(key, null)
        return
      }
      plan.set(key, { rowSpan, colSpan })
      for (let rr = r; rr < r + rowSpan; rr++)
        for (let cc = c; cc < c + colSpan; cc++)
          if (rr !== r || cc !== c) covered.add(`${rr}:${cc}`)
    }),
  )
  return plan
}
