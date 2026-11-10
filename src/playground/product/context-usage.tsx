import { ContextUsage } from '@/components/ui/context-usage'
import type { PreviewProps } from '../preview'
import { DemoNote } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <div className="mx-auto w-full max-w-lg space-y-3">
      <DemoNote>
        All counts and costs are editable sample values. Cached input is part of input; reasoning
        output is part of output. ErgonUI does not estimate tokens or fetch model prices.
      </DemoNote>
      <ContextUsage
        inputTokens={+v.input}
        outputTokens={+v.output}
        cachedInputTokens={+v.cached}
        reasoningTokens={+v.reasoning}
        contextWindow={+v.window}
        cost={v.cost ? +v.amount / 100 : undefined}
        currency={String(v.currency)}
        label={String(v.label)}
      />
    </div>
  )
}
