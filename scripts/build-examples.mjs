// Builds the examples as consumers would: each one is copied out of the
// workspace, installed with npm from the packed tarballs and the chosen
// framework majors, and built. This checks what only a framework can: the
// Astro components, the react-server entries, and one React context shared
// by the entry points. The static Astro example also renders the Link
// component of the astro-i18n-tiny alias, and the Next.js examples must
// include the proxy (as middleware.ts on Next.js 15).
//
//   node scripts/pack.mjs <tarballs>        (with pnpm, after pnpm build)
//   node scripts/build-examples.mjs --tarballs <tarballs> --astro 6 --next 15 --react 18

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { frameworkVersions, hasMiddleware, middlewareFromProxy, rewriteManifest } from './lib/examples.mjs'

const root = resolve(import.meta.dirname, '..')
const { values: options } = parseArgs({
  options: {
    tarballs: { type: 'string' },
    astro: { type: 'string' },
    next: { type: 'string' },
    react: { type: 'string' }
  }
})
if (!options.tarballs || !options.astro || !options.next || !options.react) {
  console.error('Usage: node scripts/build-examples.mjs --tarballs <dir> --astro <major> --next <major> --react <major>')
  process.exit(2)
}
const majors = { astro: Number(options.astro), next: Number(options.next), react: Number(options.react) }
const versions = frameworkVersions(majors)

// The packed packages, read from the tarballs.
const tarballDir = resolve(options.tarballs)
const packages = {}
for (const file of readdirSync(tarballDir).filter((f) => f.endsWith('.tgz'))) {
  const tarball = join(tarballDir, file)
  const manifest = JSON.parse(execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf-8' }))
  packages[manifest.name] = { tarball, dependencies: manifest.dependencies }
}
if (Object.keys(packages).length !== 7) throw new Error(`expected the 7 packed packages in ${tarballDir}, found ${Object.keys(packages).join(', ')}`)

const work = mkdtempSync(join(tmpdir(), 'i18n-tiny-examples-'))
const shown = ['astro', '@astrojs/node', 'next', 'react', 'react-dom', '@types/react', 'typescript', 'vite']
const results = []

// The static Astro example also builds a page with the alias's Link, and the
// built page must contain the link.
const aliasPage = `---
import Link from 'astro-i18n-tiny/router/Link.astro'
---

<Link href="/about" data-check="alias-link">About</Link>
`
const findInBuild = (dir, needle) => readdirSync(dir).some((name) => {
  const full = join(dir, name)
  if (statSync(full).isDirectory()) return findInBuild(full, needle)
  return name.endsWith('.html') && readFileSync(full, 'utf-8').includes(needle)
})

for (const example of ['astro', 'astro-ssr', 'next', 'next-ssr', 'react']) {
  const source = join(root, 'examples', example)
  const dir = join(work, example)
  const files = execFileSync('git', ['ls-files', '-z', '--', '.'], { cwd: source, encoding: 'utf-8' }).split('\0').filter(Boolean)
  for (const file of files) {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), readFileSync(join(source, file)))
  }
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
  const extra = example === 'astro' ? ['astro-i18n-tiny'] : []
  writeFileSync(join(dir, 'package.json'), JSON.stringify(rewriteManifest(manifest, { packages, versions, extra }), null, 2) + '\n')
  if (example === 'astro') writeFileSync(join(dir, 'src/pages/alias-link.astro'), aliasPage)
  if (example.startsWith('next') && majors.next === 15) {
    writeFileSync(join(dir, 'middleware.ts'), middlewareFromProxy(readFileSync(join(dir, 'proxy.ts'), 'utf-8')))
    rmSync(join(dir, 'proxy.ts'))
  }

  console.log(`\n=== ${example}: npm install`)
  const result = { example, versions: '', install: 'FAIL', build: '-', check: '-' }
  results.push(result)
  if (spawnSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit' }).status !== 0) continue
  result.install = 'ok'
  result.versions = shown.flatMap((name) => {
    try {
      return [`${name}@${JSON.parse(readFileSync(join(dir, 'node_modules', name, 'package.json'), 'utf-8')).version}`]
    } catch {
      return []
    }
  }).join(' ')

  console.log(`\n=== ${example}: npm run build (${result.versions})`)
  result.build = spawnSync('npm', ['run', 'build'], { cwd: dir, stdio: 'inherit' }).status === 0 ? 'ok' : 'FAIL'
  if (example === 'astro' && result.build === 'ok') {
    result.check = findInBuild(join(dir, 'dist'), 'data-check="alias-link"') ? 'alias Link ok' : 'FAIL: alias Link not rendered'
  }
  // A Next.js build succeeds without a middleware too, so check that the
  // proxy (middleware.ts on Next.js 15) made it into the build.
  if (example.startsWith('next') && result.build === 'ok') {
    const manifest = (file) => {
      const full = join(dir, '.next/server', file)
      return existsSync(full) ? JSON.parse(readFileSync(full, 'utf-8')) : undefined
    }
    result.check = hasMiddleware(manifest('middleware-manifest.json'), manifest('functions-config-manifest.json'))
      ? 'middleware ok'
      : 'FAIL: no middleware in the build'
  }
}

console.log(`\nNode ${process.version}, Astro ${majors.astro}, Next.js ${majors.next}, React ${majors.react} (${work})`)
for (const r of results) {
  console.log(`${r.example.padEnd(10)} install ${r.install.padEnd(4)} build ${r.build.padEnd(4)} ${r.check === '-' ? '' : r.check + '  '}${r.versions}`)
}
const failed = results.some((r) => r.install !== 'ok' || r.build !== 'ok' || r.check.startsWith('FAIL'))
if (failed) process.exit(1)
rmSync(work, { recursive: true, force: true })
