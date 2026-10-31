---
description: "Add i18n to an Astro site, static or server-rendered, without heavy setup. i18n-tiny gives fully typed translation keys with zero dependencies."
---

# Type-Safe i18n for Astro (SSG and SSR)

A zero-dependency, type-safe, minimal internationalization library for **Astro** that ships no client JavaScript.

Works with both SSG and SSR. Configuration is handled by a single `define` function, providing full auto-completion for key paths like `messages.common.title`.
For static builds, put the pages under `src/pages/[...locale]/` and return `i18n.getStaticPaths()`: the default locale has no prefix (`/about`), the others have one (`/en/about`).

Updating from 1.x? See the [migration guide](https://github.com/unlibra/i18n-tiny/blob/main/MIGRATION.md).

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

const { locale } = Astro.props // 'ja' | 'en'
const messages = i18n.getMessages(locale)
const t = i18n.getTranslations(locale)
---

<html lang={locale}>
  <head>
    <title>{messages.common.title}</title> {/* ← Type-safe! Autocomplete */}
  </head>
  <body>
    <h1>{messages.common.title}</h1>
    <p>{t('common.description')}</p> {/* ← Typed keys */}
  </body>
</html>
```

For server rendering, see [Usage](./usage#server-rendering).

## Next Steps

- [Installation](./installation)
- [Usage](./usage)
- [API Reference](./api-reference/)
- [TIPS](./tips/)
