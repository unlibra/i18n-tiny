import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/router/index.ts', 'src/middleware/index.ts', 'src/internal/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  // The entry points share chunks instead of a copy each of the code they
  // have in common, such as the check of the config: an app that imports
  // more than one entry ships it once.
  splitting: true,
  treeshake: true
})
