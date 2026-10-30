// Copied into the scratch project by check-packages.mjs and run there, so
// that the specifiers resolve from the installed tarballs. Imports and
// requires each specifier given in the JSON file and prints, as JSON, the
// export names each way or the error.
//
//   node check-runtime.mjs <specifiers.json> [--conditions=...]

import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const specifiers = JSON.parse(readFileSync(process.argv[2], 'utf-8'))

const names = (namespace) => Object.keys(namespace).filter((name) => name !== '__esModule').sort()
const describe = (error) => (error.code ? `${error.code}: ` : '') + String(error.message).split('\n')[0]

const results = {}
for (const specifier of specifiers) {
  const result = {}
  try {
    result.import = names(await import(specifier))
  } catch (error) {
    result.importError = describe(error)
  }
  try {
    result.require = names(require(specifier))
  } catch (error) {
    result.requireError = describe(error)
  }
  results[specifier] = result
}
process.stdout.write(JSON.stringify(results))
