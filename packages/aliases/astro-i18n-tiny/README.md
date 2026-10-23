# astro-i18n-tiny

[![npm version](https://img.shields.io/npm/v/astro-i18n-tiny.svg)](https://www.npmjs.com/package/astro-i18n-tiny)
[![npm downloads](https://img.shields.io/npm/dm/astro-i18n-tiny.svg)](https://www.npmjs.com/package/astro-i18n-tiny)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/astro/introduction)

Alternative package name for [`@i18n-tiny/astro`](https://www.npmjs.com/package/@i18n-tiny/astro).

> **Note**: This is an alias package. Both `astro-i18n-tiny` and `@i18n-tiny/astro` provide the exact same functionality, including `astro-i18n-tiny/locals` for the `Astro.locals` types.
>
> Use `astro-i18n-tiny` 1.2.1 or later. Earlier versions of the alias could not be imported.

## Installation

```bash
# Short name
npm install astro-i18n-tiny

# Scoped name (recommended for monorepo consistency)
npm install @i18n-tiny/astro
```

## Documentation

See the full documentation at [docs.unlibra.com](https://docs.unlibra.com/i18n-tiny/astro/introduction), or the [@i18n-tiny/astro README](https://github.com/unlibra/i18n-tiny/tree/main/packages/astro).

## Quick Start

```typescript
// src/i18n.ts
import { define } from 'astro-i18n-tiny'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const { locales, getMessages, getTranslations } = define({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

```astro
---
// src/pages/[locale]/index.astro
import { locales, getMessages } from '../../i18n'

// Static output: build one page per locale (leave this out with output: 'server')
export function getStaticPaths() {
  return locales.map((locale) => ({ params: { locale } }))
}

const { locale } = Astro.params
const messages = getMessages(locale)
---

<h1>{messages.common.title}</h1>
```

## Why Two Package Names?

- **`astro-i18n-tiny`**: Shorter, easier to type
- **`@i18n-tiny/astro`**: Scoped package, consistent with monorepo structure

Choose whichever you prefer - they're identical!

## License

MIT
