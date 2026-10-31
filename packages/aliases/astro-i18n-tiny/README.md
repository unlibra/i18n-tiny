# astro-i18n-tiny

[![npm version](https://img.shields.io/npm/v/astro-i18n-tiny.svg)](https://www.npmjs.com/package/astro-i18n-tiny)
[![npm downloads](https://img.shields.io/npm/dm/astro-i18n-tiny.svg)](https://www.npmjs.com/package/astro-i18n-tiny)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/astro/introduction)

Alternative package name for [`@i18n-tiny/astro`](https://www.npmjs.com/package/@i18n-tiny/astro).

> **Note**: This is an alias package. Both `astro-i18n-tiny` and `@i18n-tiny/astro` provide the exact same functionality, including `astro-i18n-tiny/locals` for the `Astro.locals` types.

## Installation

```bash
# Short name
npm install astro-i18n-tiny

# Scoped name (recommended for monorepo consistency)
npm install @i18n-tiny/astro
```

Updating from 1.x? See the [migration guide](https://github.com/unlibra/i18n-tiny/blob/main/MIGRATION.md).

## Documentation

See the full documentation at [docs.unlibra.com](https://docs.unlibra.com/i18n-tiny/astro/introduction), or the [@i18n-tiny/astro README](https://github.com/unlibra/i18n-tiny/tree/main/packages/astro).

## Quick Start

```typescript
// src/i18n.ts
import { define } from 'astro-i18n-tiny'
import jaMessages from './messages/ja'
import enMessages from './messages/en'

export const i18n = define({
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  messages: { ja: jaMessages, en: enMessages }
})
```

```astro
---
// src/pages/[...locale]/index.astro → / (ja) and /en (en)
import type { InferGetStaticPropsType } from 'astro'
import { i18n } from '../../i18n'

export function getStaticPaths() {
  return i18n.getStaticPaths()
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale } = Astro.props
const messages = i18n.getMessages(locale)
---

<h1>{messages.common.title}</h1>
```

## Why Two Package Names?

- **`astro-i18n-tiny`**: Shorter, easier to type
- **`@i18n-tiny/astro`**: Scoped package, consistent with monorepo structure

Choose whichever you prefer - they're identical!

## License

MIT
