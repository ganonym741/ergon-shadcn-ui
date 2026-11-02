import { randomUUID } from 'node:crypto'
import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'

// Readers must see either the previous complete artifact or the new complete artifact.
export async function writeGeneratedFile(path: string, content: string) {
  try {
    if ((await readFile(path, 'utf8')) === content) return
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  const temporary = `${path}.${randomUUID()}.tmp`
  try {
    await writeFile(temporary, content, { flag: 'wx' })
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(temporary, path)
        break
      } catch (error) {
        // Windows readers and virus scanners can briefly hold a generated file open.
        if (
          attempt >= 9 ||
          !['EPERM', 'EACCES', 'EBUSY'].includes((error as NodeJS.ErrnoException).code ?? '')
        )
          throw error
        await delay(20 * (attempt + 1))
      }
    }
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}
