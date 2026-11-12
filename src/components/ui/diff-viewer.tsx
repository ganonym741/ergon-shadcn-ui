import * as React from 'react'
import { diffLines, diffWordsWithSpace, type Change } from 'diff'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useControllableState } from '@/components/ui/util'

export interface DiffRow {
  oldLine?: number
  newLine?: number
  oldText?: string
  newText?: string
  oldNoNewline?: boolean
  newNoNewline?: boolean
  kind: 'equal' | 'change' | 'add' | 'remove'
}
export interface DiffViewerProps extends Omit<React.ComponentProps<'section'>, 'onCopy'> {
  before: string
  after: string
  beforeLabel?: string
  afterLabel?: string
  label?: string
  mode?: 'split' | 'inline'
  defaultMode?: 'split' | 'inline'
  onModeChange?: (mode: 'split' | 'inline') => void
  contextLines?: number
  ignoreWhitespace?: boolean
  wordHighlight?: boolean
  copyable?: boolean
  maxCharacters?: number
  maxLines?: number
  timeout?: number
  onCopy?: (text: string, side: 'before' | 'after') => void | Promise<void>
}
/** Aligns adjacent removed/added blocks without dropping blank lines or inventing trailing lines. */
export function createDiffRows(changes: readonly Change[]): DiffRow[] {
  const rows: DiffRow[] = []
  let oldLine = 1,
    newLine = 1
  const lines = (value: string) => {
    const result = value.split('\n')
    if (value.endsWith('\n')) result.pop()
    return result
  }
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i],
      part = lines(change.value)
    if (change.removed && changes[i + 1]?.added) {
      const added = lines(changes[++i].value)
      for (let j = 0; j < Math.max(part.length, added.length); j++)
        rows.push({
          kind: j < part.length && j < added.length ? 'change' : j < part.length ? 'remove' : 'add',
          oldLine: j < part.length ? oldLine++ : undefined,
          newLine: j < added.length ? newLine++ : undefined,
          oldText: part[j],
          newText: added[j],
        })
    } else
      for (const text of part)
        rows.push(
          change.added
            ? { kind: 'add', newLine: newLine++, newText: text }
            : change.removed
              ? { kind: 'remove', oldLine: oldLine++, oldText: text }
              : {
                  kind: 'equal',
                  oldLine: oldLine++,
                  newLine: newLine++,
                  oldText: text,
                  newText: text,
                },
        )
  }
  const oldLast = changes.filter((change) => !change.added).at(-1)?.value,
    newLast = changes.filter((change) => !change.removed).at(-1)?.value
  if (oldLast && !oldLast.endsWith('\n')) {
    const row = rows.filter((row) => row.oldLine !== undefined).at(-1)
    if (row) row.oldNoNewline = true
  }
  if (newLast && !newLast.endsWith('\n')) {
    const row = rows.filter((row) => row.newLine !== undefined).at(-1)
    if (row) row.newNoNewline = true
  }
  return rows
}
interface DiffContext {
  rows: DiffRow[]
  mode: 'split' | 'inline'
  setMode: (mode: 'split' | 'inline') => void
  beforeLabel: string
  afterLabel: string
  before: string
  after: string
  contextLines: number
  wordHighlight: boolean
  copyable: boolean
  onCopy: DiffViewerProps['onCopy']
  status: string
  setStatus: (status: string) => void
  showAll: boolean
  setShowAll: (show: boolean) => void
}
const Context = React.createContext<DiffContext | null>(null)
function useDiff() {
  const c = React.useContext(Context)
  if (!c) throw new Error('DiffViewer parts need DiffViewer.')
  return c
}
/** Computes bounded asynchronous text diffs, discarding stale work when the sources change. */
export function DiffViewer({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  label = 'Text differences',
  mode,
  defaultMode = 'split',
  onModeChange,
  contextLines = 3,
  ignoreWhitespace = false,
  wordHighlight = true,
  copyable = true,
  maxCharacters = 200000,
  maxLines = 5000,
  timeout = 1000,
  onCopy,
  className,
  children,
  ...props
}: DiffViewerProps) {
  const [view, setView] = useControllableState({
      value: mode,
      defaultValue: defaultMode,
      onChange: onModeChange,
    }),
    [result, setResult] = React.useState<{ before: string; after: string; rows: DiffRow[] } | null>(
      null,
    ),
    [status, setStatus] = React.useState(''),
    [loading, setLoading] = React.useState(true),
    [showAll, setShowAll] = React.useState(false)
  React.useEffect(() => {
    let stale = false
    setLoading(true)
    setStatus('')
    setShowAll(false)
    const charLimit = Number.isFinite(maxCharacters)
        ? Math.min(1000000, Math.max(1, maxCharacters))
        : 200000,
      lineLimit = Number.isFinite(maxLines) ? Math.min(20000, Math.max(1, maxLines)) : 5000
    if (
      before.length + after.length > charLimit ||
      before.split('\n').length + after.split('\n').length > lineLimit
    ) {
      setStatus('Content exceeds the configured comparison limit.')
      setLoading(false)
      setResult(null)
      return
    }
    diffLines(before, after, {
      ignoreWhitespace,
      timeout: Number.isFinite(timeout) ? Math.min(5000, Math.max(10, timeout)) : 1000,
      maxEditLength: 2000,
      callback: (changes) => {
        if (stale) return
        setLoading(false)
        if (!changes) {
          setResult(null)
          setStatus('Comparison exceeded its work limit. Reduce the input size.')
        } else setResult({ before, after, rows: createDiffRows(changes) })
      },
    })
    return () => {
      stale = true
    }
  }, [before, after, ignoreWhitespace, maxCharacters, maxLines, timeout])
  const rows = result?.before === before && result.after === after ? result.rows : []
  return (
    <Context.Provider
      value={{
        rows,
        mode: view,
        setMode: setView,
        beforeLabel,
        afterLabel,
        before,
        after,
        contextLines: Number.isFinite(contextLines)
          ? Math.min(100, Math.max(0, Math.floor(contextLines)))
          : 3,
        wordHighlight,
        copyable,
        onCopy,
        status,
        setStatus,
        showAll,
        setShowAll,
      }}
    >
      <section
        {...props}
        data-slot="diff-viewer"
        aria-label={label}
        aria-busy={loading}
        className={cn('min-w-0 overflow-hidden rounded-xl border', className)}
      >
        {children ?? (
          <>
            <DiffViewerToolbar />
            {loading ? (
              <p role="status" className="p-5 text-sm text-muted-foreground">
                Comparing text…
              </p>
            ) : (
              <DiffViewerContent />
            )}
          </>
        )}
        <p
          role="status"
          className={cn(status ? 'border-t p-3 text-xs text-muted-foreground' : 'sr-only')}
        >
          {status}
        </p>
      </section>
    </Context.Provider>
  )
}
/** Exposes view selection, unchanged-context control, counts, and explicit copy actions. */
export function DiffViewerToolbar() {
  const c = useDiff(),
    added = c.rows.filter((row) => row.kind === 'add' || row.kind === 'change').length,
    removed = c.rows.filter((row) => row.kind === 'remove' || row.kind === 'change').length
  const copy = async (side: 'before' | 'after') => {
    try {
      if (c.onCopy) await c.onCopy(c[side], side)
      else await navigator.clipboard.writeText(c[side])
      c.setStatus(`${side === 'before' ? c.beforeLabel : c.afterLabel} copied.`)
    } catch {
      c.setStatus('Could not copy text.')
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 p-3">
      <span dir="ltr" className="me-auto text-xs">
        <span className="text-emerald-700 dark:text-emerald-400">+{added}</span>
        {' / '}
        <span className="text-destructive">−{removed}</span>
        {!added && !removed && ' · No changes'}
      </span>
      <div role="group" aria-label="Diff layout" className="flex rounded-lg border p-0.5">
        {(['split', 'inline'] as const).map((mode) => (
          <Button
            type="button"
            key={mode}
            size="sm"
            variant={c.mode === mode ? 'secondary' : 'ghost'}
            aria-pressed={c.mode === mode}
            onClick={() => c.setMode(mode)}
          >
            {mode === 'split' ? 'Split' : 'Inline'}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={c.showAll}
        onClick={() => c.setShowAll(!c.showAll)}
      >
        {c.showAll ? 'Collapse context' : 'Show all lines'}
      </Button>
      {c.copyable &&
        (['before', 'after'] as const).map((side) => (
          <Button
            type="button"
            key={side}
            size="icon"
            variant="ghost"
            aria-label={`Copy ${side}`}
            onClick={() => void copy(side)}
          >
            <Copy className="size-4" />
          </Button>
        ))}
    </div>
  )
}
function WordDiff({ row, side, enabled }: { row: DiffRow; side: 'old' | 'new'; enabled: boolean }) {
  const tokens = React.useMemo(
    () =>
      enabled &&
      row.kind === 'change' &&
      (row.oldText?.length ?? 0) + (row.newText?.length ?? 0) < 600
        ? diffWordsWithSpace(row.oldText ?? '', row.newText ?? '', {
            timeout: 2,
            maxEditLength: 100,
          })
        : undefined,
    [row, enabled],
  )
  return (
    <>
      {tokens
        ? tokens
            .filter((token) => (side === 'old' ? !token.added : !token.removed))
            .map((token, index) => (
              <span
                key={index}
                className={
                  token.added || token.removed
                    ? 'rounded-sm bg-current/10 font-semibold underline decoration-current/40 underline-offset-2'
                    : undefined
                }
              >
                {token.value}
              </span>
            ))
        : row[side === 'old' ? 'oldText' : 'newText']}
      {row[side === 'old' ? 'oldNoNewline' : 'newNoNewline'] && (
        <span className="block font-sans text-[10px] italic text-muted-foreground">
          No newline at end of file
        </span>
      )}
    </>
  )
}
/** Renders accessible line-number tables with expandable unchanged runs and bounded word highlighting. */
export function DiffViewerContent() {
  const c = useDiff(),
    [expanded, setExpanded] = React.useState<Set<number>>(new Set())
  React.useEffect(() => setExpanded(new Set()), [c.rows])
  const visible = new Set<number>()
  c.rows.forEach((row, index) => {
    if (c.showAll || row.kind !== 'equal')
      for (
        let i = Math.max(0, index - c.contextLines);
        i <= Math.min(c.rows.length - 1, index + c.contextLines);
        i++
      )
        visible.add(i)
  })
  const output: React.ReactNode[] = []
  for (let i = 0; i < c.rows.length; i++) {
    if (!visible.has(i) && !expanded.has(i)) {
      const start = i
      while (i + 1 < c.rows.length && !visible.has(i + 1) && !expanded.has(i + 1)) i++
      const end = i
      output.push(
        <tr key={`gap-${start}`}>
          <td colSpan={4} className="bg-muted/30 text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setExpanded((previous) => {
                  const next = new Set(previous)
                  for (let index = start; index <= end; index++) next.add(index)
                  return next
                })
              }
            >
              Show {end - start + 1} unchanged lines
            </Button>
          </td>
        </tr>,
      )
      continue
    }
    const row = c.rows[i],
      numberClass =
        'w-10 select-none border-e px-2 text-right align-top text-xs text-muted-foreground',
      textClass = 'min-w-[12rem] whitespace-pre px-3 align-top'
    if (c.mode === 'split')
      output.push(
        <tr key={i}>
          <td
            className={cn(
              numberClass,
              row.kind === 'change' || row.kind === 'remove' ? 'bg-red-500/10' : '',
            )}
          >
            {row.oldLine ?? ''}
          </td>
          <td
            className={cn(
              textClass,
              'border-e',
              row.kind === 'change' || row.kind === 'remove' ? 'bg-red-500/10' : '',
            )}
          >
            <WordDiff row={row} side="old" enabled={c.wordHighlight} />
          </td>
          <td
            className={cn(
              numberClass,
              row.kind === 'change' || row.kind === 'add' ? 'bg-emerald-500/10' : '',
            )}
          >
            {row.newLine ?? ''}
          </td>
          <td
            className={cn(
              textClass,
              row.kind === 'change' || row.kind === 'add' ? 'bg-emerald-500/10' : '',
            )}
          >
            <WordDiff row={row} side="new" enabled={c.wordHighlight} />
          </td>
        </tr>,
      )
    else
      for (const side of row.kind === 'change'
        ? (['old', 'new'] as const)
        : ([row.kind === 'remove' ? 'old' : 'new'] as const)) {
        const changed = row.kind !== 'equal'
        output.push(
          <tr
            key={`${i}-${side}`}
            className={
              changed ? (side === 'old' ? 'bg-red-500/10' : 'bg-emerald-500/10') : undefined
            }
          >
            <td className={numberClass}>
              {side === 'old' || row.kind === 'equal' ? row.oldLine : ''}
            </td>
            <td className={numberClass}>{side === 'new' ? row.newLine : ''}</td>
            <td
              className="w-6 select-none text-center"
              aria-label={changed ? (side === 'old' ? 'Removed' : 'Added') : undefined}
            >
              {changed ? (side === 'old' ? '−' : '+') : ' '}
            </td>
            <td className={textClass}>
              <WordDiff row={row} side={side} enabled={c.wordHighlight} />
            </td>
          </tr>,
        )
      }
  }
  return (
    <div dir="ltr" className="max-h-[36rem] overflow-auto text-left" tabIndex={0}>
      <table className="w-full border-collapse font-mono text-xs leading-6">
        <caption className="sr-only">
          {c.beforeLabel} compared with {c.afterLabel}
        </caption>
        <thead className="sticky top-0 z-10 bg-muted text-left text-xs">
          <tr>
            {c.mode === 'split' ? (
              <>
                <th colSpan={2} className="border-e px-3 py-2">
                  {c.beforeLabel}
                </th>
                <th colSpan={2} className="px-3 py-2">
                  {c.afterLabel}
                </th>
              </>
            ) : (
              <>
                <th className="px-2 py-2">Old</th>
                <th className="px-2 py-2">New</th>
                <th colSpan={2} className="px-3 py-2">
                  Changes
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>{output}</tbody>
      </table>
      {!c.rows.length && !c.status && (
        <p className="p-4 text-sm text-muted-foreground">No content to compare.</p>
      )}
    </div>
  )
}
