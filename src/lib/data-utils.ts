export function csvEscape(value: unknown) {
  let text = String(value ?? '')
  if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}
export function downloadCSV(filename: string, headers: string[], rows: unknown[][]) {
  const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
