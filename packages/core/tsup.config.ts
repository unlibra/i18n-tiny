import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/router/index.ts', 'src/middleware/index.ts', 'src/internal/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true
})
