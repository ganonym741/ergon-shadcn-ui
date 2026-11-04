import * as React from 'react'
import type { PreviewProps } from './preview'
const previews: Record<string, React.LazyExoticComponent<React.ComponentType<PreviewProps>>> = {
  kanban: React.lazy(() => import('./expansion/kanban')),
  'calendar-plus': React.lazy(() => import('./expansion/calendar-plus')),
  'gantt-chart': React.lazy(() => import('./expansion/gantt-chart')),
  'filter-builder': React.lazy(() => import('./expansion/filter-builder')),
  'file-browser': React.lazy(() => import('./expansion/file-browser')),
  'image-cropper': React.lazy(() => import('./expansion/image-cropper')),
  'command-palette': React.lazy(() => import('./expansion/command-palette')),
  'tags-input': React.lazy(() => import('./expansion/tags-input')),
  'phone-input': React.lazy(() => import('./expansion/phone-input')),
}
/** Loads one interactive example and its own dependency graph at a time. */
class DataBoundary extends React.Component<{ children: React.ReactNode }, { error: string }> {
  state = { error: '' }
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
  render() {
    return this.state.error ? (
      <p
        role="alert"
        className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
      >
        Check the custom data against the usage example: {this.state.error}
      </p>
    ) : (
      this.props.children
    )
  }
}
export default function ExpansionPreview(props: PreviewProps) {
  const Preview = previews[props.id],
    key = JSON.stringify(props.config)
  return (
    <DataBoundary key={key}>
      <React.Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading component…</p>}
      >
        <Preview {...props} />
      </React.Suspense>
    </DataBoundary>
  )
}
