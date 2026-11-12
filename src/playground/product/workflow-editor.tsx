import { WorkflowEditor, type WorkflowValue } from '@/components/ui/workflow-editor'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { workflowData } from '../product-data'
import { DemoNote, report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config
  return (
    <div className="w-full space-y-3">
      <DemoNote>
        Drag a step by its heading, or focus it and use the arrow keys. Choose an output, then an
        input to connect steps. This editor stores local graph data; it does not execute workflows.
      </DemoNote>
      <WorkflowEditor
        defaultValue={parseData(v, 'data', workflowData) as WorkflowValue}
        onValueChange={(value) => report(props, 'workflow-change', value)}
        onSelectionChange={(selection) => report(props, 'selection', selection)}
        allowCycles={!!v.allowCycles}
        snapGrid={+v.grid}
        height={+v.height}
        readOnly={!!v.readOnly}
        disabled={!!v.disabled}
        onBeforeConnect={
          v.reject
            ? (edge) =>
                edge.target === 'publish'
                  ? 'Simulated rule: delivery is temporarily paused.'
                  : undefined
            : undefined
        }
        renderNode={
          v.customNode
            ? (node) => (
                <div className="flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-content-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {node.label[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{node.label}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {node.type ?? 'Custom step'}
                    </p>
                  </div>
                </div>
              )
            : undefined
        }
      />
    </div>
  )
}
