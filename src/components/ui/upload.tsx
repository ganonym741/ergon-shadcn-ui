import * as React from 'react'
import { UploadCloud, X, FileText, Loader2, Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'
export interface UploadFile {
  id: string
  file: File
  status: 'ready' | 'uploading' | 'done' | 'error'
  error?: string
  progress?: number
  preview?: string
}
export interface UploadProps {
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxCount?: number
  disabled?: boolean
  onFilesChange?: (files: File[]) => void
  customRequest?: (
    file: File,
    signal: AbortSignal,
    onProgress: (percent: number) => void,
  ) => Promise<void>
  directory?: boolean
  showThumbnails?: boolean
  className?: string
  fileList?: UploadFile[]
  defaultFileList?: UploadFile[]
  onFileListChange?: (files: UploadFile[]) => void
  beforeUpload?: (file: File) => File | false | Promise<File | false>
  paste?: boolean
}
export function Upload({
  accept,
  multiple = true,
  maxSize = 10 * 1024 * 1024,
  maxCount = 10,
  disabled,
  onFilesChange,
  customRequest,
  className,
  directory,
  showThumbnails = true,
  fileList,
  defaultFileList = [],
  onFileListChange,
  beforeUpload,
  paste = true,
}: UploadProps) {
  const [files, setFiles] = useControllableState<UploadFile[]>({
    value: fileList,
    defaultValue: defaultFileList,
    onChange: onFileListChange,
  })
  const [error, setError] = React.useState('')
  const [drag, setDrag] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)
  const requests = React.useRef(new Map<string, AbortController>())
  const previews = React.useRef(new Map<string, string>())
  React.useEffect(
    () => () => {
      requests.current.forEach((c) => c.abort())
      previews.current.forEach((url) => URL.revokeObjectURL(url))
    },
    [],
  )
  const start = (entry: UploadFile) => {
    if (!customRequest) return
    const controller = new AbortController()
    requests.current.set(entry.id, controller)
    setFiles((files) =>
      files.map((f) =>
        f.id === entry.id ? { ...f, status: 'uploading', error: undefined, progress: 0 } : f,
      ),
    )
    Promise.resolve()
      .then(() =>
        customRequest(entry.file, controller.signal, (percent) => {
          if (!controller.signal.aborted)
            setFiles((files) =>
              files.map((f) =>
                f.id === entry.id ? { ...f, progress: Math.max(0, Math.min(100, percent)) } : f,
              ),
            )
        }),
      )
      .then(() => {
        if (!controller.signal.aborted)
          setFiles((files) =>
            files.map((f) => (f.id === entry.id ? { ...f, status: 'done', progress: 100 } : f)),
          )
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setFiles((files) =>
            files.map((f) =>
              f.id === entry.id
                ? {
                    ...f,
                    status: 'error',
                    error: error instanceof Error ? error.message : String(error),
                  }
                : f,
            ),
          )
      })
      .finally(() => requests.current.delete(entry.id))
  }
  const add = async (incoming: File[]) => {
    if (disabled) return
    setError('')
    const available = (multiple ? maxCount : 1) - files.length
    const accepted: UploadFile[] = []
    for (let file of incoming) {
      if (beforeUpload) {
        try {
          const result = await beforeUpload(file)
          if (result === false) continue
          file = result
        } catch (error) {
          setError(String(error))
          continue
        }
      }
      const types = accept?.split(',').map((t) => t.trim().toLowerCase())
      const valid =
        !types ||
        types.some((t) =>
          t.startsWith('.')
            ? file.name.toLowerCase().endsWith(t)
            : t.endsWith('/*')
              ? file.type.startsWith(t.slice(0, -1))
              : file.type === t,
        )
      if (file.size > maxSize) {
        setError(`${file.name} exceeds ${(maxSize / 1024 / 1024).toFixed(0)} MB.`)
        continue
      }
      if (!valid) {
        setError(`${file.name} is not an accepted file type.`)
        continue
      }
      if (accepted.length >= available) {
        setError(`Choose at most ${multiple ? maxCount : 1} files.`)
        break
      }
      const id = crypto.randomUUID(),
        preview =
          showThumbnails && file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      if (preview) previews.current.set(id, preview)
      accepted.push({
        id,
        file,
        preview,
        status: customRequest ? 'uploading' : 'ready',
      })
    }
    const next = [...files, ...accepted]
    setFiles(next)
    onFilesChange?.(next.map((f) => f.file))
    accepted.forEach(start)
  }
  return (
    <div
      className={cn('w-full max-w-lg', className)}
      onPaste={(e) => {
        if (paste && e.clipboardData.files.length) {
          e.preventDefault()
          void add(Array.from(e.clipboardData.files))
        }
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          add(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-sm transition hover:border-primary hover:bg-primary/5 disabled:opacity-50',
          drag && 'border-primary bg-primary/5',
        )}
      >
        <UploadCloud className="mb-2 size-8 text-primary" />
        <span className="font-medium">Click to upload or drag and drop</span>
        <span className="text-xs text-muted-foreground">
          {accept || 'Any file type'} · up to {maxSize / 1024 / 1024} MB
        </span>
      </button>
      <input
        ref={input}
        className="hidden"
        type="file"
        accept={accept}
        multiple={multiple}
        {...(directory ? { webkitdirectory: '' } : {})}
        disabled={disabled}
        aria-label="Choose files"
        onChange={(e) => {
          add(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
            {f.preview ? (
              <img
                src={f.preview}
                alt={f.file.name}
                className="size-10 shrink-0 rounded object-cover"
              />
            ) : (
              <FileText size={16} />
            )}
            <span className="min-w-0 flex-1 truncate">
              {f.file.name}
              <small className="ml-2 text-muted-foreground">
                {(f.file.size / 1024).toFixed(1)} KB
              </small>
              {f.status === 'error' && (
                <span className="block text-xs text-destructive">{f.error}</span>
              )}
              {f.status === 'uploading' && (
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full bg-primary transition-[width]"
                    style={{ width: `${f.progress ?? 0}%` }}
                  />
                </span>
              )}
            </span>
            {f.status === 'uploading' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : f.status === 'done' ? (
              <Check className="size-4 text-emerald-600" />
            ) : null}
            {f.status === 'error' && (
              <button
                type="button"
                disabled={disabled}
                aria-label={`Retry ${f.file.name}`}
                onClick={() => start(f)}
              >
                <RefreshCw size={14} />
              </button>
            )}
            <button
              type="button"
              aria-label={`Remove ${f.file.name}`}
              onClick={() => {
                requests.current.get(f.id)?.abort()
                const preview = previews.current.get(f.id)
                if (preview) {
                  URL.revokeObjectURL(preview)
                  previews.current.delete(f.id)
                }
                const next = files.filter((v) => v.id !== f.id)
                setFiles(next)
                onFilesChange?.(next.map((v) => v.file))
              }}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
