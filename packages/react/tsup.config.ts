import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx', 'src/components.tsx'],
  format: ['esm'],
  dts: true,
  // The entry points share one chunk with the React context, instead of a
  // copy each: a Provider from one entry is then seen by the hooks of the other.
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react'],
  // The 'use client' directive at the top of each entry is kept in the output,
  // so no banner is needed.
})
