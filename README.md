# i18n-tiny

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Type-safe, zero-dependency i18n libraries for modern frameworks.

## Quick Start

### Next.js

```typescript
import { define } from '@i18n-tiny/next'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const i18n = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})

// Automatic type inference - no manual annotations needed!
// messages.common.title - autocomplete ✓
// t('common.title') - autocomplete ✓
```

[Full documentation →](./packages/next/README.md)

## Packages

### [@i18n-tiny/next](./packages/next)

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)

Type-safe i18n library for Next.js App Router with React Server Components support.

[Documentation →](./packages/next/README.md)

```bash
npm install @i18n-tiny/next
```

## Features

- **Type-safe**: Full TypeScript support with automatic type inference
- **Zero dependencies**: No external i18n libraries needed
- **Framework support**: Next.js (with more frameworks coming)
- **Small**: Minimal bundle size
- **No global state**: Pure function factory pattern

## Live Demo

The Next.js package is used at **[8px.app](https://8px.app)**.
You can try the language switcher in the header to see it in action.

Source code: [https://github.com/unlibra/8px.app](https://github.com/unlibra/8px.app)

## Development

This is a pnpm workspace monorepo.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT
