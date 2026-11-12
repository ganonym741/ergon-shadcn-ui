import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import type { ChartProps } from '@/components/ui/chart'
import {
  GanttChart,
  validateGanttTasks,
  getGanttConflicts,
  type GanttTask,
} from '@/components/ui/gantt-chart'
const captured = vi.hoisted(() => ({ option: {} as any }))
vi.mock('@/components/ui/chart', async (original) => {
  const module = await original<typeof import('@/components/ui/chart')>()
  return {
    ...module,
    Chart: ({ option, children, label }: ChartProps) => {
      captured.option = option
      return <figure aria-label={label}>{children}</figure>
    },
    ChartCanvas: () => <div data-testid="schedule-canvas" />,
  }
})
const tasks: GanttTask[] = [
  { id: 'group', title: 'Release', type: 'group', start: '2026-11-02', end: '2026-11-10' },
  {
    id: 'design',
    parentId: 'group',
    title: 'Design',
    start: '2026-11-02',
    end: '2026-11-04',
    progress: 0,
  },
  {
    id: 'ship',
    parentId: 'group',
    title: 'Ship',
    type: 'milestone',
    start: '2026-11-06',
    dependsOn: ['design'],
  },
]
describe('Gantt scheduling', () => {
  it('validates real date keys, progress, parents and dependency cycles', () => {
    expect(validateGanttTasks(tasks)).toBeUndefined()
    expect(
      validateGanttTasks([{ ...tasks[1], parentId: undefined, start: '2026-02-30' }]),
    ).toContain('real')
    expect(validateGanttTasks([{ ...tasks[1], parentId: undefined, progress: 101 }])).toContain(
      'progress',
    )
    expect(
      validateGanttTasks([{ ...tasks[1], dependsOn: ['ship'] }, tasks[0], tasks[2]]),
    ).toContain('cycles')
    expect(validateGanttTasks([{ ...tasks[1], parentId: 'unknown' }])).toContain('parent')
  })
  it('reports inclusive finish-to-start conflicts without changing tasks', () => {
    const conflicting = [
      { id: 'a', title: 'A', start: '2026-11-02', end: '2026-11-04' },
      { id: 'b', title: 'B', start: '2026-11-04', dependsOn: ['a'] },
    ]
    expect(getGanttConflicts(conflicting)).toEqual([{ taskId: 'b', dependsOnId: 'a' }])
    expect(conflicting[1].start).toBe('2026-11-04')
  })
  it('builds only custom series, UTC ranges and visible dependency links', async () => {
    const user = userEvent.setup()
    render(<GanttChart label="Release schedule" data={tasks} zoom />)
    expect(captured.option.useUTC).toBe(true)
    expect(captured.option.series.map((series: any) => series.type)).toEqual(['custom', 'custom'])
    expect(captured.option.series[1].data).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Collapse groups' }))
    expect(captured.option.series[0].data).toHaveLength(1)
    expect(captured.option.series[1].data).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(captured.option.series[0].data).toHaveLength(3)
  })
  it('edits schedule dates through a keyboard-accessible form and updates controlled data', async () => {
    const user = userEvent.setup(),
      change = vi.fn()
    function Harness() {
      const [data, setData] = React.useState(tasks)
      return (
        <GanttChart
          label="Schedule"
          data={data}
          editable
          onTasksChange={setData}
          onTaskChange={change}
        />
      )
    }
    render(<Harness />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Select task' }), 'design')
    await user.click(screen.getByRole('button', { name: 'Edit task' }))
    fireEvent.change(screen.getByLabelText('End'), { target: { value: '2026-11-05' } })
    await user.click(screen.getByRole('button', { name: 'Save task' }))
    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'design', end: '2026-11-05', progress: 0 }),
      expect.objectContaining({ end: '2026-11-04' }),
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(captured.option.series[0].data.find((row: any) => row.id === 'design').value[2]).toBe(
      Date.parse('2026-11-06'),
    )
  })
  it('escapes data when native options explicitly select an HTML tooltip', () => {
    render(
      <GanttChart
        label="Untrusted names"
        data={[{ id: 'x', title: '<img src=x onerror=alert(1)>', start: '2026-11-03' }]}
        option={{ tooltip: { renderMode: 'html' } }}
      />,
    )
    const tooltip = captured.option.tooltip.formatter({ dataIndex: 0, seriesIndex: 0 })
    expect(tooltip).toContain('&lt;img')
    expect(tooltip).not.toContain('<img')
  })
})
