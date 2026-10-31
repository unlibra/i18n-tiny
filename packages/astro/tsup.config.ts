import { defineConfig, type Options } from 'tsup'

const sharedConfig: Options = {
  format: ['esm'],
  dts: true,
  sourcemap: true,
  external: ['astro', '@i18n-tiny/core'],
  splitting: false,
  treeshake: true
}

// The configs run in parallel, so none of them cleans dist: one that did could
// delete files another has just written. The build script cleans it first.
export default defineConfig([
  // Main entry
  {
    ...sharedConfig,
    entry: {
      index: 'src/index.ts'
    },
    clean: false
  },
  // Middleware entry
  {
    ...sharedConfig,
    entry: {
      middleware: 'src/middleware.ts'
    },
    clean: false
  },
  // Router utilities (re-exports from core)
  {
    ...sharedConfig,
    entry: {
      router: 'src/router.ts'
    },
    clean: false
  },
  // Shared by the components and the middleware
  {
    ...sharedConfig,
    entry: {
      internal: 'src/internal.ts'
    },
    clean: false
  }
  // Note: Link.astro is distributed as source at src/router/Link.astro
])
