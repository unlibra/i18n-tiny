// The rules of a release, kept free of side effects so they can be tested:
// which npm dist-tag a version gets, and whether the Git tag, the versions
// of the packages and the pinned dependencies of the aliases agree.

// The published packages, in the order they are published: each one after
// the packages it depends on.
export const PACKAGES = [
  'packages/core',
  'packages/react',
  'packages/next',
  'packages/astro',
  'packages/aliases/react-i18n-tiny',
  'packages/aliases/next-i18n-tiny',
  'packages/aliases/astro-i18n-tiny'
]

const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

/**
 * The npm dist-tag for a version: "next" for a prerelease (2.0.0-beta.1),
 * "latest" for a release (2.0.0). A version npm would not accept, or one with
 * build metadata, is refused.
 */
export function distTagFor (version) {
  const match = VERSION.exec(version)
  if (!match) throw new Error(`"${version}" is not a version this release process accepts (MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-PRERELEASE)`)
  return match[4] === undefined ? 'latest' : 'next'
}

/**
 * Checks that the Git tag names the version of every package, and that every
 * dependency on one of the packages is pinned to that same version. `manifests`
 * are package.json objects; the dependencies are read as they are published
 * (from the packed tarballs, where pnpm has replaced workspace:*). Returns
 * the problems, empty when they all agree.
 */
export function checkVersions (gitTag, manifests) {
  const problems = []
  if (!/^v/.test(gitTag)) problems.push(`the Git tag "${gitTag}" does not start with "v"`)
  const version = gitTag.replace(/^v/, '')
  const names = new Set(manifests.map((pkg) => pkg.name))
  for (const pkg of manifests) {
    if (pkg.version !== version) problems.push(`${pkg.name} is version ${pkg.version}, but the Git tag is ${gitTag}`)
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [dependency, range] of Object.entries(pkg[field] ?? {})) {
        if (names.has(dependency) && range !== version) {
          problems.push(`${pkg.name} has ${field}.${dependency} "${range}", but the Git tag is ${gitTag}`)
        }
      }
    }
  }
  return problems
}

/** The file name pnpm pack gives a package's tarball. */
export function tarballName (name, version) {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
}

/** The packument URL of a package on a registry. */
export function packumentUrl (registry, name) {
  return registry.replace(/\/?$/, '/') + name.replace('/', '%2F')
}

/**
 * The manifests as pnpm pack will publish them: a "workspace:*" dependency on
 * one of the packages becomes that package's version. Any other workspace:
 * range would not be pinned, so it is left as it is for checkVersions to
 * refuse.
 */
export function asPublished (manifests) {
  const versions = new Map(manifests.map((pkg) => [pkg.name, pkg.version]))
  const pin = (deps) => deps && Object.fromEntries(Object.entries(deps).map(([name, range]) =>
    [name, range === 'workspace:*' && versions.has(name) ? versions.get(name) : range]))
  return manifests.map((pkg) => ({ ...pkg, dependencies: pin(pkg.dependencies), peerDependencies: pin(pkg.peerDependencies) }))
}

/**
 * The branches a release may be published from: a release only from main, a
 * prerelease from main or v2, where the 2.0 prereleases are made.
 */
export function releaseBranchesFor (distTag) {
  if (distTag === 'latest') return ['main']
  if (distTag === 'next') return ['main', 'v2']
  throw new Error(`unknown dist-tag "${distTag}"`)
}

/**
 * Checks that the commit to publish is on one of the branches its dist-tag
 * allows. `containing` lists the branches whose remote-tracking ref contains
 * the commit.
 */
export function checkReleaseBranch (distTag, commit, containing) {
  const allowed = releaseBranchesFor(distTag)
  if (allowed.some((branch) => containing.includes(branch))) return []
  return [`the commit ${commit} is not on ${allowed.map((b) => `origin/${b}`).join(' or ')}, where a version with the tag ${distTag} is published from`]
}

/**
 * Checks the runs of the CI workflow (as `gh run list --json
 * databaseId,headSha,status,conclusion,url` gives them) for a successful one
 * of the commit. Returns the problems, empty when one succeeded.
 */
export function checkCiRuns (runs, commit) {
  const own = runs.filter((run) => run.headSha === commit)
  if (own.some((run) => run.status === 'completed' && run.conclusion === 'success')) return []
  if (own.length === 0) return [`the CI workflow has not run on the commit ${commit}`]
  return [`the CI workflow has not succeeded on the commit ${commit}: ${own.map((run) => `${run.status}/${run.conclusion || '-'} ${run.url}`).join(', ')}`]
}
