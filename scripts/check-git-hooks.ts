import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
await mkdir(resolve(root, 'output'), { recursive: true })
const fixture = await mkdtemp(resolve(root, 'output/git-hooks-'))
const worktree = resolve(fixture, 'worktree')
const remote = resolve(fixture, 'remote.git')
await mkdir(worktree)

const environment: NodeJS.ProcessEnv = {
  ...process.env,
  HUSKY: '1',
  XDG_CONFIG_HOME: resolve(fixture, '.config'),
}
for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR'])
  delete environment[key]
const log: string[] = []
function run(command: string[], cwd = worktree, failure = false) {
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    env: environment,
    encoding: 'utf8',
  })
  assert.ifError(result.error)
  const output = result.stdout + result.stderr
  log.push(`$ ${command.join(' ')}\n${output}`)
  assert.notEqual(result.status, null, `Command terminated: ${command.join(' ')}`)
  if (failure) assert.notEqual(result.status, 0, `Expected rejection: ${command.join(' ')}`)
  else assert.equal(result.status, 0, `${command.join(' ')}\n${output.slice(-6000)}`)
  return output.trim()
}
const git = (...args: string[]) => run(['git', ...args])

try {
  run(['git', 'init', '-b', 'main', worktree], fixture)
  run(['git', 'init', '--bare', remote], fixture)
  git('config', 'user.name', 'ErgonUI hook verification')
  git('config', 'user.email', 'hooks@example.invalid')
  git('config', 'commit.gpgSign', 'false')
  git('config', 'core.autocrlf', 'false')
  git('remote', 'add', 'origin', remote)

  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  await writeFile(
    resolve(worktree, 'package.json'),
    JSON.stringify({
      name: 'ergonui-hooks-fixture',
      private: true,
      type: 'module',
      scripts: {
        prepare: manifest.scripts.prepare,
        'lint:staged': manifest.scripts['lint:staged'],
        commitlint: manifest.scripts.commitlint,
        commit: manifest.scripts.commit,
        verify: 'bun verification.mjs',
      },
      config: manifest.config,
    }),
  )
  for (const file of [
    '.gitattributes',
    '.prettierrc.json',
    '.prettierignore',
    'commitlint.config.js',
    'eslint.config.js',
    'lint-staged.config.js',
  ])
    await copyFile(resolve(root, file), resolve(worktree, file))
  await mkdir(resolve(worktree, '.husky'))
  for (const hook of ['pre-commit', 'commit-msg', 'pre-push'])
    await copyFile(resolve(root, '.husky', hook), resolve(worktree, '.husky', hook))
  await symlink(resolve(root, 'node_modules'), resolve(worktree, 'node_modules'), 'junction')
  await writeFile(
    resolve(worktree, '.gitignore'),
    'node_modules/\n.husky/_/\n.verification-result\n',
  )
  await writeFile(
    resolve(worktree, 'verification.mjs'),
    `import { readFileSync } from 'node:fs'\nif (readFileSync('.verification-result', 'utf8') !== 'pass') { console.error('Fixture quality check failed'); process.exit(1) }\n`,
  )
  await writeFile(resolve(worktree, '.verification-result'), 'pass')
  const example = resolve(worktree, 'example.ts')
  await writeFile(example, 'export const first = 1\nexport const second = 2\n')
  run([process.execPath, 'run', 'prepare'])
  assert.equal(git('config', '--get', 'core.hooksPath'), '.husky/_')
  git('add', '.')
  git('commit', '-m', 'chore(tooling): configure hook fixture')
  const initial = git('rev-parse', 'HEAD')
  console.log('PASS: valid Conventional Commit accepted through Husky')

  await writeFile(example, 'export const first=3;\nexport const second = 2\n')
  git('add', 'example.ts')
  const rejected = run(['git', 'commit', '-m', 'update stuff'], worktree, true)
  assert.match(rejected, /subject-empty|type-empty/)
  assert.equal(git('rev-parse', 'HEAD'), initial)
  console.log('PASS: invalid commit message blocked without creating a commit')

  await writeFile(example, 'export const first=4;\nexport const second = 2\n')
  git('add', 'example.ts')
  await writeFile(example, 'export const first=4;\nexport const second = 9\n')
  git('commit', '-m', 'fix(fixture): update first value')
  assert.equal(git('show', 'HEAD:example.ts'), 'export const first = 4\nexport const second = 2')
  assert.equal(await readFile(example, 'utf8'), 'export const first = 4\nexport const second = 9\n')
  console.log('PASS: staged code formatted while unstaged edits remain uncommitted')

  await writeFile(
    resolve(worktree, 'README.md'),
    '# Hook fixture\n\nA documentation-only commit.\n',
  )
  git('add', 'README.md')
  git('commit', '-m', 'docs(fixture): add guide')
  console.log('PASS: documentation-only commits skip ESLint and still run Prettier')

  await writeFile(resolve(worktree, '.verification-result'), 'fail')
  const blockedPush = run(['git', 'push', 'origin', 'main'], worktree, true)
  assert.match(blockedPush, /Fixture quality check failed/)
  run(['git', '--git-dir', remote, 'rev-parse', '--verify', 'refs/heads/main'], fixture, true)
  await writeFile(resolve(worktree, '.verification-result'), 'pass')
  git('push', 'origin', 'main')
  assert.equal(
    run(['git', '--git-dir', remote, 'rev-parse', 'refs/heads/main'], fixture),
    git('rev-parse', 'HEAD'),
  )
  console.log('PASS: failed verification blocks push; passing verification allows local push')

  const head = git('rev-parse', 'HEAD')
  const lintInvalid = 'debugger;\nexport const first=5;\n'
  await writeFile(example, lintInvalid)
  git('add', 'example.ts')
  const lintFailure = run(['git', 'commit', '-m', 'fix(fixture): test lint gate'], worktree, true)
  assert.match(lintFailure, /no-debugger/)
  assert.doesNotMatch(lintFailure, /\[STARTED\] prettier/)
  assert.equal(await readFile(example, 'utf8'), lintInvalid)
  assert.equal(git('rev-parse', 'HEAD'), head)
  console.log('PASS: ESLint errors block commits before Prettier starts')

  await writeFile(example, 'export const first =\n')
  git('add', 'example.ts')
  const syntaxFailure = run(
    ['git', 'commit', '-m', 'fix(fixture): test syntax gate'],
    worktree,
    true,
  )
  assert.match(syntaxFailure, /Parsing error|SyntaxError|Unexpected token/)
  assert.equal(git('rev-parse', 'HEAD'), head)
  console.log('PASS: staged syntax errors block commits')
} finally {
  await writeFile(resolve(fixture, 'verification.log'), log.join('\n'))
  console.log(`Hook verification artifacts: ${fixture}`)
}
