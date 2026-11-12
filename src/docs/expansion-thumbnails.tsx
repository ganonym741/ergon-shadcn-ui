import {
  CalendarDays,
  Command,
  FileText,
  Folder,
  Image,
  Music2,
  Phone,
  Play,
  Search,
  Users,
} from 'lucide-react'
/** Draws lightweight catalog illustrations; the interactive examples live in separately loaded playgrounds. */
export function ExpansionThumbnail({ id }: { id: string }) {
  const colors = ['#5579bd', '#36836a', '#9864af'],
    card = 'rounded border bg-background p-2 shadow-xs',
    muted = 'text-muted-foreground'
  if (id === 'kanban')
    return (
      <div className="grid w-full grid-cols-3 gap-2">
        {['Planned', 'Building', 'Ready'].map((name, i) => (
          <div key={name} className="space-y-2 rounded-lg border bg-muted/30 p-2">
            <p className="text-[8px] font-medium" style={{ color: colors[i] }}>
              {name}
            </p>
            {Array.from({ length: i === 2 ? 1 : 2 }, (_, j) => (
              <div key={j} className={card}>
                <div className="h-1 w-4/5 rounded bg-foreground/20" />
                <div className="mt-2 h-1 w-1/2 rounded bg-foreground/10" />
                <div
                  className="mt-2 h-2 w-6 rounded"
                  style={{ backgroundColor: `${colors[i]}25` }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  if (id === 'calendar-plus')
    return (
      <div className={`${card} w-full`}>
        <div className="mb-2 flex justify-between text-[9px] font-medium">
          <span>November</span>
          <CalendarDays className="size-3 text-primary" />
        </div>
        <div className="grid grid-cols-7 gap-px bg-border">
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} className="h-5 bg-background p-0.5 text-[6px] text-muted-foreground">
              {i + 1}
              {[2, 5, 9, 10, 17, 20].includes(i) && (
                <div className="mt-0.5 h-1 rounded" style={{ backgroundColor: colors[i % 3] }} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  if (id === 'gantt-chart')
    return (
      <svg viewBox="0 0 230 120" className="w-full" aria-hidden="true">
        {[45, 80, 115, 150, 185, 220].map((x) => (
          <path key={x} d={`M${x} 10v100`} stroke="var(--border)" />
        ))}
        {['Discover', 'Design', 'Build', 'Launch'].map((name, i) => (
          <g key={name}>
            <text x="0" y={29 + i * 25} fill="var(--muted-foreground)" fontSize="7">
              {name}
            </text>
            <rect
              x={45 + i * 39}
              y={19 + i * 25}
              width={i === 3 ? 8 : 55}
              height={i === 3 ? 8 : 12}
              rx="3"
              fill={colors[i % 3]}
              opacity=".25"
            />
            <rect
              x={45 + i * 39}
              y={19 + i * 25}
              width={i === 3 ? 8 : 35}
              height={i === 3 ? 8 : 12}
              rx="3"
              fill={colors[i % 3]}
            />
          </g>
        ))}
      </svg>
    )
  if (id === 'filter-builder')
    return (
      <div className="w-full space-y-2 rounded-lg border p-3">
        <div className="flex items-center gap-2 text-[8px]">
          <span className="rounded bg-primary/10 px-2 py-1 text-primary">AND</span>
          <span className={muted}>Match all conditions</span>
        </div>
        {[
          ['Revenue', 'at least', '$500'],
          ['Status', 'is', 'Active'],
        ].map((row) => (
          <div key={row[0]} className="flex gap-1">
            {row.map((text, i) => (
              <span
                key={text}
                className={`flex-1 rounded border px-2 py-1.5 text-[7px] ${i === 1 ? muted : ''}`}
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    )
  if (id === 'file-browser')
    return (
      <div className="w-full">
        <div className="mb-3 flex items-center gap-1 text-[8px] text-muted-foreground">
          <Folder className="size-3" />
          Files / Design
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Projects', 'Assets', 'Brief.md'].map((name, i) => (
            <div key={name} className={`${card} space-y-2 text-center`}>
              {i === 2 ? (
                <FileText className="mx-auto size-7 text-muted-foreground" />
              ) : (
                <Folder className="mx-auto size-7 fill-primary/10 text-primary" />
              )}
              <p className="text-[7px]">{name}</p>
            </div>
          ))}
        </div>
      </div>
    )
  if (id === 'image-cropper' || id === 'image-comparison')
    return (
      <div className="relative w-full overflow-hidden rounded-lg border">
        <img src="/demos/landscape.svg" alt="" className="h-28 w-full object-cover" />
        {id === 'image-cropper' ? (
          <div className="absolute inset-4 border border-white shadow-[0_0_0_40px_#0005]">
            <div className="absolute inset-x-1/3 inset-y-0 border-x border-white/50" />
            <div className="absolute inset-x-0 inset-y-1/3 border-y border-white/50" />
          </div>
        ) : (
          <>
            <img
              src="/demos/landscape-before.svg"
              alt=""
              className="absolute inset-0 size-full object-cover [clip-path:inset(0_50%_0_0)]"
            />
            <div className="absolute inset-y-0 left-1/2 border-l-2 border-white">
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-1 py-1 text-[8px] text-black">
                ↔
              </div>
            </div>
          </>
        )}
      </div>
    )
  if (id === 'command-palette')
    return (
      <div className={`${card} w-full`}>
        <div className="mb-2 flex items-center gap-2 border-b pb-2 text-[8px] text-muted-foreground">
          <Search className="size-3" />
          Search commands…
          <Command className="ms-auto size-3" />
        </div>
        {['Overview', 'Create project', 'Appearance'].map((name, i) => (
          <div
            key={name}
            className={`rounded p-2 text-[8px] ${i === 1 ? 'bg-accent text-accent-foreground' : ''}`}
          >
            {name}
            <span className="float-right text-muted-foreground">↵</span>
          </div>
        ))}
      </div>
    )
  if (id === 'tags-input')
    return (
      <div className="w-full space-y-3">
        <p className="text-[9px] font-medium">Skills</p>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-background p-2">
          {['React', 'Design', 'TypeScript'].map((text) => (
            <span key={text} className="rounded bg-primary/10 px-2 py-1 text-[8px] text-primary">
              {text} ×
            </span>
          ))}
          <span className="py-1 text-[8px] text-muted-foreground">Add tag…</span>
        </div>
      </div>
    )
  if (id === 'phone-input')
    return (
      <div className="w-full space-y-3">
        <p className="flex items-center gap-1 text-[9px] font-medium">
          <Phone className="size-3" />
          Phone number
        </p>
        <div className="flex gap-1">
          <span className="rounded-lg border bg-background p-2 text-[8px]">United States +1⌄</span>
          <span className="flex-1 rounded-lg border bg-background p-2 text-[8px]">
            (415) 555-2671
          </span>
        </div>
        <p className="text-[7px] text-emerald-700">+14155552671</p>
      </div>
    )
  if (id === 'json-viewer')
    return (
      <div className={`${card} w-full space-y-1 font-mono text-[9px]`}>
        <p className="text-muted-foreground">▾ root {'{'}</p>
        <p className="ps-3">
          project: <span className="text-primary">"ErgonUI"</span>
        </p>
        <p className="ps-3">
          active: <span className="text-blue-600">true</span>
        </p>
        <p className="ps-3 text-muted-foreground">▸ members [2 items]</p>
        <p className="text-muted-foreground">{'}'}</p>
      </div>
    )
  if (id === 'code-block' || id === 'diff-viewer')
    return (
      <div className={`${card} w-full font-mono text-[8px]`}>
        <p className="mb-3 flex justify-between border-b pb-2 text-muted-foreground">
          <span>{id === 'code-block' ? 'theme.ts' : 'Changes'}</span>
          <span>⧉</span>
        </p>
        <p className="text-primary">export const theme = {'{'}</p>
        {id === 'diff-viewer' && <p className="bg-red-500/10 px-2 text-red-700">− radius: 8,</p>}
        <p className={`px-2 ${id === 'diff-viewer' ? 'bg-emerald-500/10 text-emerald-700' : ''}`}>
          {id === 'diff-viewer' ? '+ ' : ''}radius: 12,
        </p>
        <p className="px-2">accent: "#36836a",</p>
        <p>{'}'}</p>
      </div>
    )
  if (id === 'organization-chart')
    return (
      <div className="flex w-full flex-col items-center">
        <div className={`${card} flex items-center gap-2 text-[8px]`}>
          <Users className="size-4 text-primary" />
          Maya · CEO
        </div>
        <div className="h-5 border-l" />
        <div className="flex w-4/5 justify-between border-t pt-4">
          {['Engineering', 'Design'].map((name) => (
            <div
              key={name}
              className={`${card} relative text-[7px] before:absolute before:-top-4 before:left-1/2 before:h-4 before:border-l`}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    )
  return (
    <div className={`${card} w-full`}>
      <div className="flex h-20 items-center justify-center rounded bg-primary/5">
        <Image className="size-10 text-primary/30" />
        <Play className="absolute size-6 fill-primary text-primary" />
      </div>
      <div className="mt-3 h-1 rounded bg-muted">
        <div className="h-1 w-2/5 rounded bg-primary" />
      </div>
      <div className="mt-2 flex items-center gap-2 text-[7px] text-muted-foreground">
        <Play className="size-3" />
        0:03 / 0:08
        <Music2 className="ms-auto size-3" />
      </div>
    </div>
  )
}
