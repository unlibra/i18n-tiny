import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PACKAGES, asPublished, checkVersions, distTagFor, packumentUrl, tarballName } from '../lib/release.mjs'

test('a prerelease is published with the tag next', () => {
  for (const version of ['2.0.0-beta.1', '2.0.0-rc.0', '2.1.0-alpha', '3.0.0-0']) {
    assert.equal(distTagFor(version), 'next', version)
  }
})

test('a release is published with the tag latest', () => {
  for (const version of ['2.0.0', '2.10.3', '0.0.1']) {
    assert.equal(distTagFor(version), 'latest', version)
  }
})

test('a version npm would reject, or one with build metadata, is refused', () => {
  for (const version of ['2.0', 'v2.0.0', '2.0.0-', '2.0.0-beta..1', '02.0.0', '2.0.0+build.1', '2.0.0-beta.1+sha', '']) {
    assert.throws(() => distTagFor(version), /not a version/, version)
  }
})

const packages = (version, overrides = {}) => [
  { name: '@i18n-tiny/core', version },
  { name: '@i18n-tiny/react', version, dependencies: { '@i18n-tiny/core': version }, peerDependencies: { react: '^18.0.0 || ^19.0.0' } },
  { name: 'react-i18n-tiny', version, dependencies: { '@i18n-tiny/react': version } }
].map((pkg) => ({ ...pkg, ...overrides[pkg.name] }))

test('matching tag, versions and pinned dependencies pass', () => {
  assert.deepEqual(checkVersions('v2.0.0-beta.1', packages('2.0.0-beta.1')), [])
})

test('a tag that names another version stops the release', () => {
  const problems = checkVersions('v2.0.0-beta.2', packages('2.0.0-beta.1'))
  assert.equal(problems.length, 5)
  assert.ok(problems.every((p) => p.includes('v2.0.0-beta.2')))
})

test('one package at another version stops the release', () => {
  const problems = checkVersions('v2.0.0', packages('2.0.0', { '@i18n-tiny/core': { version: '2.0.0-beta.1' } }))
  assert.deepEqual(problems, ['@i18n-tiny/core is version 2.0.0-beta.1, but the Git tag is v2.0.0'])
})

test('an alias pinned to another version stops the release', () => {
  const problems = checkVersions('v2.0.0', packages('2.0.0', { 'react-i18n-tiny': { dependencies: { '@i18n-tiny/react': '1.3.0' } } }))
  assert.deepEqual(problems, ['react-i18n-tiny has dependencies.@i18n-tiny/react "1.3.0", but the Git tag is v2.0.0'])
})

test('a dependency on a package that is not pinned stops the release', () => {
  for (const range of ['^2.0.0', 'workspace:*', 'workspace:^']) {
    const problems = checkVersions('v2.0.0', packages('2.0.0', { '@i18n-tiny/react': { dependencies: { '@i18n-tiny/core': range } } }))
    assert.equal(problems.length, 1, range)
  }
})

test('a tag without the v prefix stops the release', () => {
  assert.match(checkVersions('2.0.0', packages('2.0.0'))[0], /does not start with "v"/)
})

test('the packages are published after the packages they depend on', () => {
  const order = PACKAGES.map((dir) => dir.split('/').pop())
  assert.deepEqual(order, ['core', 'react', 'next', 'astro', 'react-i18n-tiny', 'next-i18n-tiny', 'astro-i18n-tiny'])
})

test('tarball names and packument URLs', () => {
  assert.equal(tarballName('@i18n-tiny/core', '2.0.0-beta.1'), 'i18n-tiny-core-2.0.0-beta.1.tgz')
  assert.equal(tarballName('next-i18n-tiny', '2.0.0'), 'next-i18n-tiny-2.0.0.tgz')
  assert.equal(packumentUrl('https://registry.npmjs.org/', '@i18n-tiny/core'), 'https://registry.npmjs.org/@i18n-tiny%2Fcore')
  assert.equal(packumentUrl('https://registry.example.com', 'next-i18n-tiny'), 'https://registry.example.com/next-i18n-tiny')
})

test('workspace:* is read as the version of the package it points at, as pnpm pack writes it', () => {
  const sources = [
    { name: '@i18n-tiny/core', version: '2.0.0' },
    { name: '@i18n-tiny/astro', version: '2.0.1', dependencies: { '@i18n-tiny/core': 'workspace:*', other: '^1.0.0' } }
  ]
  const [, astro] = asPublished(sources)
  assert.deepEqual(astro.dependencies, { '@i18n-tiny/core': '2.0.0', other: '^1.0.0' })
  assert.deepEqual(checkVersions('v2.0.0', asPublished(sources)), ['@i18n-tiny/astro is version 2.0.1, but the Git tag is v2.0.0'])
})

test('other workspace: ranges are left as they are, so the check refuses them', () => {
  const [, react] = asPublished([
    { name: '@i18n-tiny/core', version: '2.0.0' },
    { name: '@i18n-tiny/react', version: '2.0.0', dependencies: { '@i18n-tiny/core': 'workspace:^' } }
  ])
  assert.equal(react.dependencies['@i18n-tiny/core'], 'workspace:^')
})
