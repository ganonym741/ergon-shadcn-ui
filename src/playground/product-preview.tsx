import * as React from 'react'
import type { PreviewProps } from './preview'
const previews: Record<string, React.LazyExoticComponent<React.ComponentType<PreviewProps>>> = {
  'workflow-editor': React.lazy(() => import('./product/workflow-editor')),
  'pdf-viewer': React.lazy(() => import('./product/pdf-viewer')),
  'signature-pad': React.lazy(() => import('./product/signature-pad')),
  'notification-inbox': React.lazy(() => import('./product/notification-inbox')),
  presence: React.lazy(() => import('./product/presence')),
  'upload-plus': React.lazy(() => import('./product/upload-plus')),
  conversation: React.lazy(() => import('./product/conversation')),
  'chat-message': React.lazy(() => import('./product/chat-message')),
  'prompt-composer': React.lazy(() => import('./product/prompt-composer')),
  'streaming-markdown': React.lazy(() => import('./product/streaming-markdown')),
  'conversation-history': React.lazy(() => import('./product/conversation-history')),
  'model-selector': React.lazy(() => import('./product/model-selector')),
  citations: React.lazy(() => import('./product/citations')),
  'tool-call': React.lazy(() => import('./product/tool-call')),
  'agent-run-trace': React.lazy(() => import('./product/agent-run-trace')),
  'approval-request': React.lazy(() => import('./product/approval-request')),
  'artifact-panel': React.lazy(() => import('./product/artifact-panel')),
  'context-usage': React.lazy(() => import('./product/context-usage')),
  'generation-settings': React.lazy(() => import('./product/generation-settings')),
  'model-comparison': React.lazy(() => import('./product/model-comparison')),
  'voice-conversation': React.lazy(() => import('./product/voice-conversation')),
}
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
/** Independent lazy boundaries keep PDF.js, Markdown and other dependency graphs out of unrelated examples. */
export default function ProductPreview(props: PreviewProps) {
  const Preview = previews[props.id]
  return (
    <DataBoundary key={JSON.stringify(props.config)}>
      <React.Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading component…</p>}
      >
        <Preview {...props} />
      </React.Suspense>
    </DataBoundary>
  )
}
