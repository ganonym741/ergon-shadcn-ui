import {
  Citations,
  CitationReference,
  CitationsList,
  type CitationSource,
} from '@/components/ui/citations'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { citationData } from '../product-data'
import { DemoNote, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    sources = parseData(v, 'data', citationData) as CitationSource[]
  return (
    <div className="w-full space-y-4">
      <DemoNote>
        Sources are supplied by the application. One link opens the real ErgonUI documentation; the
        document excerpt is fictional and has no attached file.
      </DemoNote>
      <Citations
        sources={sources}
        defaultExpanded={!!v.expanded}
        onSourceOpen={(source) => report(props, 'source-open', source.id)}
      >
        {v.inline ? (
          <div className="space-y-4 rounded-xl border bg-background p-4">
            <p className="text-sm leading-7">
              A clear visual hierarchy makes the next useful action easier to find.
              {sources[0] && <CitationReference sourceId={sources[0].id} />}Keep supporting details
              close to the task.{sources[1] && <CitationReference sourceId={sources[1].id} />}
            </p>
            <CitationsList />
          </div>
        ) : undefined}
      </Citations>
    </div>
  )
}
