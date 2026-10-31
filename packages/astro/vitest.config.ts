import { getViteConfig } from 'astro/config'

// Astro's Vite config compiles the .astro components, which the tests render
// with the container API
export default getViteConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/*.d.ts'
      ]
    }
  }
})
