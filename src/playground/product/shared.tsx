import * as React from 'react'
/** Stable example IDs also work when users edit the seed data to contain reserved demo IDs. */
export function uniqueDemoId(items: readonly { id: string }[], base: string): string {
  const ids = new Set(items.map((item) => item.id))
  let id = base,
    suffix = 1
  while (ids.has(id)) id = `${base}-${suffix++}`
  return id
}
export { report, simulate } from '../expansion/shared'
export function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}
export function useBlobURL(blob: Blob | null) {
  const [url, setURL] = React.useState('')
  React.useEffect(() => {
    if (!blob) {
      setURL('')
      return
    }
    const url = URL.createObjectURL(blob)
    setURL(url)
    return () => URL.revokeObjectURL(url)
  }, [blob])
  return url
}
export function readDemoImage(file: File, signal: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    const abort = () => {
      reader.abort()
      reject(new DOMException('Cancelled', 'AbortError'))
    }
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
    reader.onload = () => {
      signal.removeEventListener('abort', abort)
      resolve(String(reader.result))
    }
    reader.onerror = () => {
      signal.removeEventListener('abort', abort)
      reject(new Error('The local image could not be read.'))
    }
    reader.readAsDataURL(file)
  })
}
