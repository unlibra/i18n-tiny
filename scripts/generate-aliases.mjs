// Generates the alias packages in packages/aliases from the packages they
// stand for (see scripts/lib/aliases.mjs). Run after `pnpm build`, since it
// reads the built entry points.
//
//   node scripts/generate-aliases.mjs           writes the aliases
//   node scripts/generate-aliases.mjs --check   fails if they are out of date

import { resolve } from 'node:path'
import { diffAlias, planAliases, writeAlias } from './lib/aliases.mjs'

const root = resolve(import.meta.dirname, '..')
const check = process.argv.includes('--check')

const problems = []
for (const [aliasDir, files] of planAliases(root)) {
  if (check) problems.push(...diffAlias(aliasDir, files))
  else writeAlias(aliasDir, files)
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  console.error('\nThe alias packages are out of date. Run `pnpm aliases` and commit the result.')
  process.exit(1)
}
console.log(check ? 'The alias packages are up to date.' : 'Generated the alias packages.')
