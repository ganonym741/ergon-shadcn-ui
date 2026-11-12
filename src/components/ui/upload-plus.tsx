import * as React from 'react'
import { Upload, Play, Pause, X, RotateCcw, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clamp, productId, productURL } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'

export interface UploadPartReceipt {
  index: number
  token: string
}
export interface UploadPartContext {
  id: string
  file: File
  index: number
  totalParts: number
  chunkSize: number
  signal: AbortSignal
  onProgress: (loaded: number) => void
}
export interface UploadTransport {
  uploadPart: (chunk: Blob, context: UploadPartContext) => Promise<UploadPartReceipt>
  getUploadedParts?: (context: {
    id: string
    file: File
    totalParts: number
    chunkSize: number
    signal: AbortSignal
  }) => Promise<UploadPartReceipt[]>
  complete?: (
    parts: UploadPartReceipt[],
    context: { id: string; file: File; signal: AbortSignal },
  ) => Promise<string | void>
  discard?: (context: { id: string; file: File }) => void | Promise<void>
}
export type UploadQueueStatus = 'queued' | 'uploading' | 'paused' | 'error' | 'complete'
export interface UploadQueueItem {
  id: string
  file: File
  /** Fixed for the lifetime of this file/session, including after prop changes. */
  chunkSize: number
  status: UploadQueueStatus
  parts: UploadPartReceipt[]
  loaded: number
  error?: string
  result?: string
}
export interface UploadPlusHandle {
  addFiles: (files: File[]) => void
  start: () => void
  pauseAll: () => void
  getQueue: () => UploadQueueItem[]
}
export interface UploadPlusProps extends Omit<React.ComponentProps<'section'>, 'onChange' | 'ref'> {
  transport: UploadTransport
  defaultFiles?: File[]
  onQueueChange?: (queue: UploadQueueItem[]) => void
  onComplete?: (item: UploadQueueItem) => void | Promise<void>
  onReject?: (file: File, reason: string) => void
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxFileSize?: number
  chunkSize?: number
  concurrency?: number
  retries?: number
  autoStart?: boolean
  disabled?: boolean
  label?: string
  ref?: React.Ref<UploadPlusHandle>
}
interface UploadContext {
  items: UploadQueueItem[]
  add: (files: File[]) => void
  start: () => void
  pauseAll: () => void
  pause: (id: string) => void
  resume: (id: string) => void
  remove: (id: string) => void
  disabled: boolean
  accept?: string
  multiple: boolean
  label: string
  error: string
}
const Context = React.createContext<UploadContext | null>(null)
const useUploadQueue = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Upload queue parts need UploadPlus.')
  return c
}
/** Validates server receipts before a resumed upload can skip local chunks. */
export function validateUploadParts(parts: UploadPartReceipt[], total: number) {
  return (
    parts.every(
      (part) =>
        Number.isInteger(part.index) &&
        part.index >= 0 &&
        part.index < total &&
        typeof part.token === 'string' &&
        !!part.token,
    ) && new Set(parts.map((part) => part.index)).size === parts.length
  )
}
const matchesAccept = (file: File, accept?: string) =>
  !accept ||
  accept.split(',').some((raw) => {
    const pattern = raw.trim().toLowerCase()
    return pattern.startsWith('.')
      ? file.name.toLowerCase().endsWith(pattern)
      : pattern.endsWith('/*')
        ? file.type.startsWith(pattern.slice(0, -1))
        : file.type === pattern
  })
const waitRetry = (delay: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Cancelled', 'AbortError'))
      return
    }
    const abort = () => {
        clearTimeout(timer)
        reject(new DOMException('Cancelled', 'AbortError'))
      },
      timer = setTimeout(() => {
        signal.removeEventListener('abort', abort)
        resolve()
      }, delay)
    signal.addEventListener('abort', abort, { once: true })
  })
/** Original bounded chunk scheduler. Resumption requires an application transport with durable receipts. */
export function UploadPlus({
  transport,
  defaultFiles = [],
  onQueueChange,
  onComplete,
  onReject,
  accept,
  multiple = true,
  maxFiles = 20,
  maxFileSize = 1024 * 1024 * 1024,
  chunkSize = 2 * 1024 * 1024,
  concurrency = 3,
  retries = 2,
  autoStart = false,
  disabled = false,
  label = 'Upload queue',
  ref,
  children,
  className,
  ...props
}: UploadPlusProps) {
  const size = Math.floor(clamp(chunkSize, 1024, 64 * 1024 * 1024)),
    [items, setItems] = React.useState<UploadQueueItem[]>(() =>
      defaultFiles
        .filter((file) => file.size <= maxFileSize && matchesAccept(file, accept))
        .slice(0, Math.floor(clamp(maxFiles, 0, 1000)))
        .map((file) => ({
          id: productId(),
          file,
          chunkSize: size,
          status: 'queued',
          parts: [],
          loaded: 0,
        })),
    )
  const [running, setRunning] = React.useState(autoStart),
    [error, setError] = React.useState('')
  const queue = React.useRef(items),
    controllers = React.useRef(new Map<string, AbortController>()),
    mounted = React.useRef(true),
    latest = React.useRef({ onQueueChange, onComplete, onReject, transport })
  React.useLayoutEffect(() => {
    queue.current = items
    latest.current = { onQueueChange, onComplete, onReject, transport }
  }, [items, onQueueChange, onComplete, onReject, transport])
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      for (const controller of controllers.current.values()) controller.abort()
      controllers.current.clear()
    }
  }, [])
  React.useEffect(() => {
    latest.current.onQueueChange?.(items)
  }, [items])
  const patch = (id: string, update: Partial<UploadQueueItem>) => {
    if (mounted.current)
      setItems((previous) =>
        previous.map((item) => (item.id === id ? { ...item, ...update } : item)),
      )
  }
  const add = (files: File[]) => {
    if (disabled) return
    setError('')
    const additions: UploadQueueItem[] = [],
      existing = queue.current
    for (const file of files.slice(0, multiple ? files.length : 1)) {
      const reason =
        existing.length + additions.length >= Math.floor(clamp(maxFiles, 0, 1000))
          ? 'The queue is full.'
          : file.size > maxFileSize
            ? 'The file exceeds the size limit.'
            : !matchesAccept(file, accept)
              ? 'This file type is not accepted.'
              : undefined
      if (reason) {
        setError(reason)
        latest.current.onReject?.(file, reason)
        continue
      }
      if (
        [...existing, ...additions].some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified,
        )
      )
        continue
      additions.push({
        id: productId(),
        file,
        chunkSize: size,
        status: 'queued',
        parts: [],
        loaded: 0,
      })
    }
    if (additions.length) {
      queue.current = [...existing, ...additions]
      setItems((previous) => [...previous, ...additions])
      if (autoStart) setRunning(true)
    }
  }
  const pause = (id: string) => {
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    patch(id, { status: 'paused' })
  }
  const pauseAll = () => {
    setRunning(false)
    for (const controller of controllers.current.values()) controller.abort()
    controllers.current.clear()
    setItems((previous) =>
      previous.map((item) =>
        item.status === 'uploading' || item.status === 'queued'
          ? { ...item, status: 'paused' }
          : item,
      ),
    )
  }
  const start = () => {
    if (disabled) return
    setRunning(true)
    setItems((previous) =>
      previous.map((item) =>
        item.status === 'paused' ? { ...item, status: 'queued', error: undefined } : item,
      ),
    )
  }
  const resume = (id: string) => {
    if (disabled) return
    setRunning(true)
    patch(id, { status: 'queued', error: undefined })
  }
  const remove = (id: string) => {
    const item = queue.current.find((item) => item.id === id)
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    setItems((previous) => previous.filter((item) => item.id !== id))
    if (item)
      Promise.resolve()
        .then(() => latest.current.transport.discard?.({ id, file: item.file }))
        .catch((failure) => {
          if (mounted.current)
            setError(failure instanceof Error ? failure.message : 'Could not discard the upload.')
        })
  }
  React.useImperativeHandle(ref, () => ({
    addFiles: add,
    start,
    pauseAll,
    getQueue: () => queue.current,
  }))
  React.useEffect(() => {
    if (disabled) {
      for (const controller of controllers.current.values()) controller.abort()
      controllers.current.clear()
      setItems((previous) =>
        previous.some((item) => item.status === 'uploading')
          ? previous.map((item) =>
              item.status === 'uploading' ? { ...item, status: 'paused' } : item,
            )
          : previous,
      )
      return
    }
    if (!running) return
    for (const item of items.filter((item) => item.status === 'queued')) {
      if (controllers.current.size >= Math.floor(clamp(concurrency, 1, 8))) break
      if (controllers.current.has(item.id)) continue
      const controller = new AbortController(),
        signal = controller.signal,
        provider = transport,
        partSize = item.chunkSize,
        retryLimit = Math.floor(clamp(retries, 0, 5)),
        total = Math.max(1, Math.ceil(item.file.size / partSize))
      controllers.current.set(item.id, controller)
      patch(item.id, { status: 'uploading' })
      void (async () => {
        let parts = [...item.parts]
        try {
          if (provider.getUploadedParts)
            parts = await provider.getUploadedParts({
              id: item.id,
              file: item.file,
              totalParts: total,
              chunkSize: partSize,
              signal,
            })
          if (signal.aborted) return
          if (!validateUploadParts(parts, total))
            throw new Error('The upload service returned invalid chunk receipts.')
          const partBytes = (index: number) =>
            Math.max(0, Math.min(partSize, item.file.size - index * partSize))
          let loaded = parts.reduce((sum, part) => sum + partBytes(part.index), 0)
          patch(item.id, { parts, loaded })
          for (let index = 0; index < total; index++) {
            if (parts.some((part) => part.index === index)) continue
            if (signal.aborted) return
            const chunk = item.file.slice(index * partSize, (index + 1) * partSize)
            let receipt: UploadPartReceipt | undefined
            for (let attempt = 0; attempt <= retryLimit; attempt++) {
              try {
                receipt = await provider.uploadPart(chunk, {
                  id: item.id,
                  file: item.file,
                  index,
                  totalParts: total,
                  chunkSize: partSize,
                  signal,
                  onProgress: (bytes) => {
                    if (!signal.aborted && controllers.current.get(item.id) === controller)
                      patch(item.id, { loaded: loaded + clamp(bytes, 0, chunk.size) })
                  },
                })
                break
              } catch (failure) {
                if (signal.aborted) throw failure
                if (attempt >= retryLimit) throw failure
                await waitRetry(Math.min(5000, 250 * 2 ** attempt), signal)
              }
            }
            if (signal.aborted) return
            if (!receipt || receipt.index !== index || !validateUploadParts([receipt], total))
              throw new Error('The upload service returned an invalid chunk receipt.')
            parts = [...parts, receipt]
            loaded += chunk.size
            patch(item.id, { parts, loaded })
          }
          const result = await provider.complete?.(
            [...parts].sort((a, b) => a.index - b.index),
            { id: item.id, file: item.file, signal },
          )
          if (signal.aborted) return
          const complete: UploadQueueItem = {
            ...item,
            parts,
            status: 'complete',
            loaded: item.file.size,
            result: result || undefined,
          }
          patch(item.id, complete)
          const notify = latest.current.onComplete
          void Promise.resolve()
            .then(() => notify?.(complete))
            .catch((failure) => {
              if (mounted.current)
                setError(
                  failure instanceof Error ? failure.message : 'The completion callback failed.',
                )
            })
        } catch (failure) {
          if (!signal.aborted)
            patch(item.id, {
              status: 'error',
              error: failure instanceof Error ? failure.message : 'Upload failed.',
            })
        } finally {
          if (controllers.current.get(item.id) === controller) {
            controllers.current.delete(item.id)
            if (mounted.current) setItems((previous) => [...previous])
          }
        }
      })()
    }
  }, [items, running, disabled, concurrency, retries, size, transport])
  return (
    <Context.Provider
      value={{
        items,
        add,
        start,
        pauseAll,
        pause,
        resume,
        remove,
        disabled,
        accept,
        multiple,
        label,
        error,
      }}
    >
      <section
        {...props}
        data-slot="upload-plus"
        aria-label={label}
        className={cn('w-full min-w-0 space-y-3', className)}
      >
        {children ?? (
          <>
            <UploadPlusDropzone />
            <UploadPlusToolbar />
            <UploadPlusList />
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
/** Native input and file drop target, preserving keyboard selection and default navigation safety. */
export function UploadPlusDropzone() {
  const c = useUploadQueue(),
    id = React.useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 p-6 text-center focus-within:ring-2 focus-within:ring-ring',
        c.disabled && 'cursor-not-allowed opacity-50',
      )}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault()
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        if (!c.disabled) c.add(Array.from(event.dataTransfer.files))
      }}
    >
      <Upload className="size-6 text-primary" />
      <span className="text-sm font-medium">Choose files or drop them here</span>
      <span className="text-xs text-muted-foreground">
        Pause and resume large files without losing completed progress.
      </span>
      <input
        id={id}
        type="file"
        aria-label="Choose upload files"
        className="sr-only"
        accept={c.accept}
        multiple={c.multiple}
        disabled={c.disabled}
        onChange={(event) => {
          c.add(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
      <span className="mt-2 inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs font-medium shadow-xs">
        Browse files
      </span>
    </label>
  )
}
/** Explicit queue controls; pausing retains successful chunk receipts. */
export function UploadPlusToolbar() {
  const c = useUploadQueue()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="me-auto text-xs text-muted-foreground">
        {c.items.filter((item) => item.status === 'complete').length} of {c.items.length} complete
      </span>
      <Button
        type="button"
        size="sm"
        disabled={
          c.disabled ||
          !c.items.some((item) => item.status === 'queued' || item.status === 'paused')
        }
        onClick={c.start}
      >
        <Play />
        Start queue
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={
          c.disabled ||
          !c.items.some((item) => item.status === 'uploading' || item.status === 'queued')
        }
        onClick={c.pauseAll}
      >
        <Pause />
        Pause all
      </Button>
    </div>
  )
}
/** Stable-ID rows with real loaded-byte counts, cancellation, retry and completion results. */
export function UploadPlusList() {
  const c = useUploadQueue()
  return c.items.length ? (
    <ul className="divide-y rounded-xl border">
      {c.items.map((item) => (
        <UploadPlusItem key={item.id} item={item} />
      ))}
    </ul>
  ) : (
    <p role="status" className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
      No files queued.
    </p>
  )
}
export function UploadPlusItem({ item }: { item: UploadQueueItem }) {
  const c = useUploadQueue(),
    percent =
      item.status === 'complete'
        ? 100
        : item.file.size
          ? Math.floor(clamp((item.loaded / item.file.size) * 100, 0, 100))
          : 0,
    href = item.result && productURL(item.result)
  return (
    <li className="space-y-2 p-3">
      <div className="flex items-center gap-2">
        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm" title={item.file.name}>
          {item.file.name}
        </span>
        <span dir="ltr" className="text-xs tabular-nums">
          {percent}%
        </span>
        {item.status === 'uploading' ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={c.disabled}
            aria-label={`Pause ${item.file.name}`}
            onClick={() => c.pause(item.id)}
          >
            <Pause />
          </Button>
        ) : ['paused', 'error'].includes(item.status) ? (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            disabled={c.disabled}
            aria-label={`Resume ${item.file.name}`}
            onClick={() => c.resume(item.id)}
          >
            <RotateCcw />
          </Button>
        ) : null}
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          disabled={c.disabled}
          aria-label={`Remove ${item.file.name}`}
          onClick={() => c.remove(item.id)}
        >
          <X />
        </Button>
      </div>
      <progress
        aria-label={`${item.file.name} upload progress`}
        max={100}
        value={percent}
        className="h-1.5 w-full accent-primary"
      />
      <div className="flex flex-wrap justify-between gap-1 text-[11px] text-muted-foreground">
        <span>{item.status}</span>
        <span dir="ltr">
          {Math.round(item.loaded / 1024)} / {Math.round(item.file.size / 1024)} KiB
        </span>
      </div>
      {item.error && (
        <p role="alert" className="break-words text-xs text-destructive">
          {item.error}
        </p>
      )}
      {href && (
        <a href={href} className="text-xs text-primary underline">
          Open uploaded file
        </a>
      )}
    </li>
  )
}
