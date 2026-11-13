import * as React from 'react'
import { GanttChart, type GanttTask } from '@/components/ui/gantt-chart'
import { parseData } from '../schema'
import type { PreviewProps } from '../preview'
import { ganttData } from '../expansion-data'
import { report } from './shared'
export default function Preview(props: PreviewProps) {
  const v = props.config,
    [tasks, setTasks] = React.useState(parseData(v, 'data', ganttData) as GanttTask[])
  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-muted-foreground">
        Select a task to edit dates and progress. Group ranges are supplied by the application;
        dependency conflicts are reported without automatic rescheduling.
      </p>
      <GanttChart
        label="Product launch schedule"
        data={tasks}
        defaultScale={v.scale as 'day' | 'week' | 'month'}
        editable={!!v.editable}
        zoom={!!v.zoom}
        showDependencies={!!v.dependencies}
        showProgress={!!v.progress}
        showDataTable={!!v.table}
        showTooltip={!!v.tooltip}
        renderer={v.renderer as 'svg' | 'canvas'}
        theme={v.theme as 'auto' | 'light' | 'dark'}
        animated={!!v.animated}
        barColor={String(v.color)}
        onTasksChange={(next) => {
          setTasks(next)
          report(props, 'tasks-change', next)
        }}
        onTaskSelect={(task) => report(props, 'task-select', task)}
        onTaskChange={(task, previous) => report(props, 'task-edit', { task, previous })}
        onScaleChange={(value) => report(props, 'scale-change', value)}
        onCollapsedIdsChange={(value) => report(props, 'collapsed-groups', value)}
      />
    </div>
  )
}
