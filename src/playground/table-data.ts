import { makeProjects, type Project } from '@/docs/demo-data'
export interface ProjectNode extends Project {
  children?: ProjectNode[]
}
export type RowContentMode = 'Flat rows' | 'Nested rows' | 'Row details' | 'Nested table'
export function createChildProjects(
  parent: ProjectNode,
  count: number,
  levels: number,
  depth = 1,
): ProjectNode[] {
  return Array.from({ length: count }, (_, index) => {
    const child: ProjectNode = {
      ...parent,
      id: `${parent.id}.${index + 1}`,
      name: `${depth === 1 ? 'Phase' : 'Task'} ${index + 1} — ${parent.name}`,
      budget: Math.round(parent.budget / count),
      children: undefined,
    }
    if (levels > 1) child.children = createChildProjects(child, count, levels - 1, depth + 1)
    return child
  })
}
export function createProjectTree(count: number, children: number, levels: number): ProjectNode[] {
  return makeProjects(count).map((parent) => ({
    ...parent,
    children: createChildProjects(parent, children, levels),
  }))
}
export function mapProjectTree(
  nodes: ProjectNode[],
  transform: (node: ProjectNode) => ProjectNode,
): ProjectNode[] {
  return nodes.map((node) =>
    transform(
      node.children ? { ...node, children: mapProjectTree(node.children, transform) } : node,
    ),
  )
}
export function filterProjectTree(
  nodes: ProjectNode[],
  matches: (node: ProjectNode) => boolean,
): ProjectNode[] {
  return nodes.flatMap((node) => {
    if (matches(node)) return [node]
    const children = node.children ? filterProjectTree(node.children, matches) : []
    return children.length ? [{ ...node, children }] : []
  })
}
export function removeProjectNodes(nodes: ProjectNode[], keys: Set<string>): ProjectNode[] {
  return nodes
    .filter((node) => !keys.has(node.id))
    .map((node) =>
      node.children ? { ...node, children: removeProjectNodes(node.children, keys) } : node,
    )
}
