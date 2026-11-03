import * as React from 'react'
import {
  RotateCcw,
  Copy,
  Download,
  SlidersHorizontal,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  Check,
  Bookmark,
} from 'lucide-react'
import { ConfigProvider } from '@/components/ui/config-provider'
import { Button } from '@/components/ui/button'
import { PlaygroundPreview, type PlaygroundEvent } from './preview'
import { playgrounds, defaultConfig, type Config, type Control } from './schema'
import { CodeBlock } from '@/docs/ui'
import { useTheme } from '@/components/ui/theme-provider'
import { themeAccent } from '@/lib/contrast'
class PreviewBoundary extends React.Component<{ children: React.ReactNode }, { error: string }> {
  state = { error: '' }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    return this.state.error ? (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 p-5 text-sm text-destructive"
      >
        Preview error: {this.state.error}
      </div>
    ) : (
      this.props.children
    )
  }
}
export default function ComponentPlayground({
  id,
  direction = 'ltr',
}: {
  id: string
  direction?: 'ltr' | 'rtl'
}) {
  const { resolvedTheme } = useTheme()
  const spec = playgrounds[id],
    [config, setConfig] = React.useState<Config>(() => ({
      ...defaultConfig(id),
      _direction: direction,
    })),
    [revision, restart] = React.useReducer((n) => n + 1, 0),
    [events, setEvents] = React.useState<PlaygroundEvent[]>([]),
    [width, setWidth] = React.useState(0),
    [panel, setPanel] = React.useState<'controls' | 'events' | 'config'>('controls'),
    [copied, setCopied] = React.useState(false),
    [filter, setFilter] = React.useState(''),
    [saved, setSaved] = React.useState<{ name: string; values: Config }[]>(() => {
      try {
        return JSON.parse(localStorage.getItem(`ergonui:presets:${id}`) ?? '[]')
      } catch {
        return []
      }
    }),
    [presetName, setPresetName] = React.useState(''),
    [storageNotice, setStorageNotice] = React.useState('')
  const onEvent = React.useCallback(
    (event: PlaygroundEvent) => setEvents((previous) => [event, ...previous].slice(0, 50)),
    [],
  )
  const update = (key: string, value: string | number | boolean) => {
    setConfig((previous) => ({ ...previous, [key]: value }))
    restart()
  }
  const apply = (values: Config) => {
    setConfig({ ...defaultConfig(id), ...values })
    setEvents([])
    restart()
  }
  const exportConfig = () => {
    const blob = new Blob([JSON.stringify({ component: id, config }, null, 2)], {
        type: 'application/json',
      }),
      url = URL.createObjectURL(blob),
      link = document.createElement('a')
    link.href = url
    link.download = `ergonui-${id}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
  const common: Control[] = [
    {
      key: '_density',
      label: 'Density',
      type: 'select',
      options: ['comfortable', 'compact'],
      initial: 'comfortable',
    },
    {
      key: '_direction',
      label: 'Reading direction',
      type: 'select',
      options: ['ltr', 'rtl'],
      initial: 'ltr',
    },
    { key: '_radius', label: 'Corner radius', type: 'number', initial: 10, min: 0, max: 24 },
    { key: '_accent', label: 'Accent', type: 'color', initial: '#e66043' },
  ]
  const renderControl = (control: Control) => {
    const key = `playground-${id}-${control.key}`,
      value = config[control.key] ?? control.initial
    return (
      <label key={key} htmlFor={key} className="block space-y-1.5 text-xs">
        <span className="flex items-center justify-between gap-2 font-medium">
          {control.label}
          {control.type === 'boolean' && (
            <input
              id={key}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => update(control.key, event.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
          )}
        </span>
        {control.type === 'select' ? (
          <select
            id={key}
            value={String(value)}
            onChange={(event) => update(control.key, event.target.value)}
            className="h-8 w-full rounded-md border bg-background px-2"
          >
            {control.options?.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : control.type === 'json' ? (
          <>
            <textarea
              id={key}
              value={String(value)}
              rows={5}
              spellCheck={false}
              onChange={(event) => update(control.key, event.target.value)}
              className="w-full resize-y rounded-md border bg-background p-2 font-mono text-[10px]"
            />
            {(() => {
              try {
                const parsed = JSON.parse(String(value))
                const object = control.jsonShape === 'object'
                const valid = object
                  ? parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
                  : Array.isArray(parsed)
                return !valid ? (
                  <span role="alert" className="text-destructive">
                    {object ? 'Provide an object.' : 'Provide an array.'}
                  </span>
                ) : null
              } catch {
                return (
                  <span role="alert" className="text-destructive">
                    Enter valid JSON.
                  </span>
                )
              }
            })()}
          </>
        ) : control.type !== 'boolean' ? (
          <input
            id={key}
            type={
              control.type === 'color' ? 'color' : control.type === 'number' ? 'number' : 'text'
            }
            value={String(value)}
            min={control.min}
            max={control.max}
            step={control.type === 'number' ? 'any' : undefined}
            onChange={(event) =>
              update(
                control.key,
                control.type === 'number'
                  ? Math.max(
                      control.min ?? -Infinity,
                      Math.min(control.max ?? Infinity, Number(event.target.value)),
                    )
                  : event.target.value,
              )
            }
            className="h-8 w-full rounded-md border bg-background px-2"
          />
        ) : null}
      </label>
    )
  }
  return (
    <div className="component-playground">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-4 py-3">
        <SlidersHorizontal size={14} className="text-primary" />
        <span className="mr-auto text-xs font-medium">Interactive playground</span>
        <select
          aria-label="Playground preset"
          className="h-7 max-w-40 rounded border bg-background px-2 text-[11px]"
          value=""
          onChange={(e) => {
            const preset = [...spec.presets, ...saved].find((p) => p.name === e.target.value)
            if (preset) apply(preset.values)
          }}
        >
          <option value="">Choose a preset</option>
          {[...spec.presets, ...saved].map((preset, index) => (
            <option key={index}>{preset.name}</option>
          ))}
        </select>
        <div className="flex gap-1" aria-label="Canvas width">
          {[
            [0, Monitor, 'Responsive'],
            [768, Tablet, 'Tablet'],
            [375, Smartphone, 'Mobile'],
          ].map(([size, Icon, label]) => {
            const Glyph = Icon as typeof Monitor
            return (
              <button
                type="button"
                key={String(size)}
                aria-label={`${label} preview`}
                aria-pressed={width === size}
                onClick={() => setWidth(Number(size))}
                className={`rounded p-1.5 ${width === size ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
              >
                <Glyph size={14} />
              </button>
            )
          })}
        </div>
        <button
          aria-label="Reset playground"
          className="rounded p-1.5 text-muted-foreground hover:bg-muted"
          onClick={() => apply(defaultConfig(id))}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_228px]">
        <div className="min-w-0 overflow-x-auto bg-[radial-gradient(var(--border)_0.6px,transparent_0.6px)] bg-[size:16px_16px] p-4 sm:p-6">
          <div
            className="mx-auto min-h-80 rounded-xl border bg-background transition-[width]"
            style={{ width: width || '100%', maxWidth: width ? 'none' : '100%' }}
          >
            <ConfigProvider
              density={config._density as any}
              direction={config._direction as any}
              radius={Number(config._radius)}
              accent={themeAccent(String(config._accent), resolvedTheme)}
              data-playground-canvas=""
              data-preview-motion="full"
              role="region"
              aria-label="Component preview"
              className="flex min-h-80 min-w-0 items-center justify-center p-5"
            >
              <PreviewBoundary key={`${id}:${revision}`}>
                <PlaygroundPreview
                  key={`${id}:${revision}`}
                  id={id}
                  config={config}
                  onEvent={onEvent}
                />
              </PreviewBoundary>
            </ConfigProvider>
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Controls restart the preview. Canvas sizes constrain its width; resize your browser to
            test media breakpoints.
          </p>
        </div>
        <aside
          className="min-w-0 border-t bg-background lg:border-t-0 lg:border-l"
          aria-label="Playground configuration"
        >
          <div className="flex border-b text-[11px]">
            {(['controls', 'events', 'config'] as const).map((item) => (
              <button
                key={item}
                className={`flex-1 border-b-2 px-2 py-3 capitalize ${panel === item ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                aria-pressed={panel === item}
                onClick={() => setPanel(item)}
              >
                {item}
                {item === 'events' && events.length > 0 ? ` (${events.length})` : ''}
              </button>
            ))}
          </div>
          <div className="max-h-[650px] overflow-y-auto p-4">
            {panel === 'controls' ? (
              <>
                <input
                  aria-label="Find a playground control"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Find a control…"
                  className="mb-5 h-8 w-full rounded border bg-background px-2 text-xs"
                />
                <div className="space-y-4">
                  {spec.controls
                    .filter((c) => c.label.toLowerCase().includes(filter.toLowerCase()))
                    .map(renderControl)}
                </div>
                <details className="mt-6 border-t pt-3">
                  <summary className="cursor-pointer text-xs font-medium">Appearance</summary>
                  <div className="mt-4 space-y-4">{common.map(renderControl)}</div>
                </details>
              </>
            ) : panel === 'events' ? (
              <>
                <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Latest 50 interactions</span>
                  <button aria-label="Clear playground events" onClick={() => setEvents([])}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {events.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    Interact with the component to see its output.
                  </p>
                ) : (
                  events.map((event, index) => (
                    <div key={index} className="mb-2 rounded-md border p-2">
                      <div className="flex justify-between text-[10px]">
                        <strong>{event.type}</strong>
                        <span className="text-muted-foreground">
                          {new Date(event.time).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">
                        {JSON.stringify(event.value, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  This configuration describes the playground recipe. See Usage and API for
                  component props.
                </p>
                <CodeBlock code={JSON.stringify(config, null, 2)} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    {copied ? <Check /> : <Copy />}Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportConfig}>
                    <Download />
                    Export
                  </Button>
                </div>
                <label className="block text-xs">
                  Import configuration
                  <input
                    type="file"
                    accept="application/json"
                    className="mt-2 block max-w-full text-[10px]"
                    onChange={async (event) => {
                      try {
                        const data = JSON.parse((await event.target.files?.[0]?.text()) ?? '{}')
                        if (
                          data.component !== id ||
                          !data.config ||
                          typeof data.config !== 'object'
                        )
                          throw new Error('Choose a configuration exported for this component')
                        apply(data.config)
                      } catch (error) {
                        onEvent({ type: 'import-error', value: String(error), time: Date.now() })
                      }
                    }}
                  />
                </label>
                <div className="border-t pt-3">
                  <input
                    aria-label="Saved preset name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Name your preset"
                    className="h-8 w-full rounded border bg-background px-2 text-xs"
                  />
                  <Button
                    className="mt-2"
                    size="sm"
                    variant="outline"
                    disabled={!presetName.trim()}
                    onClick={() => {
                      const next = [
                        ...saved.filter((p) => p.name !== presetName.trim()),
                        { name: presetName.trim(), values: { ...config } },
                      ]
                      setSaved(next)
                      try {
                        localStorage.setItem(`ergonui:presets:${id}`, JSON.stringify(next))
                        setStorageNotice('')
                      } catch {
                        setStorageNotice(
                          'Browser storage is unavailable. This preset is available for this session.',
                        )
                      }
                      setPresetName('')
                    }}
                  >
                    <Bookmark />
                    Save locally
                  </Button>
                  {saved.length > 0 && (
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSaved([])
                        try {
                          localStorage.removeItem(`ergonui:presets:${id}`)
                          setStorageNotice('')
                        } catch {
                          setStorageNotice(
                            'Presets cleared for this session. Browser storage is unavailable.',
                          )
                        }
                      }}
                    >
                      Clear saved presets
                    </Button>
                  )}
                  {storageNotice && (
                    <p role="status" className="mt-2 text-xs text-muted-foreground">
                      {storageNotice}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
