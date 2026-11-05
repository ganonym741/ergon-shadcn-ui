import * as React from 'react'
import { TagsInput } from '@/components/ui/tags-input'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { report, simulate } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [tags, setTags] = React.useState(parseData<string[]>(v, 'data', [])),
    suggestions = parseData<string[]>(v, 'suggestions', []),
    search = React.useCallback(
      async (query: string, signal: AbortSignal) => {
        await simulate(signal, !!v.failure)
        return suggestions.filter((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      },
      [v.suggestions, v.failure],
    )
  return (
    <div className="w-full max-w-xl space-y-4">
      <TagsInput
        value={tags}
        onValueChange={(value) => {
          setTags(value)
          report(props, 'tags-change', value)
        }}
        label="Project tags"
        placeholder="Add tags…"
        suggestions={suggestions}
        onSearch={v.async ? search : undefined}
        maxTags={Number(v.maxTags)}
        allowDuplicates={!!v.duplicates}
        createOnBlur={!!v.createOnBlur}
        validateTag={
          v.validate
            ? (tag) => (tag.length < 3 ? 'Use at least three characters.' : undefined)
            : undefined
        }
        onInvalidTag={(tag, message) => report(props, 'invalid-tag', { tag, message })}
        disabled={!!v.disabled}
        readOnly={!!v.readOnly}
        name="tags"
      />
      <p className="text-xs text-muted-foreground">
        Paste comma-separated tags. Use Backspace to focus a chip, Alt + arrow keys to reorder, and
        Delete to remove it. Async suggestions are simulated.
      </p>
      <output dir="ltr" className="block rounded-lg bg-muted/40 p-3 text-left font-mono text-xs">
        {JSON.stringify(tags)}
      </output>
    </div>
  )
}
