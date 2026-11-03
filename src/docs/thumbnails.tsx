import { AdvancedChartThumbnail } from './chart-thumbnails'
import {
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Check,
  Plus,
  Search,
  Star,
  CalendarDays,
  Clock,
  UploadCloud,
  Bell,
  Settings2,
  LayoutDashboard,
  Layers,
  Folder,
  File,
  CircleCheck,
  Inbox,
  Loader2,
  GripVertical,
  Sun,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
function Lines() {
  return (
    <>
      <div className="micro-line" />
      <div className="micro-line short" />
    </>
  )
}
function TableThumb({ enhanced = false }: { enhanced?: boolean }) {
  return (
    <div className="micro-table">
      {enhanced && (
        <div className="micro-table-row" style={{ justifyContent: 'space-between' }}>
          <span className="micro-label">All projects</span>
          <span className="micro-button" style={{ padding: '3px 6px', fontSize: 7 }}>
            + New
          </span>
        </div>
      )}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`micro-table-row ${i === 0 ? 'micro-table-head' : ''}`}>
          <span className="micro-square" />
          <span className="micro-table-cell" style={{ flex: 1.8 }} />
          <span className="micro-table-cell" />
          <span className={i ? 'micro-dot' : 'micro-table-cell'} />
        </div>
      ))}
    </div>
  )
}
function FormThumb() {
  return (
    <div className="micro-card" style={{ width: 183, padding: 12 }}>
      <div className="micro-label" style={{ marginBottom: 6 }}>
        Project name <span style={{ color: 'var(--primary)' }}>*</span>
      </div>
      <div className="micro-input" style={{ padding: '6px 8px', width: '100%', fontSize: 8 }}>
        My next big idea
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
        <div className="micro-input" style={{ fontSize: 8, padding: 6, width: '60%' }}>
          Category
          <ChevronDown size={8} />
        </div>
        <span className="micro-button" style={{ padding: '5px 9px', fontSize: 8 }}>
          Create
        </span>
      </div>
    </div>
  )
}
export function Thumbnail({ id }: { id: string }) {
  let content: React.ReactNode
  switch (id) {
    case 'map-chart':
    case 'boxplot-chart':
    case 'calendar-heatmap-chart':
    case 'combo-chart':
    case 'sankey-chart':
    case 'candlestick-chart':
      content = <AdvancedChartThumbnail id={id} />
      break
    case 'chart':
    case 'line-chart':
    case 'area-chart':
    case 'bar-chart':
    case 'pie-chart':
    case 'scatter-chart':
    case 'radar-chart':
    case 'heatmap-chart':
    case 'gauge-chart':
      content = (
        <svg
          viewBox="0 0 220 130"
          width="220"
          height="130"
          aria-hidden="true"
          style={{ color: 'var(--primary)' }}
        >
          {id === 'pie-chart' ? (
            <>
              <circle cx="110" cy="65" r="42" fill="none" stroke="var(--border)" strokeWidth="20" />
              <circle
                cx="110"
                cy="65"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="20"
                strokeDasharray="110 264"
              />
              <circle
                cx="110"
                cy="65"
                r="42"
                fill="none"
                stroke="#5579bd"
                strokeWidth="20"
                strokeDasharray="70 264"
                strokeDashoffset="-115"
              />
            </>
          ) : id === 'gauge-chart' ? (
            <>
              <path
                d="M60 103 A58 58 0 1 1 160 103"
                stroke="var(--border)"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M60 103 A58 58 0 1 1 165 60"
                stroke="currentColor"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
              />
              <text
                x="110"
                y="85"
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="24"
                fontWeight="600"
              >
                72%
              </text>
            </>
          ) : id === 'radar-chart' ? (
            <>
              <path d="M110 8 168 50 146 113 74 113 52 50Z" stroke="var(--border)" fill="none" />
              <path
                d="M110 24 154 55 136 94 82 100 68 56Z"
                fill="currentColor"
                fillOpacity=".15"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M110 42 164 51 129 109 85 88 62 53Z"
                stroke="#5579bd"
                fill="none"
                strokeWidth="2"
              />
            </>
          ) : id === 'heatmap-chart' ? (
            Array.from({ length: 24 }, (_, i) => (
              <rect
                key={i}
                x={18 + (i % 6) * 31}
                y={16 + Math.floor(i / 6) * 26}
                width="26"
                height="21"
                rx="3"
                fill="currentColor"
                opacity={0.15 + ((i * 17) % 9) / 12}
              />
            ))
          ) : (
            <>
              <path
                d="M18 16 V112 H208 M18 80 H208 M18 48 H208"
                stroke="var(--border)"
                fill="none"
              />
              {id === 'bar-chart' ? (
                [58, 34, 70, 45, 87, 62].map((h, i) => (
                  <rect
                    key={i}
                    x={30 + i * 28}
                    y={112 - h}
                    width="18"
                    height={h}
                    rx="3"
                    fill={i % 2 ? '#5579bd' : 'currentColor'}
                    opacity=".85"
                  />
                ))
              ) : id === 'scatter-chart' ? (
                Array.from({ length: 18 }, (_, i) => (
                  <circle
                    key={i}
                    cx={28 + ((i * 29) % 170)}
                    cy={24 + ((i * 17) % 80)}
                    r={3 + (i % 4)}
                    fill={i % 2 ? '#5579bd' : 'currentColor'}
                    opacity=".7"
                  />
                ))
              ) : (
                <>
                  <path
                    d="M22 98 52 82 82 90 112 48 142 64 172 30 202 18"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {id === 'area-chart' && (
                    <path
                      d="M22 98 52 82 82 90 112 48 142 64 172 30 202 18 V112 H22Z"
                      fill="currentColor"
                      opacity=".12"
                    />
                  )}
                  <path
                    d="M22 88 52 91 82 65 112 70 142 40 172 45 202 32"
                    stroke="#5579bd"
                    strokeWidth="2"
                    fill="none"
                  />
                </>
              )}
            </>
          )}
        </svg>
      )
      break
    case 'rich-text-editor':
      content = (
        <div className="w-44 overflow-hidden rounded-md border bg-background text-[8px]">
          <div className="flex gap-3 border-b bg-muted/30 px-3 py-2">
            <strong>B</strong>
            <em>I</em>
            <u>U</u>
            <span>H₂</span>
            <span>↶</span>
          </div>
          <div className="space-y-2 p-3">
            <strong className="text-[10px]">A story worth sharing</strong>
            <div className="h-1 w-full rounded bg-muted" />
            <img src="/landscape.svg" alt="" className="h-12 w-full rounded object-cover" />
            <div className="h-1 w-4/5 rounded bg-muted" />
          </div>
        </div>
      )
      break
    case 'button':
      content = (
        <>
          <span className="micro-button">
            Get started
            <ArrowRight size={11} />
          </span>
          <span className="micro-button outline">Cancel</span>
        </>
      )
      break
    case 'float-button':
      content = (
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--background)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 10px #0001',
            }}
          >
            <Plus size={17} />
          </span>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--primary)',
              color: 'white',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 10px #e6604322',
            }}
          >
            <ArrowUpRight size={17} />
          </span>
        </div>
      )
      break
    case 'icon':
      content = (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 17,
            color: 'var(--muted-foreground)',
          }}
        >
          {[
            Layers,
            Search,
            Star,
            Bell,
            CalendarDays,
            Settings2,
            Plus,
            ArrowUpRight,
            Inbox,
            Sun,
          ].map((I, i) => (
            <I
              key={i}
              size={17}
              style={{ color: i === 2 || i === 6 ? 'var(--primary)' : undefined }}
            />
          ))}
        </div>
      )
      break
    case 'typography':
      content = (
        <div style={{ width: 187 }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.8 }}>
            Make it meaningful.
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--muted-foreground)',
              marginTop: 6,
              lineHeight: 1.8,
            }}
          >
            Good type makes all the difference.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 9, fontSize: 9 }}>
            <span style={{ color: 'var(--primary)' }}>A link worth following ↗</span>
            <span
              style={{
                fontFamily: 'monospace',
                background: 'var(--border)',
                padding: '1px 4px',
                borderRadius: 3,
              }}
            >
              code
            </span>
          </div>
        </div>
      )
      break
    case 'divider':
      content = (
        <div style={{ width: 190 }}>
          <div className="micro-line short" />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: '17px 0',
              fontSize: 8,
              color: 'var(--muted-foreground)',
            }}
          >
            <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />A little space
            <span style={{ height: 1, background: 'var(--border)', flex: 1 }} />
          </div>
          <div className="micro-line" />
        </div>
      )
      break
    case 'flex':
    case 'space':
    case 'grid':
      content = (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: id === 'grid' ? 'repeat(3,1fr)' : 'repeat(4,1fr)',
            gap: 7,
            width: 180,
          }}
        >
          {Array.from({ length: id === 'grid' ? 6 : 4 }, (_, i) => (
            <div
              key={i}
              style={{
                height: id === 'grid' ? 26 : 49,
                background: i % 2 ? '#edc7ba' : '#e9a68e',
                borderRadius: 4,
                display: 'grid',
                placeItems: 'center',
                color: '#b06449',
                fontSize: 9,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )
      break
    case 'layout':
    case 'layout-plus':
      content = (
        <div className="micro-card" style={{ width: 195, padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              height: 17,
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              gap: 3,
            }}
          >
            {[1, 2, 3].map((i) => (
              <i
                key={i}
                style={{ width: 3, height: 3, borderRadius: 3, background: 'var(--border)' }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', height: 87 }}>
            <div
              style={{
                width: 44,
                background: 'var(--muted)',
                borderRight: '1px solid var(--border)',
                padding: 7,
              }}
            >
              <div className="micro-line coral" />
              <div className="micro-line" />
              <div className="micro-line" />
            </div>
            <div style={{ flex: 1, padding: 11 }}>
              <div className="micro-line short" />
              <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 35,
                      background: i === 1 ? '#f5ded5' : 'var(--muted)',
                      flex: 1,
                      borderRadius: 3,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )
      break
    case 'masonry':
      content = (
        <div style={{ display: 'flex', gap: 6, width: 165 }}>
          {[0, 1, 2].map((i) => (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }} key={i}>
              {[0, 1].map((j) => (
                <span
                  key={j}
                  style={{
                    height: (i + j) % 2 ? 48 : 31,
                    background: ['#e9b5a2', '#e4cfc6', '#ecc5b7'][(i + j) % 3],
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )
      break
    case 'splitter':
      content = (
        <div
          className="micro-card"
          style={{ width: 190, height: 95, padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <div
            style={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              color: 'var(--muted-foreground)',
            }}
          >
            Panel A
          </div>
          <span
            style={{
              height: '100%',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <GripVertical
              size={12}
              style={{
                marginLeft: -6,
                background: 'var(--background)',
                color: 'var(--muted-foreground)',
              }}
            />
          </span>
          <div
            style={{
              flex: 1,
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              color: 'var(--muted-foreground)',
            }}
          >
            Panel B
          </div>
        </div>
      )
      break
    case 'anchor':
      content = (
        <div
          style={{
            borderLeft: '1px solid var(--border)',
            fontSize: 10,
            display: 'grid',
            gap: 12,
            color: 'var(--muted-foreground)',
          }}
        >
          {['Introduction', 'Getting started', 'What’s next'].map((t, i) => (
            <span
              style={{
                paddingLeft: 14,
                borderLeft: i === 1 ? '2px solid var(--primary)' : undefined,
                color: i === 1 ? 'var(--primary)' : undefined,
              }}
              key={t}
            >
              {t}
            </span>
          ))}
        </div>
      )
      break
    case 'breadcrumb':
      content = (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            fontSize: 10,
            color: 'var(--muted-foreground)',
          }}
        >
          <LayoutDashboard size={12} />
          <ChevronRight size={10} />
          <span>Projects</span>
          <ChevronRight size={10} />
          <span style={{ color: 'var(--foreground)' }}>Overview</span>
        </div>
      )
      break
    case 'dropdown':
    case 'menu':
      content = (
        <div className="micro-menu">
          {[
            <>
              <Layers size={10} />
              Your projects
            </>,
            <>
              <Settings2 size={10} />
              Settings <span style={{ marginLeft: 'auto', fontSize: 7 }}>⌘ S</span>
            </>,
            <>
              <Plus size={10} />
              Create workspace
            </>,
          ].map((el, i) => (
            <div key={i} className={`micro-menu-item ${i === 0 ? 'active' : ''}`}>
              {el}
            </div>
          ))}
        </div>
      )
      break
    case 'pagination':
      content = (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 10 }}>
          <ChevronRight
            size={12}
            style={{
              transform: 'rotate(180deg)',
              color: 'var(--muted-foreground)',
              marginRight: 6,
            }}
          />
          {[1, 2, 3, '…', 8].map((n, i) => (
            <span
              key={i}
              style={{
                width: 25,
                height: 26,
                display: 'grid',
                placeItems: 'center',
                background: n === 2 ? 'var(--primary)' : 'var(--background)',
                color: n === 2 ? 'white' : 'var(--muted-foreground)',
                border: n === 2 ? '0' : '1px solid var(--border)',
                borderRadius: 5,
              }}
            >
              {n}
            </span>
          ))}
          <ChevronRight size={12} style={{ color: 'var(--muted-foreground)', marginLeft: 6 }} />
        </div>
      )
      break
    case 'steps':
      content = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {['Details', 'Review', 'Done'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'grid', placeItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 23,
                    height: 23,
                    display: 'grid',
                    placeItems: 'center',
                    background:
                      i === 0 ? 'var(--primary)' : i === 1 ? '#fbece7' : 'var(--background)',
                    color:
                      i === 0 ? 'white' : i === 1 ? 'var(--primary)' : 'var(--muted-foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: 20,
                    fontSize: 9,
                  }}
                >
                  {i === 0 ? <Check size={11} /> : i + 1}
                </span>
                <span style={{ fontSize: 8, color: 'var(--muted-foreground)' }}>{t}</span>
              </div>
              {i < 2 && (
                <span
                  style={{
                    width: 42,
                    height: 1,
                    background: 'var(--border)',
                    margin: '0 7px 19px',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )
      break
    case 'tabs':
    case 'segmented':
      content = (
        <div style={{ width: 190 }}>
          <div
            style={{
              display: 'flex',
              gap: id === 'tabs' ? 18 : 3,
              padding: id === 'tabs' ? 0 : 4,
              borderBottom: id === 'tabs' ? '1px solid var(--border)' : undefined,
              background: id === 'tabs' ? undefined : 'var(--border)',
              borderRadius: 6,
            }}
          >
            {['Overview', 'Analytics', 'Reports'].map((t, i) => (
              <span
                key={t}
                style={{
                  fontSize: 9,
                  padding: id === 'tabs' ? '9px 0' : '6px 9px',
                  borderBottom: id === 'tabs' && i === 0 ? '2px solid var(--primary)' : undefined,
                  color: i === 0 ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: id === 'segmented' && i === 0 ? 'var(--background)' : undefined,
                  borderRadius: 4,
                }}
              >
                {t}
              </span>
            ))}
          </div>
          {id === 'tabs' && (
            <div style={{ marginTop: 13 }}>
              <Lines />
            </div>
          )}
        </div>
      )
      break
    case 'auto-complete':
    case 'select':
    case 'tree-select':
    case 'cascader':
      content = (
        <div style={{ display: 'grid', gap: 5 }}>
          <div className="micro-input focus">
            {id === 'auto-complete'
              ? 'Search for something…'
              : id === 'cascader'
                ? 'Asia / Indonesia'
                : 'Select a framework'}
            <ChevronDown size={11} />
          </div>
          <div className="micro-menu" style={{ width: 165, padding: 3 }}>
            <div className="micro-menu-item active" style={{ padding: '5px 8px' }}>
              React
              <Check size={9} style={{ marginLeft: 'auto' }} />
            </div>
            <div className="micro-menu-item" style={{ padding: '5px 8px' }}>
              Next.js
            </div>
          </div>
        </div>
      )
      break
    case 'checkbox':
    case 'radio':
      content = (
        <div style={{ display: 'grid', gap: 14 }}>
          {['Design with intention', 'Make it your own'].map((t, i) => (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 10,
                color: 'var(--muted-foreground)',
              }}
              key={t}
            >
              <span
                className={i === 0 ? 'micro-check' : 'micro-square'}
                style={id === 'radio' ? { borderRadius: 20 } : undefined}
              >
                {i === 0 &&
                  (id === 'radio' ? (
                    <i style={{ width: 5, height: 5, borderRadius: 10, background: 'white' }} />
                  ) : (
                    <Check size={9} />
                  ))}
              </span>
              {t}
            </span>
          ))}
        </div>
      )
      break
    case 'color-picker':
      content = (
        <div className="micro-card" style={{ width: 168, padding: 9 }}>
          <div
            style={{
              height: 49,
              borderRadius: 3,
              background:
                'linear-gradient(to top,black,transparent),linear-gradient(to right,white,#e66043)',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '68%',
                top: '26%',
                width: 8,
                height: 8,
                borderRadius: 8,
                border: '2px solid white',
              }}
            />
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 4,
              margin: '8px 0',
              background: 'linear-gradient(90deg,red,yellow,lime,cyan,blue,magenta,red)',
            }}
          />
          <span style={{ fontSize: 8, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
            HEX <span style={{ marginLeft: 30 }}>#E66043</span>
          </span>
        </div>
      )
      break
    case 'date-picker':
    case 'time-picker':
      content = (
        <div className="micro-input" style={{ width: 185 }}>
          {id === 'date-picker' ? <CalendarDays size={12} /> : <Clock size={12} />}
          <span style={{ flex: 1, marginLeft: 3 }}>
            {id === 'date-picker' ? 'October 24, 2026' : '10 : 30 : 00'}
          </span>
          <ChevronDown size={10} />
        </div>
      )
      break
    case 'form':
    case 'form-plus':
      content = <FormThumb />
      break
    case 'input':
      content = (
        <div style={{ display: 'grid', gap: 9 }}>
          <div className="micro-input">
            <Search size={11} /> A good idea starts here<span style={{ fontSize: 8 }}>⌘ K</span>
          </div>
          <div className="micro-input focus" style={{ color: 'var(--foreground)' }}>
            Make something great
            <span style={{ height: 12, width: 1, background: 'var(--primary)' }} />
          </div>
        </div>
      )
      break
    case 'input-number':
      content = (
        <div className="micro-input" style={{ width: 123, padding: 0 }}>
          <span style={{ padding: '9px 12px', borderRight: '1px solid var(--border)' }}>−</span>
          <span style={{ color: 'var(--foreground)', fontSize: 12 }}>24</span>
          <span style={{ padding: '9px 12px', borderLeft: '1px solid var(--border)' }}>+</span>
        </div>
      )
      break
    case 'mentions':
      content = (
        <div
          className="micro-card"
          style={{
            width: 190,
            padding: 12,
            fontSize: 10,
            color: 'var(--muted-foreground)',
            lineHeight: 1.9,
          }}
        >
          Hey{' '}
          <span
            style={{
              color: 'var(--primary)',
              background: '#fbece6',
              borderRadius: 3,
              padding: '2px 4px',
            }}
          >
            @sarah
          </span>
          , have you seen
          <br />
          the latest design updates?
        </div>
      )
      break
    case 'rate':
      content = (
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3, 4].map((n) => (
            <Star
              key={n}
              size={22}
              style={{
                fill: n < 4 ? '#e9b454' : 'var(--border)',
                color: n < 4 ? '#e9b454' : 'var(--border)',
              }}
            />
          ))}
        </div>
      )
      break
    case 'slider':
    case 'progress':
      content = (
        <div style={{ width: 183 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 9,
              color: 'var(--muted-foreground)',
              marginBottom: 13,
            }}
          >
            <span>{id === 'slider' ? 'Find your balance' : 'Almost there'}</span>
            <span>64%</span>
          </div>
          <div
            style={{
              height: 5,
              borderRadius: 6,
              background: 'var(--border)',
              position: 'relative',
            }}
          >
            <span
              style={{
                display: 'block',
                width: '64%',
                height: 5,
                background: 'var(--primary)',
                borderRadius: 6,
              }}
            />
            {id === 'slider' && (
              <i
                style={{
                  position: 'absolute',
                  left: '60%',
                  top: -4,
                  width: 13,
                  height: 13,
                  border: '3px solid var(--primary)',
                  borderRadius: '50%',
                  background: 'var(--background)',
                }}
              />
            )}
          </div>
        </div>
      )
      break
    case 'switch':
      content = (
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div className="micro-switch" />
          <div className="micro-switch off" />
        </div>
      )
      break
    case 'transfer':
      content = (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {[0, 1].map((n) => (
            <div key={n} style={{ display: 'contents' }}>
              {n === 1 && (
                <div style={{ display: 'grid', gap: 6, color: 'var(--muted-foreground)' }}>
                  <ArrowRight size={10} />
                  <ArrowRight size={10} style={{ transform: 'rotate(180deg)' }} />
                </div>
              )}
              <div className="micro-card" style={{ width: 83, padding: 9 }}>
                <div className="micro-label">{n ? 'Selected' : 'Available'}</div>
                {[1, 2, 3].map((i) => (
                  <div
                    style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 9 }}
                    key={i}
                  >
                    <span
                      className={i === 2 ? 'micro-check' : 'micro-square'}
                      style={{ width: 9, height: 9 }}
                    >
                      {i === 2 && <Check size={7} />}
                    </span>
                    <div className="micro-line" style={{ margin: 0, flex: 1, height: 4 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
      break
    case 'upload':
      content = (
        <div
          style={{
            border: '1px dashed #d9b6a9',
            background: 'var(--background)',
            borderRadius: 7,
            padding: '17px 25px',
            display: 'grid',
            justifyItems: 'center',
            gap: 6,
          }}
        >
          <UploadCloud size={24} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 9 }}>Drop your next big thing</span>
          <span style={{ fontSize: 7, color: 'var(--muted-foreground)' }}>
            or click to browse files
          </span>
        </div>
      )
      break
    case 'avatar':
      content = (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {['JD', 'SK', 'AL', '+4'].map((t, i) => (
            <span
              className="micro-avatar"
              key={t}
              style={{
                width: 38,
                height: 38,
                marginLeft: i ? -8 : 0,
                border: '3px solid var(--preview-bg)',
                fontSize: 10,
                background: i === 3 ? 'var(--background)' : undefined,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )
      break
    case 'badge':
    case 'tag':
      content =
        id === 'tag' ? (
          <>
            <span className="micro-tag">Design</span>
            <span className="micro-tag green">Shipped</span>
            <span className="micro-tag purple">In progress</span>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <span
              style={{
                position: 'relative',
                padding: 10,
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--background)',
              }}
            >
              <Bell size={21} style={{ color: 'var(--muted-foreground)' }} />
              <i
                style={{
                  position: 'absolute',
                  right: -4,
                  top: -4,
                  background: 'var(--primary)',
                  fontSize: 8,
                  color: 'white',
                  padding: '2px 5px',
                  border: '2px solid var(--preview-bg)',
                  borderRadius: 10,
                  fontStyle: 'normal',
                }}
              >
                3
              </i>
            </span>
            <span
              style={{
                fontSize: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--muted-foreground)',
              }}
            >
              <span className="micro-dot" />
              All systems go
            </span>
          </div>
        )
      break
    case 'calendar':
      content = (
        <div className="micro-card" style={{ width: 168, padding: 10 }}>
          <div style={{ fontSize: 9, textAlign: 'center', marginBottom: 10 }}>October 2026</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7,1fr)',
              gap: 3,
              textAlign: 'center',
              fontSize: 7,
              color: 'var(--muted-foreground)',
            }}
          >
            {Array.from({ length: 28 }, (_, i) => (
              <span
                key={i}
                style={{
                  padding: 2,
                  background: i === 23 ? 'var(--primary)' : undefined,
                  color: i === 23 ? 'white' : undefined,
                  borderRadius: 3,
                }}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      )
      break
    case 'card':
    case 'card-plus':
      content = (
        <div className="micro-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              fontWeight: 550,
            }}
          >
            A space for your ideas <MoreHorizontal size={11} />
          </div>
          <div style={{ margin: '13px 0' }}>
            <Lines />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="micro-tag green">In progress</span>
            <span className="micro-label">↗</span>
          </div>
        </div>
      )
      break
    case 'carousel':
      content = (
        <div style={{ display: 'grid', justifyItems: 'center', gap: 10, width: 190 }}>
          <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
            <div style={{ height: 55, width: 22, background: '#eee0da', borderRadius: 5 }} />
            <div
              style={{
                height: 76,
                flex: 1,
                background: 'linear-gradient(135deg,#ecc5b4,#dd987e)',
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                color: '#fff7',
                fontWeight: 600,
              }}
            >
              01
            </div>
            <div style={{ height: 55, width: 22, background: '#eee0da', borderRadius: 5 }} />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  height: 4,
                  width: i === 0 ? 12 : 4,
                  background: i === 0 ? 'var(--primary)' : 'var(--border)',
                  borderRadius: 4,
                }}
              />
            ))}
          </div>
        </div>
      )
      break
    case 'collapse':
      content = (
        <div className="micro-card" style={{ width: 190, padding: '2px 10px' }}>
          <div
            className="micro-menu-item"
            style={{
              padding: '9px 0',
              justifyContent: 'space-between',
              color: 'var(--foreground)',
            }}
          >
            A little more information
            <ChevronDown size={11} />
          </div>
          <Lines />
          <div
            className="micro-menu-item"
            style={{
              padding: '9px 0',
              justifyContent: 'space-between',
              marginTop: 8,
              borderTop: '1px solid var(--border)',
            }}
          >
            What’s included?
            <Plus size={10} />
          </div>
        </div>
      )
      break
    case 'descriptions':
    case 'descriptions-plus':
      content = (
        <div
          className="micro-card"
          style={{
            width: 185,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 13,
            padding: 14,
          }}
        >
          {['Project', 'Status', 'Created', 'Owner'].map((t, i) => (
            <div key={t}>
              <div style={{ fontSize: 7, color: 'var(--muted-foreground)', marginBottom: 5 }}>
                {t}
              </div>
              <div style={{ fontSize: 9, color: i === 1 ? '#77a389' : undefined }}>
                {['Ergon workspace', 'Active', 'Oct 24, 2026', 'Sarah Kim'][i]}
              </div>
            </div>
          ))}
        </div>
      )
      break
    case 'empty':
    case 'result':
      content = (
        <div style={{ display: 'grid', justifyItems: 'center', gap: 7 }}>
          {id === 'empty' ? (
            <Inbox size={31} strokeWidth={1} style={{ color: '#b7b9ad' }} />
          ) : (
            <CircleCheck size={31} strokeWidth={1.5} style={{ color: '#80a990' }} />
          )}
          <span style={{ fontSize: 10 }}>
            {id === 'empty' ? 'Room for something great' : 'You’re all set'}
          </span>
          <span style={{ fontSize: 8, color: 'var(--muted-foreground)' }}>
            {id === 'empty' ? 'Your first project is one click away.' : 'On to the next big thing.'}
          </span>
        </div>
      )
      break
    case 'image':
      content = (
        <div
          style={{
            width: 165,
            height: 92,
            borderRadius: 6,
            overflow: 'hidden',
            background: 'linear-gradient(170deg,#d5ded0,#d3c2a6)',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              right: 24,
              top: 15,
              width: 17,
              height: 17,
              borderRadius: 20,
              background: '#f9efce',
            }}
          />
          <span
            style={{
              position: 'absolute',
              width: 150,
              height: 95,
              background: '#85977b',
              borderRadius: '50% 50% 0 0',
              transform: 'rotate(-18deg)',
              bottom: -53,
              left: -20,
            }}
          />
          <span
            style={{
              position: 'absolute',
              width: 150,
              height: 110,
              background: '#6a7d60',
              borderRadius: '50% 50% 0 0',
              transform: 'rotate(25deg)',
              bottom: -64,
              right: -20,
            }}
          />
        </div>
      )
      break
    case 'list':
    case 'list-plus':
      content = (
        <div className="micro-card" style={{ padding: '2px 11px', width: 190 }}>
          {['Website redesign', 'Design system', 'Mobile experience'].map((t, i) => (
            <div
              key={t}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: i < 2 ? '1px solid var(--border)' : undefined,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: ['#eee3d9', '#e3e8db', '#e8e1ed'][i],
                  display: 'grid',
                  placeItems: 'center',
                  color: ['#b4997c', '#93a180', '#a58db4'][i],
                }}
              >
                <Layers size={12} />
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 8 }}>{t}</span>
                <div className="micro-line short" style={{ height: 3, margin: '4px 0 0' }} />
              </div>
              <MoreHorizontal size={11} style={{ color: 'var(--muted-foreground)' }} />
            </div>
          ))}
        </div>
      )
      break
    case 'popover':
    case 'tooltip':
      content = (
        <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
          <div
            style={{
              fontSize: 9,
              padding: id === 'tooltip' ? '7px 11px' : '12px 17px',
              borderRadius: 5,
              background: id === 'tooltip' ? 'var(--foreground)' : 'var(--background)',
              color: id === 'tooltip' ? 'var(--background)' : 'var(--foreground)',
              border: '1px solid var(--border)',
              boxShadow: '0 3px 8px #00000008',
              position: 'relative',
            }}
          >
            {id === 'tooltip' ? 'A little helpful context' : 'Everything you need, right here.'}
            <span
              style={{
                position: 'absolute',
                width: 7,
                height: 7,
                background: id === 'tooltip' ? 'var(--foreground)' : 'var(--background)',
                bottom: -4,
                left: '48%',
                transform: 'rotate(45deg)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
              }}
            />
          </div>
          <span className="micro-button outline" style={{ fontSize: 9, padding: '6px 11px' }}>
            Hover for more
          </span>
        </div>
      )
      break
    case 'qr-code':
      content = (
        <div className="micro-card" style={{ width: 93, padding: 9 }}>
          <QRCodeSVG size={75} value="https://ui.shadcn.com" fgColor="#454b3c" />
        </div>
      )
      break
    case 'statistic':
      content = (
        <div style={{ width: 180 }}>
          <span className="micro-label">Total revenue</span>
          <div style={{ fontSize: 29, fontWeight: 600, letterSpacing: -1, marginTop: 5 }}>
            $24,680
            <span style={{ fontSize: 14, color: 'var(--muted-foreground)', fontWeight: 400 }}>
              .00
            </span>
          </div>
          <span style={{ fontSize: 9, color: '#6f9d79', marginTop: 6, display: 'block' }}>
            ↗ 12.8%{' '}
            <span style={{ color: 'var(--muted-foreground)', fontSize: 8 }}>from last month</span>
          </span>
        </div>
      )
      break
    case 'table':
    case 'table-plus':
    case 'editable-table-plus':
      content = <TableThumb enhanced={id !== 'table'} />
      break
    case 'timeline':
      content = (
        <div style={{ display: 'grid', gap: 17, fontSize: 9, width: 170, position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              width: 1,
              height: 60,
              top: 4,
              left: 5,
              background: 'var(--border)',
            }}
          />
          {['Project created', 'Design approved', 'Ready to build'].map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  zIndex: 1,
                  width: 11,
                  height: 11,
                  borderRadius: 20,
                  border: '2px solid ' + (i < 2 ? 'var(--primary)' : 'var(--border)'),
                  background: 'var(--preview-bg)',
                }}
              />
              {t}
              <span style={{ marginLeft: 'auto', fontSize: 7, color: 'var(--muted-foreground)' }}>
                {['09:00', '10:24', 'Now'][i]}
              </span>
            </div>
          ))}
        </div>
      )
      break
    case 'tree':
      content = (
        <div
          style={{
            width: 165,
            fontSize: 10,
            display: 'grid',
            gap: 10,
            color: 'var(--muted-foreground)',
          }}
        >
          <span
            style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--foreground)' }}
          >
            <ChevronDown size={10} />
            <Folder size={13} style={{ color: '#d4a56c' }} />
            Your workspace
          </span>
          <span style={{ marginLeft: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Folder size={12} style={{ color: '#d4a56c' }} />
            Design assets
          </span>
          <span style={{ marginLeft: 43, display: 'flex', gap: 6, alignItems: 'center' }}>
            <File size={11} />
            brand-guidelines.pdf
          </span>
          <span style={{ marginLeft: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Folder size={12} style={{ color: '#d4a56c' }} />
            Development
          </span>
        </div>
      )
      break
    case 'alert':
    case 'message':
    case 'notification':
      content = (
        <div
          style={{
            width: 202,
            background: id === 'alert' ? '#edf5ee' : 'var(--background)',
            border: '1px solid ' + (id === 'alert' ? '#d8e8d9' : 'var(--border)'),
            borderRadius: 7,
            padding: 13,
            display: 'flex',
            gap: 9,
            alignItems: 'flex-start',
            boxShadow: id === 'alert' ? undefined : '0 5px 15px #00000008',
          }}
        >
          <CircleCheck size={15} style={{ color: '#74a17f', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 10, color: id === 'alert' ? '#55785b' : undefined }}>
              Looking good!
            </div>
            <div style={{ fontSize: 8, color: 'var(--muted-foreground)', marginTop: 4 }}>
              Your changes have been saved.
            </div>
          </div>
          <X size={9} style={{ marginLeft: 'auto', color: 'var(--muted-foreground)' }} />
        </div>
      )
      break
    case 'drawer':
    case 'modal':
    case 'popconfirm':
    case 'tour':
      content = (
        <div
          style={{
            width: 200,
            height: 106,
            border: '1px solid var(--border)',
            borderRadius: 7,
            background: 'var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: id === 'drawer' ? 'flex-end' : 'center',
            overflow: 'hidden',
          }}
        >
          <div
            className="micro-card"
            style={{
              width: id === 'drawer' ? 117 : 157,
              height: id === 'drawer' ? '100%' : undefined,
              padding: 11,
              borderRadius: id === 'drawer' ? 0 : 6,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 550,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {id === 'tour'
                ? 'Welcome aboard'
                : id === 'popconfirm'
                  ? 'Make it official?'
                  : 'A moment of focus'}
              <X size={9} />
            </div>
            <div style={{ margin: '8px 0' }}>
              <Lines />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5 }}>
              <span className="micro-button outline" style={{ fontSize: 7, padding: '4px 7px' }}>
                Cancel
              </span>
              <span className="micro-button" style={{ fontSize: 7, padding: '4px 7px' }}>
                Continue
              </span>
            </div>
          </div>
        </div>
      )
      break
    case 'skeleton':
    case 'skeleton-plus':
      content = (
        <div className="micro-card" style={{ width: 190 }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 9 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 30,
                background: 'var(--border)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <Lines />
            </div>
          </div>
          <Lines />
          <div className="micro-line" style={{ width: '80%' }} />
        </div>
      )
      break
    case 'spin':
      content = (
        <div style={{ display: 'grid', justifyItems: 'center', gap: 9 }}>
          <Loader2 size={26} style={{ color: 'var(--primary)' }} />
          <span className="micro-label">Good things are coming</span>
        </div>
      )
      break
    case 'watermark':
      content = (
        <div
          className="micro-card"
          style={{ position: 'relative', height: 90, width: 185, overflow: 'hidden' }}
        >
          <Lines />
          <Lines />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              transform: 'rotate(-20deg)',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: 3,
              color: 'var(--foreground)',
              opacity: 0.12,
            }}
          >
            CONFIDENTIAL
          </div>
        </div>
      )
      break
    case 'affix':
      content = (
        <div className="micro-card" style={{ width: 180, height: 95, overflow: 'hidden' }}>
          <div
            style={{
              background: '#f8e8e1',
              color: 'var(--primary)',
              fontSize: 9,
              padding: '7px 10px',
              borderRadius: 4,
              display: 'flex',
              gap: 8,
            }}
          >
            <PinIcon />
            Always in the right place
          </div>
          <div style={{ marginTop: 12 }}>
            <Lines />
            <Lines />
          </div>
        </div>
      )
      break
    case 'border-beam':
      content = (
        <div
          style={{
            padding: 2,
            background:
              'conic-gradient(from 120deg,var(--border) 50%,var(--primary),var(--border) 90%)',
            borderRadius: 9,
          }}
        >
          <div
            className="micro-card"
            style={{ border: 0, width: 170, textAlign: 'center', padding: 22 }}
          >
            <Star size={18} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
            <span style={{ fontSize: 10 }}>A little extra attention</span>
          </div>
        </div>
      )
      break
    case 'config-provider':
    case 'app':
    case 'util':
      content = (
        <div
          className="micro-card"
          style={{
            width: 190,
            padding: 14,
            fontFamily: 'monospace',
            fontSize: 9,
            lineHeight: 1.9,
            color: 'var(--muted-foreground)',
          }}
        >
          <span style={{ color: 'var(--primary)' }}>
            {id === 'util' ? 'const [value, set] =' : '<ConfigProvider'}
          </span>
          <br />
          <span style={{ paddingLeft: 12 }}>
            {id === 'util' ? 'useControllableState({' : 'theme="your-style"'}
          </span>
          <br />
          <span style={{ paddingLeft: 12 }}>
            {id === 'util' ? 'value, onChange' : 'density="comfortable"'}
          </span>
          <br />
          <span style={{ color: 'var(--primary)' }}>{id === 'util' ? '})' : '/>'}</span>
        </div>
      )
      break
    case 'field-plus':
      content = (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <div className="micro-label" style={{ marginBottom: 6 }}>
              Read
            </div>
            <span style={{ fontSize: 17, fontWeight: 550 }}>$1,280.00</span>
          </div>
          <ArrowRight size={13} style={{ color: 'var(--muted-foreground)' }} />
          <div>
            <div className="micro-label" style={{ marginBottom: 6 }}>
              Edit
            </div>
            <div className="micro-input focus" style={{ width: 85, padding: 7 }}>
              1280.00
            </div>
          </div>
        </div>
      )
      break
    case 'check-card-plus':
      content = (
        <div style={{ display: 'flex', gap: 9 }}>
          {['Starter', 'Team'].map((t, i) => (
            <div
              className="micro-card"
              key={t}
              style={{
                width: 88,
                padding: 12,
                borderColor: i ? 'var(--primary)' : undefined,
                background: i
                  ? 'color-mix(in srgb,var(--primary) 3%,var(--background))'
                  : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: i ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
              >
                <Layers size={14} />
                {i === 1 && <CircleCheck size={11} />}
              </div>
              <div style={{ fontSize: 10, marginTop: 9 }}>{t}</div>
              <div style={{ fontSize: 7, color: 'var(--muted-foreground)', marginTop: 4 }}>
                {i ? 'Build together' : 'Start creating'}
              </div>
            </div>
          ))}
        </div>
      )
      break
    default:
      content = <TableThumb />
  }
  return <div className="thumb">{content}</div>
}
function PinIcon() {
  return <span style={{ fontSize: 11 }}>↥</span>
}
