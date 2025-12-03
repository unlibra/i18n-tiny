import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx', 'src/types.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'next'],
  splitting: false,
  treeshake: true
})
