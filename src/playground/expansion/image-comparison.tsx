import * as React from 'react'
import { ImageComparison } from '@/components/ui/image-comparison'
import type { PreviewProps } from '../preview'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [value, setValue] = React.useState(Number(v.value))
  return (
    <div className="w-full max-w-2xl space-y-3">
      <ImageComparison
        before={{
          src: String(v.before),
          alt: 'Landscape before color grading',
          label: String(v.beforeLabel),
        }}
        after={{
          src: String(v.after),
          alt: 'Landscape after color grading',
          label: String(v.afterLabel),
        }}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          report(props, 'divider-change', next)
        }}
        orientation={v.orientation as 'horizontal' | 'vertical'}
        aspectRatio={Number(v.aspect) / 10}
        disabled={!!v.disabled}
      />
      <p className="text-center text-xs text-muted-foreground">
        {Math.round(value)}% before · Use arrow keys, Home or End on the divider.
      </p>
    </div>
  )
}
