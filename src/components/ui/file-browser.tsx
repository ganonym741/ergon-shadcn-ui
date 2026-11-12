import * as React from 'react'
import {
  Folder,
  File,
  FileImage,
  FileText,
  FileCode,
  Music2,
  Video,
  Search,
  LayoutGrid,
  List,
  ArrowDownAZ,
  ArrowUpAZ,
  FolderPlus,
  Upload,
  Trash2,
  Pencil,
  FolderInput,
  Download,
  Info,
  ChevronRight,
  Home,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useControllableState } from '@/components/ui/util'
import { cn } from '@/lib/utils'

export interface FileBrowserEntry {
  id: string
  parentId?: string | null
  name: string
  kind: 'file' | 'folder'
  size?: number
  modifiedAt?: string
  mimeType?: string
  thumbnail?: string
  disabled?: boolean
  data?: unknown
}
export interface FileOperationContext {
  /** Cancellation is requested through this signal. Reject with AbortError to confirm it; resolve when the operation completes. */
  signal: AbortSignal
}
export interface FileBrowserProps extends Omit<
  React.ComponentProps<'section'>,
  'onChange' | 'onError'
> {
  entries: FileBrowserEntry[]
  folderId?: string | null
  defaultFolderId?: string | null
  onFolderChange?: (id: string | null) => void
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  multiple?: boolean
  view?: 'grid' | 'list'
  defaultView?: 'grid' | 'list'
  onViewChange?: (view: 'grid' | 'list') => void
  sortBy?: 'name' | 'size' | 'modified'
  defaultSortBy?: 'name' | 'size' | 'modified'
  onSortByChange?: (sort: 'name' | 'size' | 'modified') => void
  sortDirection?: 'asc' | 'desc'
  defaultSortDirection?: 'asc' | 'desc'
  onSortDirectionChange?: (direction: 'asc' | 'desc') => void
  searchScope?: 'folder' | 'all'
  pageSize?: number
  maxEntries?: number
  label?: string
  disabled?: boolean
  accept?: string
  onOpen?: (entry: FileBrowserEntry) => void
  onDownload?: (entry: FileBrowserEntry, context: FileOperationContext) => void | Promise<void>
  onCreateFolder?: (
    name: string,
    parentId: string | null,
    context: FileOperationContext,
  ) => void | Promise<void>
  onRename?: (
    entry: FileBrowserEntry,
    name: string,
    context: FileOperationContext,
  ) => void | Promise<void>
  onMove?: (
    entries: FileBrowserEntry[],
    parentId: string | null,
    context: FileOperationContext,
  ) => void | Promise<void>
  onDelete?: (entries: FileBrowserEntry[], context: FileOperationContext) => void | Promise<void>
  onUpload?: (
    files: File[],
    parentId: string | null,
    context: FileOperationContext,
  ) => void | Promise<void>
  onError?: (error: Error) => void
  renderPreview?: (entry: FileBrowserEntry) => React.ReactNode
}
/** Checks stable IDs, folder parents, cycles, and bounded hierarchy depth. */
export function validateFileEntries(
  entries: readonly FileBrowserEntry[],
  max = 10000,
): string | undefined {
  if (entries.length > (Number.isFinite(max) ? Math.min(50000, Math.max(1, max)) : 10000))
    return 'The file list exceeds the configured entry limit.'
  const map = new Map(entries.map((entry) => [entry.id, entry]))
  if (map.size !== entries.length || entries.some((entry) => !entry.id))
    return 'File and folder IDs must be unique.'
  for (const entry of entries) {
    let current: FileBrowserEntry | undefined = entry
    const visited = new Set<string>()
    while (current) {
      if (visited.has(current.id)) return 'Folders must not contain cycles.'
      visited.add(current.id)
      if (visited.size > 100) return 'Use at most 100 folder levels.'
      if (current.parentId && map.get(current.parentId)?.kind !== 'folder')
        return `Missing folder parent for ${entry.name}.`
      current = current.parentId ? map.get(current.parentId) : undefined
    }
  }
}
/** Rejects moving folders into themselves or descendants, disabled entries, and invalid destinations. */
export function canMoveFileEntries(
  entries: readonly FileBrowserEntry[],
  ids: readonly string[],
  parentId: string | null,
  maxEntries = 10000,
): boolean {
  if (!ids.length || validateFileEntries(entries, maxEntries)) return false
  const map = new Map(entries.map((entry) => [entry.id, entry])),
    selected = new Set(ids)
  if (
    ids.some((id) => !map.has(id) || map.get(id)?.disabled) ||
    (parentId && (map.get(parentId)?.kind !== 'folder' || map.get(parentId)?.disabled))
  )
    return false
  let parent = parentId ? map.get(parentId) : undefined
  while (parent) {
    if (selected.has(parent.id)) return false
    parent = parent.parentId ? map.get(parent.parentId) : undefined
  }
  return ids.some((id) => (map.get(id)?.parentId ?? null) !== parentId)
}
/** Formats binary file sizes, preserving meaningful zero-byte values. */
export function formatFileSize(size?: number): string {
  if (size === undefined || !Number.isFinite(size) || size < 0) return '—'
  if (size === 0) return '0 B'
  const unit = Math.max(0, Math.min(4, Math.floor(Math.log(size) / Math.log(1024))))
  return `${(size / 1024 ** unit).toLocaleString(undefined, { maximumFractionDigits: unit || size % 1 ? 1 : 0 })} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][unit]}`
}
type FileDialog = {
  kind: 'create' | 'rename' | 'move' | 'delete' | 'info'
  entries: FileBrowserEntry[]
} | null
interface FilesContext {
  entries: FileBrowserEntry[]
  map: Map<string, FileBrowserEntry>
  folderId: string | null
  path: FileBrowserEntry[]
  navigate: (id: string | null) => void
  query: string
  setQuery: (query: string) => void
  view: 'grid' | 'list'
  setView: (view: 'grid' | 'list') => void
  sort: string
  setSort: (sort: 'name' | 'size' | 'modified') => void
  direction: 'asc' | 'desc'
  setDirection: (direction: 'asc' | 'desc') => void
  selected: Set<string>
  select: (id: string, checked: boolean, range?: boolean) => void
  selectAll: () => void
  clearSelection: () => void
  filtered: FileBrowserEntry[]
  pageItems: FileBrowserEntry[]
  page: number
  setPage: (page: number) => void
  pages: number
  disabled: boolean
  busy: boolean
  operation: string
  operationError: string
  dialog: FileDialog
  setDialog: (dialog: FileDialog) => void
  perform: (
    name: string,
    action: (context: FileOperationContext) => void | Promise<void>,
  ) => Promise<void>
  cancel: () => void
  open: (entry: FileBrowserEntry) => void
  callbacks: Pick<
    FileBrowserProps,
    'onCreateFolder' | 'onRename' | 'onMove' | 'onDelete' | 'onUpload' | 'onDownload'
  >
  accept?: string
  maxEntries: number
  renderPreview: FileBrowserProps['renderPreview']
}
const Context = React.createContext<FilesContext | null>(null)
/** Exposes file browser state for custom toolbar, listing, and operation controls. */
export function useFileBrowser() {
  const c = React.useContext(Context)
  if (!c) throw new Error('File browser parts need FileBrowser.')
  return c
}
/** Browses application-owned entries; all persistence, uploads, and downloads are injected callbacks. */
export function FileBrowser({
  entries,
  folderId,
  defaultFolderId = null,
  onFolderChange,
  selectedIds,
  defaultSelectedIds = [],
  onSelectionChange,
  multiple = true,
  view,
  defaultView = 'grid',
  onViewChange,
  sortBy,
  defaultSortBy = 'name',
  onSortByChange,
  sortDirection,
  defaultSortDirection = 'asc',
  onSortDirectionChange,
  searchScope = 'folder',
  pageSize = 50,
  maxEntries = 10000,
  label = 'File browser',
  disabled = false,
  accept,
  onOpen,
  onDownload,
  onCreateFolder,
  onRename,
  onMove,
  onDelete,
  onUpload,
  onError,
  renderPreview,
  className,
  children,
  ...props
}: FileBrowserProps) {
  const [folder, setFolder] = useControllableState({
      value: folderId,
      defaultValue: defaultFolderId,
      onChange: onFolderChange,
    }),
    [selected, setSelected] = useControllableState({
      value: selectedIds,
      defaultValue: defaultSelectedIds,
      onChange: onSelectionChange,
    }),
    [layout, setView] = useControllableState({
      value: view,
      defaultValue: defaultView,
      onChange: onViewChange,
    }),
    [sort, setSort] = useControllableState({
      value: sortBy,
      defaultValue: defaultSortBy,
      onChange: onSortByChange,
    }),
    [direction, setDirection] = useControllableState({
      value: sortDirection,
      defaultValue: defaultSortDirection,
      onChange: onSortDirectionChange,
    })
  const [query, setQuery] = React.useState(''),
    [page, setPage] = React.useState(1),
    [dialog, setDialog] = React.useState<FileDialog>(null),
    [busy, setBusy] = React.useState(false),
    [operation, setOperation] = React.useState(''),
    [message, setMessage] = React.useState(''),
    [operationError, setOperationError] = React.useState(''),
    request = React.useRef<AbortController | null>(null),
    anchor = React.useRef<string | null>(null)
  const error = React.useMemo(
      () => validateFileEntries(entries, maxEntries),
      [entries, maxEntries],
    ),
    map = React.useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]),
    path = React.useMemo(() => {
      if (error) return []
      const result: FileBrowserEntry[] = []
      let current = folder ? map.get(folder) : undefined
      while (current) {
        result.unshift(current)
        current = current.parentId ? map.get(current.parentId) : undefined
      }
      return result
    }, [folder, map, error])
  const filtered = React.useMemo(
    () =>
      entries
        .filter(
          (entry) =>
            ((query && searchScope === 'all') || (entry.parentId ?? null) === folder) &&
            entry.name.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          a.kind !== b.kind
            ? a.kind === 'folder'
              ? -1
              : 1
            : (sort === 'size'
                ? (a.size ?? 0) - (b.size ?? 0)
                : sort === 'modified'
                  ? (Date.parse(a.modifiedAt ?? '') || 0) - (Date.parse(b.modifiedAt ?? '') || 0)
                  : a.name.localeCompare(b.name, undefined, {
                      numeric: true,
                      sensitivity: 'base',
                    })) * (direction === 'asc' ? 1 : -1) || a.id.localeCompare(b.id),
        ),
    [entries, folder, query, searchScope, sort, direction],
  )
  const size = Number.isFinite(pageSize) ? Math.min(500, Math.max(1, Math.floor(pageSize))) : 50,
    pages = Math.max(1, Math.ceil(filtered.length / size)),
    currentPage = Math.min(page, pages),
    selection = new Set(selected.filter((id) => map.has(id)))
  React.useEffect(() => setPage(1), [folder, query, sort, direction, pageSize])
  React.useEffect(() => {
    if (selected.some((id) => !map.has(id))) setSelected(selected.filter((id) => map.has(id)))
  }, [map, selected, setSelected])
  React.useEffect(
    () => () => {
      request.current?.abort()
      request.current = null
    },
    [],
  )
  const navigate = (id: string | null) => {
    if (disabled || (id && (map.get(id)?.kind !== 'folder' || map.get(id)?.disabled))) return
    setFolder(id)
    setSelected([])
    setQuery('')
    anchor.current = null
  }
  const select = (id: string, checked: boolean, range = false) => {
    if (disabled || map.get(id)?.disabled) return
    const next = new Set(multiple ? selected : [])
    if (range && multiple && anchor.current) {
      const start = filtered.findIndex((entry) => entry.id === anchor.current),
        end = filtered.findIndex((entry) => entry.id === id)
      if (start >= 0 && end >= 0)
        for (const entry of filtered.slice(Math.min(start, end), Math.max(start, end) + 1))
          if (!entry.disabled) {
            if (checked) next.add(entry.id)
            else next.delete(entry.id)
          }
    } else if (checked) next.add(id)
    else next.delete(id)
    anchor.current = id
    setSelected([...next])
  }
  const perform = async (
    name: string,
    action: (context: FileOperationContext) => void | Promise<void>,
  ) => {
    if (disabled || request.current || error) return
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setOperation(name)
    setMessage('')
    setOperationError('')
    try {
      await action({ signal: controller.signal })
      if (request.current === controller) {
        setMessage(
          controller.signal.aborted
            ? `${name} completed after cancellation was requested.`
            : `${name} completed.`,
        )
        setDialog(null)
      }
    } catch (reason) {
      if (request.current === controller) {
        const problem = reason instanceof Error ? reason : new Error(String(reason))
        if (problem.name === 'AbortError') setMessage(`${name} cancelled.`)
        else {
          setMessage(problem.message)
          setOperationError(problem.message)
          onError?.(problem)
        }
      }
    } finally {
      if (request.current === controller) {
        request.current = null
        setBusy(false)
      }
    }
  }
  const cancel = () => {
    const current = request.current
    if (!current || current.signal.aborted) return
    current.abort()
    setMessage('Cancellation requested. Waiting for the operation to finish.')
  }
  const invalidFolder =
    !!folder && (map.get(folder)?.kind !== 'folder' || !!map.get(folder)?.disabled)
  return (
    <Context.Provider
      value={{
        entries,
        maxEntries,
        map,
        folderId: folder,
        path,
        navigate,
        query,
        setQuery,
        view: layout,
        setView,
        sort,
        setSort,
        direction,
        setDirection,
        selected: selection,
        select,
        selectAll: () =>
          setSelected(
            multiple
              ? [
                  ...new Set([
                    ...selected,
                    ...filtered.filter((entry) => !entry.disabled).map((entry) => entry.id),
                  ]),
                ]
              : filtered.find((entry) => !entry.disabled)
                ? [filtered.find((entry) => !entry.disabled)!.id]
                : [],
          ),
        clearSelection: () => setSelected([]),
        filtered,
        pageItems: filtered.slice((currentPage - 1) * size, currentPage * size),
        page: currentPage,
        setPage,
        pages,
        disabled,
        busy,
        operation,
        operationError,
        dialog,
        setDialog: (next) => {
          setOperationError('')
          setDialog(next)
        },
        perform,
        cancel,
        open: (entry) => {
          if (disabled || entry.disabled) return
          if (entry.kind === 'folder') navigate(entry.id)
          else if (onOpen) onOpen(entry)
          else setDialog({ kind: 'info', entries: [entry] })
        },
        callbacks: { onDownload, onCreateFolder, onRename, onMove, onDelete, onUpload },
        accept,
        renderPreview,
      }}
    >
      <section
        {...props}
        data-slot="file-browser"
        aria-label={label}
        aria-busy={busy}
        className={cn('w-full min-w-0 overflow-hidden rounded-xl border bg-background', className)}
        onDragOver={(event) => {
          props.onDragOver?.(event)
          if (!event.defaultPrevented && event.dataTransfer.types.includes('Files')) {
            event.preventDefault()
            event.dataTransfer.dropEffect =
              onUpload && !disabled && !busy && !invalidFolder && !error ? 'copy' : 'none'
          }
        }}
        onDrop={(event) => {
          props.onDrop?.(event)
          if (event.defaultPrevented) return
          if (!event.dataTransfer.files.length) return
          event.preventDefault()
          if (!onUpload || disabled || busy || invalidFolder || error) return
          const files = Array.from(event.dataTransfer.files)
          void perform('Upload', (context) => onUpload(files, folder, context))
        }}
      >
        {error ? (
          <p role="alert" className="p-4 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            {children ?? (
              <>
                <FileBrowserToolbar />
                {invalidFolder ? (
                  <div className="space-y-2 p-6">
                    <p role="alert" className="text-sm">
                      This folder is no longer available.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(null)}
                    >
                      Return to files
                    </Button>
                  </div>
                ) : (
                  <FileBrowserContent />
                )}
              </>
            )}
            <FileBrowserOperations
              key={`${dialog?.kind}-${dialog?.entries.map((entry) => entry.id).join(',')}`}
            />
          </>
        )}
        <div
          className={cn(
            'flex items-center gap-2 text-xs text-muted-foreground',
            busy || message ? 'border-t px-4 py-2' : 'sr-only',
          )}
          role="status"
        >
          {busy ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              {request.current?.signal.aborted ? message : `${operation}…`}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ms-auto"
                disabled={request.current?.signal.aborted}
                onClick={cancel}
              >
                Cancel operation
              </Button>
            </>
          ) : (
            message
          )}
        </div>
      </section>
    </Context.Provider>
  )
}
/** Displays breadcrumbs, search, sort, view switches, selection actions, and available application operations. */
export function FileBrowserToolbar() {
  const c = useFileBrowser(),
    file = React.useRef<HTMLInputElement>(null),
    selected = c.entries.filter((entry) => c.selected.has(entry.id)),
    locked = c.disabled || c.busy,
    unavailableFolder =
      c.folderId !== null &&
      (c.map.get(c.folderId)?.kind !== 'folder' || !!c.map.get(c.folderId)?.disabled),
    folderLocked = locked || unavailableFolder
  return (
    <div className="space-y-3 border-b bg-muted/15 p-4">
      <nav aria-label="File breadcrumbs">
        <ol className="flex flex-wrap items-center gap-1 text-xs">
          <li>
            <button
              type="button"
              className="flex items-center gap-1 rounded px-1 py-1 hover:bg-accent"
              onClick={() => c.navigate(null)}
              disabled={c.disabled}
            >
              <Home className="size-3" />
              Files
            </button>
          </li>
          {c.path.map((entry, index) => (
            <li key={entry.id} className="flex items-center gap-1">
              <ChevronRight className="size-3 text-muted-foreground" />
              <button
                type="button"
                aria-current={index === c.path.length - 1 ? 'page' : undefined}
                className="max-w-40 truncate rounded px-1 py-1 hover:bg-accent"
                disabled={c.disabled}
                onClick={() => c.navigate(entry.id)}
              >
                {entry.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-wrap gap-2">
        <Input
          value={c.query}
          onValueChange={c.setQuery}
          aria-label="Search files"
          placeholder="Search files…"
          leading={<Search className="size-4" />}
          className="min-w-40 flex-1"
          disabled={c.disabled}
        />
        <select
          aria-label="Sort files by"
          value={c.sort}
          disabled={c.disabled}
          onChange={(event) => c.setSort(event.target.value as 'name' | 'size' | 'modified')}
          className="rounded-md border bg-background px-2 text-xs"
        >
          <option value="name">Name</option>
          <option value="modified">Modified</option>
          <option value="size">Size</option>
        </select>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={c.disabled}
          aria-label={c.direction === 'asc' ? 'Sort descending' : 'Sort ascending'}
          onClick={() => c.setDirection(c.direction === 'asc' ? 'desc' : 'asc')}
        >
          {c.direction === 'asc' ? <ArrowDownAZ /> : <ArrowUpAZ />}
        </Button>
        <div
          role="group"
          aria-label="File layout"
          className="flex rounded-lg border bg-background p-0.5"
        >
          {(['grid', 'list'] as const).map((view) => (
            <Button
              type="button"
              key={view}
              size="icon"
              variant={c.view === view ? 'secondary' : 'ghost'}
              aria-label={`${view === 'grid' ? 'Grid' : 'List'} view`}
              aria-pressed={c.view === view}
              disabled={c.disabled}
              onClick={() => c.setView(view)}
            >
              {view === 'grid' ? <LayoutGrid /> : <List />}
            </Button>
          ))}
        </div>
        {c.callbacks.onCreateFolder && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={folderLocked}
            onClick={() => {
              if (!folderLocked) c.setDialog({ kind: 'create', entries: [] })
            }}
          >
            <FolderPlus />
            New folder
          </Button>
        )}
        {c.callbacks.onUpload && (
          <>
            <Button
              type="button"
              size="sm"
              disabled={folderLocked}
              onClick={() => file.current?.click()}
            >
              <Upload />
              Upload
            </Button>
            <input
              ref={file}
              type="file"
              multiple
              accept={c.accept}
              aria-label="Upload files"
              className="sr-only"
              disabled={folderLocked}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                if (files.length && !folderLocked)
                  void c.perform('Upload', (context) =>
                    c.callbacks.onUpload?.(files, c.folderId, context),
                  )
                event.target.value = ''
              }}
            />
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="me-auto">
          {selected.length ? `${selected.length} selected` : `${c.filtered.length} items`}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={locked || !c.filtered.length}
          onClick={selected.length ? c.clearSelection : c.selectAll}
        >
          {selected.length ? 'Clear selection' : 'Select all'}
        </Button>
        {selected.length === 1 && c.callbacks.onRename && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Rename selected item"
            disabled={locked || selected[0].disabled}
            onClick={() => c.setDialog({ kind: 'rename', entries: selected })}
          >
            <Pencil />
          </Button>
        )}
        {selected.length > 0 && c.callbacks.onMove && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Move selected items"
            disabled={locked || selected.some((entry) => entry.disabled)}
            onClick={() => c.setDialog({ kind: 'move', entries: selected })}
          >
            <FolderInput />
          </Button>
        )}
        {selected.length > 0 && c.callbacks.onDelete && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Delete selected items"
            disabled={locked || selected.some((entry) => entry.disabled)}
            onClick={() => c.setDialog({ kind: 'delete', entries: selected })}
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </div>
  )
}
/** Renders paginated grid/list views with native checkboxes and explicit open/details/download actions. */
export function FileBrowserContent() {
  const c = useFileBrowser()
  return (
    <>
      <div className="min-h-48 p-4">
        {c.pageItems.length ? (
          c.view === 'grid' ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {c.pageItems.map((entry) => (
                <FileBrowserItem key={entry.id} entry={entry} />
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="w-8">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="py-2 font-medium">Name</th>
                    <th className="px-3 font-medium">Size</th>
                    <th className="px-3 font-medium">Modified</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.pageItems.map((entry) => (
                    <FileBrowserItem key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <p className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
            {c.query ? 'No files match your search.' : 'This folder is empty.'}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          Page {c.page} of {c.pages}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={c.disabled || c.page <= 1}
            onClick={() => c.setPage(c.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={c.disabled || c.page >= c.pages}
            onClick={() => c.setPage(c.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  )
}
/** Shows one entry while keeping selection controls independent from navigation. */
export function FileBrowserItem({ entry }: { entry: FileBrowserEntry }) {
  const c = useFileBrowser(),
    selected = c.selected.has(entry.id),
    disabled = c.disabled || entry.disabled,
    Icon =
      entry.kind === 'folder'
        ? Folder
        : entry.mimeType?.startsWith('image/')
          ? FileImage
          : entry.mimeType?.startsWith('audio/')
            ? Music2
            : entry.mimeType?.startsWith('video/')
              ? Video
              : /json|javascript|typescript|html|css/.test(entry.mimeType ?? '')
                ? FileCode
                : entry.mimeType?.startsWith('text/')
                  ? FileText
                  : File,
    checkbox = (
      <input
        type="checkbox"
        aria-label={`Select ${entry.name}`}
        checked={selected}
        disabled={disabled}
        className="size-3.5 accent-primary"
        onChange={(event) =>
          c.select(entry.id, event.target.checked, !!(event.nativeEvent as MouseEvent).shiftKey)
        }
      />
    ),
    actions = (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          aria-label={`Details for ${entry.name}`}
          disabled={disabled}
          onClick={() => c.setDialog({ kind: 'info', entries: [entry] })}
        >
          <Info className="size-3.5" />
        </Button>
        {entry.kind === 'file' && c.callbacks.onDownload && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label={`Download ${entry.name}`}
            disabled={disabled || c.busy}
            onClick={() =>
              void c.perform('Download', (context) => c.callbacks.onDownload?.(entry, context))
            }
          >
            <Download className="size-3.5" />
          </Button>
        )}
      </div>
    ),
    modified =
      entry.modifiedAt && !Number.isNaN(Date.parse(entry.modifiedAt))
        ? new Date(entry.modifiedAt).toLocaleDateString()
        : '—'
  return c.view === 'list' ? (
    <tr
      className={cn('border-b last:border-0', selected && 'bg-primary/5', disabled && 'opacity-50')}
    >
      <td className="py-3">{checkbox}</td>
      <td>
        <button
          type="button"
          disabled={disabled}
          className="flex min-w-40 items-center gap-2 text-left hover:text-primary"
          aria-label={`Open ${entry.name}`}
          onClick={() => c.open(entry)}
        >
          <Icon
            className={cn(
              'size-4 shrink-0',
              entry.kind === 'folder' ? 'fill-primary/10 text-primary' : 'text-muted-foreground',
            )}
          />
          {entry.name}
        </button>
      </td>
      <td className="whitespace-nowrap px-3 text-muted-foreground">
        {entry.kind === 'folder' ? 'Folder' : <bdi dir="ltr">{formatFileSize(entry.size)}</bdi>}
      </td>
      <td className="whitespace-nowrap px-3 text-muted-foreground">{modified}</td>
      <td>{actions}</td>
    </tr>
  ) : (
    <li
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        selected && 'border-primary ring-1 ring-primary/20',
        disabled && 'opacity-50',
      )}
    >
      <div className="flex items-center justify-between px-2 pt-2">
        {checkbox}
        {actions}
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Open ${entry.name}`}
        onClick={() => c.open(entry)}
        className="block w-full space-y-2 px-3 pb-3 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="flex h-20 items-center justify-center overflow-hidden rounded-md bg-muted/30">
          {c.renderPreview ? (
            c.renderPreview(entry)
          ) : entry.thumbnail ? (
            <img src={entry.thumbnail} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <Icon
              className={cn(
                'size-9',
                entry.kind === 'folder'
                  ? 'fill-primary/10 text-primary'
                  : 'text-muted-foreground/70',
              )}
            />
          )}
        </div>
        <span className="block truncate text-xs font-medium" title={entry.name}>
          {entry.name}
        </span>
        <span className="block text-[10px] text-muted-foreground">
          {entry.kind === 'folder' ? 'Folder' : <bdi dir="ltr">{formatFileSize(entry.size)}</bdi>}
        </span>
      </button>
    </li>
  )
}
/** Confirms and dispatches application operations; destination choices never include folder descendants. */
export function FileBrowserOperations() {
  const c = useFileBrowser(),
    dialog = c.dialog,
    [name, setName] = React.useState(
      dialog?.kind === 'rename' ? (dialog.entries[0]?.name ?? '') : '',
    ),
    [destination, setDestination] = React.useState<string>(''),
    [validation, setValidation] = React.useState(''),
    id = React.useId(),
    entry = dialog?.entries[0]
  if (!dialog) return null
  const movingIds = new Set(dialog.entries.map((item) => item.id))
  const canTarget = (id: string | null) => {
    if (id && c.map.get(id)?.disabled) return false
    let current = id ? c.map.get(id) : undefined
    while (current) {
      if (movingIds.has(current.id)) return false
      current = current.parentId ? c.map.get(current.parentId) : undefined
    }
    return dialog.entries.some((item) => (item.parentId ?? null) !== id)
  }
  const title =
    dialog.kind === 'create'
      ? 'New folder'
      : dialog.kind === 'rename'
        ? 'Rename item'
        : dialog.kind === 'move'
          ? 'Move items'
          : dialog.kind === 'delete'
            ? 'Delete items'
            : 'Item details'
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !c.busy) c.setDialog(null)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {dialog.kind === 'delete'
              ? `Delete ${dialog.entries.length} selected item${dialog.entries.length === 1 ? '' : 's'}?`
              : dialog.kind === 'move'
                ? 'Choose a destination folder.'
                : dialog.kind === 'info'
                  ? entry?.name
                  : 'Choose a name for this item.'}
          </DialogDescription>
        </DialogHeader>
        {dialog.kind === 'info' && entry ? (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{entry.kind === 'folder' ? 'Folder' : entry.mimeType || 'File'}</dd>
              {entry.kind === 'file' && (
                <>
                  <dt className="text-muted-foreground">Size</dt>
                  <dd>
                    <bdi dir="ltr">{formatFileSize(entry.size)}</bdi>
                  </dd>
                </>
              )}
              {entry.modifiedAt && !Number.isNaN(Date.parse(entry.modifiedAt)) && (
                <>
                  <dt className="text-muted-foreground">Modified</dt>
                  <dd>{new Date(entry.modifiedAt).toLocaleString()}</dd>
                </>
              )}
            </dl>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => c.setDialog(null)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (c.disabled || c.busy) return
              const currentEntries = dialog.entries.map((item) => c.map.get(item.id))
              if (currentEntries.some((item) => !item || item.disabled)) {
                setValidation('A selected item is no longer available for this action.')
                return
              }
              const operationEntries = currentEntries as FileBrowserEntry[],
                operationEntry = operationEntries[0]
              if (
                dialog.kind === 'create' &&
                c.folderId !== null &&
                (c.map.get(c.folderId)?.kind !== 'folder' || c.map.get(c.folderId)?.disabled)
              ) {
                setValidation(
                  'This folder is no longer available. Return to files to create a folder.',
                )
                return
              }
              const clean = name.trim()
              if (
                (dialog.kind === 'create' || dialog.kind === 'rename') &&
                (!clean ||
                  [...clean].some(
                    (char) => char === '/' || char === '\\' || char.charCodeAt(0) < 32,
                  ) ||
                  ['.', '..'].includes(clean))
              ) {
                setValidation('Use a nonempty name without slashes or control characters.')
                return
              }
              if (dialog.kind === 'create' || dialog.kind === 'rename') {
                const parent = dialog.kind === 'create' ? c.folderId : (entry?.parentId ?? null)
                if (
                  c.entries.some(
                    (item) =>
                      (item.parentId ?? null) === parent &&
                      item.id !== entry?.id &&
                      item.name.toLocaleLowerCase() === clean.toLocaleLowerCase(),
                  )
                ) {
                  setValidation('An item with that name already exists in this folder.')
                  return
                }
              }
              if (
                dialog.kind === 'move' &&
                !canMoveFileEntries(
                  c.entries,
                  dialog.entries.map((item) => item.id),
                  destination || null,
                  c.maxEntries,
                )
              ) {
                setValidation('Choose a valid destination outside the selected folders.')
                return
              }
              void c.perform(title, (context) =>
                dialog.kind === 'create'
                  ? c.callbacks.onCreateFolder?.(clean, c.folderId, context)
                  : dialog.kind === 'rename' && operationEntry
                    ? c.callbacks.onRename?.(operationEntry, clean, context)
                    : dialog.kind === 'move'
                      ? c.callbacks.onMove?.(operationEntries, destination || null, context)
                      : c.callbacks.onDelete?.(operationEntries, context),
              )
            }}
          >
            {(dialog.kind === 'create' || dialog.kind === 'rename') && (
              <div className="space-y-1">
                <label htmlFor={id} className="text-xs font-medium">
                  Name
                </label>
                <Input
                  id={id}
                  value={name}
                  onValueChange={setName}
                  autoFocus
                  disabled={c.busy}
                  maxLength={255}
                  required
                />
              </div>
            )}
            {dialog.kind === 'move' && (
              <div className="space-y-1">
                <label htmlFor={id} className="text-xs font-medium">
                  Destination
                </label>
                <select
                  id={id}
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  disabled={c.busy}
                  className="h-10 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="" disabled={!canTarget(null)}>
                    Files root
                  </option>
                  {c.entries
                    .filter((item) => item.kind === 'folder' && canTarget(item.id))
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            {validation && (
              <p role="alert" className="text-sm text-destructive">
                {validation}
              </p>
            )}
            {c.operationError && (
              <p role="alert" className="text-sm text-destructive">
                {c.operationError}
              </p>
            )}
            <DialogFooter>
              {c.busy && (
                <Button type="button" variant="outline" onClick={c.cancel}>
                  Cancel operation
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={c.busy}
                onClick={() => c.setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={dialog.kind === 'delete' ? 'destructive' : 'default'}
                disabled={c.busy || c.disabled}
              >
                {c.busy
                  ? 'Working…'
                  : dialog.kind === 'delete'
                    ? 'Delete'
                    : dialog.kind === 'move'
                      ? 'Move'
                      : dialog.kind === 'create'
                        ? 'Create folder'
                        : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
