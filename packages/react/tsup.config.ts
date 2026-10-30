import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx', 'src/components.tsx'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react'],
  // The 'use client' directive at the top of each entry is kept in the output,
  // so no banner is needed.
})
