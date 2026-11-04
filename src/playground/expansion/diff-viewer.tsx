import { DiffViewer } from '@/components/ui/diff-viewer'
import type { PreviewProps } from '../preview'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <DiffViewer
      before={String(v.before)}
      after={String(v.after)}
      beforeLabel="theme.before.ts"
      afterLabel="theme.after.ts"
      defaultMode={v.mode as 'split' | 'inline'}
      contextLines={Number(v.context)}
      ignoreWhitespace={!!v.ignoreWhitespace}
      wordHighlight={!!v.words}
      copyable={!!v.copy}
      maxCharacters={Number(v.maxChars)}
      onModeChange={(mode) => report(props, 'layout-change', mode)}
      onCopy={async (text, side) => {
        await navigator.clipboard.writeText(text)
        report(props, 'copy-diff', { side, text })
      }}
    />
  )
}
