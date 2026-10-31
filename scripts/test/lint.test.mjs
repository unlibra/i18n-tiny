// Checks the lint rules that protect the published packages, by linting code
// as if it were a source file of a package.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { ESLint } from 'eslint'

const root = resolve(import.meta.dirname, '../..')
const eslint = new ESLint({ cwd: root })

async function restrictedSyntax (code, file = 'packages/core/src/example.ts') {
  const [result] = await eslint.lintText(code, { filePath: resolve(root, file) })
  return result.messages.filter((message) => message.ruleId === 'no-restricted-syntax').map((message) => message.line)
}

test('top-level await is an error in package sources', async () => {
  const code = [
    'const a = await Promise.resolve(1)',
    'for await (const x of [a]) { console.log(x) }',
    'if (a) { await Promise.resolve(2) }',
    'await using b = { async [Symbol.asyncDispose] () {} }',
    'export {}'
  ].join('\n')
  assert.deepEqual(await restrictedSyntax(code), [1, 2, 3, 4])
})

test('await inside functions is allowed', async () => {
  const code = [
    'export async function f () { const b = await Promise.resolve(1); for await (const y of [b]) { console.log(y) } return b }',
    'export const g = async () => await Promise.resolve(2)',
    'export class C { async m () { return await Promise.resolve(3) } }',
    'export async function h () { await using r = { async [Symbol.asyncDispose] () {} }; return r }'
  ].join('\n')
  assert.deepEqual(await restrictedSyntax(code), [])
})

test('tests may use top-level await', async () => {
  const code = 'await Promise.resolve(1)\nexport {}'
  assert.deepEqual(await restrictedSyntax(code, 'packages/core/src/__tests__/example.test.ts'), [])
})

// The lines that use a Node global, by name or as a property of globalThis
async function restrictedGlobals (code, file) {
  const [result] = await eslint.lintText(code, { filePath: resolve(root, file) })
  return result.messages
    .filter((message) => message.ruleId === 'no-restricted-globals' || message.ruleId === 'no-restricted-properties')
    .map((message) => message.line)
}

// The router and the middleware entries of the core run outside Node, and so
// do the files they load, the internal entry that the Astro middleware and
// the Next.js proxy import included.
const outsideNode = [
  'packages/core/src/router/paths.ts',
  'packages/core/src/middleware/index.ts',
  'packages/core/src/config.ts',
  'packages/core/src/detectLocale.ts',
  'packages/core/src/internal/index.ts',
  'packages/core/src/utils.ts'
]

for (const file of outsideNode) {
  test(`Node globals are an error in ${file}`, async () => {
    const code = [
      'export const a = process.env.X',
      'export const b = Buffer.from("x")',
      'export const c = __dirname',
      'export const d = globalThis.process',
      'export const e = globalThis["Buffer"]',
      'export const { process: f } = globalThis'
    ].join('\n')
    assert.deepEqual(await restrictedGlobals(code, file), [1, 2, 3, 4, 5, 6])
  })
}

test('globals that runtimes other than Node have too are allowed', async () => {
  const code = [
    'export const a = globalThis.fetch',
    'export const b = globalThis.crypto',
    'export const c = new URL("https://example.com")'
  ].join('\n')
  assert.deepEqual(await restrictedGlobals(code, 'packages/core/src/utils.ts'), [])
})

test('the tests of the core may use Node globals', async () => {
  assert.deepEqual(await restrictedGlobals('export const a = process.env.X', 'packages/core/src/__tests__/example.test.ts'), [])
})
