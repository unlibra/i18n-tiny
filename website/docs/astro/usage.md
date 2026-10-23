---
description: "Add multiple languages to an Astro site, step by step: create message files, call define(), set up SSG or SSR locale routing, and use typed translations."
---

# How to Add i18n to an Astro Site

**In short:** create one message file per locale, and call `define()` once to get typed `getMessages()` and `getTranslations()`. Optionally, add the i18n-tiny integration (SSG) or middleware (SSR) for locale routing. Then call the helpers in your pages with the current locale.

## 1. Create Messages

Create message files for each locale.

```typescript
// src/messages/en.ts
export default {
  common: {
    title: "My Site",
    description: "Welcome"
  }
}

// src/messages/ja.ts
export default {
  common: {
    title: "マイサイト",
    description: "ようこそ"
  }
}
```

## 2. Define i18n Instance

Import `define` from `@i18n-tiny/astro` to create your instance.

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/astro'
import en from './messages/en'
import ja from './messages/ja'

export const { locales, getMessages, getTranslations } = define({
  messages: { en, ja }
})
```

## 3. Advanced Setup (Optional)

Depending on your project's output mode, you can add an Integration (for SSG) or Middleware (for SSR).

### SSG

Use the Integration if you want to copy the default locale's content to the root directory after build, allowing access without a prefix (e.g., `/about` instead of `/en/about`).

The pages are copied as they are, so links inside the copied root pages still point to `/en/...`.

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import { create } from '@i18n-tiny/astro/integration'

export default defineConfig({
  output: 'static', // Default
  integrations: [
    create({ defaultLocale: 'en' })
  ]
})
```

### SSR

Use the Middleware for Server-Side Rendering to handle language detection and redirects. The middleware runs on each request, so set `output: 'server'` and add an adapter:

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' })
})
```

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware'
import { create } from '@i18n-tiny/astro/middleware'

export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en'
  })
)
```

## 4. Use in Pages

Retrieve messages within your `[locale]` directory.

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

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```