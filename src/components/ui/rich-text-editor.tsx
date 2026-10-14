import * as React from 'react'
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type Extensions,
  type JSONContent,
} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { TableKit } from '@tiptap/extension-table'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  ImagePlus,
  Link,
  Unlink,
  Highlighter,
  Minus,
  CodeXml,
  Table2,
  RemoveFormatting,
  X,
  Loader2,
  Check,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  RichTextUploadAnchors,
  imageUploadAnchors,
  changeImageUploadAnchors,
  richTextURL,
  withUploadSignal,
} from '@/lib/rich-text-uploads'
export type { Editor, JSONContent } from '@tiptap/react'
export interface RichTextImage {
  src: string
  alt?: string
  title?: string
}
export interface ImageUploadOptions {
  signal: AbortSignal
  onProgress: (percent: number) => void
}
export type RichTextImageUploader = (
  file: File,
  options: ImageUploadOptions,
) => Promise<string | RichTextImage>
export interface RichTextUpload {
  id: string
  name: string
  status: 'queued' | 'uploading' | 'done' | 'error' | 'cancelled'
  progress?: number
  error?: string
}
export interface RichTextContent {
  html: string
  json: JSONContent
  text: string
}
export interface RichTextEditorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children'
> {
  value?: string
  defaultValue?: string
  onValueChange?: (html: string) => void
  onContentChange?: (content: RichTextContent) => void
  onImageUpload?: RichTextImageUploader
  onImageUploaded?: (image: RichTextImage, file: File) => void
  onImageUploadError?: (error: Error, file: File) => void
  imageAccept?: string
  maxImageSize?: number
  maxFiles?: number
  placeholder?: string
  label?: string
  disabled?: boolean
  readOnly?: boolean
  toolbar?: boolean
  minHeight?: number
  maxHeight?: number
  extensions?: Extensions
  onReady?: (editor: Editor | null) => void
  children?: React.ReactNode
}
interface RichTextContextValue {
  editor: Editor | null
  disabled: boolean
  readOnly: boolean
  label: string
  minHeight: number
  maxHeight: number
  uploads: RichTextUpload[]
  uploadFiles: (files: File[], position?: number) => Promise<void>
  cancelUpload: (id: string) => void
  retryUpload: (id: string) => void
  dismissUpload: (id: string) => void
  chooseImages: () => void
  canUpload: boolean
}
const RichTextContext = React.createContext<RichTextContextValue | null>(null)
export function useRichTextEditor() {
  const context = React.useContext(RichTextContext)
  if (!context) throw new Error('Rich text parts must be inside RichTextEditor')
  return context
}
const EditorImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') ?? 'center',
        renderHTML: (attrs) => ({
          'data-align': attrs.alignment,
          style: `display:block;max-width:100%;height:auto;margin-left:${attrs.alignment === 'left' ? '0' : 'auto'};margin-right:${attrs.alignment === 'right' ? '0' : 'auto'}`,
        }),
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) =>
          richTextURL((element as HTMLElement).getAttribute('src') ?? '', 'image') ? null : false,
      },
    ]
  },
})
export function RichTextEditor({
  value,
  defaultValue = '<p></p>',
  onValueChange,
  onContentChange,
  onImageUpload,
  onImageUploaded,
  onImageUploadError,
  imageAccept = 'image/png,image/jpeg,image/webp,image/gif,image/avif',
  maxImageSize = 10 * 1024 * 1024,
  maxFiles = 5,
  placeholder = 'Write your story…',
  label = 'Rich text editor',
  disabled = false,
  readOnly = false,
  toolbar = true,
  minHeight = 240,
  maxHeight = 600,
  extensions = [],
  onReady,
  children,
  className,
  ...props
}: RichTextEditorProps) {
  const latest = React.useRef({
    onValueChange,
    onContentChange,
    onImageUpload,
    onImageUploaded,
    onImageUploadError,
    imageAccept,
    maxImageSize,
    maxFiles,
    disabled,
    readOnly,
    onReady,
  })
  latest.current = {
    onValueChange,
    onContentChange,
    onImageUpload,
    onImageUploaded,
    onImageUploadError,
    imageAccept,
    maxImageSize,
    maxFiles,
    disabled,
    readOnly,
    onReady,
  }
  const [uploads, setUploads] = React.useState<RichTextUpload[]>([]),
    input = React.useRef<HTMLInputElement>(null),
    tasks = React.useRef(new Map<string, { file: File; controller: AbortController }>()),
    failedFiles = React.useRef(new Map<string, File>()),
    queue = React.useRef(Promise.resolve()),
    mounted = React.useRef(true),
    lastHTML = React.useRef(value ?? defaultValue),
    uploadRef = React.useRef<RichTextContextValue['uploadFiles']>(async () => {})
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          isAllowedUri: (url) => !!richTextURL(url, 'link'),
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      EditorImage,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyleKit,
      TableKit.configure({ table: { resizable: true } }),
      RichTextUploadAnchors,
      ...extensions,
    ],
    content: value ?? defaultValue,
    editable: !disabled && !readOnly,
    editorProps: {
      attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': label },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (!files.length || latest.current.disabled || latest.current.readOnly) return false
        void uploadRef.current(files)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? [])
        if (moved || !files.length || latest.current.disabled || latest.current.readOnly)
          return false
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        void uploadRef.current(files, position)
        return true
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      lastHTML.current = html
      latest.current.onValueChange?.(html)
      latest.current.onContentChange?.({ html, json: editor.getJSON(), text: editor.getText() })
    },
  })
  const updateUpload = React.useCallback((id: string, patch: Partial<RichTextUpload>) => {
    if (mounted.current)
      setUploads((previous) =>
        previous.map((task) => (task.id === id ? { ...task, ...patch } : task)),
      )
  }, [])
  const cancelUpload = React.useCallback(
    (id: string) => {
      tasks.current.get(id)?.controller.abort()
      if (editor) changeImageUploadAnchors(editor, { remove: id })
      updateUpload(id, { status: 'cancelled' })
    },
    [editor, updateUpload],
  )
  const cancelAll = React.useCallback(() => {
    tasks.current.forEach(({ controller }) => controller.abort())
    if (editor) changeImageUploadAnchors(editor, { clear: true })
    if (mounted.current)
      setUploads((previous) =>
        previous.map((task) =>
          task.status === 'queued' || task.status === 'uploading'
            ? { ...task, status: 'cancelled' }
            : task,
        ),
      )
  }, [editor])
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      tasks.current.forEach(({ controller }) => controller.abort())
    }
  }, [])
  React.useEffect(() => {
    if (!editor) return
    latest.current.onReady?.(editor)
    return () => latest.current.onReady?.(null)
  }, [editor])
  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled && !readOnly, false)
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: {
          ...editor.options.editorProps.attributes,
          'aria-label': label,
          'aria-readonly': String(readOnly),
          'aria-disabled': String(disabled),
        },
      },
    })
    if (disabled || readOnly) cancelAll()
  }, [editor, disabled, readOnly, label, cancelAll])
  React.useEffect(() => {
    if (editor && value !== undefined && value !== lastHTML.current && value !== editor.getHTML()) {
      cancelAll()
      editor.commands.setContent(value, { emitUpdate: false })
      lastHTML.current = editor.getHTML()
    }
  }, [editor, value, cancelAll])
  const uploadFiles = React.useCallback(
    async (incoming: File[], position?: number) => {
      if (!editor || editor.isDestroyed || latest.current.disabled || latest.current.readOnly)
        return
      const settings = latest.current,
        handler = settings.onImageUpload,
        selected = editor.state.selection,
        from = position ?? selected.from,
        to = position ?? selected.to
      if (incoming.length > settings.maxFiles) {
        const error = new Error(`Choose up to ${settings.maxFiles} images at a time.`)
        const file = incoming[settings.maxFiles]
        setUploads((previous) => [
          ...previous,
          { id: crypto.randomUUID(), name: file.name, status: 'error', error: error.message },
        ])
        settings.onImageUploadError?.(error, file)
        return
      }
      const files = incoming,
        entries = files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          controller: new AbortController(),
        }))
      setUploads((previous) => [
        ...previous.filter((task) => task.status === 'queued' || task.status === 'uploading'),
        ...previous
          .filter((task) => task.status !== 'queued' && task.status !== 'uploading')
          .slice(-9),
        ...entries.map(({ id, file }) => ({ id, name: file.name, status: 'queued' as const })),
      ])
      entries.forEach((entry) => tasks.current.set(entry.id, entry))
      changeImageUploadAnchors(editor, {
        add: entries.map(({ id, file }, index) => ({
          id,
          name: file.name,
          from: index === 0 ? from : to,
          to,
        })),
      })
      const scheduled = entries.map((entry) => {
        const process = async () => {
          const { id, file, controller } = entry
          if (controller.signal.aborted || !mounted.current || editor.isDestroyed) {
            tasks.current.delete(id)
            return
          }
          let finished = false
          try {
            const types = settings.imageAccept.split(',').map((type) => type.trim().toLowerCase())
            const accepted = types.some((type) =>
              type.startsWith('.')
                ? file.name.toLowerCase().endsWith(type)
                : type.endsWith('/*')
                  ? file.type.startsWith(type.slice(0, -1))
                  : file.type === type,
            )
            if (!file.type.startsWith('image/') || !accepted)
              throw new Error('Choose a supported image format.')
            if (file.size > settings.maxImageSize)
              throw new Error(
                `Image must be smaller than ${Math.round(settings.maxImageSize / 1024 / 1024)} MB.`,
              )
            if (!handler) throw new Error('Image uploads are not available in this editor.')
            if (!imageUploadAnchors.getState(editor.state)?.has(id))
              throw new Error('The insertion position was removed. Please upload the image again.')
            updateUpload(id, { status: 'uploading' })
            const response = await withUploadSignal(
              handler(file, {
                signal: controller.signal,
                onProgress: (percent) => {
                  if (!finished && !controller.signal.aborted && Number.isFinite(percent))
                    updateUpload(id, { progress: Math.min(100, Math.max(0, percent)) })
                },
              }),
              controller.signal,
            )
            if (controller.signal.aborted || !mounted.current || editor.isDestroyed) return
            const image =
              typeof response === 'string' ? { src: response, alt: file.name } : response
            if (!richTextURL(image.src, 'image'))
              throw new Error('The upload did not return a supported image URL.')
            const anchor = imageUploadAnchors.getState(editor.state)?.get(id)
            if (!anchor) {
              updateUpload(id, { status: 'cancelled' })
              return
            }
            const stillSelected =
              editor.state.selection.from === anchor.from && editor.state.selection.to === anchor.to
            const selectionBefore = editor.state.selection
            const followers = Array.from(
              imageUploadAnchors.getState(editor.state)?.values() ?? [],
            ).filter(
              (other) => other.id !== id && other.from === anchor.to && other.to === anchor.to,
            )
            const inserted = editor
              .chain()
              .insertContentAt(
                { from: anchor.from, to: anchor.to },
                { type: 'image', attrs: { ...image, alt: image.alt ?? file.name } },
                { updateSelection: true },
              )
              .command(({ tr }) => {
                const position = tr.selection.to
                tr.setMeta(imageUploadAnchors, {
                  remove: id,
                  add: followers.map((other) => ({ ...other, from: position, to: position })),
                })
                if (!stillSelected) tr.setSelection(selectionBefore.map(tr.doc, tr.mapping))
                return true
              })
              .run()
            if (!inserted) throw new Error('The image could not be inserted at this position.')
            updateUpload(id, { status: 'done', progress: 100 })
            latest.current.onImageUploaded?.(image, file)
          } catch (cause) {
            if (!controller.signal.aborted && mounted.current && !editor.isDestroyed) {
              const error = cause instanceof Error ? cause : new Error(String(cause))
              failedFiles.current.set(id, file)
              updateUpload(id, { status: 'error', error: error.message })
              latest.current.onImageUploadError?.(error, file)
            }
          } finally {
            finished = true
            tasks.current.delete(id)
            if (mounted.current && !editor.isDestroyed)
              changeImageUploadAnchors(editor, { remove: id })
          }
        }
        const job = queue.current.then(process)
        queue.current = job.catch(() => {})
        return job
      })
      await Promise.all(scheduled)
    },
    [editor, updateUpload],
  )
  uploadRef.current = uploadFiles
  React.useEffect(() => {
    const visible = new Set(uploads.map((upload) => upload.id))
    failedFiles.current.forEach((_file, id) => {
      if (!visible.has(id)) failedFiles.current.delete(id)
    })
  }, [uploads])
  const context: RichTextContextValue = {
    editor,
    disabled,
    readOnly,
    label,
    minHeight,
    maxHeight,
    uploads,
    uploadFiles,
    cancelUpload,
    retryUpload: (id) => {
      const file = failedFiles.current.get(id)
      if (file) {
        failedFiles.current.delete(id)
        setUploads((previous) => previous.filter((task) => task.id !== id))
        void uploadFiles([file])
      }
    },
    dismissUpload: (id) => {
      failedFiles.current.delete(id)
      setUploads((previous) => previous.filter((task) => task.id !== id))
    },
    chooseImages: () => input.current?.click(),
    canUpload: !!onImageUpload,
  }
  return (
    <RichTextContext.Provider value={context}>
      <div
        {...props}
        data-slot="rich-text-editor"
        className={cn(
          'w-full overflow-hidden rounded-xl border bg-background text-foreground focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
          disabled && 'opacity-50',
          className,
        )}
        aria-disabled={disabled || undefined}
      >
        <input
          ref={input}
          type="file"
          accept={imageAccept}
          multiple
          disabled={disabled || readOnly}
          aria-label="Upload editor images"
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.target.value = ''
            void uploadFiles(files)
          }}
        />
        {children ?? (
          <>
            {toolbar && !readOnly && <RichTextEditorToolbar />}
            <RichTextEditorContent />
            <RichTextEditorStatus />
          </>
        )}
      </div>
    </RichTextContext.Provider>
  )
}
export function RichTextEditorContent({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { editor, disabled, readOnly, minHeight, maxHeight } = useRichTextEditor()
  return (
    <EditorContent
      {...props}
      editor={editor}
      data-slot="rich-text-content"
      className={cn(
        'ergon-editor overflow-auto text-sm leading-7 [&_.tiptap]:p-5 [&_.tiptap]:outline-none [&_h1]:my-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:my-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-s-4 [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_a]:text-primary [&_a]:underline [&_hr]:my-5 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-primary [&_table]:w-full [&_table]:table-fixed [&_table]:border-collapse [&_td]:relative [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:bg-muted [&_th]:p-2 [&_.tableWrapper]:overflow-auto [&_.selectedCell]:bg-primary/10 [&_.column-resize-handle]:absolute [&_.column-resize-handle]:inset-y-0 [&_.column-resize-handle]:-right-1 [&_.column-resize-handle]:w-1 [&_.column-resize-handle]:bg-primary [&_.tiptap_.is-editor-empty:first-child:before]:pointer-events-none [&_.tiptap_.is-editor-empty:first-child:before]:float-left [&_.tiptap_.is-editor-empty:first-child:before]:h-0 [&_.tiptap_.is-editor-empty:first-child:before]:text-muted-foreground [&_.tiptap_.is-editor-empty:first-child:before]:content-[attr(data-placeholder)]',
        disabled && 'pointer-events-none',
        '[&_.tiptap]:min-h-[var(--ergon-editor-height)]',
        readOnly && 'cursor-default',
        className,
      )}
      style={
        {
          maxHeight,
          '--ergon-editor-height': `${Math.max(80, minHeight)}px`,
          ...style,
        } as React.CSSProperties
      }
    />
  )
}
export function RichTextEditorStatus() {
  const {
    editor,
    uploads,
    cancelUpload,
    dismissUpload,
    retryUpload,
    canUpload,
    disabled,
    readOnly,
  } = useRichTextEditor()
  const text = useEditorState({ editor, selector: ({ editor }) => editor?.getText() ?? '' }) ?? ''
  return (
    <div className="border-t bg-muted/10 px-4 py-2">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
        <span>{text.length} characters</span>
      </div>
      {uploads.length > 0 && (
        <ul aria-label="Editor image uploads" className="mt-2 max-h-40 space-y-2 overflow-auto">
          {uploads.map((upload) => {
            const pending = upload.status === 'queued' || upload.status === 'uploading'
            return (
              <li
                key={upload.id}
                className="flex items-center gap-2 rounded-md border bg-background p-2 text-xs"
              >
                {pending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : upload.status === 'done' ? (
                  <Check className="size-3 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <ImageIcon className="size-3" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="block truncate">{upload.name}</span>
                  <span
                    role={upload.status === 'error' ? 'alert' : undefined}
                    className={cn(
                      'mt-1 block text-[10px] text-muted-foreground',
                      upload.status === 'error' && 'text-destructive',
                    )}
                  >
                    {upload.error ??
                      (upload.status === 'queued'
                        ? 'Waiting to upload'
                        : upload.status === 'uploading'
                          ? 'Uploading…'
                          : upload.status === 'done'
                            ? 'Image inserted'
                            : 'Upload cancelled')}
                  </span>
                  {pending && (
                    <progress
                      aria-label={`Upload progress for ${upload.name}`}
                      max={100}
                      value={upload.progress}
                      className="mt-1 h-1 w-full accent-primary"
                    />
                  )}
                </div>
                {upload.status === 'error' && canUpload && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    disabled={disabled || readOnly}
                    aria-label={`Retry upload ${upload.name}`}
                    title="Retry at the current cursor position"
                    onClick={() => retryUpload(upload.id)}
                  >
                    <RotateCcw />
                  </Button>
                )}
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={
                    pending ? `Cancel upload ${upload.name}` : `Dismiss upload ${upload.name}`
                  }
                  onClick={() => (pending ? cancelUpload(upload.id) : dismissUpload(upload.id))}
                >
                  <X />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
export function RichTextEditorToolbar() {
  const { editor, disabled, readOnly, chooseImages, canUpload } = useRichTextEditor(),
    [dialog, setDialog] = React.useState<'link' | 'image' | null>(null),
    [url, setURL] = React.useState(''),
    [alt, setAlt] = React.useState(''),
    [title, setTitle] = React.useState(''),
    [width, setWidth] = React.useState(''),
    [alignment, setAlignment] = React.useState('center'),
    [error, setError] = React.useState(''),
    [imagePosition, setImagePosition] = React.useState<number | null>(null),
    fieldId = React.useId()
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            underline: editor.isActive('underline'),
            strike: editor.isActive('strike'),
            code: editor.isActive('code'),
            highlight: editor.isActive('highlight'),
            bullet: editor.isActive('bulletList'),
            ordered: editor.isActive('orderedList'),
            quote: editor.isActive('blockquote'),
            codeBlock: editor.isActive('codeBlock'),
            link: editor.isActive('link'),
            image: editor.isActive('image'),
            table: editor.isActive('table'),
            heading: editor.getAttributes('heading').level ?? 0,
            align:
              editor.getAttributes('paragraph').textAlign ??
              editor.getAttributes('heading').textAlign ??
              'left',
            color: editor.getAttributes('textStyle').color ?? '#262725',
            fontFamily: editor.getAttributes('textStyle').fontFamily ?? '',
            undo: editor.can().undo(),
            redo: editor.can().redo(),
          }
        : null,
  })
  const unavailable = disabled || readOnly || !editor
  const action = (
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    run: () => void,
    active?: boolean,
    blocked = false,
  ) => (
    <Button
      key={label}
      type="button"
      size="icon-sm"
      variant={active ? 'soft' : 'ghost'}
      disabled={unavailable || blocked}
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={run}
    >
      <Icon className="size-4" />
    </Button>
  )
  const openLink = () => {
    setURL(editor?.getAttributes('link').href ?? '')
    setError('')
    setDialog('link')
  }
  const openImage = (edit = false) => {
    const attrs = edit ? editor?.getAttributes('image') : {}
    setImagePosition(edit ? (editor?.state.selection.from ?? null) : null)
    setURL(attrs?.src ?? '')
    setAlt(attrs?.alt ?? '')
    setTitle(attrs?.title ?? '')
    setWidth(attrs?.width ? String(attrs.width) : '')
    setAlignment(attrs?.alignment ?? 'center')
    setError('')
    setDialog('image')
  }
  const save = () => {
    if (!editor) return
    const normalized = richTextURL(url, dialog === 'image' ? 'image' : 'link')
    if (!normalized) {
      setError('Enter a supported URL.')
      return
    }
    if (dialog === 'link')
      editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run()
    else {
      const size = width ? Number(width) : null
      if (size !== null && (!Number.isFinite(size) || size < 50 || size > 3000)) {
        setError('Choose an image width between 50 and 3000 pixels.')
        return
      }
      if (imagePosition !== null) {
        if (editor.state.doc.nodeAt(imagePosition)?.type.name !== 'image') {
          setError('This image is no longer in the document.')
          return
        }
        editor
          .chain()
          .focus()
          .setNodeSelection(imagePosition)
          .updateAttributes('image', {
            src: normalized,
            alt,
            title,
            width: size,
            height: null,
            alignment,
          })
          .run()
      } else
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'image',
            attrs: { src: normalized, alt, title, width: size, alignment },
          })
          .run()
    }
    setDialog(null)
  }
  return (
    <>
      <div
        role="toolbar"
        aria-label="Text formatting"
        onKeyDown={(event) => {
          if (
            !(event.target instanceof HTMLButtonElement) ||
            !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
          )
            return
          const buttons = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
          )
          const index = buttons.indexOf(event.target)
          if (index < 0) return
          event.preventDefault()
          const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
          const step = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1)
          buttons[
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? buttons.length - 1
                : (index + step + buttons.length) % buttons.length
          ]?.focus()
        }}
        className="flex flex-wrap items-center gap-0.5 border-b bg-muted/20 p-2"
      >
        <select
          aria-label="Text style"
          value={state?.heading ?? 0}
          disabled={unavailable}
          className="mr-1 h-8 max-w-32 rounded border bg-background px-2 text-xs"
          onChange={(event) => {
            const level = Number(event.target.value)
            if (!editor) return
            if (level)
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 })
                .run()
            else editor.chain().focus().setParagraph().run()
          }}
        >
          <option value={0}>Paragraph</option>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>
              Heading {level}
            </option>
          ))}
        </select>
        {action('Bold', Bold, () => editor?.chain().focus().toggleBold().run(), state?.bold)}
        {action(
          'Italic',
          Italic,
          () => editor?.chain().focus().toggleItalic().run(),
          state?.italic,
        )}
        {action(
          'Underline',
          Underline,
          () => editor?.chain().focus().toggleUnderline().run(),
          state?.underline,
        )}
        {action(
          'Strikethrough',
          Strikethrough,
          () => editor?.chain().focus().toggleStrike().run(),
          state?.strike,
        )}
        {action('Inline code', Code, () => editor?.chain().focus().toggleCode().run(), state?.code)}
        {action(
          'Highlight',
          Highlighter,
          () => editor?.chain().focus().toggleHighlight().run(),
          state?.highlight,
        )}
        <span aria-hidden className="mx-1 h-5 border-s" />
        {action(
          'Bullet list',
          List,
          () => editor?.chain().focus().toggleBulletList().run(),
          state?.bullet,
        )}
        {action(
          'Numbered list',
          ListOrdered,
          () => editor?.chain().focus().toggleOrderedList().run(),
          state?.ordered,
        )}
        {action(
          'Block quote',
          Quote,
          () => editor?.chain().focus().toggleBlockquote().run(),
          state?.quote,
        )}
        {action(
          'Code block',
          CodeXml,
          () => editor?.chain().focus().toggleCodeBlock().run(),
          state?.codeBlock,
        )}
        {action('Horizontal rule', Minus, () => editor?.chain().focus().setHorizontalRule().run())}
        <span aria-hidden className="mx-1 h-5 border-s" />
        {action(
          'Align left',
          AlignLeft,
          () => editor?.chain().focus().setTextAlign('left').run(),
          state?.align === 'left',
        )}
        {action(
          'Align center',
          AlignCenter,
          () => editor?.chain().focus().setTextAlign('center').run(),
          state?.align === 'center',
        )}
        {action(
          'Align right',
          AlignRight,
          () => editor?.chain().focus().setTextAlign('right').run(),
          state?.align === 'right',
        )}
        {action('Insert or edit link', Link, openLink, state?.link)}
        {state?.link &&
          action('Remove link', Unlink, () => editor?.chain().focus().unsetLink().run())}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={unavailable}
              aria-label="Insert image"
              title="Insert image"
            >
              <ImagePlus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {canUpload && (
              <DropdownMenuItem onSelect={chooseImages}>Upload images</DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => openImage()}>Image from URL</DropdownMenuItem>
            {state?.image && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => openImage(true)}>
                  Edit image description and size
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => editor?.chain().focus().deleteSelection().run()}>
                  Remove image
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={unavailable}
              aria-label="Table tools"
              title="Table tools"
            >
              <Table2 />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() =>
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              Insert table
            </DropdownMenuItem>
            {state?.table && (
              <>
                <DropdownMenuSeparator />
                {[
                  ['Add row', () => editor?.chain().focus().addRowAfter().run()],
                  ['Add column', () => editor?.chain().focus().addColumnAfter().run()],
                  ['Delete row', () => editor?.chain().focus().deleteRow().run()],
                  ['Delete column', () => editor?.chain().focus().deleteColumn().run()],
                  ['Merge or split cells', () => editor?.chain().focus().mergeOrSplit().run()],
                  ['Toggle header row', () => editor?.chain().focus().toggleHeaderRow().run()],
                  ['Delete table', () => editor?.chain().focus().deleteTable().run()],
                ].map(([label, run]) => (
                  <DropdownMenuItem
                    key={String(label)}
                    onSelect={() => {
                      if (typeof run === 'function') run()
                    }}
                  >
                    {String(label)}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <label
          className="mx-1 flex h-8 items-center gap-1 rounded px-1 text-[10px] text-muted-foreground"
          title="Text color"
        >
          Color
          <input
            type="color"
            aria-label="Text color"
            disabled={unavailable}
            className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            value={/^#[\da-f]{6}$/i.test(state?.color ?? '') ? state!.color : '#262725'}
            onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()}
          />
        </label>
        <select
          aria-label="Font family"
          disabled={unavailable}
          value={state?.fontFamily ?? ''}
          className="h-8 max-w-24 rounded border bg-background px-1 text-xs"
          onChange={(event) => {
            if (event.target.value) editor?.chain().focus().setFontFamily(event.target.value).run()
            else editor?.chain().focus().unsetFontFamily().run()
          }}
        >
          <option value="">Default font</option>
          <option value="sans-serif">Sans serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
        {action('Clear formatting', RemoveFormatting, () =>
          editor?.chain().focus().unsetAllMarks().clearNodes().run(),
        )}
        <span aria-hidden className="mx-1 h-5 border-s" />
        {action('Undo', Undo2, () => editor?.chain().focus().undo().run(), undefined, !state?.undo)}
        {action('Redo', Redo2, () => editor?.chain().focus().redo().run(), undefined, !state?.redo)}
      </div>
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === 'image'
                ? imagePosition === null
                  ? 'Insert image'
                  : 'Edit image'
                : 'Edit link'}
            </DialogTitle>
            <DialogDescription>
              {dialog === 'image'
                ? 'Place an image between text and describe it for readers.'
                : 'Add a destination to the selected text.'}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={fieldId + '-url'}>URL</Label>
              <Input
                id={fieldId + '-url'}
                value={url}
                onValueChange={setURL}
                placeholder="https://example.com"
                autoFocus
              />
            </div>
            {dialog === 'image' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={fieldId + '-alt'}>Image description (alt text)</Label>
                  <Input id={fieldId + '-alt'} value={alt} onValueChange={setAlt} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={fieldId + '-title'}>Image title</Label>
                  <Input id={fieldId + '-title'} value={title} onValueChange={setTitle} />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="space-y-2 text-sm">
                    Width in pixels
                    <Input
                      aria-label="Image width"
                      type="number"
                      min={50}
                      max={3000}
                      value={width}
                      onValueChange={setWidth}
                      placeholder="Automatic"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    Alignment
                    <select
                      aria-label="Image alignment"
                      value={alignment}
                      onChange={(event) => setAlignment(event.target.value)}
                      className="block h-9 rounded border bg-background px-2 text-sm"
                    >
                      {['left', 'center', 'right'].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={unavailable}>
                Apply
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
