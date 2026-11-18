import * as React from 'react'
import { Paperclip, ArrowUp, Square, X, FileText, LoaderCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useControllableState } from '@/components/ui/util'
import { useAsyncAction, productId, productURL } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export interface PromptAttachment {
  id: string
  name: string
  mediaType: string
  size: number
  file?: File
  url?: string
  uploadId?: string
  status: 'ready' | 'uploading' | 'error'
  error?: string
}
export interface PromptSubmission {
  text: string
  attachments: PromptAttachment[]
}
export interface PromptComposerProps extends Omit<
  React.ComponentProps<'section'>,
  'onSubmit' | 'onChange' | 'defaultValue'
> {
  value?: string
  defaultValue?: string
  onValueChange?: (text: string) => void
  onSubmit: (prompt: PromptSubmission, options: { signal: AbortSignal }) => void | Promise<void>
  onAttachmentUpload?: (
    file: File,
    options: { signal: AbortSignal },
  ) => Promise<{ url: string; id?: string }>
  onAttachmentsChange?: (attachments: PromptAttachment[]) => void
  onRejectFile?: (file: File, reason: string) => void
  onStop?: () => void
  status?: 'idle' | 'submitting' | 'streaming'
  disabled?: boolean
  placeholder?: string
  accept?: string
  maxFiles?: number
  maxFileSize?: number
  maxLength?: number
  submitOnEnter?: boolean
  footer?: React.ReactNode
}
interface PromptContext {
  text: string
  setText: (text: string) => void
  attachments: PromptAttachment[]
  add: (files: File[]) => void
  remove: (id: string) => void
  retry: (attachment: PromptAttachment) => void
  send: () => void
  stop: () => void
  busy: boolean
  streaming: boolean
  disabled: boolean
  placeholder: string
  accept?: string
  maxLength: number
  submitOnEnter: boolean
  footer?: React.ReactNode
  error: string
}
const Context = React.createContext<PromptContext | null>(null)
const usePrompt = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Prompt parts need PromptComposer.')
  return c
}
/** Upload callbacks choose storage; without one the submit callback receives the original File objects. */
export function PromptComposer({
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  onAttachmentUpload,
  onAttachmentsChange,
  onRejectFile,
  onStop,
  status = 'idle',
  disabled = false,
  placeholder = 'Ask anything…',
  accept,
  maxFiles = 8,
  maxFileSize = 20 * 1024 * 1024,
  maxLength = 32000,
  submitOnEnter = true,
  footer,
  children,
  className,
  ...props
}: PromptComposerProps) {
  const [text, setText] = useControllableState({ value, defaultValue, onChange: onValueChange }),
    [attachments, setAttachments] = React.useState<PromptAttachment[]>([]),
    [fileError, setFileError] = React.useState(''),
    action = useAsyncAction(),
    controllers = React.useRef(new Map<string, AbortController>()),
    latest = React.useRef({ onAttachmentsChange, onAttachmentUpload, onRejectFile }),
    mounted = React.useRef(true)
  latest.current = { onAttachmentsChange, onAttachmentUpload, onRejectFile }
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      for (const controller of controllers.current.values()) controller.abort()
      controllers.current.clear()
    }
  }, [])
  React.useEffect(() => latest.current.onAttachmentsChange?.(attachments), [attachments])
  const busy = action.busy || status === 'submitting',
    streaming = status === 'streaming'
  const upload = (attachment: PromptAttachment) => {
    const file = attachment.file,
      handler = latest.current.onAttachmentUpload
    if (!file || !handler) return
    controllers.current.get(attachment.id)?.abort()
    const controller = new AbortController()
    controllers.current.set(attachment.id, controller)
    setAttachments((items) =>
      items.map((item) =>
        item.id === attachment.id ? { ...item, status: 'uploading', error: undefined } : item,
      ),
    )
    void Promise.resolve()
      .then(() => handler(file, { signal: controller.signal }))
      .then((result) => {
        if (!controller.signal.aborted && mounted.current) {
          if (!productURL(result.url, true))
            throw new Error('The upload callback returned an unsupported URL.')
          setAttachments((items) =>
            items.map((item) =>
              item.id === attachment.id
                ? { ...item, status: 'ready', url: result.url, uploadId: result.id }
                : item,
            ),
          )
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted && mounted.current)
          setAttachments((items) =>
            items.map((item) =>
              item.id === attachment.id
                ? {
                    ...item,
                    status: 'error',
                    error: failure instanceof Error ? failure.message : 'Upload failed.',
                  }
                : item,
            ),
          )
      })
      .finally(() => {
        if (controllers.current.get(attachment.id) === controller)
          controllers.current.delete(attachment.id)
      })
  }
  const add = (files: File[]) => {
    if (disabled || busy || streaming) return
    setFileError('')
    let count = attachments.length
    const added: PromptAttachment[] = []
    for (const file of files) {
      const allowed =
        !accept ||
        accept.split(',').some((entry) => {
          const type = entry.trim().toLowerCase()
          return type.startsWith('.')
            ? file.name.toLowerCase().endsWith(type)
            : type.endsWith('/*')
              ? file.type.startsWith(type.slice(0, -1))
              : file.type === type
        })
      const reason =
        count >= Math.max(0, maxFiles)
          ? 'Attachment limit reached.'
          : file.size > maxFileSize
            ? 'File exceeds the size limit.'
            : !allowed
              ? 'File type is not accepted.'
              : ''
      if (reason) {
        setFileError(reason)
        latest.current.onRejectFile?.(file, reason)
        continue
      }
      const attachment: PromptAttachment = {
        id: productId(),
        name: file.name,
        mediaType: file.type,
        size: file.size,
        file,
        status: latest.current.onAttachmentUpload ? 'uploading' : 'ready',
      }
      added.push(attachment)
      count++
    }
    setAttachments((items) => [...items, ...added])
    for (const item of added) upload(item)
  }
  const remove = (id: string) => {
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    setAttachments((items) => items.filter((item) => item.id !== id))
  }
  const send = () => {
    if (
      disabled ||
      busy ||
      streaming ||
      (!text.trim() && !attachments.length) ||
      attachments.some((item) => item.status !== 'ready') ||
      text.length > maxLength
    )
      return
    const snapshot = text,
      files = attachments
    void action.run(async (signal) => {
      await onSubmit({ text: snapshot.trim(), attachments: files }, { signal })
      if (!signal.aborted) {
        setText((current) => (current === snapshot ? '' : current))
        setAttachments((current) =>
          current.filter((item) => !files.some((file) => file.id === item.id)),
        )
      }
    })
  }
  const stop = () => {
    action.cancel()
    onStop?.()
  }
  return (
    <Context.Provider
      value={{
        text,
        setText,
        attachments,
        add,
        remove,
        retry: upload,
        send,
        stop,
        busy,
        streaming,
        disabled,
        placeholder,
        accept,
        maxLength,
        submitOnEnter,
        footer,
        error: action.error || fileError,
      }}
    >
      <section
        {...props}
        data-slot="prompt-composer"
        aria-label="Prompt composer"
        className={cn(
          'w-full min-w-0 overflow-hidden rounded-2xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring/30',
          className,
        )}
        onDragOver={(event) => {
          props.onDragOver?.(event)
          if (!event.defaultPrevented) event.preventDefault()
        }}
        onDrop={(event) => {
          props.onDrop?.(event)
          if (event.defaultPrevented) return
          event.preventDefault()
          add([...event.dataTransfer.files])
        }}
      >
        {children ?? (
          <>
            <PromptComposerAttachments />
            <PromptComposerEditor />
            <PromptComposerFooter />
          </>
        )}
        {(action.error || fileError) && (
          <p role="alert" className="px-4 pb-3 text-xs text-destructive">
            {action.error || fileError}
          </p>
        )}
      </section>
    </Context.Provider>
  )
}
export function PromptComposerEditor() {
  const c = usePrompt()
  return (
    <Textarea
      aria-label="Message prompt"
      dir="auto"
      placeholder={c.placeholder}
      value={c.text}
      maxLength={c.maxLength}
      disabled={c.disabled || c.busy}
      onChange={(event) => c.setText(event.target.value)}
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' &&
          !event.shiftKey &&
          c.submitOnEnter &&
          !event.nativeEvent.isComposing &&
          event.nativeEvent.keyCode !== 229
        ) {
          event.preventDefault()
          c.send()
        }
      }}
      className="max-h-64 min-h-24 resize-y rounded-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
    />
  )
}
export function PromptComposerAttachments() {
  const c = usePrompt()
  return c.attachments.length ? (
    <ul className="flex flex-wrap gap-2 px-3 pt-3">
      {c.attachments.map((item) => (
        <li
          key={item.id}
          className="flex max-w-full items-center gap-2 rounded-lg border bg-muted/30 px-2 py-2 text-xs"
        >
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <span className="block max-w-44 truncate">{item.name}</span>
            <span
              role="status"
              className={cn(
                'block text-[10px] text-muted-foreground',
                item.status === 'error' && 'text-destructive',
              )}
            >
              {item.status === 'ready'
                ? `${(item.size / 1024).toFixed(1)} KB`
                : (item.error ?? 'Uploading…')}
            </span>
          </div>
          {item.status === 'uploading' && <LoaderCircle className="size-3 animate-spin" />}
          {item.status === 'error' && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Retry ${item.name}`}
              disabled={c.busy || c.disabled}
              onClick={() => c.retry(item)}
            >
              <RotateCcw />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Remove ${item.name}`}
            disabled={c.busy || c.disabled}
            onClick={() => c.remove(item.id)}
          >
            <X />
          </Button>
        </li>
      ))}
    </ul>
  ) : null
}
export function PromptComposerFooter() {
  const c = usePrompt(),
    input = React.useRef<HTMLInputElement>(null),
    canSend = !!c.text.trim() || c.attachments.length > 0
  return (
    <footer className="flex flex-wrap items-center gap-2 px-3 pb-3">
      <input
        ref={input}
        type="file"
        multiple
        accept={c.accept}
        hidden
        onChange={(event) => {
          c.add([...(event.target.files ?? [])])
          event.target.value = ''
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Attach files"
        disabled={c.disabled || c.busy || c.streaming}
        onClick={() => input.current?.click()}
      >
        <Paperclip />
      </Button>
      <div className="min-w-0 flex-1 text-xs text-muted-foreground">
        {c.footer ?? (
          <span>
            {c.submitOnEnter ? 'Enter to send · Shift+Enter for a new line' : 'Use Send to submit'}
          </span>
        )}
      </div>
      <span dir="ltr" className="text-[10px] tabular-nums text-muted-foreground">
        {c.text.length.toLocaleString()} / {c.maxLength.toLocaleString()}
      </span>
      {c.busy || c.streaming ? (
        <Button
          type="button"
          size="icon-sm"
          aria-label="Stop generation"
          variant="secondary"
          disabled={c.disabled}
          onClick={c.stop}
        >
          <Square />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon-sm"
          aria-label="Send prompt"
          disabled={
            c.disabled ||
            !canSend ||
            c.attachments.some((item) => item.status !== 'ready') ||
            c.text.length > c.maxLength
          }
          onClick={c.send}
        >
          <ArrowUp />
        </Button>
      )}
    </footer>
  )
}
