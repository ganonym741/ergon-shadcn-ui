import * as React from 'react'
import { StreamingMarkdown } from '@/components/ui/streaming-markdown'
import { CodeBlock } from '@/components/ui/code-block'
import { Button } from '@/components/ui/button'
import { clamp } from '@/components/ui/product-utils'
import type { PreviewProps } from '../preview'
import { DemoNote } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    source = String(v.content).slice(0, Math.floor(clamp(Number(v.maxChars), 100, 1000000))),
    [visible, setVisible] = React.useState(v.streaming ? '' : source),
    [restart, setRestart] = React.useState(0)
  React.useEffect(() => {
    if (!v.streaming) {
      setVisible(source)
      return
    }
    let index = 0
    setVisible('')
    const timer = setInterval(() => {
      index += Math.max(29, Math.ceil(source.length / 200))
      setVisible(source.slice(0, index))
      if (index >= source.length) clearInterval(timer)
    }, +v.delay)
    return () => clearInterval(timer)
  }, [v.streaming, v.delay, source, restart])
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        Simulated incremental text; no AI service is connected. Code highlighting loads only for a
        used grammar. Optional renderer callbacks below are illustrative, with no math or diagram
        engine installed.
      </DemoNote>
      {v.streaming && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setRestart((value) => value + 1)}
        >
          Restart stream
        </Button>
      )}
      <div className="rounded-xl border bg-background p-4 sm:p-6">
        {String(v.content).length > source.length && (
          <p role="status" className="mb-3 text-xs text-muted-foreground">
            Preview limited to {source.length.toLocaleString()} characters.
          </p>
        )}
        <StreamingMarkdown
          content={visible}
          streaming={!!v.streaming && visible.length < source.length}
          textAnimation={v.textAnimation as 'typewriter' | 'none'}
          charactersPerSecond={+v.charactersPerSecond}
          breaks={!!v.breaks}
          allowImages={!!v.images}
          maxCharacters={+v.maxChars}
          renderCode={
            v.customCode
              ? (code, language) => (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-primary">
                      Custom renderer · {language}
                    </p>
                    <CodeBlock code={code} language="text" lineNumbers={false} />
                  </div>
                )
              : undefined
          }
          renderMath={
            v.extensions
              ? (source) => (
                  <div className="rounded border bg-muted/40 p-4 font-mono text-xs">
                    Application math renderer: {source}
                  </div>
                )
              : undefined
          }
          renderDiagram={
            v.extensions
              ? (source) => (
                  <div className="rounded border bg-muted/40 p-4 font-mono text-xs">
                    Application diagram renderer: {source}
                  </div>
                )
              : undefined
          }
        />
      </div>
    </div>
  )
}
