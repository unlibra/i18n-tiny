// Checks the packages as consumers receive them, which the build and the
// tests cannot see: lints each one with publint, packs it, installs the
// tarballs into a scratch project, and resolves every export with the import
// and require conditions (and react-server). Run after `pnpm build`.

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const packageDirs = [
  ...['core', 'react', 'next', 'astro'].map((name) => `packages/${name}`),
  ...readdirSync(join(root, 'packages/aliases')).map((name) => `packages/aliases/${name}`)
]

const work = mkdtempSync(join(tmpdir(), 'i18n-tiny-packages-'))
const tarballDir = join(work, 'tarballs')

for (const dir of packageDirs) {
  console.log(`publint ${dir}`)
  execFileSync('pnpm', ['exec', 'publint', '--strict', dir], { cwd: root, stdio: 'inherit' })
  execFileSync('pnpm', ['pack', '--pack-destination', tarballDir], { cwd: join(root, dir), stdio: 'ignore' })
}

const project = join(work, 'project')
mkdirSync(project)
writeFileSync(join(project, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
const tarballs = readdirSync(tarballDir).map((file) => join(tarballDir, file))
// The aliases depend on the exact @i18n-tiny versions being packed here, so
// npm installs those tarballs instead of fetching them. Peers are not needed
// to resolve exports.
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--legacy-peer-deps', ...tarballs], {
  cwd: project,
  stdio: 'inherit'
})

const names = packageDirs.map((dir) => JSON.parse(readFileSync(join(root, dir, 'package.json'), 'utf-8')).name)
writeFileSync(join(project, 'resolve.mjs'), `
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const hasRuntimeTarget = (target) =>
  typeof target === 'string' ||
  (target !== null && typeof target === 'object' &&
    Object.entries(target).some(([condition, value]) => condition !== 'types' && hasRuntimeTarget(value)))

let failed = false
for (const name of ${JSON.stringify(names)}) {
  const { exports } = JSON.parse(readFileSync(new URL('./node_modules/' + name + '/package.json', import.meta.url), 'utf-8'))
  for (const [subpath, target] of Object.entries(exports)) {
    if (subpath.includes('*') || !hasRuntimeTarget(target)) continue
    const specifier = name + subpath.slice(1)
    for (const [condition, resolveSpecifier] of [
      ['import', (s) => fileURLToPath(import.meta.resolve(s))],
      ['require', (s) => require.resolve(s)]
    ]) {
      try {
        const file = resolveSpecifier(specifier)
        if (!existsSync(file)) throw new Error('resolved to a missing file: ' + file)
        console.log('ok   ' + condition.padEnd(8) + specifier)
      } catch (error) {
        failed = true
        console.error('FAIL ' + condition.padEnd(8) + specifier + ': ' + (error.code ?? error.message))
      }
    }
  }
}
if (failed) process.exit(1)
`)

for (const conditions of [[], ['--conditions=react-server']]) {
  console.log(`\nResolving exports${conditions.length ? ` with ${conditions.join(' ')}` : ''}`)
  execFileSync('node', [...conditions, 'resolve.mjs'], { cwd: project, stdio: 'inherit' })
}
