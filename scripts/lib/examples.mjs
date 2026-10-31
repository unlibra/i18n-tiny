// How an example is turned into a project of its own that consumes the
// packed packages with chosen framework versions. Free of side effects, so
// it can be tested; scripts/build-examples.mjs does the copying and building.

// The versions each supported major of a framework is tested with: the
// latest release of that major, with the packages that go along with it.
export const FRAMEWORKS = {
  astro: {
    6: { astro: '^6.0.0', '@astrojs/node': '^10.0.0' },
    7: { astro: '^7.0.0', '@astrojs/node': '^11.0.0' }
  },
  next: {
    15: { next: '^15.0.0' },
    16: { next: '^16.0.0' }
  },
  react: {
    18: { react: '^18.0.0', 'react-dom': '^18.0.0', '@types/react': '^18.0.0', '@types/react-dom': '^18.0.0' },
    19: { react: '^19.0.0', 'react-dom': '^19.0.0', '@types/react': '^19.0.0', '@types/react-dom': '^19.0.0' }
  }
}

/** The dependency versions for the chosen majors, such as { astro: 6, next: 15, react: 18 }. */
export function frameworkVersions (majors) {
  const versions = {}
  for (const [framework, table] of Object.entries(FRAMEWORKS)) {
    const major = majors[framework]
    if (major === undefined) throw new Error(`no ${framework} version chosen`)
    const set = table[major]
    if (!set) throw new Error(`${framework} ${major} is not supported (supported: ${Object.keys(table).join(', ')})`)
    Object.assign(versions, set)
  }
  return versions
}

/**
 * Rewrites an example's package.json to consume the packed packages:
 *   - each workspace:* dependency on one of the packages, and the packages
 *     those depend on, become file: dependencies on the tarballs (npm would
 *     otherwise look for the unpublished versions on the registry),
 *   - `extra` names packages to add (such as an alias the build checks),
 *   - the framework packages get the chosen versions.
 * `packages` maps each package name to { tarball, dependencies }, read from
 * the tarballs. Any other workspace: dependency is refused.
 */
export function rewriteManifest (manifest, { packages, versions, extra = [] }) {
  const pkg = structuredClone(manifest)
  const wanted = new Set(extra)
  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, range] of Object.entries(pkg[field] ?? {})) {
      if (!range.startsWith('workspace:')) continue
      if (range !== 'workspace:*' || !packages[name]) throw new Error(`${manifest.name}: cannot replace ${field}.${name} "${range}"`)
      delete pkg[field][name]
      wanted.add(name)
    }
  }
  const closure = new Set()
  const visit = (name) => {
    if (closure.has(name)) return
    if (!packages[name]) throw new Error(`${manifest.name}: ${name} is not one of the packed packages`)
    closure.add(name)
    for (const dependency of Object.keys(packages[name].dependencies ?? {})) {
      if (packages[dependency]) visit(dependency)
    }
  }
  for (const name of wanted) visit(name)
  pkg.dependencies ??= {}
  for (const name of [...closure].sort()) pkg.dependencies[name] = `file:${packages[name].tarball}`

  for (const field of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (versions[name]) pkg[field][name] = versions[name]
    }
  }
  return pkg
}

/**
 * Next.js 15 reads the proxy (middleware) from middleware.ts and the export
 * `middleware`; Next.js 16 from proxy.ts and `proxy`. Returns the
 * middleware.ts source for Next.js 15 made from proxy.ts.
 */
export function middlewareFromProxy (source) {
  const renamed = source.replace(/^export const proxy\b/m, 'export const middleware')
  if (renamed === source) throw new Error('proxy.ts has no `export const proxy` to rename')
  return renamed
}

/**
 * Whether a Next.js build includes a middleware (proxy), read from the
 * parsed .next/server/middleware-manifest.json (an Edge middleware, as in
 * Next.js 15) and functions-config-manifest.json (a Node.js one, as the
 * proxy of Next.js 16). Either may be missing.
 */
export function hasMiddleware (middlewareManifest, functionsConfigManifest) {
  return Object.keys(middlewareManifest?.middleware ?? {}).length > 0 ||
    Object.hasOwn(functionsConfigManifest?.functions ?? {}, '/_middleware')
}
