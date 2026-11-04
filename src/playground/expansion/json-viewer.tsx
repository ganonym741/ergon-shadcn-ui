import * as React from 'react'
import { JsonViewer } from '@/components/ui/json-viewer'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { jsonData } from '../expansion-data'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    value = React.useMemo(() => {
      const base = parseData<Record<string, unknown>>(v, 'data', jsonData)
      if (!v.extended) return base
      const result = {
        ...base,
        bigCount: 1234567890123456789n,
        createdAt: new Date('2026-11-03T00:00:00Z'),
        map: new Map<unknown, unknown>([
          [1, 'numeric key'],
          ['1', 'string key'],
        ]),
        cycle: null as unknown,
      }
      result.cycle = result
      return result
    }, [v.data, v.extended])
  return (
    <JsonViewer
      value={value}
      defaultExpandDepth={Number(v.depth)}
      pageSize={Number(v.pageSize)}
      maxNodes={Number(v.maxNodes)}
      maxDepth={Number(v.maxDepth)}
      maxStringLength={Number(v.maxString)}
      searchable={!!v.search}
      copyable={!!v.copy}
      renderValue={
        v.customValue
          ? (value) =>
              typeof value === 'boolean' ? (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 font-sans text-[10px] text-primary">
                  {value ? 'Enabled' : 'Disabled'}
                </span>
              ) : undefined
          : undefined
      }
      onCopy={async (text, kind, path) => {
        await navigator.clipboard.writeText(text)
        report(props, `copy-${kind}`, { path, text })
      }}
    />
  )
}
