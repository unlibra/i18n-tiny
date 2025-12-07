import { defineConfig, type Options } from 'tsup'

const sharedConfig: Options = {
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  external: ['astro', '@i18n-tiny/core'],
  splitting: false,
  treeshake: true,
  outExtension ({ format }) {
    return {
      js: format === 'esm' ? '.js' : '.cjs'
    }
  }
}

export default defineConfig([
  // Main entry
  {
    ...sharedConfig,
    entry: {
      index: 'src/index.ts'
    },
    clean: true
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
  // Integration for static file generation
  {
    ...sharedConfig,
    entry: {
      integration: 'src/integration.ts'
    },
    clean: false
  }
  // Note: Link.astro is distributed as source at src/router/Link.astro
])
