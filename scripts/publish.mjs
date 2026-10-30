// Publishes the seven packages to npm. Run after `pnpm build`.
//
//   node scripts/publish.mjs --git-tag v2.0.0-beta.1 --dry-run
//   node scripts/publish.mjs --git-tag v2.0.0-beta.1 --publish
//
// In order:
//   1. The Git tag, the versions of the packages and the pinned dependencies
//      between them agree, and the tag points at the checked-out commit.
//   2. check:packages packs and checks the tarballs, and size checks the
//      browser bundles.
//   3. The packed tarballs agree with the tag too (pnpm has replaced
//      workspace:* with the version by then).
//   4. Each tarball that is not on the registry yet is published, with the
//      dist-tag "next" for a prerelease and "latest" for a release. Versions
//      already published are skipped, so a failed run can be run again.
//
// --dry-run runs every step but passes --dry-run to npm publish.

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { PACKAGES, asPublished, checkVersions, distTagFor, packumentUrl, tarballName } from './lib/release.mjs'

const root = resolve(import.meta.dirname, '..')
const { values: options } = parseArgs({
  options: {
    'git-tag': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    publish: { type: 'boolean', default: false }
  }
})
const gitTag = options['git-tag']
if (!gitTag || options['dry-run'] === options.publish) {
  console.error('Usage: node scripts/publish.mjs --git-tag <tag> (--dry-run | --publish)')
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
if (problems.length > 0) stop(problems)

console.log(`Release ${version} from ${gitTag} (${tagNote})`)
console.log(`npm dist-tag: ${distTag}${dryRun ? '  [dry run]' : ''}\n`)

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
