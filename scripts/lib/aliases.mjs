// Builds the alias packages (astro-i18n-tiny and the others) from the
// package.json of the package each one stands for. An alias depends on the
// exact version of its package and re-exports every entry point, so the
// generated part covers the re-export files, exports, files, version,
// engines, the pinned dependency and the peer dependencies. Only the README
// and the alias's own fields (name, description, keywords...) are written by
// hand.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import ts from 'typescript'

// Each alias and the package it stands for.
export const ALIASES = {
  'astro-i18n-tiny': 'packages/astro',
  'next-i18n-tiny': 'packages/next',
  'react-i18n-tiny': 'packages/react'
}

// The fields of an alias's package.json that are written by hand, in output
// order. Any other field is generated, so a hand-written one would be lost:
// the generator refuses such a package.json instead.
const HAND_WRITTEN_FIELDS = ['name', 'description', 'keywords', 'author', 'license', 'repository', 'homepage']

// The fields of a package's package.json that the generator knows: the ones
// it copies to the alias, and the ones that do not concern the alias. Any
// other field (peerDependenciesMeta, sideEffects, bin...) is refused until
// the generator decides what the alias does with it.
const KNOWN_PACKAGE_FIELDS = [
  'name', 'version', 'type', 'exports', 'engines', 'peerDependencies',
  'description', 'keywords', 'author', 'license', 'homepage', 'repository',
  'main', 'types', 'files', 'scripts', 'dependencies', 'devDependencies'
]

// Files of an alias directory that the generator never touches.
export const HAND_WRITTEN_FILES = ['README.md', 'package.json']

/**
 * Plans an alias package. Pure: the file system is read only through
 * `inspect`, which answers about files of the aliased package (paths
 * relative to its directory):
 *   - hasDefault(path): whether the module (JS or .d.ts) has a default export
 *   - isModule(path): whether the .d.ts is a module, not a global script
 *   - list(dir): the names of the entries of a directory
 * Returns the files to write (path relative to the alias directory ->
 * contents), the package.json included.
 */
export function planAlias ({ body, alias, inspect }) {
  for (const field of Object.keys(alias)) {
    if (!HAND_WRITTEN_FIELDS.includes(field) && !GENERATED_FIELDS.includes(field)) {
      throw new Error(`${alias.name}: unknown field "${field}" in package.json. Add it to the hand-written fields of the alias generator first.`)
    }
  }
  for (const field of Object.keys(body)) {
    if (!KNOWN_PACKAGE_FIELDS.includes(field)) {
      throw new Error(`${body.name}: the alias generator does not handle the field "${field}" of package.json. Decide what the alias does with it first.`)
    }
  }
  if (!body.exports || typeof body.exports !== 'object') {
    throw new Error(`${body.name}: package.json has no exports map`)
  }

  const files = new Map()
  const exportsMap = {}
  for (const [subpath, target] of Object.entries(body.exports)) {
    if (!subpath.startsWith('.')) {
      throw new Error(`${body.name}: exports must be a subpath map, found "${subpath}"`)
    }
    if (subpath.includes('*')) {
      exportsMap[subpath] = planWildcard(body, subpath, target, inspect, files)
    } else {
      const specifier = body.name + subpath.slice(1)
      const base = subpath === '.' ? 'index' : subpath.slice(2)
      exportsMap[subpath] = planEntry(body, specifier, base, target, inspect, files)
    }
  }

  if (typeof alias.name !== 'string') throw new Error('an alias package.json needs a name')
  const pkg = { name: alias.name }
  pkg.version = body.version
  pkg.type = 'module'
  for (const field of HAND_WRITTEN_FIELDS.slice(1)) {
    if (alias[field] !== undefined) pkg[field] = alias[field]
  }
  const main = exportsMap['.']
  if (main && typeof main === 'object' && typeof main.default === 'string') {
    pkg.main = main.default
    pkg.types = main.types
  }
  pkg.exports = exportsMap
  pkg.files = [...new Set([...files.keys()].map((file) => file.split('/')[0]))].sort()
  if (body.engines) pkg.engines = body.engines
  pkg.dependencies = { [body.name]: body.version }
  if (body.peerDependencies) pkg.peerDependencies = body.peerDependencies

  files.set('package.json', JSON.stringify(pkg, null, 2) + '\n')
  return files
}

const GENERATED_FIELDS = ['version', 'type', 'main', 'types', 'exports', 'files', 'engines', 'dependencies', 'peerDependencies']

// One entry point. Its target is a set of conditions: "types" and "default"
// for a JS entry, "types" alone for a types-only entry, and other conditions
// (such as "react-server") that each hold such a set. Each condition gets its
// own re-export files; they all import the same specifier, which the
// consumer's tools resolve with the same conditions as the alias.
function planEntry (body, specifier, base, target, inspect, files) {
  if (typeof target !== 'object' || target === null || Array.isArray(target)) {
    throw new Error(`${specifier}: unsupported export target ${JSON.stringify(target)}`)
  }
  // The alias keeps the order of the conditions, which decides which one a
  // resolver picks.
  const result = {}
  for (const [condition, value] of Object.entries(target)) {
    result[condition] = condition === 'types' || condition === 'default'
      ? null
      : planEntry(body, specifier, `${base}.${condition}`, value, inspect, files)
  }

  if (target.default !== undefined) {
    if (typeof target.default !== 'string' || typeof target.types !== 'string') {
      throw new Error(`${specifier}: a JS entry needs string "types" and "default" targets`)
    }
    files.set(`${base}.js`, reexport(specifier, inspect.hasDefault(path(target.default))))
    files.set(`${base}.d.ts`, reexport(specifier, inspect.hasDefault(path(target.types))))
    result.types = `./${base}.d.ts`
    result.default = `./${base}.js`
  } else if (target.types !== undefined) {
    if (typeof target.types !== 'string') {
      throw new Error(`${specifier}: unsupported "types" target ${JSON.stringify(target.types)}`)
    }
    const types = path(target.types)
    files.set(`${base}.d.ts`, inspect.isModule(types)
      ? reexport(specifier, inspect.hasDefault(types))
      : `// Alias of ${specifier}: the same global types.\n/// <reference types="${specifier}" />\nexport {}\n`)
    result.types = `./${base}.d.ts`
  } else {
    throw new Error(`${specifier}: an export target needs "types" or "default"`)
  }
  return result
}

// A wildcard export of Astro components, such as "./router/*" ->
// "./src/router/*". Each component gets a wrapper that renders it.
function planWildcard (body, subpath, target, inspect, files) {
  const match = /^\.\/(.+)\/\*$/.exec(subpath)
  if (!match || typeof target !== 'string' || !target.endsWith('/*') || target.slice(0, -2).includes('*')) {
    throw new Error(`${body.name}: unsupported wildcard export "${subpath}": ${JSON.stringify(target)}`)
  }
  const dir = match[1]
  const names = inspect.list(path(target.slice(0, -2)))
  if (names.length === 0) {
    throw new Error(`${body.name}: wildcard export "${subpath}" matches no file`)
  }
  for (const name of names) {
    if (!name.endsWith('.astro')) {
      throw new Error(`${body.name}: wildcard export "${subpath}" contains "${name}", but only .astro components are supported`)
    }
    files.set(`${dir}/${name}`, astroWrapper(`${body.name}/${dir}/${name}`))
  }
  return `./${dir}/*`
}

function reexport (specifier, hasDefault) {
  return `// Alias of ${specifier}: re-exports it unchanged.\n` +
    `export * from '${specifier}'\n` +
    (hasDefault ? `export { default } from '${specifier}'\n` : '')
}

function astroWrapper (specifier) {
  return `---
// Alias of ${specifier}: renders it unchanged.
import type { ComponentProps } from 'astro/types'
import Component from '${specifier}'

type Props = ComponentProps<typeof Component>
---

<Component {...Astro.props}><slot /></Component>
`
}

function path (target) {
  if (!target.startsWith('./')) throw new Error(`export target must start with "./": ${target}`)
  return target.slice(2)
}

/** Whether the ES module source (JS or .d.ts) has a default export. */
export function sourceHasDefault (fileName, source) {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, false)
  return file.statements.some((statement) => {
    if (ts.isExportAssignment(statement)) return !statement.isExportEquals
    if (ts.isExportDeclaration(statement)) {
      return statement.exportClause !== undefined && ts.isNamedExports(statement.exportClause) &&
        statement.exportClause.elements.some((element) => element.name.text === 'default')
    }
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) ?? [] : []
    return modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
  })
}

/** Whether the .d.ts source is a module, as opposed to a global script. */
export function sourceIsModule (fileName, source) {
  return ts.isExternalModule(ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, false))
}

/** The answers planAlias needs, read from a package directory. */
export function inspectDirectory (dir) {
  const read = (file) => {
    const full = join(dir, file)
    if (!existsSync(full)) {
      throw new Error(`${full} does not exist. Files under dist/ come from the build: run pnpm build before generating the aliases.`)
    }
    return readFileSync(full, 'utf-8')
  }
  return {
    hasDefault: (file) => sourceHasDefault(file, read(file)),
    isModule: (file) => sourceIsModule(file, read(file)),
    list: (sub) => readdirSync(join(dir, sub)).map((name) => {
      if (statSync(join(dir, sub, name)).isDirectory()) {
        throw new Error(`${join(dir, sub, name)}: directories under a wildcard export are not supported`)
      }
      return name
    }).sort()
  }
}

/** Plans every alias of the repository. Returns alias directory -> files. */
export function planAliases (root) {
  const plans = new Map()
  const found = readdirSync(join(root, 'packages/aliases')).sort()
  for (const name of found) {
    if (!ALIASES[name]) throw new Error(`packages/aliases/${name} is not listed in the alias generator`)
  }
  for (const [name, bodyDir] of Object.entries(ALIASES)) {
    if (!found.includes(name)) throw new Error(`packages/aliases/${name} does not exist`)
    const aliasDir = join(root, 'packages/aliases', name)
    const readJson = (file) => JSON.parse(readFileSync(file, 'utf-8'))
    plans.set(aliasDir, planAlias({
      body: readJson(join(root, bodyDir, 'package.json')),
      alias: readJson(join(aliasDir, 'package.json')),
      inspect: inspectDirectory(join(root, bodyDir))
    }))
  }
  return plans
}

function listFiles (dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full, base) : [relative(base, full)]
  })
}

/**
 * Compares an alias directory with its plan. Returns the differences as
 * lines; empty when the directory is up to date.
 */
export function diffAlias (aliasDir, files) {
  const problems = []
  for (const [file, contents] of files) {
    const full = join(aliasDir, file)
    if (!existsSync(full)) problems.push(`missing  ${full}`)
    else if (readFileSync(full, 'utf-8') !== contents) problems.push(`outdated ${full}`)
  }
  for (const file of listFiles(aliasDir)) {
    if (!files.has(file) && !HAND_WRITTEN_FILES.includes(file)) problems.push(`extra    ${join(aliasDir, file)}`)
  }
  return problems
}

/** Writes an alias directory from its plan, removing files it no longer has. */
export function writeAlias (aliasDir, files) {
  for (const file of listFiles(aliasDir)) {
    if (!files.has(file) && !HAND_WRITTEN_FILES.includes(file)) rmSync(join(aliasDir, file))
  }
  for (const name of readdirSync(aliasDir)) {
    const full = join(aliasDir, name)
    if (statSync(full).isDirectory() && listFiles(full).length === 0) rmSync(full, { recursive: true })
  }
  for (const [file, contents] of files) {
    mkdirSync(dirname(join(aliasDir, file)), { recursive: true })
    writeFileSync(join(aliasDir, file), contents)
  }
}
