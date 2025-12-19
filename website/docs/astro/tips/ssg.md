---
sidebar_position: 1
---

# 静的サイト生成 (SSG)

静的サイトの場合は、`getStaticPaths` とインテグレーションを使用します。

**1. `astro.config.mjs` にインテグレーションを追加:**

```typescript
import { defineConfig } from 'astro/config'
import { create } from '@i18n-tiny/astro/integration'

export default defineConfig({
  integrations: [
    create({ defaultLocale: 'en' })
  ]
})
```

**2. ページで `getStaticPaths` を使用:**

```astro
---
// src/pages/[locale]/index.astro
import { locales, getMessages } from '../../i18n'

export function getStaticPaths() {
  return locales.map((locale) => ({
    params: { locale }
  }))
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

> **注意**: インテグレーションはビルド後に `/en/*` を `/*` にコピーするため、ユーザーはロケールプレフィックスなしで `/` でサイトにアクセスできます。SSGの場合、ミドルウェアは不要です。
