export interface TableView {
  visibility: Record<string, boolean>
  order: string[]
  pinning: { left: string[]; right: string[] }
  sizing: Record<string, number>
}
export function readTableView(key?: string): Partial<TableView> {
  if (!key || typeof localStorage === 'undefined') return {}
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}')
    const strings = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every((i) => typeof i === 'string')
    const result: Partial<TableView> = {}
    if (
      value.visibility &&
      typeof value.visibility === 'object' &&
      Object.values(value.visibility).every((v) => typeof v === 'boolean')
    )
      result.visibility = value.visibility
    if (strings(value.order)) result.order = value.order
    if (value.pinning && strings(value.pinning.left) && strings(value.pinning.right))
      result.pinning = value.pinning
    if (
      value.sizing &&
      typeof value.sizing === 'object' &&
      Object.values(value.sizing).every((v) => typeof v === 'number' && Number.isFinite(v) && v > 0)
    )
      result.sizing = value.sizing
    return result
  } catch {
    return {}
  }
}
