import { ModelComparison } from '@/components/ui/model-comparison'
import type { ModelDescriptor } from '@/components/ui/model-selector'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { modelData } from '../product-data'
import { DemoNote, simulate, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  const models = parseData(v, 'data', modelData.slice(0, 3)) as ModelDescriptor[]
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        These fictional models return original simulated text. No provider is contacted, and no
        token counts or prices are invented. Elapsed time measures this local simulation.
      </DemoNote>
      <ModelComparison
        models={models}
        defaultPrompt={String(v.prompt)}
        concurrency={+v.concurrency}
        disabled={!!v.disabled}
        textAnimation={v.textAnimation as 'typewriter' | 'none'}
        charactersPerSecond={+v.charactersPerSecond}
        onVote={v.votes ? (id) => report(props, 'preferred-model', id) : undefined}
        onRunsChange={(runs) =>
          report(
            props,
            'comparison-state',
            runs.map((run) => ({ id: run.modelId, status: run.status })),
          )
        }
        onGenerate={async ({ model, prompt }, { signal, onDelta }) => {
          const chunks =
            model.id === 'small'
              ? [
                  '1. Choose one primary action.\n',
                  '2. Group related controls.\n',
                  '3. Keep feedback close to the task.',
                ]
              : [
                  '### Make the next step clear\n\n',
                  'Start with one primary action and a quieter supporting layout.\n\n',
                  '- **Hierarchy:** give the current task a clear place.\n',
                  '- **Rhythm:** group related details with consistent spacing.\n',
                  '- **Feedback:** show progress without interrupting the flow.',
                ]
          for (const chunk of chunks) {
            await simulate(signal, !!v.failure && model.id === (models[1] ?? models[0])?.id)
            if (v.stream) onDelta(chunk)
          }
          report(props, 'simulated-generation', { model: model.id, prompt })
          return v.stream ? {} : { text: chunks.join('') }
        }}
      />
    </div>
  )
}
