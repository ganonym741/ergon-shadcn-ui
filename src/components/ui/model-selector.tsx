import * as React from 'react'
import { Check, ChevronsUpDown, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useControllableState } from '@/components/ui/util'
import type { ModelDescriptor, ModelCapability } from '@/components/ui/ai-model'
import { cn } from '@/lib/utils'
export type { ModelDescriptor, ModelCapability } from '@/components/ui/ai-model'
export interface ModelSelectorProps {
  models: ModelDescriptor[]
  value?: string
  defaultValue?: string
  onValueChange?: (id: string, model: ModelDescriptor) => void
  requiredCapabilities?: ModelCapability[]
  favorites?: string[]
  onFavoritesChange?: (ids: string[]) => void
  disabled?: boolean
  label?: string
  placeholder?: string
  className?: string
  renderModel?: (model: ModelDescriptor) => React.ReactNode
}
/** Provider-grouped, searchable selection over application-supplied model metadata. */
export function ModelSelector({
  models,
  value,
  defaultValue = '',
  onValueChange,
  requiredCapabilities = [],
  favorites = [],
  onFavoritesChange,
  disabled = false,
  label = 'Model',
  placeholder = 'Choose a model',
  className,
  renderModel,
}: ModelSelectorProps) {
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: (id) => {
      const model = models.find((model) => model.id === id)
      if (model) onValueChange?.(id, model)
    },
  })
  const [open, setOpen] = React.useState(false),
    [query, setQuery] = React.useState(''),
    id = React.useId()
  React.useEffect(() => {
    if (disabled) {
      setOpen(false)
      setQuery('')
    }
  }, [disabled])
  const valid =
    new Set(models.map((model) => model.id)).size === models.length &&
    models.every((model) => model.id && model.name && model.provider)
  const current = models.find((model) => model.id === selected),
    matches = models.filter((model) =>
      `${model.name} ${model.provider} ${model.description ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
  const allowed = (model: ModelDescriptor) =>
    model.available !== false &&
    requiredCapabilities.every((capability) => model.capabilities?.includes(capability))
  const choose = (model: ModelDescriptor) => {
    if (disabled || !allowed(model)) return
    setSelected(model.id)
    setOpen(false)
    setQuery('')
  }
  const groups = [...new Set(matches.map((model) => model.provider))]
  return (
    <div className={cn('min-w-0', className)} data-slot="model-selector">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            role="combobox"
            aria-haspopup="dialog"
            aria-label={label}
            aria-expanded={open}
            aria-controls={id}
            disabled={disabled || !valid}
            variant="outline"
            className="w-full justify-between"
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                setOpen(true)
              }
            }}
          >
            <Cpu className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-start">
              {current?.name ?? placeholder}
            </span>
            <ChevronsUpDown className="shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          id={id}
          aria-label={`${label} options`}
          align="start"
          className="w-[min(24rem,calc(100vw-2rem))] p-2"
        >
          <Input
            aria-label="Search models"
            value={query}
            onValueChange={setQuery}
            placeholder="Search models or providers…"
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                document
                  .getElementById(id)
                  ?.querySelector<HTMLButtonElement>('[data-model-option]:not(:disabled)')
                  ?.focus()
              }
            }}
            className="mb-2"
          />
          <div
            role="group"
            aria-label={label}
            className="max-h-80 space-y-2 overflow-auto"
            onKeyDown={(event) => {
              const options = [
                  ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
                    '[data-model-option]:not(:disabled)',
                  ),
                ],
                index = options.indexOf(document.activeElement as HTMLButtonElement)
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                options[
                  (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
                ]?.focus()
              } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault()
                ;(event.key === 'Home' ? options[0] : options.at(-1))?.focus()
              }
            }}
          >
            {groups.map((group) => (
              <div key={group} role="group" aria-label={group}>
                <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">{group}</p>
                {matches
                  .filter((model) => model.provider === group)
                  .sort(
                    (a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)),
                  )
                  .map((model) => (
                    <div key={model.id} className="flex items-start gap-1">
                      <button
                        type="button"
                        data-model-option
                        aria-label={`Select ${model.name}`}
                        aria-pressed={model.id === selected}
                        disabled={!allowed(model)}
                        onClick={() => choose(model)}
                        className="flex min-w-0 flex-1 items-start gap-2 rounded-lg p-2 text-start text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                      >
                        <span className="min-w-0 flex-1">
                          {renderModel ? (
                            renderModel(model)
                          ) : (
                            <>
                              <span className="block font-medium">{model.name}</span>
                              {model.description && (
                                <span className="block text-xs text-muted-foreground">
                                  {model.description}
                                </span>
                              )}
                              {model.capabilities?.length ? (
                                <span className="mt-1 flex flex-wrap gap-1">
                                  {model.capabilities.map((capability) => (
                                    <span
                                      key={capability}
                                      className="rounded border px-1 text-[10px] text-muted-foreground"
                                    >
                                      {capability}
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </>
                          )}
                        </span>
                        {model.id === selected && <Check className="mt-0.5 size-4 shrink-0" />}
                      </button>
                      {onFavoritesChange && (
                        <button
                          type="button"
                          aria-label={`${favorites.includes(model.id) ? 'Unfavorite' : 'Favorite'} ${model.name}`}
                          aria-pressed={favorites.includes(model.id)}
                          disabled={disabled}
                          className="mt-2 rounded px-2 py-1 text-sm focus-visible:outline-ring"
                          onClick={() =>
                            onFavoritesChange(
                              favorites.includes(model.id)
                                ? favorites.filter((id) => id !== model.id)
                                : [...favorites, model.id],
                            )
                          }
                        >
                          {favorites.includes(model.id) ? '★' : '☆'}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ))}
            {!matches.length && (
              <p role="status" className="p-5 text-center text-sm text-muted-foreground">
                No matching models.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {!valid && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          Models need unique IDs, names and providers.
        </p>
      )}
    </div>
  )
}
