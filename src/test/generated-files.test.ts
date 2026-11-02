import { afterEach, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, readdir, rmdir, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { writeGeneratedFile } from '../../scripts/write-generated-file'

const directories: string[] = []
async function artifact() {
  await mkdir(resolve('output'), { recursive: true })
  const directory = await mkdtemp(resolve('output/generated-write-'))
  directories.push(directory)
  return resolve(directory, 'component.json')
}
afterEach(async () => {
  for (const directory of directories.splice(0)) {
    for (const file of await readdir(directory)) await unlink(resolve(directory, file))
    await rmdir(directory)
  }
})

it('replaces a longer generated JSON file without trailing bytes or temporary files', async () => {
  const path = await artifact()
  await writeGeneratedFile(path, JSON.stringify({ content: 'old'.repeat(10000) }))
  await writeGeneratedFile(path, JSON.stringify({ content: 'new' }))
  expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({ content: 'new' })
  expect(await readdir(directories[0])).toEqual(['component.json'])
})

it('keeps generated JSON complete while readers observe repeated replacements', async () => {
  const path = await artifact()
  await writeGeneratedFile(path, JSON.stringify({ index: 0, content: '' }))
  await Promise.all([
    (async () => {
      for (let index = 1; index <= 20; index++)
        await writeGeneratedFile(
          path,
          JSON.stringify({ index, content: 'data'.repeat(index * 300) }),
        )
    })(),
    (async () => {
      for (let index = 0; index < 80; index++)
        expect(JSON.parse(await readFile(path, 'utf8'))).toHaveProperty('index')
    })(),
  ])
  expect(JSON.parse(await readFile(path, 'utf8')).index).toBe(20)
})
