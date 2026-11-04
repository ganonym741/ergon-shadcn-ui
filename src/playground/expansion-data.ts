export const expansionIds = [
  'kanban',
  'calendar-plus',
  'gantt-chart',
  'filter-builder',
  'file-browser',
  'image-cropper',
  'command-palette',
  'tags-input',
  'phone-input',
  'json-viewer',
  'code-block',
  'diff-viewer',
] as const
export const kanbanData = [
  {
    id: 'planned',
    title: 'Planned',
    color: '#5579bd',
    cards: [
      {
        id: 'research',
        title: 'Interview customers',
        description: 'Learn how people organize their work.',
        priority: 'high',
        labels: [{ label: 'Research', color: '#5579bd' }],
        assignee: { name: 'Maya' },
      },
      {
        id: 'tokens',
        title: 'Refine design tokens',
        description: 'Make light and dark themes feel cohesive.',
        priority: 'medium',
        labels: [{ label: 'Design', color: '#9864af' }],
      },
    ],
  },
  {
    id: 'building',
    title: 'Building',
    color: '#c38a28',
    limit: 3,
    cards: [
      {
        id: 'keyboard',
        title: 'Keyboard navigation',
        description: 'Make every action reachable.',
        priority: 'high',
        assignee: { name: 'Rio' },
      },
    ],
  },
  { id: 'ready', title: 'Ready', color: '#36836a', cards: [] },
]
export const calendarData = [
  {
    id: 'review',
    title: 'Design review',
    start: '2026-11-03T10:00:00',
    end: '2026-11-03T11:00:00',
    color: '#5579bd',
  },
  {
    id: 'planning',
    title: 'Sprint planning',
    start: '2026-11-03T10:30:00',
    end: '2026-11-03T12:00:00',
    color: '#9864af',
  },
  {
    id: 'launch',
    title: 'Launch week',
    start: '2026-11-09',
    end: '2026-11-13',
    allDay: true,
    color: '#36836a',
  },
  {
    id: 'research',
    title: 'Customer interviews',
    start: '2026-11-05T13:00:00',
    end: '2026-11-05T15:00:00',
    color: '#b93e28',
  },
]
export const ganttData = [
  {
    id: 'product',
    title: 'Product launch',
    type: 'group',
    start: '2026-11-02',
    end: '2026-11-20',
    progress: 42,
  },
  {
    id: 'discovery',
    parentId: 'product',
    title: 'Discovery',
    start: '2026-11-02',
    end: '2026-11-05',
    progress: 100,
  },
  {
    id: 'design',
    parentId: 'product',
    title: 'Interface design',
    start: '2026-11-06',
    end: '2026-11-11',
    progress: 65,
    dependsOn: ['discovery'],
    color: '#5579bd',
  },
  {
    id: 'build',
    parentId: 'product',
    title: 'Implementation',
    start: '2026-11-12',
    end: '2026-11-18',
    progress: 20,
    dependsOn: ['design'],
  },
  {
    id: 'launch',
    parentId: 'product',
    title: 'Launch',
    type: 'milestone',
    start: '2026-11-20',
    dependsOn: ['build'],
  },
]
export const filterFields = [
  { id: 'name', label: 'Name', type: 'text' },
  { id: 'revenue', label: 'Revenue', type: 'number' },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'trial', label: 'Trial' },
      { value: 'paused', label: 'Paused' },
    ],
  },
  { id: 'joined', label: 'Joined', type: 'date' },
  { id: 'verified', label: 'Verified', type: 'boolean' },
]
export const filterQuery = {
  id: 'root',
  kind: 'group',
  combinator: 'and',
  children: [
    { id: 'revenue-rule', kind: 'rule', field: 'revenue', operator: 'gte', value: 500 },
    {
      id: 'status-group',
      kind: 'group',
      combinator: 'or',
      children: [
        { id: 'active-rule', kind: 'rule', field: 'status', operator: 'eq', value: 'active' },
        { id: 'verified-rule', kind: 'rule', field: 'verified', operator: 'eq', value: true },
      ],
    },
  ],
}
export const filterRecords = [
  {
    id: 'studio',
    name: 'Studio North',
    revenue: 1200,
    status: 'active',
    joined: '2026-09-04',
    verified: true,
  },
  {
    id: 'bloom',
    name: 'Bloom',
    revenue: 0,
    status: 'trial',
    joined: '2026-10-10',
    verified: false,
  },
  {
    id: 'orbit',
    name: 'Orbit',
    revenue: 800,
    status: 'paused',
    joined: '2026-08-20',
    verified: false,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    revenue: 650,
    status: 'trial',
    joined: '2026-10-01',
    verified: true,
  },
]
export const fileData = [
  { id: 'designs', name: 'Design', kind: 'folder' },
  { id: 'docs', name: 'Documents', kind: 'folder' },
  { id: 'archive', name: 'Archive', parentId: 'docs', kind: 'folder' },
  {
    id: 'landscape',
    name: 'Landscape.svg',
    kind: 'file',
    size: 1412,
    mimeType: 'image/svg+xml',
    thumbnail: '/demos/landscape.svg',
    modifiedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'brief',
    parentId: 'docs',
    name: 'Project brief.md',
    kind: 'file',
    size: 2400,
    mimeType: 'text/markdown',
    modifiedAt: '2026-10-30T11:00:00Z',
  },
  {
    id: 'theme',
    parentId: 'designs',
    name: 'Theme.json',
    kind: 'file',
    size: 860,
    mimeType: 'application/json',
    modifiedAt: '2026-11-02T08:30:00Z',
  },
  {
    id: 'notes',
    name: 'Release notes.txt',
    kind: 'file',
    size: 0,
    mimeType: 'text/plain',
    modifiedAt: '2026-11-02T09:00:00Z',
  },
]
export const organizationData = [
  {
    id: 'maya',
    name: 'Maya Chen',
    role: 'Chief executive',
    department: 'Leadership',
    color: '#b93e28',
  },
  {
    id: 'rio',
    parentId: 'maya',
    name: 'Rio Santoso',
    role: 'Head of engineering',
    department: 'Engineering',
    color: '#5579bd',
  },
  {
    id: 'ava',
    parentId: 'maya',
    name: 'Ava Morgan',
    role: 'Head of design',
    department: 'Design',
    color: '#9864af',
  },
  {
    id: 'eli',
    parentId: 'rio',
    name: 'Eli Park',
    role: 'Frontend engineer',
    department: 'Engineering',
  },
  {
    id: 'sora',
    parentId: 'rio',
    name: 'Sora Kim',
    role: 'Platform engineer',
    department: 'Engineering',
  },
  { id: 'noor', parentId: 'ava', name: 'Noor Ali', role: 'Product designer', department: 'Design' },
]
export const jsonData = {
  project: 'ErgonUI',
  version: '0.3.0',
  active: true,
  theme: { accent: '#b93e28', radius: 10, mode: 'system' },
  members: [
    { id: 'maya', name: 'Maya', role: 'Designer' },
    { id: 'rio', name: 'Rio', role: 'Engineer' },
  ],
  features: ['Typed APIs', 'Composable parts', 'Source distribution'],
  limits: { uploads: 0, notes: null },
}
export const codeExample = `import { Button } from "@/components/ui/button"

export function SaveButton() {
  return <Button onClick={() => console.log("Saved")}>Save changes</Button>
}`
export const diffBefore = `export const theme = {
  accent: "#b93e28",
  radius: 8,
  density: "comfortable",
}

export const features = ["accessible", "typed"]
`
export const diffAfter = `export const theme = {
  accent: "#36836a",
  radius: 12,
  density: "comfortable",
  motion: "system",
}

export const features = ["accessible", "typed", "composable"]
`
