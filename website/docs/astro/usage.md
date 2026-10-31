---
description: "Add multiple languages to an Astro site, step by step: create message files, call define(), build a page per locale, and add the middleware for server rendering."
---

# How to Add i18n to an Astro Site

**In short:** create one message file per locale, and call `define()` once to get typed `getMessages()` and `getTranslations()`. Put the pages under `src/pages/[...locale]/` and return `i18n.getStaticPaths()`. For server rendering, add the middleware.

## 1. Create Messages

Create message files for each locale.

```typescript
// src/messages/ja.ts
export default {
  common: {
    title: "マイサイト",
    description: "ようこそ"
  }
}

// src/messages/en.ts
export default {
  common: {
    title: "My Site",
    description: "Welcome"
  }
}
```

Every locale must have the keys of the default locale: a missing or extra key is a type error in `define()`. See [Messages](./api-reference/core#messages) for variables and their types.

## 2. Define i18n Instance

Import `define` from `@i18n-tiny/astro` to create your instance.

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/astro'
import ja from './messages/ja'
import en from './messages/en'

export const i18n = define({
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  messages: { ja, en }
})
```

`locales` and `defaultLocale` are required. The keys are typed from the messages of `defaultLocale`, and `locales` needs no `as const`.

## 3. Use in Pages

Put the pages under `src/pages/[...locale]/`, and return `i18n.getStaticPaths()` from their `getStaticPaths`:

```text
src/pages/
└── [...locale]/
    ├── index.astro    → /, /en
    └── about.astro    → /about, /en/about
```

```astro
---
// src/pages/[...locale]/index.astro
import type { InferGetStaticPropsType } from 'astro'
import { i18n } from '../../i18n'

export function getStaticPaths() {
  return i18n.getStaticPaths()
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale } = Astro.props // 'ja' | 'en'
const messages = i18n.getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

The build has `/` and `/about` in Japanese, the default locale, and `/en` and `/en/about` in English, with no `/ja`. Use `Astro.props.locale`, typed as one of the locales, rather than `Astro.params.locale`, which is `undefined` for the default locale.

Write `getStaticPaths` as a function declaration, as above: on Astro 6, `export const getStaticPaths = () => …` fails the build. For pages in some locales only, and for routes with other dynamic parameters, see [`getStaticPaths()`](./api-reference/core#i18n-getstaticpaths-options).

## 4. Links

Use the `Link` component for links between pages. Without `locale`, it keeps the locale of the current page:

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
---

<Link href="/about">About</Link> <!-- /about on /, /en/about on /en -->
```

For a link to another locale, pass the `define()` result as `i18n`: see [Router](./api-reference/router) and the [language switcher](./tips/language-switcher).

## Server Rendering

With `output: 'server'` and an adapter, add the middleware. To use the locale settings in the middleware too, write them once in a file of their own and spread them:

```typescript
// src/i18n.config.ts
export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const

// src/i18n.ts
export const i18n = define({ ...config, messages: { ja, en } })
```

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { config } from './i18n.config'

export const onRequest = defineMiddleware(create({ ...config }))
```

The pages stay under `src/pages/[...locale]/`. With server output there is no `getStaticPaths()`, so read the locale from the params:

```astro
---
// src/pages/[...locale]/about.astro
import { i18n } from '../../i18n'

// undefined for the default locale. [...locale] also matches /fr/about, so check it
const locale = Astro.params.locale ?? i18n.defaultLocale
if (!i18n.isLocale(locale)) {
  return new Response(null, { status: 404 })
}
const messages = i18n.getMessages(locale)
---
```

The middleware does not detect the language unless you pass `detectLanguage: true`. For language detection and the rewrite mode, see [Middleware](./api-reference/middleware).
