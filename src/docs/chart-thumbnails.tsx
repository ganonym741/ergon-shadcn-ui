/**
 * Draws lightweight catalog artwork for the advanced charts without importing the ECharts runtime or distributed demonstration data.
 */
export function AdvancedChartThumbnail({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 220 130" className="h-32 w-full" aria-hidden="true">
      {id === 'map-chart' ? (
        <>
          <path
            d="m22 28 32-13 25 12-9 19-23 8-8-13-17 3zm53 37 21 7-5 28-11 18-12-29zm31-34 30-16 54 13 13 24-30 8-16-12-21 12-10-13-14 1zm16 28 27 7-3 30-17 12-18-31zm51 32 23-6 12 18-14 12-19-7z"
            fill="var(--primary)"
            opacity=".65"
          />
        </>
      ) : id === 'calendar-heatmap-chart' ? (
        Array.from({ length: 84 }, (_, i) => (
          <rect
            key={i}
            x={18 + Math.floor(i / 7) * 16}
            y={14 + (i % 7) * 15}
            width="12"
            height="11"
            rx="2"
            fill="var(--primary)"
            opacity={0.1 + ((i * 13) % 9) / 10}
          />
        ))
      ) : id === 'boxplot-chart' ? (
        Array.from({ length: 4 }, (_, i) => (
          <g key={i} transform={`translate(${40 + i * 46} 0)`}>
            <path d={`M0 16V106M-7 16H7M-7 106H7`} stroke="var(--muted-foreground)" />
            <rect
              x="-12"
              y={34 + i * 5}
              width="24"
              height="40"
              rx="3"
              fill="var(--primary)"
              opacity=".6"
            />
            <path d={`M-12 ${54 + i * 5}H12`} stroke="var(--foreground)" />
          </g>
        ))
      ) : id === 'sankey-chart' ? (
        <>
          <path
            d="M24 30C95 30 100 40 194 40M24 45C90 45 115 93 194 93M24 95C95 95 120 58 194 58"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="16"
            opacity=".3"
          />
          {[
            [18, 20, 48],
            [18, 82, 28],
            [188, 24, 46],
            [188, 82, 28],
          ].map(([x, y, h], i) => (
            <rect key={i} x={x} y={y} width="12" height={h} rx="3" fill="var(--primary)" />
          ))}
        </>
      ) : id === 'candlestick-chart' ? (
        Array.from({ length: 9 }, (_, i) => (
          <g key={i} transform={`translate(${22 + i * 22} ${(i % 3) * 8})`}>
            <path d="M0 14V102" stroke={i % 3 ? '#16956d' : '#d95454'} />
            <rect
              x="-6"
              y={30 + (i % 4) * 8}
              width="12"
              height="32"
              rx="2"
              fill={i % 3 ? '#16956d' : '#d95454'}
            />
          </g>
        ))
      ) : (
        <>
          {[55, 78, 62, 90, 76, 104].map((h, i) => (
            <rect
              key={i}
              x={20 + i * 31}
              y={120 - h}
              width="19"
              height={h}
              rx="3"
              fill="var(--primary)"
              opacity=".5"
            />
          ))}
          <path
            d="M29 84 60 64 91 72 122 43 153 51 184 26"
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  )
}
