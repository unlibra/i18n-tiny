import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync } from 'fs'

const sharedConfig = {
  format: ['cjs', 'esm'] as const,
  dts: true,
  sourcemap: true,
  external: ['react', 'next', '@i18n-tiny/core'],
  splitting: false,
  treeshake: true,
  outExtension ({ format }: { format: 'cjs' | 'esm' }) {
    return {
      js: format === 'esm' ? '.js' : '.cjs'
    }
  }
}

async function addUseClientDirective(files: string[]) {
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      // Check if directive already exists to avoid duplication
      if (!content.includes("use client")) {
        writeFileSync(file, `"use client";\n${content}`)
      }
    } catch (err) {
      console.error(`Failed to add "use client" to ${file}:`, err)
    }
  }
}

export default defineConfig([
  // Router utilities (Client Components)
  {
    ...sharedConfig,
    entry: {
      'router/index': 'src/router/index.ts'
    },
    clean: true,
    async onSuccess () {
      await addUseClientDirective([
        'dist/router/index.js',
        'dist/router/index.cjs'
      ])
    }
  },
  // React Client build
  {
    ...sharedConfig,
    entry: {
      'index.react-client': 'src/index.react-client.tsx'
    },
    clean: false,
    async onSuccess () {
      await addUseClientDirective([
        'dist/index.react-client.js',
        'dist/index.react-client.cjs'
      ])
    }
  },
  // React Server build
  {
    ...sharedConfig,
    entry: {
      'index.react-server': 'src/index.react-server.tsx'
    },
    clean: false,
  },
  // Types export
  {
    ...sharedConfig,
    entry: {
      types: 'src/types.ts'
    },
    clean: false,
  },
  // Proxy export (middleware)
  {
    ...sharedConfig,
    entry: {
      'proxy/index': 'src/proxy/index.ts'
    },
    external: ['next/server', '@i18n-tiny/core'],
    clean: false,
  }
])
