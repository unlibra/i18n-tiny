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
    'export {}'
  ].join('\n')
  assert.deepEqual(await restrictedSyntax(code), [1, 2, 3])
})

test('await inside functions is allowed', async () => {
  const code = [
    'export async function f () { const b = await Promise.resolve(1); for await (const y of [b]) { console.log(y) } return b }',
    'export const g = async () => await Promise.resolve(2)',
    'export class C { async m () { return await Promise.resolve(3) } }'
  ].join('\n')
  assert.deepEqual(await restrictedSyntax(code), [])
})

test('tests may use top-level await', async () => {
  const code = 'await Promise.resolve(1)\nexport {}'
  assert.deepEqual(await restrictedSyntax(code, 'packages/core/src/__tests__/example.test.ts'), [])
})
