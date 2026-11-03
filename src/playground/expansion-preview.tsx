import * as React from 'react'
import type { PreviewProps } from './preview'
const previews: Record<string, React.LazyExoticComponent<React.ComponentType<PreviewProps>>> = {}
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
