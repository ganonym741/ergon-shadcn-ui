import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { applyEdits, modify, parse, type ParseError } from 'jsonc-parser'

export async function read(path: string) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

export function json(content: string, path: string): any {
  const errors: ParseError[] = []
  const value = parse(content, errors, { allowTrailingComma: true })
  if (errors.length || !value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Invalid JSON configuration: ${path}`)
  return value
}

export function setJSON(content: string, path: (string | number)[], value: unknown) {
  return applyEdits(
    content,
    modify(content, path, value, {
      formattingOptions: { insertSpaces: true, tabSize: 2, eol: '\n' },
    }),
  )
}

export async function destination(root: string, path: string) {
  if (
    !path ||
    path.includes('\\') ||
    path.includes(':') ||
    /[\x00-\x1f]/.test(path) ||
    isAbsolute(path) ||
    path.split('/').some((part) => !part || part === '.' || part === '..')
  )
    throw new Error(`Unsafe destination: ${path}`)
  const target = resolve(root, path)
  const inside = relative(root, target)
  if (inside.startsWith(`..${sep}`) || inside === '..' || isAbsolute(inside))
    throw new Error(`Destination escapes application: ${path}`)
  let current = target
  while (current !== dirname(root)) {
    try {
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Refusing symlink destination: ${path}`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    if (current === root) break
    current = dirname(current)
  }
  return target
}

export interface Change {
  path: string
  content: string
  replace?: boolean
}
export async function apply(root: string, changes: Change[], overwrite: boolean, dryRun: boolean) {
  const seen = new Set<string>()
  const prepared = []
  for (const change of changes) {
    const key = change.path.toLowerCase()
    if (seen.has(key)) throw new Error(`Duplicate destination: ${change.path}`)
    seen.add(key)
    const target = await destination(root, change.path)
    const before = await read(target)
    if (before === change.content) continue
    const conflict = before !== undefined && !change.replace && !overwrite
    prepared.push({ ...change, target, conflict, before })
  }
  const conflicts = prepared.filter((change) => change.conflict)
  if (conflicts.length && !dryRun)
    throw new Error(
      `Existing files differ: ${conflicts.map((change) => change.path).join(', ')}. Review them, then use --overwrite to replace them. No files were written.`,
    )
  for (const change of prepared) {
    console.log(
      `${change.conflict ? 'conflict' : change.before === undefined ? 'create' : 'update'} ${change.path}`,
    )
    if (!dryRun) {
      await destination(root, change.path)
      await mkdir(dirname(change.target), { recursive: true })
      await writeFile(change.target, change.content)
    }
  }
  return prepared
}
