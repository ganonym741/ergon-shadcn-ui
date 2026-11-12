import * as React from 'react'
import { useControllableState } from '@/components/ui/util'

/** Runs the latest cancellable action without publishing stale results after unmount. */
export function useAsyncAction() {
  const active = React.useRef<AbortController | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  React.useEffect(
    () => () => {
      active.current?.abort()
      active.current = null
    },
    [],
  )
  const cancel = React.useCallback(() => {
    active.current?.abort()
    active.current = null
    setBusy(false)
  }, [])
  const run = React.useCallback(async <T>(task: (signal: AbortSignal) => T | Promise<T>) => {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setBusy(true)
    setError('')
    try {
      const value = await task(controller.signal)
      if (!controller.signal.aborted && active.current === controller) return value
    } catch (failure) {
      if (!controller.signal.aborted && active.current === controller)
        setError(failure instanceof Error ? failure.message : 'The action failed.')
    } finally {
      if (active.current === controller) {
        active.current = null
        setBusy(false)
      }
    }
    return undefined
  }, [])
  return { busy, error, run, cancel, clearError: () => setError('') }
}

/** Bounded immutable history for controlled or uncontrolled editors. */
export function useEditorHistory<T>({
  value,
  defaultValue,
  onChange,
  limit = 50,
}: {
  value?: T
  defaultValue: T
  onChange?: (value: T) => void
  limit?: number
}) {
  const [current, setCurrent] = useControllableState({ value, defaultValue, onChange })
  const [past, setPast] = React.useState<T[]>([])
  const [future, setFuture] = React.useState<T[]>([])
  const expected = React.useRef(current)
  React.useEffect(() => {
    if (value !== undefined && value !== expected.current) {
      expected.current = value
      setPast([])
      setFuture([])
    }
  }, [value])
  const apply = (next: T) => {
    expected.current = next
    setCurrent(next)
  }
  return {
    value: current,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    commit(next: T) {
      if (Object.is(next, current)) return
      setPast((previous) => [...previous, current].slice(-Math.max(1, Math.min(100, limit))))
      setFuture([])
      apply(next)
    },
    undo() {
      if (!past.length) return
      setPast(past.slice(0, -1))
      setFuture([current, ...future])
      apply(past[past.length - 1])
    },
    redo() {
      if (!future.length) return
      setPast([...past, current])
      setFuture(future.slice(1))
      apply(future[0])
    },
  }
}

/** Accepts explicit web/blob/image URLs and relative paths, never executable protocols. */
export function productURL(value: string, image = false): string | undefined {
  const clean = value.trim()
  if (
    !clean ||
    [...clean].some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)
  )
    return
  if (image && /^data:image\/(?:png|jpeg|webp|gif);base64,[\da-z+/=]+$/i.test(clean)) return clean
  try {
    const url = new URL(clean, 'https://ergon.invalid/')
    if (['http:', 'https:'].includes(url.protocol) || (image && url.protocol === 'blob:'))
      return clean
  } catch {
    /* Invalid input remains inert. */
  }
}
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))
/** Creates client-side entity IDs in secure and plain-HTTP browser contexts. */
export const productId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
