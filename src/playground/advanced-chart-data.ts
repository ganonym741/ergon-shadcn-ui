export const advancedChartIds = [
  'map-chart',
  'boxplot-chart',
  'calendar-heatmap-chart',
  'combo-chart',
  'sankey-chart',
  'candlestick-chart',
] as const
export const advancedChartTitles: Record<string, string> = {
  'map-chart': 'Revenue by region',
  'boxplot-chart': 'Response time distribution',
  'calendar-heatmap-chart': 'Daily activity',
  'combo-chart': 'Revenue and margin',
  'sankey-chart': 'Visitor journey',
  'candlestick-chart': 'Simulated price and volume',
}
export const mapRows = [
  'United States of America',
  'Indonesia',
  'India',
  'Brazil',
  'Japan',
  'Germany',
  'Australia',
  'Canada',
  'South Africa',
  'France',
  'Spain',
  'United Kingdom',
].map((name, i) => ({
  id: `region-${i}`,
  name,
  value: [92, 78, 84, 48, 62, 70, 44, 58, 32, 66, 42, 60][i],
}))
export const boxplotRows = [
  { id: 'api', label: 'API', summary: [12, 19, 25, 34, 51], outliers: [78, 92] },
  { id: 'search', label: 'Search', summary: [18, 28, 36, 49, 70], outliers: [105] },
  { id: 'checkout', label: 'Checkout', summary: [24, 35, 45, 60, 88], outliers: [124, 140] },
  { id: 'media', label: 'Media', summary: [8, 14, 19, 26, 39], outliers: [58] },
]
export const calendarRows = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
  return { id: date, date, value: (i * 17 + (i % 7) * 13) % 101 }
})
export const comboRows = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(
  (label, i) => ({
    id: `month-${i}`,
    label,
    revenue: [42, 58, 48, 76, 65, 94, 86, 112][i],
    margin: [18, 22, 20, 26, 24, 31, 28, 35][i],
  }),
)
export const comboSeries = [
  { key: 'revenue', label: 'Revenue', type: 'bar', axisId: 'revenue' },
  { key: 'margin', label: 'Margin', type: 'line', axisId: 'margin', smooth: true },
]
export const comboAxes = [
  { id: 'revenue', label: 'Revenue ($k)', min: 0 },
  { id: 'margin', label: 'Margin', unit: '%', position: 'right', min: 0, max: 50 },
]
export const sankeyNodes = [
  { id: 'visits', label: 'Visitors' },
  { id: 'organic', label: 'Organic' },
  { id: 'paid', label: 'Paid' },
  { id: 'trial', label: 'Trial' },
  { id: 'exit', label: 'Exited' },
  { id: 'converted', label: 'Subscribed' },
]
export const sankeyLinks = [
  { id: 'a', source: 'visits', target: 'organic', value: 120 },
  { id: 'b', source: 'visits', target: 'paid', value: 80 },
  { id: 'c', source: 'organic', target: 'trial', value: 90 },
  { id: 'd', source: 'paid', target: 'trial', value: 50 },
  { id: 'e', source: 'organic', target: 'exit', value: 30 },
  { id: 'f', source: 'paid', target: 'exit', value: 30 },
  { id: 'g', source: 'trial', target: 'converted', value: 100 },
  { id: 'h', source: 'trial', target: 'exit', value: 40 },
]
export const candleRows = Array.from({ length: 90 }, (_, i) => {
  const open = 100 + i * 0.35 + Math.sin(i * 0.6) * 4,
    close = open + Math.sin(i * 1.7) * 3
  return {
    id: `day-${i}`,
    date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
    open: Number(open.toFixed(2)),
    close: Number(close.toFixed(2)),
    low: Number((Math.min(open, close) - 1.5 - (i % 3) * 0.4).toFixed(2)),
    high: Number((Math.max(open, close) + 2 + (i % 4) * 0.3).toFixed(2)),
    volume: 10000 + ((i * 7919) % 80000),
  }
})
export const advancedChartData: Record<string, unknown[]> = {
  'map-chart': mapRows,
  'boxplot-chart': boxplotRows,
  'calendar-heatmap-chart': calendarRows,
  'combo-chart': comboRows,
  'sankey-chart': sankeyNodes,
  'candlestick-chart': candleRows,
}
