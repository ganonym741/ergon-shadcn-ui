import * as React from 'react'
import {
  ModelSelector,
  type ModelDescriptor,
  type ModelCapability,
} from '@/components/ui/model-selector'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { modelData } from '../product-data'
import { DemoNote, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [value, setValue] = React.useState(String(v.value)),
    [favorites, setFavorites] = React.useState(['balanced'])
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <DemoNote>
        Fictional model metadata demonstrates provider grouping, search, capabilities, availability
        and favorites. Selecting a model makes no network request.
      </DemoNote>
      <ModelSelector
        models={parseData(v, 'data', modelData) as ModelDescriptor[]}
        value={value}
        onValueChange={(id, model) => {
          setValue(id)
          report(props, 'model-selected', { id, capabilities: model.capabilities })
        }}
        requiredCapabilities={v.required === 'none' ? [] : [v.required as ModelCapability]}
        favorites={favorites}
        onFavoritesChange={
          v.favorites
            ? (next) => {
                setFavorites(next)
                report(props, 'favorites', next)
              }
            : undefined
        }
        disabled={!!v.disabled}
        renderModel={
          v.custom
            ? (model) => (
                <span className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/10 p-2 text-xs font-semibold text-primary">
                    {model.name[0]}
                  </span>
                  <span>
                    <span className="block text-xs font-medium">{model.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {model.contextWindow?.toLocaleString() ?? '—'} token context
                    </span>
                  </span>
                </span>
              )
            : undefined
        }
      />
      <p role="status" className="text-xs text-muted-foreground">
        Selected model ID: <code>{value}</code>
      </p>
    </div>
  )
}
