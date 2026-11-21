import {
  Bot,
  Mic,
  ShieldCheck,
  Wrench,
  FileText,
  GitCompare,
  SlidersHorizontal,
  Search,
  ArrowUp,
  Upload,
  Check,
  Users,
} from 'lucide-react'
/** Lightweight original catalog illustrations; real implementations load in each component playground. */
export function ProductThumbnail({ id }: { id: string }) {
  if (id === 'workflow-editor')
    return (
      <svg viewBox="0 0 260 110" className="w-[88%]">
        <path
          d="M65 55 C100 55 90 30 125 30 M65 55 C100 55 90 82 125 82 M163 30 C190 30 180 55 208 55 M163 82 C190 82 180 55 208 55"
          stroke="var(--primary)"
          strokeWidth="1.6"
          fill="none"
          opacity=".5"
        />
        {[
          [20, 38, 46, 34],
          [125, 14, 40, 32],
          [125, 66, 40, 32],
          [208, 38, 34, 34],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx="7"
              fill="var(--background)"
              stroke="var(--border)"
            />
            <circle cx={x + 11} cy={y + 11} r="4" fill="var(--primary)" opacity=".5" />
            <path
              d={`M${x + 8} ${y + 23}h${w - 16}`}
              stroke="var(--muted-foreground)"
              opacity=".4"
            />
          </g>
        ))}
      </svg>
    )
  if (id === 'signature-pad')
    return (
      <div className="w-[84%] rounded-xl border bg-background px-4 py-5">
        <svg viewBox="0 0 220 65" className="w-full">
          <path
            d="M12 48 C29 2 42 3 29 46 S62 18 63 43 S83 28 93 42 S119 21 115 45 S146 24 147 40 S177 47 190 28 M45 55 Q115 49 205 53"
            fill="none"
            stroke="#5579bd"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M5 61H215" stroke="var(--border)" />
        </svg>
      </div>
    )
  if (id === 'pdf-viewer')
    return (
      <div className="flex h-28 w-[82%] gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="w-7 space-y-2">
          {[0, 1].map((n) => (
            <div key={n} className="h-9 rounded border bg-background p-1">
              <div className="h-1 bg-primary/25" />
              <div className="mt-1 h-0.5 bg-muted" />
            </div>
          ))}
        </div>
        <div className="flex-1 rounded border bg-background p-3">
          <p className="text-[10px] font-semibold">A calmer workspace</p>
          {[80, 95, 70, 88].map((w, i) => (
            <div
              key={i}
              className="mt-2 h-0.5 rounded bg-muted-foreground/25"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    )
  if (id === 'presence')
    return (
      <div className="w-[82%] rounded-xl border bg-background p-4">
        <div className="flex -space-x-2">
          {['M', 'R', 'A', '+2'].map((name, i) => (
            <span
              key={name}
              className="grid size-7 place-content-center rounded-full border-2 border-background text-[8px] font-medium"
              style={{ background: ['#5579bd22', '#9864af22', '#36836a22', 'var(--muted)'][i] }}
            >
              {name}
            </span>
          ))}
          <Users className="ms-auto mt-1 size-4 text-muted-foreground" />
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[8px] text-muted-foreground">
          <span className="size-1 rounded-full bg-primary" />
          <span className="size-1 rounded-full bg-primary/60" />
          <span className="size-1 rounded-full bg-primary/30" />
          Maya is typing
        </div>
      </div>
    )
  if (id === 'upload-plus')
    return (
      <div className="w-[82%] space-y-3 rounded-xl border bg-background p-3">
        <div className="flex items-center gap-2 text-[9px]">
          <Upload className="size-4 text-primary" />
          Workspace assets<span className="ms-auto text-[8px] text-muted-foreground">2 files</span>
        </div>
        {[68, 100].map((n, i) => (
          <div key={i}>
            <div className="mb-1 flex justify-between text-[8px] text-muted-foreground">
              <span>{i ? 'design-notes.pdf' : 'workspace.png'}</span>
              <span>{n}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary/65" style={{ width: `${n}%` }} />
            </div>
          </div>
        ))}
      </div>
    )
  if (id === 'context-usage')
    return (
      <div className="w-[82%] space-y-3 rounded-xl border bg-background p-4">
        <div className="flex justify-between text-[9px]">
          <span>Context budget</span>
          <span className="text-muted-foreground">14k / 128k</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted">
          <div className="h-full w-1/4 rounded-full bg-primary" />
        </div>
        <div className="flex gap-4 text-[8px] text-muted-foreground">
          <span>● Input</span>
          <span>● Cached</span>
          <span>● Output</span>
        </div>
      </div>
    )
  const icons: Record<string, typeof Bot> = {
      'voice-conversation': Mic,
      'approval-request': ShieldCheck,
      'tool-call': Wrench,
      'artifact-panel': FileText,
      'model-comparison': GitCompare,
      'generation-settings': SlidersHorizontal,
      'conversation-history': Search,
      citations: FileText,
      'notification-inbox': Check,
      'model-selector': Bot,
      'agent-run-trace': Wrench,
      'streaming-markdown': FileText,
      'chat-message': Bot,
      conversation: Bot,
      'prompt-composer': ArrowUp,
    },
    Icon = icons[id] ?? Bot
  const labels: Record<string, string> = {
    'voice-conversation': 'Ready when you are',
    'approval-request': 'Review before continuing',
    'tool-call': 'search_workspace',
    'artifact-panel': 'Workspace principles',
    'model-comparison': 'Several useful perspectives',
    'generation-settings': 'Shape the response',
    'conversation-history': 'A calmer workspace',
    citations: 'Keep the source close',
    'notification-inbox': 'A design is ready for review',
    'model-selector': 'Choose a model',
    'agent-run-trace': 'Follow the next step',
    'streaming-markdown': 'An answer taking shape',
    'chat-message': 'A thoughtful next step',
    conversation: 'A little room to think',
    'prompt-composer': 'What would you like to explore?',
  }
  return (
    <div className="w-[84%] rounded-xl border bg-background p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-lg bg-primary/8 p-1.5 text-primary">
          <Icon className="size-3.5" />
        </span>
        <span className="text-[9px] font-medium">{labels[id]}</span>
      </div>
      {id === 'generation-settings' ? (
        <div className="space-y-3">
          {[45, 70].map((n) => (
            <div key={n} className="h-1 rounded bg-muted">
              <div className="relative h-full rounded bg-primary/60" style={{ width: `${n}%` }}>
                <span className="absolute -right-1 -top-1 size-3 rounded-full border bg-background" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="h-1 w-full rounded bg-muted-foreground/18" />
          <div className="mt-2 h-1 w-4/5 rounded bg-muted-foreground/12" />
          {id === 'prompt-composer' ? (
            <div className="mt-4 flex justify-between text-muted-foreground">
              <span className="text-[8px]">Attach context</span>
              <ArrowUp className="size-3" />
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-1 text-[8px] text-muted-foreground">
              <span className="size-1 rounded-full bg-primary/65" />
              {id === 'citations'
                ? '2 sources'
                : id === 'approval-request'
                  ? 'Approve · Reject'
                  : 'Clear, useful, considered'}
            </div>
          )}
        </>
      )}
    </div>
  )
}
