# astro-i18n-tiny

Alternative package name for [`@i18n-tiny/astro`](https://www.npmjs.com/package/@i18n-tiny/astro).

> **Note**: This is an alias package. Both `astro-i18n-tiny` and `@i18n-tiny/astro` provide the exact same functionality.

## Installation

```bash
# Short name
npm install astro-i18n-tiny

# Scoped name (recommended for monorepo consistency)
npm install @i18n-tiny/astro
```

## Documentation

See the full documentation at [@i18n-tiny/astro](https://github.com/unlibra/i18n-tiny/tree/main/packages/astro).

## Quick Start

```typescript
// i18n.ts
import { define } from 'astro-i18n-tiny'

export const { getMessages, getTranslations } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

```astro
---
// page.astro
import { getMessages } from '@/i18n'

const locale = Astro.currentLocale
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
