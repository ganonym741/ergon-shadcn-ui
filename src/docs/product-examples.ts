/** Installable, framework-neutral source examples; service endpoints below are supplied by the consuming application. */
export const productExamples: Record<string, string> = {
  'workflow-editor': `import { WorkflowEditor, type WorkflowValue } from "@/components/ui/workflow-editor"
import { useState } from "react"

export function Workflow() {
  const [graph, setGraph] = useState<WorkflowValue>({
    nodes: [
      { id: "start", label: "Start", x: 30, y: 80, inputs: [] },
      { id: "review", label: "Review", x: 340, y: 80 },
    ],
    edges: [{ id: "start-review", source: "start", sourcePort: "out", target: "review", targetPort: "in" }],
  })
  return <WorkflowEditor value={graph} onValueChange={setGraph} allowCycles={false} />
}
// Named parts: WorkflowToolbar, WorkflowCanvas, WorkflowNodeCard.
// Node execution and persistence belong to your application.`,
  'pdf-viewer': `import { PDFViewer } from "@/components/ui/pdf-viewer"

<PDFViewer source="/documents/guide.pdf" workerSrc="/pdf.worker.min.mjs"
  showThumbnails searchable textLayer onPageChange={page => console.log(page)} />

// Serve your own PDF at /documents/guide.pdf or change source to an existing PDF URL.
// Host node_modules/pdfjs-dist/build/pdf.worker.min.mjs at the configured URL.
// The worker must match the installed pdfjs-dist version (6.5.438).
// Vite alternative: import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
// Other bundlers can emit this worker as an asset or serve it from their public directory.
// Pass documentOptions.standardFontDataUrl / wasmUrl when your documents require those PDF.js assets.
// Named parts: PDFViewerToolbar, PDFViewerPage, PDFViewerThumbnails, PDFViewerSearchResults.`,
  'signature-pad': `import { SignaturePad } from "@/components/ui/signature-pad"

<SignaturePad defaultValue={[]} color="#5579bd" penWidth={3} format="png"
  onValueChange={strokes => console.log(strokes)}
  onExport={async (blob, format) => {
    // Store the image using your own upload function, or offer a download.
    console.log(format, blob.size)
  }} />
// Use value + onValueChange for controlled strokes.
// Named parts: SignaturePadCanvas, SignaturePadToolbar.`,
  'notification-inbox': `import { NotificationInbox } from "@/components/ui/notification-inbox"

<NotificationInbox defaultItems={[
  { id: "review", title: "Ready for review", createdAt: "2026-11-04T09:00:00Z", read: false },
]} onAction={async (item, action, { signal }) => {
  // Replace with your application's persistence API.
  const response = await fetch("/api/notifications/" + encodeURIComponent(item.id), {
    method: "PATCH", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
  })
  if (!response.ok) throw new Error("Could not update the notification")
}} />
// Named parts: NotificationInboxHeader, NotificationInboxList, NotificationInboxItem.`,
  presence: `import { Presence, PresenceAvatars, PresenceCanvas, PresenceTyping } from "@/components/ui/presence"

<Presence users={[
  { id: "you", name: "You", status: "online" },
  { id: "maya", name: "Maya", status: "online", typing: true, cursor: { x: 0.4, y: 0.6 } },
]} currentUserId="you" connection="online" onCursorChange={point => console.log(point)}>
  <PresenceAvatars />
  <PresenceCanvas className="min-h-64">Your shared content</PresenceCanvas>
  <PresenceTyping />
</Presence>
// Publish cursor updates and supply remote users through your own realtime transport.`,
  'upload-plus': `import { UploadPlus, type UploadTransport } from "@/components/ui/upload-plus"

// Implement your upload service. Each accepted part returns a durable { index, token } receipt.
const transport: UploadTransport = {
  async uploadPart(chunk, { id, file, index, totalParts, signal, onProgress }) {
    const response = await fetch("/api/uploads/" + id + "/parts/" + index + "?total=" + totalParts, {
      method: "PUT", body: chunk, signal, headers: { "X-File-Name": encodeURIComponent(file.name) },
    })
    if (!response.ok) throw new Error("Chunk upload failed")
    onProgress(chunk.size)
    return { index, token: await response.text() }
  },
  async complete(parts, { id, signal }) {
    const response = await fetch("/api/uploads/" + id + "/complete", {
      method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(parts),
    })
    if (!response.ok) throw new Error("Upload completion failed")
    return (await response.json()).url
  },
};
<UploadPlus transport={transport} chunkSize={2 * 1024 * 1024} concurrency={3} retries={2} />
// Optional getUploadedParts reconciles server receipts before resumption.
// Named parts: UploadPlusDropzone, UploadPlusToolbar, UploadPlusList, UploadPlusItem.`,
  conversation: `import { Conversation } from "@/components/ui/conversation"
import { PromptComposer } from "@/components/ui/prompt-composer"

<Conversation messages={[
  { id: "user-1", role: "user", content: "How can we simplify this?" },
  { id: "assistant-1", role: "assistant", content: "Start with the next useful action.", status: "complete" },
]} height={480} autoScroll textAnimation="typewriter" charactersPerSecond={60}
  footer={<PromptComposer onSubmit={async ({ text, attachments }, { signal }) => {
    // Send through your own model adapter and update application-owned messages.
    console.log(text, attachments, signal)
  }} />} />
// Named parts: ConversationMessages, ConversationJumpToLatest, ConversationFooter.
// Streaming string messages reveal progressively. Completed history renders immediately.
// Per-message options override these defaults. Pass options to custom renderMessage content yourself.
// For history, supply hasEarlier and onLoadEarlier, then prepend stable-ID messages.`,
  'chat-message': `import { ChatMessage } from "@/components/ui/chat-message"
import { StreamingMarkdown } from "@/components/ui/streaming-markdown"

<ChatMessage id="reply-1" role="assistant" author="Workspace assistant"
  status="streaming"
  content={<StreamingMarkdown content="A **clear next step** makes all the difference."
    streaming textAnimation="typewriter" charactersPerSecond={60} />}
  copyText="A clear next step makes all the difference."
  onRatingChange={rating => console.log(rating)} />
// Named parts: ChatMessageHeader, ChatMessageContent, ChatMessageActions.
// String content animates directly; rich content configures its own StreamingMarkdown.
// textAnimation="none" displays each incoming chunk immediately.
// onEdit and onRetry are cancellable application callbacks.`,
  'prompt-composer': `import { PromptComposer } from "@/components/ui/prompt-composer"

<PromptComposer placeholder="What would you like to explore?" accept="image/*,.pdf,.txt"
  maxFiles={4} maxFileSize={20 * 1024 * 1024}
  onSubmit={async ({ text, attachments }, { signal }) => {
    // Implement your own request adapter. Without onAttachmentUpload, attachments include File objects.
    console.log(text, attachments, signal)
  }} onStop={() => console.log("Stop your provider stream here")} />
// onAttachmentUpload(file, { signal }) resolves { url: string } from your chosen storage.
// Named parts: PromptComposerEditor, PromptComposerAttachments, PromptComposerFooter.`,
  'streaming-markdown': `import { StreamingMarkdown } from "@/components/ui/streaming-markdown"

<StreamingMarkdown content={"## A response taking shape\\n\\n- Clear\\n- Useful"} streaming
  textAnimation="typewriter" charactersPerSecond={60} />
// Append chunks to application-owned content. Raw HTML renders as inert text.
// Set streaming=false when delivery finishes; buffered text finishes revealing.
// textAnimation="none" displays text immediately. Use a React key when switching response identities.
// Marked and syntax grammars load lazily; no AI SDK is installed.
// Optional renderCode, renderImage, renderMath and renderDiagram customize output.
// Math/diagram callbacks receive fenced block source and do not bundle an engine.`,
  'conversation-history': `import { ConversationHistory } from "@/components/ui/conversation-history"
import { useState } from "react"

export function History() {
  const [items, setItems] = useState([{ id: "workspace", title: "A calmer workspace", updatedAt: "2026-11-04T09:00:00Z" }])
  return <ConversationHistory items={items} onItemsChange={setItems}
    onSelect={item => console.log("Open", item.id)}
    onAction={async (item, action, { signal }) => {
      // Persist through your application API before the local state changes.
      console.log(item.id, action, signal)
    }} />
}
// hasMore + onLoadMore support application-owned pagination.`,
  'model-selector': `import { ModelSelector, type ModelDescriptor } from "@/components/ui/model-selector"

// Replace sample metadata with models your application can actually use.
const models: ModelDescriptor[] = [{
  id: "my-model", name: "My model", provider: "My provider", capabilities: ["tools"],
  contextWindow: 128000, maxOutputTokens: 16000,
  parameters: { temperature: { min: 0, max: 2 }, topP: true, responseFormats: ["text", "json"] },
}];
<ModelSelector models={models} requiredCapabilities={["tools"]}
  onValueChange={(id, model) => console.log(id, model)} />
// Favorites are controlled with favorites + onFavoritesChange.`,
  citations: `import { Citations, CitationReference, CitationsList } from "@/components/ui/citations"

<Citations sources={[{ id: "docs", title: "ErgonUI documentation", url: "https://ergonui.netlify.app/" }]}>
  <p>Composable parts keep useful details close.<CitationReference sourceId="docs" /></p>
  <CitationsList />
</Citations>
// Pass document, page and quote for document excerpts. No retrieval service is assumed.`,
  'tool-call': `import { ToolCall } from "@/components/ui/tool-call"

<ToolCall call={{ id: "lookup-1", name: "search_notes", status: "success",
  input: { query: "workspace" }, output: { matches: 2 }, durationMs: 320,
}} defaultExpanded />
// States: pending, running, success, error, cancelled.
// onRetry(call, { signal }) and onCancel(call) delegate execution to the application.
// Named parts: ToolCallHeader, ToolCallContent.`,
  'agent-run-trace': `import { AgentRunTrace } from "@/components/ui/agent-run-trace"

<AgentRunTrace steps={[{ id: "run", title: "Workspace assistant", kind: "agent", status: "running", children: [
  { id: "lookup", title: "Find related notes", kind: "retrieval", status: "success", summary: "Found two design notes." },
  { id: "draft", title: "Prepare a response", kind: "model", status: "running" },
]}]} defaultExpandedIds={["run"]} />
// Supply public activity summaries only. The component does not retrieve private model reasoning.
// Expanded IDs and custom step rendering are controllable.`,
  'approval-request': `import { ApprovalRequest } from "@/components/ui/approval-request"

<ApprovalRequest request={{ id: "share-1", revision: "3", title: "Share the summary?", status: "pending",
  arguments: { recipient: "team@example.test", message: "Ready for review" },
}} editableArguments onDecide={async (decision, { signal }) => {
  // Implement this backend: authorize the user, validate edited arguments and compare revision atomically.
  const response = await fetch("/api/approvals/decide", {
    method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(decision),
  })
  if (!response.ok) throw new Error("Decision was rejected or the request changed")
}} />`,
  'artifact-panel': `import { ArtifactPanel } from "@/components/ui/artifact-panel"

<ArtifactPanel artifact={{ id: "note", title: "Design notes", kind: "markdown", filename: "notes.md", versions: [
  { id: "draft", label: "Draft", content: "# A calmer workspace" },
  { id: "review", label: "Reviewed", content: "# A calmer workspace\\n\\nKeep the next useful action visible." },
] }} defaultView="preview" />
// Code stays source unless you provide renderPreview with your own execution isolation.
// Named parts: ArtifactPanelHeader, ArtifactPanelContent.`,
  'context-usage': `import { ContextUsage } from "@/components/ui/context-usage"

<ContextUsage inputTokens={12400} cachedInputTokens={4200} outputTokens={1800}
  reasoningTokens={600} contextWindow={128000} cost={0.03} currency="USD" />
// Supply actual counts/costs from your application. Cached and reasoning values are subsets.
// usedTokens optionally overrides the context-window occupancy without changing the token breakdown.`,
  'generation-settings': `import { GenerationSettings } from "@/components/ui/generation-settings"

<GenerationSettings model={{ id: "my-model", name: "My model", provider: "My provider", maxOutputTokens: 16000,
  parameters: { temperature: { min: 0, max: 2 }, topP: true, seed: true, stop: true, responseFormats: ["text", "json"] },
}} defaultValue={{ temperature: 0.7, maxOutputTokens: 2048 }}
  onValueChange={parameters => console.log(parameters)} />
// Only supported controls appear. Translate these overrides using your provider adapter.
// normalizeGenerationParameters can filter a settings object against model metadata.`,
  'model-comparison': `import { ModelComparison } from "@/components/ui/model-comparison"

<ModelComparison models={[
  { id: "a", name: "Model A", provider: "Your provider" },
  { id: "b", name: "Model B", provider: "Your provider" },
]} defaultPrompt="Suggest a calmer workspace" concurrency={2}
  onGenerate={async ({ prompt, model }, { signal, onDelta }) => {
    // Implement /api/generate in your application; keep provider keys on the server.
    const response = await fetch("/api/generate", {
      method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, model: model.id }),
    })
    if (!response.ok) throw new Error("Generation failed")
    const text = await response.text()
    onDelta(text) // Or call once for each streamed text delta.
    return {} // Optionally return final text and actual provider token/cost metadata.
  }} />`,
  'voice-conversation': `import { VoiceConversation } from "@/components/ui/voice-conversation"

<VoiceConversation autoSpeak={false} maxDurationSeconds={120}
  onProcessRecording={async (audio, { signal }) => {
    // Implement this endpoint with your chosen transcription/model/audio services.
    const body = new FormData()
    body.append("audio", audio, "recording")
    const response = await fetch("/api/voice", { method: "POST", body, signal })
    if (!response.ok) throw new Error("Voice processing failed")
    return response.json() // { transcript: string, response?: string, audioUrl?: string }
  }} />
// Microphone permission is requested only after Start talking.
// onAudioChunk supports a live transport; browser playback can use returned audio or speech synthesis.
// Named parts: VoiceConversationWaveform, VoiceConversationControls.`,
}
