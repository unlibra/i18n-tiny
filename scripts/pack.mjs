// Packs the seven packages into a directory, as they would be published.
// Run after `pnpm build`.
//
//   node scripts/pack.mjs <dir>

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PACKAGES } from './lib/release.mjs'

const root = resolve(import.meta.dirname, '..')
const dir = process.argv[2] && resolve(process.argv[2])
if (!dir) {
  console.error('Usage: node scripts/pack.mjs <dir>')
  process.exit(2)
}
if (existsSync(dir) && readdirSync(dir).length > 0) throw new Error(`${dir} is not empty`)
mkdirSync(dir, { recursive: true })
for (const pkg of PACKAGES) {
  execFileSync('pnpm', ['pack', '--pack-destination', dir], { cwd: join(root, pkg), stdio: 'ignore' })
}
console.log(readdirSync(dir).join('\n'))
