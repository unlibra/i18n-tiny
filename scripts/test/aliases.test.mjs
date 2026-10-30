import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { diffAlias, planAlias, sourceHasDefault, sourceIsModule, writeAlias } from '../lib/aliases.mjs'

const alias = {
  name: 'pkg-alias',
  description: 'Alias of @scope/pkg',
  keywords: ['i18n'],
  author: 'someone',
  license: 'MIT',
  homepage: 'https://example.com'
}

// Answers for planAlias from a table of files of the aliased package.
function inspect ({ defaults = [], scripts = [], dirs = {} } = {}) {
  return {
    hasDefault: (file) => defaults.includes(file),
    isModule: (file) => !scripts.includes(file),
    list: (dir) => {
      if (!dirs[dir]) throw new Error(`no directory ${dir}`)
      return dirs[dir]
    }
  }
}

function plan (body, options, aliasPkg = alias) {
  const files = planAlias({
    body: { name: '@scope/pkg', version: '2.0.0-beta.1', ...body },
    alias: aliasPkg,
    inspect: inspect(options)
  })
  return { files, pkg: JSON.parse(files.get('package.json')) }
}

test('a JS entry re-exports the module and its types', () => {
  const { files, pkg } = plan({
    exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } }
  })
  assert.equal(files.get('index.js'), "// Alias of @scope/pkg: re-exports it unchanged.\nexport * from '@scope/pkg'\n")
  assert.equal(files.get('index.d.ts'), files.get('index.js'))
  assert.deepEqual(pkg.exports, { '.': { types: './index.d.ts', default: './index.js' } })
  assert.equal(pkg.main, './index.js')
  assert.equal(pkg.types, './index.d.ts')
})

test('a JS entry with a default export also re-exports the default', () => {
  const { files } = plan({
    exports: { './sub': { types: './dist/sub.d.ts', default: './dist/sub.js' } }
  }, { defaults: ['dist/sub.js', 'dist/sub.d.ts'] })
  assert.match(files.get('sub.js'), /^export \* from '@scope\/pkg\/sub'$/m)
  assert.match(files.get('sub.js'), /^export \{ default \} from '@scope\/pkg\/sub'$/m)
  assert.match(files.get('sub.d.ts'), /^export \{ default \} from '@scope\/pkg\/sub'$/m)
})

test('the default is re-exported only where the aliased file has one', () => {
  const { files } = plan({
    exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } }
  }, { defaults: ['dist/index.js'] })
  assert.match(files.get('index.js'), /export \{ default \}/)
  assert.doesNotMatch(files.get('index.d.ts'), /export \{ default \}/)
})

test('a types-only entry gets only a .d.ts and a types condition', () => {
  const { files, pkg } = plan({
    exports: {
      './globals': { types: './src/globals.d.ts' },
      './typed': { types: './dist/typed.d.ts' }
    }
  }, { scripts: ['src/globals.d.ts'] })
  assert.deepEqual(pkg.exports, { './globals': { types: './globals.d.ts' }, './typed': { types: './typed.d.ts' } })
  assert.equal(files.has('globals.js'), false)
  assert.equal(files.has('typed.js'), false)
  // A global script cannot be re-exported, so the alias references it.
  assert.match(files.get('globals.d.ts'), /^\/\/\/ <reference types="@scope\/pkg\/globals" \/>$/m)
  assert.match(files.get('typed.d.ts'), /^export \* from '@scope\/pkg\/typed'$/m)
  assert.equal(pkg.main, undefined)
})

test('a conditional entry keeps the conditions, each with its own files', () => {
  const { files, pkg } = plan({
    exports: {
      '.': {
        'react-server': { types: './dist/server.d.ts', default: './dist/server.js' },
        types: './dist/client.d.ts',
        default: './dist/client.js'
      }
    }
  }, { defaults: ['dist/server.js'] })
  assert.deepEqual(pkg.exports, {
    '.': {
      'react-server': { types: './index.react-server.d.ts', default: './index.react-server.js' },
      types: './index.d.ts',
      default: './index.js'
    }
  })
  assert.deepEqual(Object.keys(pkg.exports['.']), ['react-server', 'types', 'default'])
  assert.match(files.get('index.react-server.js'), /export \{ default \} from '@scope\/pkg'/)
  assert.doesNotMatch(files.get('index.js'), /default/)
})

test('a wildcard of Astro components gets one wrapper per component', () => {
  const { files, pkg } = plan({
    exports: { './router/*': './src/router/*' }
  }, { dirs: { 'src/router': ['A.astro', 'Link.astro'] } })
  assert.deepEqual(pkg.exports, { './router/*': './router/*' })
  assert.deepEqual([...files.keys()].filter((f) => f !== 'package.json'), ['router/A.astro', 'router/Link.astro'])
  const wrapper = files.get('router/Link.astro')
  assert.match(wrapper, /^import Component from '@scope\/pkg\/router\/Link\.astro'$/m)
  assert.match(wrapper, /^type Props = ComponentProps<typeof Component>$/m)
  assert.match(wrapper, /<Component \{\.\.\.Astro\.props\}><slot \/><\/Component>/)
  assert.deepEqual(pkg.files, ['router'])
})

test('a wildcard with a file that is not an Astro component is refused', () => {
  assert.throws(() => plan({ exports: { './router/*': './src/router/*' } }, { dirs: { 'src/router': ['a.ts'] } }), /only \.astro/)
})

test('unsupported export shapes are refused', () => {
  const shapes = [
    { '.': './dist/index.js' },
    { '.': { default: './dist/index.js' } },
    { '.': { import: './dist/index.js' } },
    { '.': {} },
    { './a/*/b': './src/*/b' },
    { './*': './src/*.js' }
  ]
  for (const exports of shapes) {
    assert.throws(() => plan({ exports }, { dirs: { src: ['x.astro'] } }), Error, JSON.stringify(exports))
  }
})

test('package.json pins the package and copies its versions, engines and peers', () => {
  const { pkg } = plan({
    exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } },
    engines: { node: '>=22.12' },
    peerDependencies: { react: '^18.0.0 || ^19.0.0' }
  })
  assert.equal(pkg.version, '2.0.0-beta.1')
  assert.equal(pkg.type, 'module')
  assert.deepEqual(pkg.dependencies, { '@scope/pkg': '2.0.0-beta.1' })
  assert.deepEqual(pkg.engines, { node: '>=22.12' })
  assert.deepEqual(pkg.peerDependencies, { react: '^18.0.0 || ^19.0.0' })
  assert.deepEqual(pkg.files, ['index.d.ts', 'index.js'])
})

test('package.json keeps the hand-written fields and replaces the generated ones', () => {
  const { pkg } = plan({
    exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } }
  }, {}, { ...alias, version: '1.0.0', exports: { './old': './old.cjs' }, dependencies: { '@scope/pkg': '1.0.0' } })
  for (const field of ['name', 'description', 'keywords', 'author', 'license', 'homepage']) {
    assert.deepEqual(pkg[field], alias[field], field)
  }
  assert.equal(pkg.version, '2.0.0-beta.1')
  assert.deepEqual(Object.keys(pkg.exports), ['.'])
  assert.deepEqual(pkg.dependencies, { '@scope/pkg': '2.0.0-beta.1' })
})

test('an unknown field in the alias package.json is refused rather than dropped', () => {
  assert.throws(() => plan({ exports: { '.': { types: './a.d.ts', default: './a.js' } } }, {}, { ...alias, funding: 'x' }), /unknown field "funding"/)
})

test('default exports are found in JS and declaration files', () => {
  assert.equal(sourceHasDefault('a.js', 'const a = 1\nexport { a as default }'), true)
  assert.equal(sourceHasDefault('a.js', 'export default function f () {}'), true)
  assert.equal(sourceHasDefault('a.js', 'export default 1'), true)
  assert.equal(sourceHasDefault('a.d.ts', 'declare const x: number\nexport default x'), true)
  assert.equal(sourceHasDefault('a.d.ts', 'export { default } from "./b"'), true)
  assert.equal(sourceHasDefault('a.js', 'export * from "./b"\nexport { a, b as c }'), false)
  assert.equal(sourceHasDefault('a.js', 'const defaultValue = 1\nexport { defaultValue }'), false)
})

test('a declaration file is a module only when it imports or exports', () => {
  assert.equal(sourceIsModule('a.d.ts', 'declare namespace App { interface Locals {} }'), false)
  assert.equal(sourceIsModule('a.d.ts', 'export declare const a: number'), true)
})

test('writing an alias removes stale generated files and keeps the README', () => {
  const dir = mkdtempSync(join(tmpdir(), 'alias-test-'))
  writeFileSync(join(dir, 'README.md'), 'readme')
  writeFileSync(join(dir, 'package.json'), '{}')
  writeFileSync(join(dir, 'index.cjs'), 'stale')
  mkdirSync(join(dir, 'old'))
  writeFileSync(join(dir, 'old/Link.astro'), 'stale')
  const { files } = plan({ exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } } })

  assert.deepEqual(diffAlias(dir, files).map((line) => line.split(/\s+/)[0]).sort(), ['extra', 'extra', 'missing', 'missing', 'outdated'])
  writeAlias(dir, files)
  assert.deepEqual(diffAlias(dir, files), [])
  assert.deepEqual(readdirSync(dir).sort(), ['README.md', 'index.d.ts', 'index.js', 'package.json'])
  assert.equal(readFileSync(join(dir, 'README.md'), 'utf-8'), 'readme')
})
