import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync } from 'fs'

export default defineConfig([
  // React Client build (default)
  {
    entry: {
      'index.react-client': 'src/index.react-client.tsx'
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react', 'next'],
    splitting: false,
    treeshake: true,
    outExtension ({ format }) {
      return {
        js: format === 'esm' ? '.js' : '.cjs'
      }
    },
    async onSuccess () {
      // Add 'use client' directive to client builds
      const files = ['dist/index.react-client.js', 'dist/index.react-client.cjs']
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8')
          if (!content.startsWith('"use client"')) {
            writeFileSync(file, `"use client";\n${content}`)
          }
        } catch {
          // File might not exist yet
        }
      }
    }
  },
  // React Server build
  {
    entry: {
      'index.react-server': 'src/index.react-server.tsx'
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: false, // Don't clean, client build already did
    sourcemap: true,
    external: ['react', 'next'],
    splitting: false,
    treeshake: true,
    outExtension ({ format }) {
      return {
        js: format === 'esm' ? '.js' : '.cjs'
      }
    }
  },
  // Types export
  {
    entry: {
      types: 'src/types.ts'
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: false,
    sourcemap: true,
    external: ['react', 'next'],
    splitting: false,
    treeshake: true,
    outExtension ({ format }) {
      return {
        js: format === 'esm' ? '.js' : '.cjs'
      }
    }
  }
])
