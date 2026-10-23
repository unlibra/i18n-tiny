---
description: "Add i18n to an Astro site, static or server-rendered, without heavy setup. i18n-tiny gives fully typed translation keys with zero dependencies."
---

# Type-Safe i18n for Astro (SSG and SSR)

A zero-dependency, type-safe, minimal internationalization library for **Astro**.

Works with both SSG and SSR. Configuration is handled by a single `define` function, providing full auto-completion for key paths like `messages.common.title`.
Locale handling in `getStaticPaths` requires only minimal setup, avoiding repetitive per-page definitions.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys.
- **Zero dependencies**: No external i18n libraries needed.
- **Server-first**: Native Astro server-side rendering support.
- **Minimal SSG**: Works seamlessly with Astro's static site generation.
- **Simple API**: Single configuration, minimal boilerplate.
- **Lightweight**: Minimal bundle size.
- **Flexible**: Works with Astro's built-in i18n or as a standalone solution.

## Installation

```bash
npm install @i18n-tiny/astro
```

## Usage

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/astro'

export const { getMessages, getTranslations } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

```astro
---
// src/pages/[locale]/index.astro
import { getMessages, getTranslations } from '../../i18n'
const { locale } = Astro.params

const messages = getMessages(locale)
const t = getTranslations(locale)
---

<html lang={locale}>
  <head>
    <title>{messages.common.title}</title> {/* ← Type-safe! Autocomplete */}
  </head>
  <body>
    <h1>{messages.common.title}</h1>
    <p>{t('common.description')}</p> {/* ← Interpolation supported */}
  </body>
</html>
```

## Next Steps

- [Installation](./installation)
- [Usage](./usage)
- [API Reference](./api-reference/)
- [TIPS](./tips/typescript)