export const chartIds = [
  'chart',
  'line-chart',
  'area-chart',
  'bar-chart',
  'pie-chart',
  'scatter-chart',
  'radar-chart',
  'heatmap-chart',
  'gauge-chart',
] as const
export const chartRows = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(
  (label, index) => ({
    id: `month-${index + 1}`,
    label,
    revenue: [42, 58, 48, 76, 65, 94, 86, 112][index],
    target: [48, 50, 54, 60, 70, 78, 88, 98][index],
  }),
)
export const chartSeries = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'target', label: 'Target' },
]
export const radarIndicators = [
  'Design',
  'Performance',
  'Accessibility',
  'Flexibility',
  'Support',
].map((name) => ({ name, max: 100 }))
export const chartData: Record<string, unknown> = {
  'line-chart': chartRows,
  'area-chart': chartRows,
  'bar-chart': chartRows,
  'pie-chart': [
    { id: 'direct', name: 'Direct', value: 420 },
    { id: 'search', name: 'Search', value: 320 },
    { id: 'social', name: 'Social', value: 180 },
    { id: 'referrals', name: 'Referrals', value: 120 },
  ],
  'scatter-chart': ['Design', 'Engineering'].map((name, series) => ({
    id: `team-${series}`,
    name,
    data: Array.from({ length: 14 }, (_, index) => ({
      id: `point-${series}-${index}`,
      name: `Project ${index + 1}`,
      x: 10 + index * 5 + series * 7,
      y: 15 + ((index * 19 + series * 31) % 72),
      size: 8 + (index % 4) * 4,
    })),
  })),
  'radar-chart': [
    { id: 'current', name: 'Current', values: [82, 72, 94, 88, 70] },
    { id: 'previous', name: 'Previous', values: [65, 84, 68, 76, 80] },
  ],
  'heatmap-chart': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].flatMap((x, i) =>
    ['Morning', 'Afternoon', 'Evening'].map((y, j) => ({
      id: `${i}-${j}`,
      x,
      y,
      value: 10 + ((i * 17 + j * 29) % 80),
    })),
  ),
}
export const customChartOption = {
  grid: { top: 24, right: 24, bottom: 32, left: 16, containLabel: true },
  tooltip: { trigger: 'axis' },
  legend: { show: false, data: ['Revenue', 'Target'] },
  xAxis: {
    type: 'category',
    data: chartRows.map((row) => row.label),
    axisTick: { show: false },
    axisLine: { show: false },
  },
  yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } } },
  series: [
    {
      id: 'revenue',
      name: 'Revenue',
      type: 'bar',
      barMaxWidth: 38,
      itemStyle: { borderRadius: [5, 5, 0, 0] },
      data: chartRows.map((row) => row.revenue),
    },
    {
      id: 'target',
      name: 'Target',
      type: 'line',
      smooth: true,
      symbolSize: 7,
      data: chartRows.map((row) => row.target),
    },
  ],
}
