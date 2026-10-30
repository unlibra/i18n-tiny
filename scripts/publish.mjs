// Publishes the seven packages to npm. Run after `pnpm build`.
//
//   node scripts/publish.mjs --git-tag v2.0.0-beta.1 --dry-run
//   node scripts/publish.mjs --git-tag v2.0.0-beta.1 --publish
//
// In order:
//   1. The Git tag, the versions of the packages and the pinned dependencies
//      between them agree, and the tag points at the checked-out commit. The
//      commit is on a branch the release may come from (a release on
//      origin/main, a prerelease on origin/main or origin/v2), and the CI
//      workflow has succeeded on it (read with gh).
//   2. check:packages packs and checks the tarballs, and size checks the
//      browser bundles.
//   3. The packed tarballs agree with the tag too (pnpm has replaced
//      workspace:* with the version by then).
//   4. Each tarball that is not on the registry yet is published, with the
//      dist-tag "next" for a prerelease and "latest" for a release. Versions
//      already published are skipped, so a failed run can be run again.
//
// --dry-run runs every step but passes --dry-run to npm publish. In a dry run
// without the tag, the checked-out commit is checked instead. --skip-ci-check
// (dry run only) leaves out the check of the CI runs, for a commit that has
// not been pushed; the output says so.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import {
  PACKAGES, asPublished, checkCiRuns, checkReleaseBranch, checkVersions, distTagFor, packumentUrl, releaseBranchesFor, tarballName
} from './lib/release.mjs'

const root = resolve(import.meta.dirname, '..')
const { values: options } = parseArgs({
  options: {
    'git-tag': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    publish: { type: 'boolean', default: false },
    'skip-ci-check': { type: 'boolean', default: false }
  }
})
const gitTag = options['git-tag']
if (!gitTag || options['dry-run'] === options.publish || (options.publish && options['skip-ci-check'])) {
  console.error('Usage: node scripts/publish.mjs --git-tag <tag> (--dry-run [--skip-ci-check] | --publish)')
  process.exit(2)
}
const dryRun = options['dry-run']
const stop = (problems) => {
  console.error(`\nStopped before publishing anything:\n${problems.map((p) => `- ${p}`).join('\n')}`)
  process.exit(1)
}
const run = (command, args) => execFileSync(command, args, { cwd: root, stdio: 'inherit' })

// 1. Tag, versions and dependencies, as written in the repository.
const sources = PACKAGES.map((dir) => JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf-8')))
const version = gitTag.replace(/^v/, '')
const problems = checkVersions(gitTag, asPublished(sources))
let distTag
try {
  distTag = distTagFor(version)
} catch (error) {
  problems.push(error.message)
}
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf-8' }).trim()
const tagged = spawnSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${gitTag}^{commit}`], { cwd: root, encoding: 'utf-8' })
let tagNote
if (tagged.status === 0) {
  if (tagged.stdout.trim() !== head) problems.push(`the Git tag ${gitTag} points at ${tagged.stdout.trim()}, not at the checked-out commit ${head}`)
  tagNote = `points at ${head}`
} else if (dryRun) {
  tagNote = 'does not exist yet (allowed in a dry run)'
} else {
  problems.push(`the Git tag ${gitTag} does not exist`)
}
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf-8' })
const notes = []
if (distTag) {
  // The branches, as the remote-tracking refs have them (the publish
  // workflow fetches the whole history).
  const containing = []
  for (const branch of releaseBranchesFor(distTag)) {
    const ref = `refs/remotes/origin/${branch}`
    const tip = git(['rev-parse', '--verify', '--quiet', ref])
    if (tip.status !== 0) {
      notes.push(`origin/${branch}: not found`)
      continue
    }
    const onBranch = git(['merge-base', '--is-ancestor', head, ref]).status === 0
    notes.push(`origin/${branch} (${tip.stdout.trim().slice(0, 7)}): ${onBranch ? 'contains' : 'does not contain'} the commit`)
    if (onBranch) containing.push(branch)
  }
  problems.push(...checkReleaseBranch(distTag, head, containing))
}
if (options['skip-ci-check']) {
  notes.push('CI: NOT CHECKED (--skip-ci-check)')
} else {
  const repo = process.env.GITHUB_REPOSITORY ??
    /github\.com[/:]([^/]+\/[^/.]+)/.exec(JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8')).repository?.url ?? '')?.[1]
  const runs = repo && spawnSync('gh', [
    'run', 'list', '--repo', repo, '--workflow', 'ci.yml', '--commit', head,
    '--json', 'databaseId,headSha,status,conclusion,url', '--limit', '50'
  ], { cwd: root, encoding: 'utf-8' })
  if (!repo) {
    problems.push('CI not confirmed: the GitHub repository is unknown')
  } else if (runs.error || runs.status !== 0) {
    problems.push(`CI not confirmed: gh run list failed: ${runs.error?.message ?? runs.stderr.trim()}`)
  } else {
    const ci = checkCiRuns(JSON.parse(runs.stdout), head)
    problems.push(...ci)
    if (ci.length === 0) notes.push(`CI: succeeded on ${head.slice(0, 7)} (${repo})`)
  }
}
if (notes.length > 0) console.log(notes.join('\n'))
if (problems.length > 0) stop(problems)

console.log(`Release ${version} from ${gitTag} (${tagNote})`)
console.log(`npm dist-tag: ${distTag}${dryRun ? '  [dry run]' : ''}${options['skip-ci-check'] ? '  [CI not checked]' : ''}\n`)

// 2. Check the tarballs that will be published.
const tarballDir = mkdtempSync(join(tmpdir(), 'i18n-tiny-publish-'))
run('node', ['scripts/check-packages.mjs', '--pack-destination', tarballDir])
run('pnpm', ['size'])

// 3. The packed tarballs.
const tarballs = sources.map((pkg) => {
  const file = join(tarballDir, tarballName(pkg.name, pkg.version))
  if (!existsSync(file)) stop([`${file} was not packed`])
  const manifest = JSON.parse(execFileSync('tar', ['-xzOf', file, 'package/package.json'], { encoding: 'utf-8' }))
  return { name: pkg.name, file, manifest }
})
const packed = checkVersions(gitTag, tarballs.map((t) => t.manifest))
if (packed.length > 0) stop(packed)

// 4. Publish what the registry does not have yet.
const registry = execFileSync('npm', ['config', 'get', 'registry'], { cwd: root, encoding: 'utf-8' }).trim()
const isPublished = async (name) => {
  const response = await fetch(packumentUrl(registry, name), { headers: { accept: 'application/vnd.npm.install-v1+json' } })
  if (response.status === 404) return false
  if (!response.ok) throw new Error(`${registry}: ${response.status} ${response.statusText} for ${name}`)
  return Object.hasOwn((await response.json()).versions ?? {}, version)
}
const results = []
for (const { name, file } of tarballs) {
  if (await isPublished(name)) {
    results.push(`skipped    ${name}@${version} (already on ${registry})`)
    continue
  }
  const args = ['publish', file, '--tag', distTag, '--access', 'public', '--provenance', ...(dryRun ? ['--dry-run'] : [])]
  console.log(`\nnpm ${args.join(' ')}`)
  run('npm', args)
  results.push(`${dryRun ? 'would publish' : 'published '} ${name}@${version} with the tag ${distTag}`)
}
console.log(`\n${results.join('\n')}`)
if (dryRun) console.log(`\nDry run: nothing was published. The checked tarballs are in ${tarballDir}`)
if (options['skip-ci-check']) console.log('The CI runs of the commit were NOT checked (--skip-ci-check).')
