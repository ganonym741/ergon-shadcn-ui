import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, readFile, rmdir, unlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { parse as yaml } from 'yaml'
import { planNpmRelease, prepareNpmRelease, type PublishedPackage } from '../../scripts/npm-release'

const commit = 'a'.repeat(40)
const published: PublishedPackage = {
  name: '@ergonui/cli',
  versions: { '0.1.0': { gitHead: 'b'.repeat(40) } },
}
const directories: string[] = []
async function fixtureDirectory() {
  await mkdir(resolve('output'), { recursive: true })
  const directory = await mkdtemp(resolve('output/npm-release-test-'))
  directories.push(directory)
  return directory
}
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(async (directory) => {
      await unlink(join(directory, 'package.json'))
      await rmdir(directory)
    }),
  )
})

describe('automatic npm releases', () => {
  it('starts a declared higher release and increments subsequent merges', () => {
    expect(planNpmRelease('0.2.0', published, commit)).toEqual({ publish: true, version: '0.2.0' })
    expect(planNpmRelease('0.2.0', { ...published, versions: { '0.2.5': {} } }, commit)).toEqual({
      publish: true,
      version: '0.2.6',
    })
    expect(planNpmRelease('1.0.0', published, commit).version).toBe('1.0.0')
  })

  it('ignores prereleases and skips a commit already published', () => {
    expect(
      planNpmRelease(
        '0.2.0',
        { ...published, versions: { '0.2.0-beta.1': { gitHead: commit } } },
        commit,
      ),
    ).toEqual({ publish: true, version: '0.2.0' })
    expect(
      planNpmRelease(
        '0.2.0',
        { ...published, versions: { ...published.versions, '9.0.0-beta.1': {} } },
        commit,
      ).version,
    ).toBe('0.2.0')
    expect(
      planNpmRelease('0.2.0', { ...published, versions: { '0.2.3': { gitHead: commit } } }, commit),
    ).toEqual({ publish: false, version: '0.2.3' })
  })

  it('rejects invalid release versions and commit identities', () => {
    for (const version of ['latest', 'v0.2.0', '0.2.0-beta.1', '0.2.0+build'])
      expect(() => planNpmRelease(version, published, commit)).toThrow()
    expect(() => planNpmRelease('0.2.0', published, 'main')).toThrow()
    expect(() => planNpmRelease('0.2.0', published, 'a'.repeat(41))).toThrow()
    expect(() =>
      planNpmRelease('0.2.0', { ...published, name: 'another-package' }, commit),
    ).toThrow()
  })

  it('writes the CI package version and commit without changing dependencies', async () => {
    const directory = await fixtureDirectory()
    const manifest = {
      name: '@ergonui/cli',
      version: '0.2.0',
      dependencies: { 'cross-spawn': '7.0.6' },
    }
    await writeFile(join(directory, 'package.json'), JSON.stringify(manifest))
    const result = await prepareNpmRelease({
      directory,
      commit,
      fetcher: async () => Response.json({ ...published, versions: { '0.2.0': {} } }),
    })
    expect(result.version).toBe('0.2.1')
    expect(JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))).toEqual({
      ...manifest,
      version: '0.2.1',
      gitHead: commit,
    })
  })

  it('keeps the manifest intact on registry failure or an already released commit', async () => {
    const directory = await fixtureDirectory()
    const original = '{"name":"@ergonui/cli","version":"0.2.0"}\n'
    await writeFile(join(directory, 'package.json'), original)
    await expect(
      prepareNpmRelease({
        directory,
        commit,
        fetcher: async () => new Response('Unavailable', { status: 503 }),
      }),
    ).rejects.toThrow('503')
    expect(await readFile(join(directory, 'package.json'), 'utf8')).toBe(original)
    await prepareNpmRelease({
      directory,
      commit,
      fetcher: async () =>
        Response.json({ ...published, versions: { '0.2.0': { gitHead: commit } } }),
    })
    expect(await readFile(join(directory, 'package.json'), 'utf8')).toBe(original)
  })

  it('runs only on main updates, queues releases, and gives OIDC only to the publish job', async () => {
    const workflow = yaml(await readFile('.github/workflows/publish-npm.yml', 'utf8'))
    expect(workflow.on.push.branches).toEqual(['main'])
    expect(workflow.concurrency).toMatchObject({ 'cancel-in-progress': false, queue: 'max' })
    expect(workflow.jobs.publish).toMatchObject({
      needs: 'validate',
      if: "github.ref == 'refs/heads/main'",
      permissions: { contents: 'read', 'id-token': 'write' },
    })
    expect(workflow.permissions).toEqual({ contents: 'read' })
  })
})
