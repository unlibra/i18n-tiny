import { test } from 'node:test'
import assert from 'node:assert/strict'
import { frameworkVersions, hasMiddleware, middlewareFromProxy, rewriteManifest } from '../lib/examples.mjs'

const packages = {
  '@i18n-tiny/core': { tarball: '/t/core.tgz', dependencies: undefined },
  '@i18n-tiny/react': { tarball: '/t/react.tgz', dependencies: { '@i18n-tiny/core': '2.0.0' } },
  '@i18n-tiny/next': { tarball: '/t/next.tgz', dependencies: { '@i18n-tiny/core': '2.0.0', '@i18n-tiny/react': '2.0.0' } },
  '@i18n-tiny/astro': { tarball: '/t/astro.tgz', dependencies: { '@i18n-tiny/core': '2.0.0' } },
  'astro-i18n-tiny': { tarball: '/t/astro-alias.tgz', dependencies: { '@i18n-tiny/astro': '2.0.0' } }
}

test('the chosen majors give the versions of each framework and its companions', () => {
  assert.deepEqual(frameworkVersions({ astro: 6, next: 15, react: 18 }), {
    astro: '^6.0.0',
    '@astrojs/node': '^10.0.0',
    next: '^15.0.0',
    react: '^18.0.0',
    'react-dom': '^18.0.0',
    '@types/react': '^18.0.0',
    '@types/react-dom': '^18.0.0'
  })
  assert.equal(frameworkVersions({ astro: 7, next: 16, react: 19 })['@astrojs/node'], '^11.0.0')
})

test('an unsupported or missing major is refused', () => {
  assert.throws(() => frameworkVersions({ astro: 5, next: 16, react: 19 }), /astro 5 is not supported/)
  assert.throws(() => frameworkVersions({ astro: 7, next: 16 }), /no react version/)
})

test('workspace dependencies become the tarballs, with the packages they depend on', () => {
  const pkg = rewriteManifest({
    name: 'example-next',
    dependencies: { '@i18n-tiny/next': 'workspace:*', next: '16.4.2', react: '^19.3.1' },
    devDependencies: { '@types/react': '^19.3.0', typescript: '^6.0.3' }
  }, { packages, versions: frameworkVersions({ astro: 7, next: 15, react: 18 }) })
  assert.deepEqual(pkg.dependencies, {
    next: '^15.0.0',
    react: '^18.0.0',
    '@i18n-tiny/core': 'file:/t/core.tgz',
    '@i18n-tiny/next': 'file:/t/next.tgz',
    '@i18n-tiny/react': 'file:/t/react.tgz'
  })
  assert.deepEqual(pkg.devDependencies, { '@types/react': '^18.0.0', typescript: '^6.0.3' })
})

test('extra packages are added with the packages they depend on', () => {
  const pkg = rewriteManifest({ name: 'example-astro', dependencies: { astro: '^7.4.2' } },
    { packages, versions: frameworkVersions({ astro: 6, next: 16, react: 19 }), extra: ['astro-i18n-tiny'] })
  assert.deepEqual(pkg.dependencies, {
    astro: '^6.0.0',
    '@i18n-tiny/astro': 'file:/t/astro.tgz',
    '@i18n-tiny/core': 'file:/t/core.tgz',
    'astro-i18n-tiny': 'file:/t/astro-alias.tgz'
  })
})

test('a workspace dependency that cannot be replaced is refused', () => {
  const versions = frameworkVersions({ astro: 7, next: 16, react: 19 })
  assert.throws(() => rewriteManifest({ name: 'x', dependencies: { '@i18n-tiny/core': 'workspace:^' } }, { packages, versions }), /cannot replace/)
  assert.throws(() => rewriteManifest({ name: 'x', dependencies: { other: 'workspace:*' } }, { packages, versions }), /cannot replace/)
})

test('the manifest given is not changed', () => {
  const manifest = { name: 'x', dependencies: { '@i18n-tiny/core': 'workspace:*' } }
  rewriteManifest(manifest, { packages, versions: frameworkVersions({ astro: 7, next: 16, react: 19 }) })
  assert.deepEqual(manifest, { name: 'x', dependencies: { '@i18n-tiny/core': 'workspace:*' } })
})

test('the Next.js 15 middleware is the proxy under the name middleware', () => {
  const proxy = "import { create } from '@i18n-tiny/next/proxy'\n\nexport const proxy = create({})\n\nexport const config = { matcher: ['/'] }\n"
  assert.equal(middlewareFromProxy(proxy), proxy.replace('export const proxy', 'export const middleware'))
  assert.throws(() => middlewareFromProxy('export default function proxy () {}'), /no `export const proxy`/)
})

test('a Next.js build has a middleware when either manifest lists one', () => {
  const empty = { version: 3, middleware: {}, sortedMiddleware: [], functions: {} }
  // Next.js 15: an Edge middleware
  assert.equal(hasMiddleware({ ...empty, middleware: { '/': { name: 'middleware' } } }, undefined), true)
  // Next.js 16: the proxy on the Node.js runtime
  assert.equal(hasMiddleware(empty, { version: 1, functions: { '/_middleware': { runtime: 'nodejs' } } }), true)
  assert.equal(hasMiddleware(empty, { version: 1, functions: {} }), false)
  assert.equal(hasMiddleware(empty, undefined), false)
  assert.equal(hasMiddleware(undefined, undefined), false)
})
