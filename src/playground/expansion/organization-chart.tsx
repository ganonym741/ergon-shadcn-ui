import { OrganizationChart, type OrganizationNode } from '@/components/ui/organization-chart'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { organizationData } from '../expansion-data'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-muted-foreground">
        Drag the dotted background to pan, or focus the canvas and use arrow keys. Navigate people
        with tree arrow keys, select with Enter, and expand with Right.
      </p>
      <OrganizationChart
        nodes={parseData(v, 'data', organizationData) as OrganizationNode[]}
        orientation={v.orientation as 'vertical' | 'horizontal'}
        height={Number(v.height)}
        disabled={!!v.disabled}
        onNodeSelect={(node) => report(props, 'person-select', node)}
        onCollapsedIdsChange={(value) => report(props, 'collapsed-people', value)}
        onZoomChange={(value) => report(props, 'zoom', value)}
        renderNode={
          v.customNode
            ? (node, state) => (
                <div className="space-y-2">
                  <span className="rounded bg-primary/10 px-2 py-1 text-[9px] uppercase tracking-wider text-primary">
                    {node.department ?? 'Team'}
                  </span>
                  <p className="pt-2 text-sm font-semibold">{node.name}</p>
                  <p className="text-xs text-muted-foreground">{node.role}</p>
                  {state.selected && <p className="text-[10px] text-primary">Selected profile</p>}
                </div>
              )
            : undefined
        }
      />
    </div>
  )
}
