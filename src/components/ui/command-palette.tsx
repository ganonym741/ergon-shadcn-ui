import * as React from 'react'
import { ChevronLeft, ChevronRight, Command as CommandIcon, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useControllableState, useDebouncedValue } from '@/components/ui/util'

export interface PaletteAction {
  id: string
  label: string
  description?: string
  group?: string
  keywords?: string[]
  shortcut?: string
  icon?: React.ReactNode
  disabled?: boolean
  children?: PaletteAction[]
  onSelect?: (context: {
    signal: AbortSignal
    close: () => void
    action: PaletteAction
  }) => void | Promise<void>
  keepOpen?: boolean
}
export interface CommandPaletteProps {
  actions: PaletteAction[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
  placeholder?: string
  shortcut?: string | false
  enableInInputs?: boolean
  loadActions?: (
    query: string,
    context: { signal: AbortSignal; path: string[] },
  ) => Promise<PaletteAction[]>
  onAction?: (action: PaletteAction) => void
  children?: React.ReactNode
}
interface PaletteContext {
  id: string
  open: boolean
  setOpen: (value: boolean) => void
  title: string
  description: string
  placeholder: string
  shortcut: string | false
  query: string
  setQuery: (value: string) => void
  path: PaletteAction[]
  back: () => void
  actions: PaletteAction[]
  loading: boolean
  error: string
  pending: boolean
  serverSearch: boolean
  retry: () => void
  run: (action: PaletteAction) => void
}
const Context = React.createContext<PaletteContext | null>(null)
/** Reads palette state for custom triggers, contents, and action renderers. */
export function useCommandPalette() {
  const context = React.useContext(Context)
  if (!context) throw new Error('Command palette parts must be inside CommandPalette.')
  return context
}
/** Provides grouped and nested commands, async search cancellation, and a configurable global shortcut. */
export function CommandPalette({
  actions,
  open,
  defaultOpen = false,
  onOpenChange,
  title = 'Command palette',
  description = 'Search for a destination or action.',
  placeholder = 'What would you like to do?',
  shortcut = 'mod+k',
  enableInInputs = false,
  loadActions,
  onAction,
  children,
}: CommandPaletteProps) {
  const [shown, setShown] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const [query, setQuery] = React.useState(''),
    [path, setPath] = React.useState<PaletteAction[]>([]),
    [remote, setRemote] = React.useState<PaletteAction[]>([]),
    [loading, setLoading] = React.useState(false),
    [error, setError] = React.useState(''),
    [pending, setPending] = React.useState(false),
    [revision, retry] = React.useReducer((n) => n + 1, 0)
  const debounced = useDebouncedValue(query),
    id = React.useId(),
    pathKey = JSON.stringify(path.map((item) => item.id)),
    operation = React.useRef<AbortController | null>(null)
  React.useEffect(() => {
    if (!shown) {
      setQuery('')
      setPath([])
      setError('')
      setPending(false)
      operation.current?.abort()
    }
  }, [shown])
  React.useEffect(() => () => operation.current?.abort(), [])
  React.useEffect(() => {
    if (!shortcut) return
    const keys = shortcut.toLowerCase().split('+'),
      key = keys.at(-1)
    const handle = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.key.toLowerCase() !== key) return
      const target = event.target as HTMLElement | null
      const ownInput =
        target?.closest('[data-command-palette]')?.getAttribute('data-command-palette') === id
      if (
        !enableInInputs &&
        !ownInput &&
        target?.closest('input,textarea,[contenteditable="true"]')
      )
        return
      if (
        keys.includes('mod')
          ? !(event.ctrlKey || event.metaKey)
          : keys.includes('ctrl') !== event.ctrlKey || keys.includes('meta') !== event.metaKey
      )
        return
      if (keys.includes('shift') !== event.shiftKey || keys.includes('alt') !== event.altKey) return
      event.preventDefault()
      setShown(!shown)
    }
    document.addEventListener('keydown', handle, true)
    return () => document.removeEventListener('keydown', handle, true)
  }, [shortcut, enableInInputs, shown, setShown, id])
  React.useEffect(() => {
    if (!shown || !loadActions) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    setRemote([])
    if (query !== debounced) return
    const controller = new AbortController()
    Promise.resolve()
      .then(() =>
        loadActions(debounced, {
          signal: controller.signal,
          path: JSON.parse(pathKey) as string[],
        }),
      )
      .then((result) => {
        if (!controller.signal.aborted) setRemote(result)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(String(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [shown, loadActions, query, debounced, pathKey, revision])
  const current = loadActions ? remote : (path.at(-1)?.children ?? actions)
  const duplicate = new Set(current.map((item) => item.id)).size !== current.length
  const run = async (action: PaletteAction) => {
    if (action.disabled || pending) return
    if (action.children) {
      setPath((previous) => [...previous, action])
      setQuery('')
      return
    }
    operation.current?.abort()
    const controller = new AbortController()
    operation.current = controller
    setPending(true)
    setError('')
    try {
      await action.onSelect?.({ signal: controller.signal, close: () => setShown(false), action })
      if (!controller.signal.aborted) {
        onAction?.(action)
        if (!action.keepOpen) setShown(false)
      }
    } catch (reason) {
      if (!controller.signal.aborted) setError(String(reason))
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }
  return (
    <Context.Provider
      value={{
        open: shown,
        id,
        setOpen: setShown,
        title,
        description,
        placeholder,
        shortcut,
        query,
        setQuery,
        path,
        back: () => {
          setPath((previous) => previous.slice(0, -1))
          setQuery('')
          setError('')
        },
        actions: duplicate ? [] : current,
        loading,
        error: duplicate ? 'Action IDs must be unique.' : error,
        pending,
        serverSearch: !!loadActions,
        retry,
        run,
      }}
    >
      {children ?? (
        <>
          <CommandPaletteTrigger />
          <CommandPaletteContent remote={!!loadActions} />
        </>
      )}
    </Context.Provider>
  )
}
/** Opens the palette using an ordinary button that can be replaced or styled by the caller. */
export function CommandPaletteTrigger({
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const c = useCommandPalette()
  return (
    <Button
      type="button"
      variant="outline"
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) c.setOpen(true)
      }}
    >
      {children ?? (
        <>
          <CommandIcon />
          Search commands
          {c.shortcut && (
            <kbd className="ms-6 rounded border px-1.5 text-[10px] text-muted-foreground">
              {c.shortcut.replace('mod', 'Ctrl / ⌘')}
            </kbd>
          )}
        </>
      )}
    </Button>
  )
}
/** Renders the accessible command dialog and restores the element focused before opening. */
export function CommandPaletteContent({
  remote,
  className,
}: {
  remote?: boolean
  className?: string
}) {
  const c = useCommandPalette(),
    previousFocus = React.useRef<HTMLElement | null>(null)
  const groups = [...new Set(c.actions.map((item) => item.group ?? 'Actions'))]
  return (
    <Dialog open={c.open} onOpenChange={c.setOpen}>
      <DialogContent
        data-command-palette={c.id}
        className={className}
        onOpenAutoFocus={() => {
          previousFocus.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null
        }}
        onCloseAutoFocus={(event) => {
          if (previousFocus.current?.isConnected) {
            event.preventDefault()
            previousFocus.current.focus()
          }
        }}
        onEscapeKeyDown={(event) => {
          if (c.path.length) {
            event.preventDefault()
            c.back()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.description}</DialogDescription>
        </DialogHeader>
        {c.path.length > 0 && (
          <Button type="button" size="sm" variant="ghost" className="w-fit" onClick={c.back}>
            <ChevronLeft />
            Back · {c.path.at(-1)?.label}
          </Button>
        )}
        <Command label="Search commands" shouldFilter={!(remote ?? c.serverSearch)}>
          <CommandInput
            aria-label="Search commands"
            placeholder={c.placeholder}
            value={c.query}
            onValueChange={c.setQuery}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !c.query && c.path.length) {
                event.preventDefault()
                c.back()
              }
            }}
          />
          <CommandList aria-label="Available commands" aria-busy={c.loading || c.pending}>
            {c.loading ? (
              <p
                role="status"
                className="flex items-center gap-2 p-4 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" />
                Searching commands…
              </p>
            ) : (
              <>
                <CommandEmpty>No commands found.</CommandEmpty>
                {groups.map((group) => (
                  <CommandGroup key={group} heading={group}>
                    {c.actions
                      .filter((item) => (item.group ?? 'Actions') === group)
                      .map((action) => (
                        <CommandPaletteItem key={action.id} action={action} />
                      ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
        {c.error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
          >
            {c.error}
            {(remote ?? c.serverSearch) && (
              <Button type="button" size="sm" variant="ghost" onClick={c.retry}>
                Retry
              </Button>
            )}
          </div>
        )}
        <p role="status" className="text-xs text-muted-foreground">
          {c.pending
            ? 'Running command…'
            : '↑ ↓ to navigate · Enter to select · Escape to go back or close'}
        </p>
      </DialogContent>
    </Dialog>
  )
}
/** Renders one command while preserving its search keywords, disabled state, and nested navigation. */
export function CommandPaletteItem({ action }: { action: PaletteAction }) {
  const c = useCommandPalette()
  return (
    <CommandItem
      value={action.id}
      keywords={[action.label, action.description ?? '', ...(action.keywords ?? [])]}
      disabled={action.disabled || c.pending}
      onSelect={() => void c.run(action)}
    >
      {action.icon && <span aria-hidden="true">{action.icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{action.label}</span>
        {action.description && (
          <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
        )}
      </span>
      {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
      {action.children && <ChevronRight aria-hidden="true" className="ms-auto size-4" />}
    </CommandItem>
  )
}
