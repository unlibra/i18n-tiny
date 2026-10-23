---
description: "Add i18n to an Astro site, static or server-rendered, without heavy setup. i18n-tiny gives fully typed translation keys with zero dependencies."
---

# Type-Safe i18n for Astro (SSG and SSR)

A zero-dependency, type-safe, minimal internationalization library for **Astro**.

Works with both SSG and SSR. Configuration is handled by a single `define` function, providing full auto-completion for key paths like `messages.common.title`.
For static builds, each `[locale]` page lists its locales in a short `getStaticPaths` that maps over the `locales` returned by `define`.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys.
- **Zero dependencies**: No external i18n libraries needed.
- **Server-first**: Native Astro server-side rendering support.
- **Minimal SSG**: Works seamlessly with Astro's static site generation.
- **Simple API**: Single configuration, minimal boilerplate.
- **No client JavaScript**: In `.astro` files it runs at build time or on the server, so it adds no JavaScript to the browser.
- **Flexible**: Works with Astro's built-in i18n or as a standalone solution.

## Installation

```bash
npm install @i18n-tiny/astro
```

## Usage

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/astro'
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
import { locales, getMessages, getTranslations } from '../../i18n'

// Static output: build one page per locale
export function getStaticPaths() {
  return locales.map((locale) => ({ params: { locale } }))
}

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

With `output: 'server'` and an adapter (SSR), leave out `getStaticPaths`.

## Next Steps

- [Installation](./installation)
- [Usage](./usage)
- [API Reference](./api-reference/)
- [TIPS](./tips/typescript)