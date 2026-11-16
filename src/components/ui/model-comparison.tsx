import * as React from 'react'
import { Play, Square, RotateCcw, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StreamingMarkdown } from '@/components/ui/streaming-markdown'
import { useControllableState } from '@/components/ui/util'
import { clamp } from '@/components/ui/product-utils'
import type { ModelDescriptor } from '@/components/ui/ai-model'
import { cn } from '@/lib/utils'
import type { TextStreamOptions } from '@/components/ui/text-stream'
export interface ModelComparisonResult {
  text?: string
  inputTokens?: number
  outputTokens?: number
  cost?: string
}
export interface ModelComparisonRun extends ModelComparisonResult {
  modelId: string
  status: 'queued' | 'running' | 'complete' | 'error' | 'cancelled'
  error?: string
  durationMs?: number
}
function withCancellation<T>(task: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Cancelled', 'AbortError'))
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
    task.then(
      (value) => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      (failure) => {
        signal.removeEventListener('abort', abort)
        reject(failure)
      },
    )
  })
}
export interface ModelComparisonProps
  extends Omit<React.ComponentProps<'section'>, 'onChange'>, TextStreamOptions {
  models: ModelDescriptor[]
  prompt?: string
  defaultPrompt?: string
  onPromptChange?: (prompt: string) => void
  onGenerate: (
    request: { prompt: string; model: ModelDescriptor },
    options: { signal: AbortSignal; onDelta: (text: string) => void },
  ) => Promise<ModelComparisonResult>
  onRunsChange?: (runs: ModelComparisonRun[]) => void
  onVote?: (modelId: string) => void
  concurrency?: number
  disabled?: boolean
  renderResponse?: (run: ModelComparisonRun) => React.ReactNode
}
/** Executes the same prompt through injected, independently cancellable model adapters. */
export function ModelComparison({
  models,
  prompt,
  defaultPrompt = '',
  onPromptChange,
  onGenerate,
  onRunsChange,
  onVote,
  concurrency = 3,
  disabled = false,
  renderResponse,
  textAnimation = 'typewriter',
  charactersPerSecond = 60,
  className,
  ...props
}: ModelComparisonProps) {
  const [text, setText] = useControllableState({
      value: prompt,
      defaultValue: defaultPrompt,
      onChange: onPromptChange,
    }),
    [runs, setRuns] = React.useState<ModelComparisonRun[]>([]),
    generation = React.useRef(0),
    controllers = React.useRef(new Map<string, AbortController>()),
    cancelled = React.useRef(new Set<string>()),
    latest = React.useRef({ onRunsChange, onGenerate }),
    runPrompt = React.useRef('')
  React.useLayoutEffect(() => {
    latest.current = { onRunsChange, onGenerate }
  }, [onRunsChange, onGenerate])
  const inventory = JSON.stringify(models.map((model) => model.id)),
    previousInventory = React.useRef(inventory)
  React.useEffect(() => {
    if (previousInventory.current === inventory) return
    previousInventory.current = inventory
    generation.current++
    for (const controller of controllers.current.values()) controller.abort()
    controllers.current.clear()
    cancelled.current.clear()
    setRuns([])
  }, [inventory])
  React.useEffect(() => {
    latest.current.onRunsChange?.(runs)
  }, [runs])
  React.useEffect(
    () => () => {
      generation.current++
      for (const controller of controllers.current.values()) controller.abort()
      controllers.current.clear()
    },
    [],
  )
  const active = runs.some((run) => run.status === 'queued' || run.status === 'running'),
    valid =
      models.length > 0 &&
      models.length <= 12 &&
      models.every((model) => model.id.trim().length > 0) &&
      new Set(models.map((model) => model.id)).size === models.length
  const patch = (id: string, update: Partial<ModelComparisonRun>, round: number) => {
    if (round === generation.current)
      setRuns((previous) =>
        previous.map((run) => (run.modelId === id ? { ...run, ...update } : run)),
      )
  }
  const execute = async (model: ModelDescriptor, round: number, snapshot: string) => {
    if (cancelled.current.has(model.id) || round !== generation.current) return
    const controller = new AbortController()
    controllers.current.set(model.id, controller)
    const start = performance.now()
    patch(model.id, { status: 'running', error: undefined }, round)
    try {
      const result = await withCancellation(
        latest.current.onGenerate(
          { prompt: snapshot, model },
          {
            signal: controller.signal,
            onDelta: (delta) => {
              if (
                !controller.signal.aborted &&
                round === generation.current &&
                controllers.current.get(model.id) === controller
              )
                setRuns((previous) =>
                  previous.map((run) =>
                    run.modelId === model.id ? { ...run, text: (run.text ?? '') + delta } : run,
                  ),
                )
            },
          },
        ),
        controller.signal,
      )
      if (!controller.signal.aborted)
        patch(
          model.id,
          {
            ...Object.fromEntries(
              Object.entries(result).filter(([, value]) => value !== undefined),
            ),
            status: 'complete',
            durationMs: Math.round(performance.now() - start),
          },
          round,
        )
    } catch (failure) {
      if (!controller.signal.aborted)
        patch(
          model.id,
          {
            status: 'error',
            error: failure instanceof Error ? failure.message : 'Generation failed.',
            durationMs: Math.round(performance.now() - start),
          },
          round,
        )
    } finally {
      controller.abort()
      if (controllers.current.get(model.id) === controller) controllers.current.delete(model.id)
    }
  }
  const start = () => {
    if (disabled || active || !valid || !text.trim()) return
    const round = ++generation.current,
      snapshot = text.trim()
    cancelled.current.clear()
    runPrompt.current = snapshot
    const available = models.filter((model) => model.available !== false)
    setRuns(available.map((model) => ({ modelId: model.id, status: 'queued', text: '' })))
    let index = 0
    for (
      let worker = 0;
      worker < Math.min(available.length, Math.floor(clamp(concurrency, 1, 6)));
      worker++
    )
      void (async () => {
        while (index < available.length && round === generation.current) {
          const model = available[index++]
          await execute(model, round, snapshot)
        }
      })()
  }
  const stop = (id?: string) => {
    for (const model of models) {
      if (id && model.id !== id) continue
      cancelled.current.add(model.id)
      controllers.current.get(model.id)?.abort()
      controllers.current.delete(model.id)
    }
    setRuns((previous) =>
      previous.map((run) =>
        (!id || run.modelId === id) && (run.status === 'queued' || run.status === 'running')
          ? { ...run, status: 'cancelled' }
          : run,
      ),
    )
  }
  return (
    <section
      {...props}
      data-slot="model-comparison"
      aria-label="Model comparison"
      className={cn('w-full min-w-0 space-y-4', className)}
    >
      <div className="space-y-3 rounded-xl border bg-background p-4">
        <Textarea
          aria-label="Comparison prompt"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="One prompt. Compare several perspectives."
          disabled={disabled || active}
          rows={3}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={
              disabled ||
              active ||
              !text.trim() ||
              !valid ||
              !models.some((model) => model.available !== false)
            }
            onClick={start}
          >
            <Play />
            Compare models
          </Button>
          {active && (
            <Button type="button" size="sm" variant="outline" onClick={() => stop()}>
              <Square />
              Stop all
            </Button>
          )}
          <span className="ms-auto self-center text-xs text-muted-foreground">
            {models.length} models
          </span>
        </div>
        {!valid && (
          <p role="alert" className="text-xs text-destructive">
            Supply 1–12 models with unique IDs.
          </p>
        )}
      </div>
      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        {models.map((model) => {
          const run = runs.find((run) => run.modelId === model.id)
          return (
            <article
              key={model.id}
              aria-label={`${model.name} response`}
              className="min-w-0 overflow-hidden rounded-xl border bg-background"
            >
              <header className="flex flex-wrap items-center gap-2 border-b p-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">{model.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{model.provider}</p>
                </div>
                <span role="status" className="text-[10px] capitalize text-muted-foreground">
                  {model.available === false ? 'Unavailable' : (run?.status ?? 'Ready')}
                </span>
                {(run?.status === 'running' || run?.status === 'queued') && (
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Stop ${model.name}`}
                    onClick={() => stop(model.id)}
                  >
                    <Square />
                  </Button>
                )}
                {run?.status === 'error' && !active && (
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Retry ${model.name}`}
                    disabled={disabled}
                    onClick={() => {
                      cancelled.current.delete(model.id)
                      patch(
                        model.id,
                        { text: '', error: undefined, status: 'queued' },
                        generation.current,
                      )
                      void execute(model, generation.current, runPrompt.current)
                    }}
                  >
                    <RotateCcw />
                  </Button>
                )}
              </header>
              <div className="max-h-96 min-h-36 overflow-auto p-4">
                {run ? (
                  (renderResponse?.(run) ?? (
                    <StreamingMarkdown
                      content={run.text ?? ''}
                      streaming={run.status === 'running'}
                      textAnimation={
                        run.status === 'cancelled' || run.status === 'error'
                          ? 'none'
                          : textAnimation
                      }
                      charactersPerSecond={charactersPerSecond}
                    />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Run a prompt to see this response.
                  </p>
                )}
                {run?.error && (
                  <p role="alert" className="mt-3 text-xs text-destructive">
                    {run.error}
                  </p>
                )}
              </div>
              {run && (
                <footer className="flex flex-wrap items-center gap-3 border-t px-3 py-2 text-[10px] tabular-nums text-muted-foreground">
                  {run.durationMs !== undefined && (
                    <span>{run.durationMs.toLocaleString()} ms</span>
                  )}
                  {run.inputTokens !== undefined && (
                    <span>{run.inputTokens.toLocaleString()} input tokens</span>
                  )}
                  {run.outputTokens !== undefined && (
                    <span>{run.outputTokens.toLocaleString()} output tokens</span>
                  )}
                  {run.cost && <span>{run.cost}</span>}
                  {onVote && run.status === 'complete' && (
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      className="ms-auto"
                      onClick={() => onVote(model.id)}
                    >
                      <ThumbsUp />
                      Prefer this
                    </Button>
                  )}
                </footer>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
