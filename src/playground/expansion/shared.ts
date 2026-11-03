import type { PreviewProps } from '../preview'
export function report(props: PreviewProps, type: string, value: unknown) {
  props.onEvent({ type, value, time: Date.now() })
}
/** Simulates latency only; playground examples never contact production services. */
export function simulate(signal?: AbortSignal, failure = false) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Cancelled', 'AbortError'))
      return
    }
    const abort = () => {
        clearTimeout(timer)
        reject(new DOMException('Cancelled', 'AbortError'))
      },
      timer = setTimeout(() => {
        signal?.removeEventListener('abort', abort)
        if (failure) reject(new Error('Simulated operation failure.'))
        else resolve()
      }, 450)
    signal?.addEventListener('abort', abort, { once: true })
  })
}
