---
sidebar_position: 3
---

# Using with Astro's Built-in i18n

Astro 4.0+ has built-in routing support for i18n. You can combine it with i18n-tiny to get the best of both worlds: Astro's native routing and i18n-tiny's type-safe translations.

## Configuration

Set up your `astro.config.mjs` using Astro's native `i18n` configuration.

```typescript
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

## Integration

Since Astro handles the routing, you only need i18n-tiny for message resolution.

```astro
---
// src/pages/[locale]/index.astro
import { getTranslations } from '../../i18n'
const { locale } = Astro.params

const t = getTranslations(locale)
---

<h1>{t('common.title')}</h1>
```

### Benefits of this approach

- Use Astro's native `Astro.currentLocale`.
- Use Astro's automatic redirect features.
- Keep the ultra-simple and type-safe translation API of i18n-tiny.