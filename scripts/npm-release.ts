import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gt, inc, maxSatisfying, parse, valid } from 'semver'

export interface PublishedPackage {
  name: string
  versions: Record<string, { gitHead?: string }>
}

export function planNpmRelease(version: string, published: PublishedPackage, commit: string) {
  const parsed = parse(version)
  if (valid(version) !== version || !parsed || parsed.prerelease.length || parsed.build.length)
    throw new Error('Main releases require a canonical stable version in package.json.')
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(commit))
    throw new Error('A full Git commit SHA is required.')
  if (
    published.name !== '@ergonui/cli' ||
    !published.versions ||
    typeof published.versions !== 'object' ||
    Array.isArray(published.versions)
  )
    throw new Error('Unexpected npm package metadata.')
  const entries = Object.entries(published.versions)
  if (entries.some(([, entry]) => !entry || typeof entry !== 'object'))
    throw new Error('Unexpected npm version metadata.')
  const stableVersion = (name: string) => {
    const release = parse(name)
    return release && !release.prerelease.length && !release.build.length
  }
  const existing = entries.find(([name, entry]) => stableVersion(name) && entry.gitHead === commit)
  if (existing) return { publish: false, version: existing[0] }
  const stable = entries.map(([name]) => name).filter(stableVersion)
  const latest = maxSatisfying(stable, '*')
  const next = !latest || gt(version, latest) ? version : inc(latest, 'patch')
  if (!next) throw new Error('Unable to increment the published version.')
  return { publish: true, version: next }
}

export async function prepareNpmRelease({
  directory,
  commit,
  fetcher = fetch,
}: {
  directory: string
  commit: string
  fetcher?: typeof fetch
}) {
  const path = resolve(directory, 'package.json')
  const manifest = JSON.parse(await readFile(path, 'utf8'))
  if (manifest.private || manifest.name !== '@ergonui/cli')
    throw new Error('Only the public @ergonui/cli package may be released.')
  const response = await fetcher('https://registry.npmjs.org/@ergonui%2fcli', {
    headers: { 'cache-control': 'no-cache' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`npm metadata request failed (${response.status}).`)
  const plan = planNpmRelease(manifest.version, await response.json(), commit)
  if (plan.publish)
    await writeFile(
      path,
      JSON.stringify({ ...manifest, version: plan.version, gitHead: commit }, null, 2) + '\n',
    )
  return plan
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.env.GITHUB_REF !== 'refs/heads/main')
    throw new Error('Publishing is limited to main.')
  const plan = await prepareNpmRelease({
    directory: resolve('packages/cli'),
    commit: process.env.GITHUB_SHA ?? '',
  })
  if (process.env.GITHUB_OUTPUT)
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `publish=${plan.publish}\nversion=${plan.version}\n`,
    )
  console.log(
    plan.publish
      ? `Prepared @ergonui/cli@${plan.version}`
      : `Commit already published as ${plan.version}`,
  )
}
