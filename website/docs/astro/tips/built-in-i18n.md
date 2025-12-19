---
sidebar_position: 3
---

# Astro組み込みのi18nとの併用

翻訳機能のみに `@i18n-tiny/astro` を使用し、ルーティングにはAstroの組み込みi18n機能を使用することもできます。

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
    routing: {
      prefixDefaultLocale: false
    }
  }
})
```

```astro
---
// src/pages/[locale]/index.astro
import { getMessages } from '../../i18n'

// Astro 4.0以降では Astro.currentLocale が利用可能です
const locale = Astro.currentLocale
const messages = getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```
