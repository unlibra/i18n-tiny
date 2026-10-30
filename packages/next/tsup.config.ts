import { defineConfig, type Options } from 'tsup'
import { copyFileSync, readFileSync, writeFileSync } from 'fs'

const sharedConfig: Options = {
  format: ['esm'],
  dts: true,
  sourcemap: true,
  external: ['react', 'next', '@i18n-tiny/core'],
  splitting: false,
  treeshake: true
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

// The configs run in parallel, so none of them cleans dist: one that did could
// delete files another has just written. The build script cleans it first.
export default defineConfig([
  // Link (Client Component). A file of its own with "use client", so that
  // the router entry can be imported by Server Components too.
  {
    ...sharedConfig,
    entry: {
      'router/Link': 'src/router/Link.tsx'
    },
    clean: false,
    async onSuccess () {
      await addUseClientDirective(['dist/router/Link.js'])
    }
  },
  // Router utilities: the Link and the URL functions. The source has only
  // re-exports, so it is its own type declaration: the declaration bundler
  // would rewrite the path of the external './Link.js'.
  {
    ...sharedConfig,
    entry: {
      'router/index': 'src/router/index.ts'
    },
    external: [...(sharedConfig.external ?? []), './Link.js'],
    dts: false,
    clean: false,
    async onSuccess () {
      copyFileSync('src/router/index.ts', 'dist/router/index.d.ts')
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
      await addUseClientDirective(['dist/index.react-client.js'])
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
