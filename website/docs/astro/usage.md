---
sidebar_position: 3
---

# Usage

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

export const { getMessages, getTranslations } = define({
  messages: { en, ja }
})
```

## 3. Advanced Setup (Optional)

Depending on your project's output mode, you can add an Integration (for SSG) or Middleware (for SSR).

### SSG

Use the Integration if you want to copy the default locale's content to the root directory after build, allowing access without a prefix (e.g., `/about` instead of `/en/about`).

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

Use the Middleware for Server-Side Rendering to handle language detection and redirects.

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
import { getMessages } from '../../i18n'
const { locale } = Astro.params

const messages = getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```