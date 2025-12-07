# next-i18n-tiny

[![npm version](https://img.shields.io/npm/v/next-i18n-tiny.svg)](https://www.npmjs.com/package/next-i18n-tiny)
[![npm downloads](https://img.shields.io/npm/dm/next-i18n-tiny.svg)](https://www.npmjs.com/package/next-i18n-tiny)

Alternative package name for [`@i18n-tiny/next`](https://www.npmjs.com/package/@i18n-tiny/next).

> **Note**: This is an alias package. Both `next-i18n-tiny` and `@i18n-tiny/next` provide the exact same functionality.

## Installation

```bash
# Short name
npm install next-i18n-tiny

# Scoped name (recommended for monorepo consistency)
npm install @i18n-tiny/next
```

## Documentation

See the full documentation at [@i18n-tiny/next](https://github.com/unlibra/i18n-tiny/tree/main/packages/next).

## Quick Start

```typescript
// i18n.ts
import { define } from 'next-i18n-tiny'

const { client, server, Provider } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})

export { Provider }
export const { useMessages, useTranslations } = client
export const { getMessages, getTranslations } = server
```

## Why Two Package Names?

- **`next-i18n-tiny`**: Shorter, easier to type
- **`@i18n-tiny/next`**: Scoped package, consistent with monorepo structure

Choose whichever you prefer - they're identical!

## License

MIT
