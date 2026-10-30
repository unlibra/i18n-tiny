// Checks the packages as consumers receive them, which the build and the
// tests cannot see. Run after `pnpm build`.
//
//   1. The alias packages are up to date with the packages they stand for.
//   2. publint passes for every package, and every tarball has the LICENSE.
//   3. The tarballs, installed with their peers into a scratch project:
//      - every JS entry point loads in Node with both import and require(),
//      - entries with an extra condition (react-server) resolve to the file
//        it names. They are not loaded: a react-server module graph runs only
//        inside a framework (Next.js), which the CI checks by building the
//        examples,
//      - every Astro component of a wildcard export resolves,
//      - TypeScript type-checks every entry point, types-only ones included,
//        with moduleResolution bundler and nodenext (and require() from a
//        CommonJS file under nodenext), and the entries with an extra
//        condition with that condition too,
//      - each alias has the same entry points as its package, with the same
//        export names at runtime and the same types.
//
//   node scripts/check-packages.mjs [--pack-destination <dir>]
//
// With --pack-destination, the tarballs are written to and kept in <dir>
// (which must be empty or missing), so that the checked tarballs can be
// published.

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { ALIASES, diffAlias, planAliases, sourceIsModule } from './lib/aliases.mjs'

const root = resolve(import.meta.dirname, '..')
const { values: options } = parseArgs({ options: { 'pack-destination': { type: 'string' } } })

const bodies = ['core', 'react', 'next', 'astro'].map((name) => `packages/${name}`)
const aliases = Object.keys(ALIASES).map((name) => `packages/aliases/${name}`)
const readJson = (file) => JSON.parse(readFileSync(file, 'utf-8'))
const manifest = (dir) => readJson(join(root, dir, 'package.json'))

// 1. Aliases
const stale = [...planAliases(root)].flatMap(([dir, files]) => diffAlias(dir, files))
if (stale.length > 0) {
  console.error(stale.join('\n'))
  console.error('\nThe alias packages are out of date. Run `pnpm aliases` and commit the result.')
  process.exit(1)
}

// 2. publint, and packing
const work = mkdtempSync(join(tmpdir(), 'i18n-tiny-packages-'))
const tarballDir = options['pack-destination'] ? resolve(options['pack-destination']) : join(work, 'tarballs')
if (existsSync(tarballDir) && readdirSync(tarballDir).length > 0) {
  throw new Error(`${tarballDir} is not empty`)
}
mkdirSync(tarballDir, { recursive: true })
for (const dir of [...bodies, ...aliases]) {
  console.log(`publint ${dir}`)
  execFileSync('pnpm', ['exec', 'publint', '--strict', dir], { cwd: root, stdio: 'inherit' })
  execFileSync('pnpm', ['pack', '--pack-destination', tarballDir], { cwd: join(root, dir), stdio: 'ignore' })
}
const withoutLicense = readdirSync(tarballDir).filter((file) => {
  const listed = execFileSync('tar', ['-tzf', join(tarballDir, file)], { encoding: 'utf-8' }).split('\n')
  return !listed.includes('package/LICENSE')
})

// 3. Scratch project with the tarballs and the peers, at the versions the
// workspace develops against.
const project = join(work, 'project')
mkdirSync(project)
writeFileSync(join(project, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
const devVersion = (dir, name) => {
  const version = manifest(dir).devDependencies?.[name]
  if (!version) throw new Error(`${dir}/package.json has no devDependency ${name}`)
  return `${name}@${version}`
}
const tools = [
  devVersion('packages/react', 'react'),
  devVersion('packages/react', 'react-dom'),
  devVersion('packages/react', '@types/react'),
  devVersion('packages/next', 'next'),
  devVersion('packages/astro', 'astro'),
  devVersion('packages/core', '@types/node'),
  devVersion('.', 'typescript')
]
const tarballs = readdirSync(tarballDir).map((file) => join(tarballDir, file))
console.log(`\nInstalling ${tarballs.length} tarballs with ${tools.join(' ')}`)
execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs, ...tools], {
  cwd: project,
  stdio: ['ignore', 'ignore', 'inherit']
})

// The entry points of every package, read from the installed package.json.
const installed = (name) => join(project, 'node_modules', name)
const entries = []
for (const dir of [...bodies, ...aliases]) {
  const { name } = manifest(dir)
  const { exports } = readJson(join(installed(name), 'package.json'))
  for (const [subpath, target] of Object.entries(exports)) {
    const specifier = name + subpath.slice(1)
    if (subpath.includes('*')) {
      const folder = target.slice(2, -2)
      const files = readdirSync(join(installed(name), folder)).sort()
      entries.push({ name, subpath, kind: 'wildcard', specifiers: files.map((file) => `${name}${subpath.slice(1, -1)}${file}`) })
    } else if (target.default !== undefined) {
      const conditions = Object.keys(target).filter((key) => key !== 'types' && key !== 'default')
      entries.push({ name, subpath, kind: 'js', specifier, conditions })
    } else {
      const types = readFileSync(join(installed(name), target.types), 'utf-8')
      entries.push({ name, subpath, kind: sourceIsModule(target.types, types) ? 'types' : 'global-types', specifier })
    }
  }
}

const failures = []
const fail = (message) => failures.push(message)
for (const file of withoutLicense) fail(`${file} has no LICENSE`)

// Runtime: import and require() each JS entry with the default conditions.
copyFileSync(join(root, 'scripts/lib/check-runtime.mjs'), join(project, 'check-runtime.mjs'))
const runtime = (specifiers, flags = []) => {
  writeFileSync(join(project, 'specifiers.json'), JSON.stringify(specifiers))
  const output = execFileSync('node', [...flags, 'check-runtime.mjs', 'specifiers.json'], { cwd: project, encoding: 'utf-8' })
  return JSON.parse(output)
}
const jsEntries = entries.filter((entry) => entry.kind === 'js')
const runs = runtime(jsEntries.map((entry) => entry.specifier))
for (const [specifier, result] of Object.entries(runs)) {
  if (result.importError) fail(`import ${specifier}: ${result.importError}`)
  if (result.requireError) fail(`require ${specifier}: ${result.requireError}`)
  if (result.import && result.require && result.import.join() !== result.require.join()) {
    fail(`${specifier}: import gives [${result.import}] but require() gives [${result.require}]`)
  }
}

// Wildcard exports: each Astro component resolves to an existing file.
const resolverFile = join(project, 'resolve.mjs')
writeFileSync(resolverFile, `
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const out = {}
for (const specifier of JSON.parse(process.argv[2])) {
  try {
    const file = fileURLToPath(import.meta.resolve(specifier))
    out[specifier] = existsSync(file) ? file : 'missing file ' + file
  } catch (error) {
    out[specifier] = error.code ?? error.message
  }
}
process.stdout.write(JSON.stringify(out))
`)
const resolveAll = (specifiers, flags = []) =>
  JSON.parse(execFileSync('node', [...flags, 'resolve.mjs', JSON.stringify(specifiers)], { cwd: project, encoding: 'utf-8' }))
const wildcardSpecifiers = entries.filter((entry) => entry.kind === 'wildcard').flatMap((entry) => entry.specifiers)
const resolved = resolveAll(wildcardSpecifiers)
for (const [specifier, result] of Object.entries(resolved)) {
  if (!result.startsWith('/')) fail(`resolve ${specifier}: ${result}`)
}

// Extra conditions: the specifier resolves to the file the condition names.
const conditionResults = {}
for (const condition of new Set(jsEntries.flatMap((entry) => entry.conditions))) {
  const withCondition = jsEntries.filter((entry) => entry.conditions.includes(condition))
  const files = resolveAll(withCondition.map((entry) => entry.specifier), [`--conditions=${condition}`])
  for (const entry of withCondition) {
    const expected = join(installed(entry.name), readJson(join(installed(entry.name), 'package.json')).exports[entry.subpath][condition].default)
    const result = files[entry.specifier] === expected ? 'ok' : files[entry.specifier]
    conditionResults[`${condition} ${entry.specifier}`] = result
    if (result !== 'ok') fail(`resolve ${entry.specifier} (${condition}): ${result}, expected ${expected}`)
  }
}

// Aliases against their packages: the same entry points, the same runtime
// export names and the same component files.
const pairs = Object.entries(ALIASES).map(([alias, dir]) => [alias, manifest(dir).name])
const entryOf = (name, subpath) => entries.find((entry) => entry.name === name && entry.subpath === subpath)
for (const [alias, body] of pairs) {
  const subpaths = (name) => entries.filter((entry) => entry.name === name).map((entry) => entry.subpath).sort()
  if (subpaths(alias).join() !== subpaths(body).join()) {
    fail(`${alias} has the entry points [${subpaths(alias)}] but ${body} has [${subpaths(body)}]`)
    continue
  }
  for (const subpath of subpaths(body)) {
    const a = entryOf(alias, subpath)
    const b = entryOf(body, subpath)
    const category = (kind) => kind === 'global-types' ? 'types' : kind
    if (category(a.kind) !== category(b.kind)) fail(`${a.name}${subpath.slice(1)} is a ${a.kind} entry but ${b.name}${subpath.slice(1)} is a ${b.kind} entry`)
    else if (a.kind === 'wildcard') {
      const files = (entry) => entry.specifiers.map((s) => s.slice(entry.name.length)).join()
      if (files(a) !== files(b)) fail(`${a.name}${subpath.slice(1)} has [${files(a)}] but ${b.name}${subpath.slice(1)} has [${files(b)}]`)
    } else if (a.kind === 'js') {
      if (a.conditions.join() !== b.conditions.join()) fail(`${a.specifier} has the conditions [${a.conditions}] but ${b.specifier} has [${b.conditions}]`)
      const [ra, rb] = [runs[a.specifier], runs[b.specifier]]
      if (ra?.import && rb?.import && ra.import.join() !== rb.import.join()) {
        fail(`${a.specifier} exports [${ra.import}] but ${b.specifier} exports [${rb.import}]`)
      }
    }
  }
}

// TypeScript: one consumer project per moduleResolution, and one more (with
// moduleResolution bundler) per extra condition, such as react-server, for
// the entries that declare it. Every entry is imported; each alias entry must
// have the same type as its package's.
const typed = entries.filter((entry) => entry.kind === 'js' || entry.kind === 'types')
const aliasOf = Object.fromEntries(pairs.map(([alias, body]) => [alias, body]))
const esmSource = (list, globals = []) => [
  ...globals.map((entry) => `/// <reference types="${entry.specifier}" />`),
  ...list.map((entry, i) => `import ${entry.kind === 'types' ? 'type ' : ''}* as m${i} from '${entry.specifier}'`),
  ...list.flatMap((entry, i) => {
    const body = aliasOf[entry.name]
    if (!body) return []
    const j = list.findIndex((other) => other.name === body && other.subpath === entry.subpath)
    if (j < 0) return []
    // Assignable both ways: the alias has the same exports, with the same types.
    return entry.kind === 'types'
      ? [`type Same${i} = [typeof m${i}] extends [typeof m${j}] ? ([typeof m${j}] extends [typeof m${i}] ? true : false) : false`, `export const same${i}: Same${i} = true`]
      : [`export const same${i}: [typeof m${j}, typeof m${i}] = [m${i}, m${j}]`]
  }),
  'export {}'
].join('\n') + '\n'
const requireSource = typed.filter((entry) => entry.kind === 'js')
  .map((entry, i) => `import r${i} = require('${entry.specifier}')\nexport const v${i} = r${i}`).join('\n') + '\n'

const compilerOptions = {
  strict: true,
  noEmit: true,
  skipLibCheck: false,
  target: 'ES2022',
  lib: ['ES2022', 'DOM'],
  jsx: 'react-jsx',
  types: ['node']
}
const globals = entries.filter((entry) => entry.kind === 'global-types')
const projects = {
  bundler: {
    files: { 'bundler.ts': esmSource(typed, globals) },
    options: { module: 'ESNext', moduleResolution: 'bundler' }
  },
  nodenext: {
    files: { 'nodenext.mts': esmSource(typed, globals), 'nodenext-require.cts': requireSource },
    options: { module: 'NodeNext', moduleResolution: 'NodeNext' }
  }
}
for (const condition of new Set(jsEntries.flatMap((entry) => entry.conditions))) {
  projects[`bundler ${condition}`] = {
    files: { [`bundler-${condition}.ts`]: esmSource(jsEntries.filter((entry) => entry.conditions.includes(condition))) },
    options: { module: 'ESNext', moduleResolution: 'bundler', customConditions: [condition] }
  }
}
const tscVersion = execFileSync(join(project, 'node_modules/.bin/tsc'), ['--version'], { encoding: 'utf-8' }).trim()
// Declaration files are checked (skipLibCheck: false), so that an error in
// the packages' own .d.ts is caught, but only errors in the packages and in
// the files written here count: the peers' declarations have errors of their
// own that consumers hide with skipLibCheck.
const ours = [...bodies, ...aliases].map((dir) => `node_modules/${manifest(dir).name}/`)
const tsc = {}
for (const [label, { files, options }] of Object.entries(projects)) {
  for (const [file, source] of Object.entries(files)) writeFileSync(join(project, file), source)
  const config = `tsconfig.${label.replace(' ', '-')}.json`
  writeFileSync(join(project, config), JSON.stringify({ compilerOptions: { ...compilerOptions, ...options }, files: Object.keys(files) }, null, 2))
  const result = spawnSync(join(project, 'node_modules/.bin/tsc'), ['-p', config, '--pretty', 'false'], { cwd: project, encoding: 'utf-8' })
  const errors = result.stdout.split('\n').filter((line) => /error TS\d+/.test(line))
  const counted = errors.filter((line) => !line.startsWith('node_modules/') || ours.some((prefix) => line.startsWith(prefix)))
  tsc[label] = counted.length === 0 ? 'ok' : 'FAIL'
  if (result.status !== 0 && errors.length === 0) fail(`tsc (${label}) failed without a diagnostic:\n${result.stdout}${result.stderr}`)
  if (counted.length > 0) fail(`tsc (${label}, ${tscVersion}):\n  ${counted.join('\n  ')}`)
}

// Report: one row per entry point, the alias next to its package.
const runtimeStatus = (specifier) => {
  const result = runs[specifier]
  return `${result.import ? 'ok' : 'FAIL'}/${result.require ? 'ok' : 'FAIL'}`
}
const cell = (entry) => {
  if (!entry) return 'missing'
  if (entry.kind === 'wildcard') {
    return entry.specifiers.map((s) => `${s.slice(entry.name.length + entry.subpath.length - 2)}:${resolved[s].startsWith('/') ? 'ok' : 'FAIL'}`).join(' ')
  }
  if (entry.kind !== 'js') return entry.kind
  return [runtimeStatus(entry.specifier), ...entry.conditions.map((c) => `${c} resolves ${conditionResults[`${c} ${entry.specifier}`] === 'ok' ? 'ok' : 'FAIL'}`)].join(', ')
}
const rows = [['entry point', 'package', 'import/require in Node', 'alias', 'import/require in Node']]
for (const name of bodies.map((dir) => manifest(dir).name)) {
  const alias = pairs.find(([, body]) => body === name)?.[0]
  for (const entry of entries.filter((e) => e.name === name)) {
    rows.push([entry.subpath, name, cell(entry), alias ?? '', alias ? cell(entryOf(alias, entry.subpath)) : ''])
  }
}
const widths = rows[0].map((_, i) => Math.max(...rows.map((row) => row[i].length)))
console.log('\n' + rows.map((row) => row.map((value, i) => value.padEnd(widths[i])).join('  ').trimEnd()).join('\n'))
console.log(`\nTypeScript ${tscVersion}: ${Object.entries(tsc).map(([label, status]) => `${label} ${status}`).join(', ')}`)

if (failures.length > 0) {
  console.error(`\n${failures.length} problem(s):\n` + failures.map((f) => `- ${f}`).join('\n'))
  console.error(`\nThe scratch project is kept in ${project}`)
  process.exit(1)
}
rmSync(project, { recursive: true, force: true })
if (!options['pack-destination']) rmSync(work, { recursive: true, force: true })
console.log('\nAll packages passed.')
