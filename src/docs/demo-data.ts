import type { ColumnDef } from '@/components/ui/data-table'
import type { TreeNode } from '@/components/ui/tree'
export interface Project {
  id: string
  name: string
  owner: string
  status: string
  budget: number
  created: string
}
const names = [
  'Website redesign',
  'Design system',
  'Customer portal',
  'Mobile experience',
  'Analytics dashboard',
  'Brand refresh',
  'Developer tools',
  'Product launch',
]
const people = [
  'Sarah Kim',
  'Alex Morgan',
  'James Wilson',
  'Maya Chen',
  'Oliver Davis',
  'Nina Patel',
]
export function makeProjects(count: number): Project[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `PRJ-${String(i + 1).padStart(4, '0')}`,
    name: `${names[i % names.length]}${i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''}`,
    owner: people[i % people.length],
    status: ['In progress', 'Completed', 'Planning'][i % 3],
    budget: 1500 + ((i * 137) % 18000),
    created: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`,
  }))
}
export const projectColumns: ColumnDef<Project, any>[] = [
  { accessorKey: 'id', header: 'Project ID', size: 120 },
  {
    accessorKey: 'name',
    header: 'Project',
    size: 240,
    meta: {
      editable: true,
      validate: (v: unknown) => (!String(v).trim() ? 'A project name is required' : undefined),
    },
  },
  { accessorKey: 'owner', header: 'Owner', size: 160, meta: { editable: true } },
  { accessorKey: 'status', header: 'Status', size: 140 },
  {
    accessorKey: 'budget',
    header: 'Budget',
    size: 130,
    cell: ({ getValue }) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(getValue()),
    meta: {
      editable: true,
      inputType: 'number',
      validate: (v: unknown) => (Number(v) < 0 ? 'Budget must be positive' : undefined),
    },
  },
  { accessorKey: 'created', header: 'Created', size: 130 },
]
export const treeData: TreeNode[] = [
  {
    key: 'workspace',
    label: 'Your workspace',
    children: [
      {
        key: 'design',
        label: 'Design',
        children: [
          { key: 'brand', label: 'Brand guidelines.pdf', isLeaf: true },
          { key: 'icons', label: 'Icon library.fig', isLeaf: true },
        ],
      },
      {
        key: 'engineering',
        label: 'Engineering',
        children: [
          {
            key: 'frontend',
            label: 'Frontend',
            children: [
              { key: 'components', label: 'components.tsx', isLeaf: true },
              { key: 'styles', label: 'tokens.css', isLeaf: true },
            ],
          },
          { key: 'api', label: 'API documentation', isLeaf: true },
        ],
      },
      { key: 'archive', label: 'Archive', disabled: true, isLeaf: true },
    ],
  },
]
export const frameworkOptions = [
  { value: 'react', label: 'React', description: 'A library for web and native interfaces' },
  { value: 'next', label: 'Next.js', description: 'The React framework for the web' },
  { value: 'vite', label: 'Vite', description: 'The build tool for the web' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'vue', label: 'Vue', disabled: true },
]
