import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockContent,
  type CodeLanguage,
} from '@/components/ui/code-block'
import type { PreviewProps } from '../preview'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <CodeBlock
      code={String(v.code)}
      language={v.language as CodeLanguage}
      filename={String(v.filename)}
      lineNumbers={!!v.lineNumbers}
      startLine={Number(v.startLine)}
      highlightedLines={String(v.highlight).split(',').map(Number).filter(Number.isFinite)}
      defaultWrap={!!v.wrap}
      copyable={!!v.copy}
      downloadable={!!v.download}
      onWrapChange={(wrap) => report(props, 'wrap', wrap)}
      onCopy={async (code) => {
        await navigator.clipboard.writeText(code)
        report(props, 'copy-code', code)
      }}
    >
      {v.customHeader ? (
        <>
          <CodeBlockHeader className="bg-primary/5" />
          <div className="border-b px-4 py-2 text-xs text-primary">
            Composable header and code surface
          </div>
          <CodeBlockContent />
        </>
      ) : undefined}
    </CodeBlock>
  )
}
