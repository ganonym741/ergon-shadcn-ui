import * as React from 'react'
import { GenerationSettings, type GenerationParameters } from '@/components/ui/generation-settings'
import type { ModelDescriptor } from '@/components/ui/model-selector'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { modelData } from '../product-data'
import { DemoNote, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    models = parseData(v, 'models', modelData) as ModelDescriptor[],
    [selected, setSelected] = React.useState(String(v.model)),
    model = models.find((model) => model.id === selected) ?? models[0],
    [value, setValue] = React.useState(parseData(v, 'data', {}) as GenerationParameters)
  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <DemoNote>
        Fictional model capabilities control which settings are available. Blank overrides preserve
        provider defaults. Connect the returned parameters to your own request adapter.
      </DemoNote>
      <label className="block space-y-1 text-xs">
        Settings model
        <select
          aria-label="Settings model"
          className="h-9 w-full rounded-md border bg-background px-2"
          value={model?.id ?? ''}
          onChange={(event) => setSelected(event.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </label>
      {model ? (
        <GenerationSettings
          model={model}
          value={value}
          onValueChange={(next) => {
            setValue(next)
            report(props, 'generation-parameters', next)
          }}
          disabled={!!v.disabled}
          showSystemPrompt={!!v.system}
          presets={
            v.presets
              ? [
                  {
                    id: 'focused',
                    label: 'Focused',
                    value: { temperature: 0.2, topP: 0.8, maxOutputTokens: 1024 },
                  },
                  {
                    id: 'explore',
                    label: 'Exploratory',
                    value: { temperature: 1.2, topP: 0.95, maxOutputTokens: 4096 },
                  },
                ]
              : []
          }
        />
      ) : (
        <p role="alert" className="text-xs text-destructive">
          Add at least one model.
        </p>
      )}
    </div>
  )
}
