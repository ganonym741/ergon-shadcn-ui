import * as React from 'react'
import { Input } from '@/components/ui/input'
import { useControllableState } from '@/components/ui/util'
import { colorChannels, channelsToHex, type ColorFormat } from '@/lib/color'
export function ColorPicker({
  value,
  defaultValue = '#e66043',
  onValueChange,
  presets = ['#e66043', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#18181b'],
  disabled,
  allowAlpha = false,
  format: controlledFormat,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (color: string) => void
  presets?: string[]
  disabled?: boolean
  allowAlpha?: boolean
  format?: ColorFormat
}) {
  const [color, setColor] = useControllableState({ value, defaultValue, onChange: onValueChange })
  const safe = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color) ? color : '#e66043'
  const [draft, setDraft] = React.useState(safe)
  const [internalFormat, setFormat] = React.useState<ColorFormat>(controlledFormat ?? 'hex'),
    format = internalFormat
  React.useEffect(() => setDraft(safe), [safe])
  const alpha = safe.length === 9 ? parseInt(safe.slice(7, 9), 16) / 255 : 1
  return (
    <div className="inline-flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          aria-label="Choose a color"
          type="color"
          className="h-9 w-10 cursor-pointer rounded border bg-transparent p-1"
          value={safe.slice(0, 7)}
          disabled={disabled}
          onChange={(e) =>
            setColor(e.target.value + (allowAlpha && alpha < 1 ? safe.slice(7) : ''))
          }
        />
        {format === 'hex' ? (
          <Input
            aria-label="Hex color"
            className="w-32 font-mono"
            value={draft}
            disabled={disabled}
            onChange={(e) => {
              setDraft(e.target.value)
              if (
                (allowAlpha ? /^#[0-9a-f]{6}([0-9a-f]{2})?$/ : /^#[0-9a-f]{6}$/).test(
                  e.target.value.toLowerCase(),
                )
              )
                setColor(e.target.value)
            }}
            onBlur={() => setDraft(safe)}
          />
        ) : (
          <div className="flex gap-1">
            {colorChannels(safe, format).map((channel, index) => (
              <Input
                key={index}
                aria-label={`${format.toUpperCase()} ${index + 1}`}
                type="number"
                className="w-16 px-2"
                value={Math.round(channel)}
                min={0}
                max={format === 'rgb' ? 255 : index === 0 ? 360 : 100}
                disabled={disabled}
                onChange={(e) => {
                  const channels = colorChannels(safe, format)
                  channels[index] = Number(e.target.value)
                  setColor(
                    channelsToHex(channels, format) +
                      (allowAlpha && alpha < 1 ? safe.slice(7) : ''),
                  )
                }}
              />
            ))}
          </div>
        )}
        <select
          aria-label="Color display format"
          className="h-9 rounded border bg-background px-2 text-xs"
          value={format}
          onChange={(e) => setFormat(e.target.value as ColorFormat)}
        >
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
          <option value="hsb">HSB</option>
        </select>
      </div>
      {allowAlpha && (
        <label className="flex items-center gap-3 text-xs text-muted-foreground">
          Opacity
          <input
            type="range"
            aria-label="Color opacity"
            min={0}
            max={100}
            value={Math.round(alpha * 100)}
            disabled={disabled}
            onChange={(e) =>
              setColor(
                safe.slice(0, 7) +
                  Math.round(Number(e.target.value) * 2.55)
                    .toString(16)
                    .padStart(2, '0'),
              )
            }
            className="min-w-20 flex-1 accent-primary"
          />
          <span className="w-8 text-right">{Math.round(alpha * 100)}%</span>
        </label>
      )}
      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            aria-label={`Use ${p}`}
            aria-pressed={p === safe}
            onClick={() => setColor(p)}
            className="size-5 rounded-full border-2 border-background shadow-sm outline-offset-2 aria-pressed:outline-2 aria-pressed:outline-ring"
            style={{ background: p }}
          />
        ))}
      </div>
    </div>
  )
}
export interface GradientValue {
  from: string
  to: string
  angle: number
  stops?: { color: string; position: number }[]
}
export function GradientPicker({
  value,
  defaultValue = { from: '#e66043', to: '#8b5cf6', angle: 120 },
  onValueChange,
  disabled,
}: {
  value?: GradientValue
  defaultValue?: GradientValue
  onValueChange?: (gradient: GradientValue) => void
  disabled?: boolean
}) {
  const [gradient, set] = useControllableState({ value, defaultValue, onChange: onValueChange })
  return (
    <div className="max-w-lg space-y-4">
      <div
        className="h-20 rounded-lg border"
        style={{
          background: `linear-gradient(${gradient.angle}deg,${
            gradient.stops?.length
              ? [...gradient.stops]
                  .sort((a, b) => a.position - b.position)
                  .map((stop) => `${stop.color} ${stop.position}%`)
                  .join(',')
              : `${gradient.from},${gradient.to}`
          })`,
        }}
      />
      {gradient.stops?.length ? (
        <div className="space-y-2">
          {gradient.stops.map((stop, index) => (
            <div key={index} className="flex flex-wrap items-center gap-3">
              <ColorPicker
                value={stop.color}
                disabled={disabled}
                onValueChange={(color) =>
                  set({
                    ...gradient,
                    stops: gradient.stops!.map((item, i) =>
                      i === index ? { ...item, color } : item,
                    ),
                  })
                }
                allowAlpha
              />
              <Input
                aria-label={`Stop ${index + 1} position`}
                className="w-20"
                type="number"
                min={0}
                max={100}
                value={stop.position}
                disabled={disabled}
                onValueChange={(value) =>
                  set({
                    ...gradient,
                    stops: gradient.stops!.map((item, i) =>
                      i === index
                        ? { ...item, position: Math.max(0, Math.min(100, Number(value))) }
                        : item,
                    ),
                  })
                }
              />
              <button
                disabled={disabled || gradient.stops!.length <= 2}
                className="text-xs text-destructive"
                onClick={() =>
                  set({ ...gradient, stops: gradient.stops!.filter((_, i) => i !== index) })
                }
              >
                Remove stop
              </button>
            </div>
          ))}
          <button
            disabled={disabled}
            className="text-xs text-primary"
            onClick={() =>
              set({ ...gradient, stops: [...gradient.stops!, { color: '#6976c5', position: 50 }] })
            }
          >
            Add stop
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          <ColorPicker
            value={gradient.from}
            onValueChange={(from) => set({ ...gradient, from })}
            allowAlpha
          />
          <ColorPicker
            value={gradient.to}
            onValueChange={(to) => set({ ...gradient, to })}
            allowAlpha
          />
        </div>
      )}
      <label className="flex items-center gap-3 text-xs text-muted-foreground">
        Angle
        <input
          aria-label="Gradient angle"
          type="range"
          min={0}
          max={360}
          value={gradient.angle}
          className="flex-1 accent-primary"
          onChange={(e) => set({ ...gradient, angle: Number(e.target.value) })}
        />
        {gradient.angle}°
      </label>
    </div>
  )
}
