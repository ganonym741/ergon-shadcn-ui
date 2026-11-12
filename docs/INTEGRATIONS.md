# Product and AI components

Components are installed individually with the same CLI flow as the rest of ErgonUI. For example:

```sh
npx @ergonui/cli add workflow-editor prompt-composer streaming-markdown
```

Use your preferred runner (`bunx`, `pnpm dlx`, Yarn 2+ `yarn dlx`, or Deno's configured `dx`) in place of `npx`. Every catalog entry includes a usage example, typed source, controls, and implementation notes.

The product components and AI interfaces use original ErgonUI source and existing primitives. Only PDF Viewer adds PDF.js 6.5.438; Streaming Markdown adds Marked 18.1.3 and reuses the existing lazy syntax highlighter. No graph, upload-service, realtime, or AI SDK is required. PDF and Markdown engines are lazy imports within their components. Installing an entry includes only its source dependencies; complex compositions such as Artifact Panel and Model Comparison also include their Markdown/code/diff dependencies as used.

## Streamed text

Chat Message string content, Streaming Markdown, and Model Comparison responses use a typewriter reveal while streaming. Set `charactersPerSecond` (default 60) to adjust the pace, or `textAnimation="none"` to display received chunks immediately. Conversation accepts the same defaults, with per-message overrides. Custom React content and `renderMessage` / `renderResponse` callbacks configure their own text renderer.

Append provider chunks to your application-owned content and keep the same response ID or React key. Completed history displays immediately; buffered characters finish revealing after delivery ends. Chat Message flushes buffered text on cancellation or error. For a composed Markdown response, set `textAnimation="none"` when cancelling, and change its React key when switching response identities. Emoji and combining characters reveal together using native `Intl.Segmenter`; older engines fall back to immediate text. No additional package is required.

## PDF worker and assets

PDF.js needs a worker matching its installed version. In a bundler that supports URL imports (such as Vite), import `pdfjs-dist/build/pdf.worker.min.mjs?url` and pass that URL as `workerSrc`. Otherwise copy that file to your application's public/static assets and pass its served URL. Use your framework's asset mechanism; ErgonUI does not assume a CDN, an absolute filesystem path, or a particular bundler.

Some documents also require the PDF.js `standard_fonts` or `wasm` assets. Serve the required directories from the installed package and pass their base URLs through `documentOptions.standardFontDataUrl` and `documentOptions.wasmUrl`. Keep these assets and the worker in sync with the installed version. PDF.js 6.5.438 declares Node.js `>=22.13.0 || >=24` for its tooling/package environment; this requirement belongs to the PDF dependency, not to every ErgonUI component.

The viewer renders documents, selectable text, thumbnails, and bounded text search. It does not edit documents or provide a form-filling/signing service. Search and thumbnail limits are documented on its coverage page.

## Application-owned integrations

- Workflow Editor edits graph data. The application executes and persists workflows.
- Signature Pad exports local vector/raster images. Upload and storage are supplied by the application.
- Upload+ uses an injected chunk transport. Accepted chunks return receipts; optional `getUploadedParts` reconciles server state before resuming. Resuming after a reload requires the application to retain the file/session, chunk size, and receipts. The playground simulates receipts in memory.
- Presence accepts users, cursor positions, and connection state. Publish normalized cursor updates through your own realtime transport.
- Notification Inbox and Conversation History expose cancellable persistence/pagination callbacks. Local examples do not connect to a push service or database.
- AI components accept messages, model metadata, token counts, costs, and provider adapters. Keep credentials on your backend. No model inventory, token estimation, pricing feed, or hosted provider is assumed.
- Approval Request includes a request ID and revision in each decision. Your backend must authorize the actor, validate edited arguments, check expiration, and compare revisions atomically before executing an action.
- Artifact Panel displays code as source. Any executable preview must be supplied and isolated by the application.
- Voice Conversation requests microphone access only after an explicit action. Its processing/chunk callbacks can connect to your transcription/realtime services. Optional browser speech synthesis may use the browser/vendor speech service. The playground keeps recorded audio local and returns a clearly labeled simulated transcript.

Streaming Markdown renders tokens as React elements; raw HTML stays text and executable URL schemes are rejected. Math and diagram callbacks handle fenced blocks without bundling additional engines. Applications can disable remote images or provide their own renderer when image access needs tighter control.
