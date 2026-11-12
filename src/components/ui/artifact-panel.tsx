import * as React from 'react'
import { FileCode, Download, PanelTop, Code, GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock, type CodeLanguage } from '@/components/ui/code-block'
import { DiffViewer } from '@/components/ui/diff-viewer'
import { StreamingMarkdown } from '@/components/ui/streaming-markdown'
import { useControllableState } from '@/components/ui/util'
import { useAsyncAction, productURL } from '@/components/ui/product-utils'
import { cn } from '@/lib/utils'
export interface ArtifactVersion {
  id: string
  label: string
  content: string
  createdAt?: string
}
export interface ArtifactData {
  id: string
  title: string
  kind: 'code' | 'markdown' | 'text' | 'image'
  language?: CodeLanguage
  filename?: string
  versions: ArtifactVersion[]
}
export interface ArtifactPanelProps extends React.ComponentProps<'section'> {
  artifact: ArtifactData
  versionId?: string
  onVersionChange?: (id: string) => void
  view?: 'preview' | 'source' | 'diff'
  defaultView?: 'preview' | 'source' | 'diff'
  onViewChange?: (view: 'preview' | 'source' | 'diff') => void
  onDownload?: (artifact: ArtifactData, version: ArtifactVersion) => void | Promise<void>
  renderPreview?: (artifact: ArtifactData, version: ArtifactVersion) => React.ReactNode
}
interface ArtifactContext {
  artifact: ArtifactData
  version: ArtifactVersion
  setVersion: (id: string) => void
  view: 'preview' | 'source' | 'diff'
  setView: (view: 'preview' | 'source' | 'diff') => void
  onDownload?: ArtifactPanelProps['onDownload']
  renderPreview?: ArtifactPanelProps['renderPreview']
}
const Context = React.createContext<ArtifactContext | null>(null)
const useArtifact = () => {
  const c = React.useContext(Context)
  if (!c) throw new Error('Artifact parts need ArtifactPanel.')
  return c
}
/** Versioned artifacts. Executable code remains source unless an application supplies its own preview. */
export function ArtifactPanel({
  artifact,
  versionId,
  onVersionChange,
  view,
  defaultView = 'preview',
  onViewChange,
  onDownload,
  renderPreview,
  children,
  className,
  ...props
}: ArtifactPanelProps) {
  const [selected, setSelected] = useControllableState({
      value: versionId,
      defaultValue: artifact.versions.at(-1)?.id ?? '',
      onChange: onVersionChange,
    }),
    [mode, setMode] = useControllableState({
      value: view,
      defaultValue: defaultView,
      onChange: onViewChange,
    }),
    version =
      artifact.versions.find((version) => version.id === selected) ?? artifact.versions.at(-1),
    valid =
      !!version &&
      artifact.versions.every((item) => item.id && item.label) &&
      new Set(artifact.versions.map((version) => version.id)).size === artifact.versions.length
  return (
    <section
      {...props}
      data-slot="artifact-panel"
      aria-label={artifact.title}
      className={cn('w-full min-w-0 overflow-hidden rounded-xl border bg-background', className)}
    >
      {valid && version ? (
        <Context.Provider
          value={{
            artifact,
            version,
            setVersion: setSelected,
            view:
              mode === 'diff' &&
              (artifact.kind === 'image' || artifact.versions[0]?.id === version.id)
                ? 'preview'
                : mode,
            setView: setMode,
            onDownload,
            renderPreview,
          }}
        >
          {children ?? (
            <>
              <ArtifactPanelHeader />
              <ArtifactPanelContent />
            </>
          )}
        </Context.Provider>
      ) : (
        <p role="alert" className="p-4 text-sm text-destructive">
          Artifacts need at least one version with unique IDs and labels.
        </p>
      )}
    </section>
  )
}
export function ArtifactPanelHeader() {
  const c = useArtifact(),
    action = useAsyncAction(),
    imageURL = c.artifact.kind === 'image' ? productURL(c.version.content, true) : undefined,
    openImage =
      !c.onDownload &&
      !!imageURL &&
      typeof window !== 'undefined' &&
      !/^(blob:|data:)/.test(imageURL) &&
      new URL(imageURL, window.location.href).origin !== window.location.origin
  const download = () =>
    void action.run(async () => {
      if (c.onDownload) {
        await c.onDownload(c.artifact, c.version)
        return
      }
      const image = c.artifact.kind === 'image',
        href = image
          ? productURL(c.version.content, true)
          : URL.createObjectURL(new Blob([c.version.content], { type: 'text/plain;charset=utf-8' }))
      if (!href) throw new Error('The image URL cannot be downloaded.')
      const link = document.createElement('a')
      link.href = href
      if (!openImage)
        link.download = c.artifact.filename ?? `${c.artifact.id}${image ? '.png' : '.txt'}`
      link.rel = 'noopener noreferrer'
      if (image) link.target = '_blank'
      link.click()
      if (!image) setTimeout(() => URL.revokeObjectURL(href), 0)
    })
  return (
    <header className="space-y-3 border-b p-3">
      <div className="flex flex-wrap items-center gap-2">
        <FileCode className="size-4 shrink-0 text-muted-foreground" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium">{c.artifact.title}</h3>
        <select
          aria-label="Artifact version"
          className="h-8 max-w-40 rounded-md border bg-background px-2 text-xs"
          value={c.version.id}
          onChange={(event) => c.setVersion(event.target.value)}
        >
          {c.artifact.versions.map((version) => (
            <option key={version.id} value={version.id}>
              {version.label}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={openImage ? 'Open image' : 'Download artifact'}
          disabled={action.busy}
          onClick={download}
        >
          <Download />
        </Button>
      </div>
      <div
        role="tablist"
        aria-label="Artifact view"
        className="flex flex-wrap gap-1"
        onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          const options = [
              ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
                '[role=tab]:not(:disabled)',
              ),
            ],
            index = options.indexOf(document.activeElement as HTMLButtonElement),
            next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? options.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + options.length) %
                    options.length
          event.preventDefault()
          options[next]?.click()
          options[next]?.focus()
        }}
      >
        {(
          [
            { view: 'preview', label: 'Preview', Icon: PanelTop },
            { view: 'source', label: 'Source', Icon: Code },
            { view: 'diff', label: 'Changes', Icon: GitCompare },
          ] as const
        ).map(({ view, label, Icon }) => (
          <Button
            key={view}
            type="button"
            role="tab"
            aria-selected={c.view === view}
            tabIndex={c.view === view ? 0 : -1}
            variant={c.view === view ? 'secondary' : 'ghost'}
            size="sm"
            disabled={
              view === 'diff' &&
              (c.artifact.kind === 'image' || c.artifact.versions[0]?.id === c.version.id)
            }
            onClick={() => c.setView(view)}
          >
            <Icon />
            {label}
          </Button>
        ))}
      </div>
      {action.error && (
        <p role="alert" className="text-xs text-destructive">
          {action.error}
        </p>
      )}
    </header>
  )
}
export function ArtifactPanelContent() {
  const c = useArtifact(),
    index = c.artifact.versions.findIndex((version) => version.id === c.version.id),
    before = c.artifact.versions[Math.max(0, index - 1)],
    image = c.artifact.kind === 'image',
    src = image ? productURL(c.version.content, true) : undefined
  return (
    <div
      role="tabpanel"
      aria-label={`${c.view} of ${c.artifact.title}`}
      className="max-h-[40rem] min-h-40 overflow-auto p-4"
    >
      {c.view === 'diff' ? (
        image ? (
          <p className="text-xs text-muted-foreground">
            Image differences require an application renderer.
          </p>
        ) : (
          <DiffViewer
            before={before.content}
            after={c.version.content}
            beforeLabel={before.label}
            afterLabel={c.version.label}
            defaultMode="inline"
          />
        )
      ) : c.view === 'source' ? (
        <CodeBlock
          code={c.version.content}
          language={
            image
              ? 'text'
              : (c.artifact.language ?? (c.artifact.kind === 'markdown' ? 'markdown' : 'text'))
          }
          filename={c.artifact.filename}
        />
      ) : (
        (c.renderPreview?.(c.artifact, c.version) ??
        (image ? (
          src ? (
            <img
              src={src}
              alt={c.artifact.title}
              className="mx-auto max-h-96 max-w-full rounded-lg object-contain"
            />
          ) : (
            <p role="alert" className="text-xs text-destructive">
              Unsupported image URL.
            </p>
          )
        ) : c.artifact.kind === 'markdown' ? (
          <StreamingMarkdown content={c.version.content} />
        ) : c.artifact.kind === 'code' ? (
          <CodeBlock
            code={c.version.content}
            language={c.artifact.language ?? 'text'}
            filename={c.artifact.filename}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {c.version.content}
          </div>
        )))
      )}
    </div>
  )
}
