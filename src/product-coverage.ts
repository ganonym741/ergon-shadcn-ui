import type { Coverage } from './coverage'
export const productCoverage: Record<string, Coverage> = {
  'workflow-editor': {
    implemented: [
      'Typed nodes, multiple input/output ports, editable connections and endpoint/duplicate/cycle validation',
      'Pointer movement, keyboard movement/deletion, selection, pan, zoom, fit, interactive overview and bounded undo/redo',
      'Controlled graph/viewport state, custom node cards, read-only mode and connection validation callback',
    ],
    notes: [
      'Original SVG editor with at most 1,000 nodes and 5,000 edges. Workflow execution and persistence are application responsibilities. No automatic layout or workflow engine is bundled.',
    ],
  },
  'pdf-viewer': {
    implemented: [
      'Lazy PDF.js loading with an application-supplied matching worker URL and password entry',
      'Page navigation, zoom, rotation, fit-width, lazy thumbnails and downloads',
      'Selectable text overlay and bounded document text search with result navigation',
    ],
    notes: [
      'Worker hosting and optional PDF.js font/WASM asset URLs are configured by the application. This viewer does not edit PDFs or provide a PDF form-filling/signing engine. Search examines a configurable number of pages (default 500) and reports truncation; thumbnails are limited to the first 300 pages.',
    ],
  },
  'signature-pad': {
    implemented: [
      'Normalized vector strokes, pointer/touch drawing, pen width/color and configurable background',
      'Controlled strokes, clear, undo/redo, read-only/disabled states and PNG/SVG export callbacks',
    ],
    notes: [
      'Captures visual marks only; it does not verify identity or provide a legal electronic-signature service. Upload/storage is application-defined.',
    ],
  },
  'notification-inbox': {
    implemented: [
      'All/unread/archived filters, unread totals and notification actions',
      'Read/unread, archive/restore/delete and mark-all-read with cancellable persistence callbacks',
      'Controlled items, custom item rendering and injected load-more pagination',
    ],
    notes: [
      'Applications supply notifications and persistence. Local examples are simulated and are not connected to a push service.',
    ],
  },
  presence: {
    implemented: [
      'Participant avatars/overflow, connection state, typing labels and stale/offline filtering',
      'Normalized local cursor callbacks and remote named cursors within a composable shared surface',
      'Custom avatars and configurable participant/time limits',
    ],
    notes: [
      'Applications provide participant updates and realtime transport. There is no hosted presence backend, conflict resolution or document synchronization.',
    ],
  },
  'upload-plus': {
    implemented: [
      'Application-defined chunk transport, concurrent file queues, per-chunk progress and bounded retries',
      'Pause/resume, retained chunk receipts, optional server receipt reconciliation, completion and discard callbacks',
      'File validation, cancellation, disabled state and imperative queue controls',
    ],
    notes: [
      'Resumption across reloads requires application-owned durable file/session state and matching transport receipts. No storage provider or multipart service is assumed. The playground transport keeps receipts in memory only.',
    ],
  },
  conversation: {
    implemented: [
      'Typed transcript data, custom message rendering and composable footer/message/jump parts',
      'Bottom-following scroll that respects a reader’s position and anchors prepended history',
      'Cancellable earlier-message loading, loading/empty states and new-message indicators',
      'Configurable typewriter reveal defaults for streaming messages with per-message overrides',
    ],
    notes: [
      'Applications own messages, pagination, provider adapters and conversation persistence. Transcript rendering is not virtualized.',
    ],
  },
  'chat-message': {
    implemented: [
      'User/assistant/system/tool roles, streaming/error/cancelled states and custom content',
      'Copy, cancellable edit/regenerate actions, feedback and response-branch controls',
      'Named header/content/action parts, timestamps, metadata and avatar slots',
      'Grapheme-safe typewriter reveal for streamed string content, speed control and immediate-display option',
    ],
    notes: [
      'Response generation and persistence are callback-driven; rich content is supplied through composition.',
    ],
  },
  'prompt-composer': {
    implemented: [
      'Controlled text, growing multiline editor, IME-safe Enter/Shift+Enter sending and stop callback',
      'Drag/drop and file selection, validation, attachment upload/retry/removal with cancellation',
      'Injected submit/upload callbacks, errors and composable editor/attachments/footer',
    ],
    notes: [
      'Without an upload callback, submit receives original File objects. Upload URLs and generated responses belong to application adapters. No AI SDK is required.',
    ],
  },
  'streaming-markdown': {
    implemented: [
      'Lazy Marked token parsing into React elements for incremental content',
      'Headings, lists, tasks, blockquotes, tables, links, images and lazy grammar-specific code highlighting',
      'Raw HTML displayed as text, URL filtering, bounded text and custom code/image/math/diagram callbacks',
      'Grapheme-safe progressive reveal, configurable characters per second and buffered completion',
    ],
    notes: [
      'No raw HTML execution, math engine or diagram engine is bundled. Math/diagram callbacks handle appropriately fenced blocks; the application owns any additional rendering engine. Content is lexed again as revealed text changes. Completed history is instant; engines without Intl.Segmenter display chunks immediately.',
    ],
  },
  'conversation-history': {
    implemented: [
      'Search, grouped/pinned/archived conversations and selected navigation',
      'New, rename, pin/unpin, archive/restore/delete and cancellable persistence callbacks',
      'Application-supplied pagination and stable item IDs',
    ],
    notes: [
      'Applications supply and persist conversation metadata. No database or provider connection is included.',
    ],
  },
  'model-selector': {
    implemented: [
      'Provider groups, search, keyboard selection, favorites and unavailable models',
      'Capability requirements, application-defined model metadata and custom option rendering',
    ],
    notes: [
      'The model inventory is supplied by the application. No live provider inventory, pricing or model inference is assumed.',
    ],
  },
  citations: {
    implemented: [
      'Source collections, inline numeric references and keyboard-triggered source previews',
      'Titles, excerpts, document/page metadata, safe external links and source-open callbacks',
    ],
    notes: [
      'Applications supply citations and source access. The component does not retrieve documents or verify generated claims.',
    ],
  },
  'tool-call': {
    implemented: [
      'Pending/running/success/error/cancelled records with expandable typed input/output inspection',
      'Published descriptions/durations and injected retry/cancel actions',
      'Named header/content parts and cancellable errors',
    ],
    notes: [
      'Rendering a tool record never executes it. Tool authorization, execution and side effects belong to the application.',
    ],
  },
  'agent-run-trace': {
    implemented: [
      'Bounded validated nested activity trees with statuses, summaries and tool records',
      'Search retaining matching ancestors, controlled expansion and custom step rendering',
    ],
    notes: [
      'Displays application-published summaries, not private model chain of thought. At most 2,000 steps and 16 nesting levels are accepted.',
    ],
  },
  'approval-request': {
    implemented: [
      'Explicit approval/rejection, optional argument editing and decision notes',
      'JSON-object validation, request ID/revision binding, duplicate-submit protection and async cancellation',
      'Pending/approved/rejected/expired states and expiration checks',
    ],
    notes: [
      'A real backend must authorize decisions, validate arguments and compare the request revision before executing the requested action.',
    ],
  },
  'artifact-panel': {
    implemented: [
      'Versioned text/Markdown/code/image artifacts with preview/source/change views',
      'Code highlighting, text differences, safe image URLs and downloads',
      'Named header/content parts and application-defined previews',
    ],
    notes: [
      'Code is not executed by default. Applications supply their own isolated execution preview if needed. Image differences are not generated.',
    ],
  },
  'context-usage': {
    implemented: [
      'Context meter and validated input/output/cached/reasoning token breakdown',
      'Subset counts avoid double-counting, with overflow feedback and app-reported currency costs',
    ],
    notes: [
      'Counts and costs are supplied, not estimated. This component does not fetch prices or perform tokenization.',
    ],
  },
  'generation-settings': {
    implemented: [
      'Typed temperature/top-p/output-token/seed/response-format overrides filtered against model capabilities',
      'System instructions, stop sequences, presets and provider-default reset',
    ],
    notes: [
      'Applications provide accurate parameter limits and translate overrides into provider requests. Unsupported model controls are omitted.',
    ],
  },
  'model-comparison': {
    implemented: [
      'Same-prompt parallel model adapters with bounded concurrency and streamed deltas',
      'Independent/all cancellation, errors, retries, preference callbacks and elapsed timing',
      'Optional application-reported token counts/costs and custom response rendering',
    ],
    notes: [
      'No providers are contacted without application adapters. The playground uses fictional models and original simulated responses.',
    ],
  },
  'voice-conversation': {
    implemented: [
      'Explicit microphone capture through MediaRecorder with feature detection and cleanup',
      'Live audio chunks, pause/resume, mute, bounded duration, interruption and input-level waveform',
      'Injected recording processor, transcript turns, optional returned audio or browser speech playback',
    ],
    notes: [
      'Requires a secure context and microphone permission. Speech recognition/realtime AI is supplied by an application adapter. Browser speech synthesis may use the browser/vendor speech service; the playground never uploads microphone audio.',
    ],
  },
}
