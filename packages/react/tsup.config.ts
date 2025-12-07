import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx', 'src/components.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react'],
  esbuildOptions (options) {
    options.banner = {
      js: '"use client";'
    }
  }
})
