import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useControllableState } from '@/components/ui/util'
import { clamp } from '@/components/ui/product-utils'
import type { GenerationParameters, ModelDescriptor } from '@/components/ui/ai-model'
import { cn } from '@/lib/utils'
export type { GenerationParameters } from '@/components/ui/ai-model'
export interface GenerationSettingsProps {
  model: ModelDescriptor
  value?: GenerationParameters
  defaultValue?: GenerationParameters
  onValueChange?: (value: GenerationParameters) => void
  disabled?: boolean
  className?: string
  presets?: { id: string; label: string; value: GenerationParameters }[]
  showSystemPrompt?: boolean
}
/** Filters overrides against supplied model capabilities; never sends requests or assumes provider support. */
export function normalizeGenerationParameters(
  value: GenerationParameters,
  model: ModelDescriptor,
): GenerationParameters {
  const p = model.parameters ?? {},
    next: GenerationParameters = {}
  if (p.temperature && Number.isFinite(value.temperature))
    next.temperature = clamp(value.temperature!, p.temperature.min, p.temperature.max)
  if (p.topP && Number.isFinite(value.topP)) next.topP = clamp(value.topP!, 0, 1)
  if (p.seed && Number.isFinite(value.seed))
    next.seed = Math.floor(clamp(value.seed!, -2147483648, 2147483647))
  if (
    model.maxOutputTokens !== undefined &&
    Number.isFinite(model.maxOutputTokens) &&
    model.maxOutputTokens > 0 &&
    Number.isFinite(value.maxOutputTokens)
  )
    next.maxOutputTokens = Math.floor(
      clamp(value.maxOutputTokens!, 1, model.maxOutputTokens ?? model.contextWindow ?? 128000),
    )
  if (value.responseFormat && p.responseFormats?.includes(value.responseFormat))
    next.responseFormat = value.responseFormat
  if (value.systemPrompt) next.systemPrompt = value.systemPrompt
  if (p.stop && value.stop?.length) next.stop = value.stop.filter(Boolean).slice(0, 8)
  return next
}
export function GenerationSettings({
  model,
  value,
  defaultValue = {},
  onValueChange,
  disabled = false,
  className,
  presets = [],
  showSystemPrompt = true,
}: GenerationSettingsProps) {
  const [settings, setSettings] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    }),
    id = React.useId(),
    limits = model.parameters ?? {}
  const current = normalizeGenerationParameters(settings, model)
  const update = (key: keyof GenerationParameters, next: unknown) =>
    setSettings(normalizeGenerationParameters({ ...current, [key]: next }, model))
  const numeric = (
    label: string,
    key: 'temperature' | 'topP' | 'maxOutputTokens' | 'seed',
    min: number,
    max: number,
    step: number,
  ) => (
    <label className="block space-y-1.5 text-xs" htmlFor={`${id}-${key}`} key={key}>
      <span className="font-medium">{label}</span>
      <GenerationNumericInput
        id={`${id}-${key}`}
        dir="ltr"
        min={min}
        max={max}
        step={step}
        placeholder="Provider default"
        value={current[key]}
        disabled={disabled}
        onValueChange={(value) => update(key, value)}
      />
    </label>
  )
  return (
    <section
      data-slot="generation-settings"
      aria-label={`Generation settings for ${model.name}`}
      className={cn('w-full min-w-0 space-y-4 rounded-xl border bg-background p-4', className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Generation settings</h3>
          <p className="text-xs text-muted-foreground">{model.name} · supported parameters only</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Reset generation settings"
          disabled={disabled}
          onClick={() => setSettings({})}
        >
          <RotateCcw />
        </Button>
      </div>
      {presets.length > 0 && (
        <select
          aria-label="Generation preset"
          value=""
          disabled={disabled}
          onChange={(event) => {
            const preset = presets.find((p) => p.id === event.target.value)
            if (preset) setSettings(normalizeGenerationParameters(preset.value, model))
          }}
          className="h-9 w-full rounded-md border bg-background px-2 text-sm"
        >
          <option value="">Choose a preset…</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {limits.temperature &&
          numeric(
            'Temperature',
            'temperature',
            limits.temperature.min,
            limits.temperature.max,
            limits.temperature.step ?? 0.1,
          )}
        {limits.topP && numeric('Top P', 'topP', 0, 1, 0.05)}
        {model.maxOutputTokens !== undefined &&
          model.maxOutputTokens > 0 &&
          numeric(
            'Maximum output tokens',
            'maxOutputTokens',
            1,
            model.maxOutputTokens ?? model.contextWindow ?? 128000,
            1,
          )}
        {limits.seed && numeric('Seed', 'seed', -2147483648, 2147483647, 1)}
      </div>
      {limits.responseFormats?.length ? (
        <label className="block space-y-1.5 text-xs">
          <span className="font-medium">Response format</span>
          <select
            aria-label="Response format"
            value={current.responseFormat ?? ''}
            disabled={disabled}
            onChange={(event) => update('responseFormat', event.target.value || undefined)}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Provider default</option>
            {limits.responseFormats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {showSystemPrompt && (
        <label className="block space-y-1.5 text-xs">
          <span className="font-medium">System instructions</span>
          <Textarea
            aria-label="System instructions"
            disabled={disabled}
            value={current.systemPrompt ?? ''}
            onChange={(event) => update('systemPrompt', event.target.value)}
            rows={3}
          />
        </label>
      )}
      {limits.stop && (
        <label className="block space-y-1.5 text-xs">
          <span className="font-medium">Stop sequences (one per line)</span>
          <GenerationStopSequences
            value={current.stop}
            disabled={disabled}
            onChange={(value) => update('stop', value)}
          />
        </label>
      )}
    </section>
  )
}
/** Keeps partially typed lines intact; apply stop sequences when the field loses focus. */
function GenerationStopSequences({
  value,
  disabled,
  onChange,
}: {
  value?: string[]
  disabled: boolean
  onChange: (value: string[]) => void
}) {
  const serialized = value?.join('\n') ?? '',
    [draft, setDraft] = React.useState(serialized)
  React.useEffect(() => setDraft(serialized), [serialized])
  return (
    <Textarea
      aria-label="Stop sequences"
      dir="ltr"
      disabled={disabled}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = draft.split(/\r?\n/).filter(Boolean).slice(0, 8)
        setDraft(next.join('\n'))
        onChange(next)
      }}
      rows={2}
    />
  )
}
/** Keeps decimal punctuation editable while publishing finite numeric overrides. */
function GenerationNumericInput({
  value,
  onValueChange,
  min,
  max,
  step,
  ...props
}: {
  value?: number
  onValueChange: (value: number | undefined) => void
  min: number
  max: number
  step: number
  id: string
  dir: string
  placeholder: string
  disabled: boolean
}) {
  const [draft, setDraft] = React.useState(String(value ?? ''))
  React.useLayoutEffect(() => {
    const parsed = draft.trim() ? Number(draft) : undefined
    if (!Object.is(value, parsed)) setDraft(String(value ?? ''))
  }, [value])
  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      value={draft}
      onValueChange={(text) => {
        setDraft(text)
        if (!text.trim()) onValueChange(undefined)
        else if (Number.isFinite(Number(text))) onValueChange(Number(text))
      }}
      onBlur={() => setDraft(String(value ?? ''))}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
        event.preventDefault()
        const next = clamp(
          Number(((value ?? 0) + (event.key === 'ArrowUp' ? step : -step)).toPrecision(15)),
          min,
          max,
        )
        setDraft(String(next))
        onValueChange(next)
      }}
    />
  )
}
