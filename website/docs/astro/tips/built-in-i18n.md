---
description: "Keep Astro's native i18n routing and add type-safe translations on top: configure astro.config.mjs, then use i18n-tiny for the messages."
---

# Typed Translations with Astro's Built-in i18n

Astro has built-in routing support for i18n. You can combine it with i18n-tiny to get the best of both worlds: Astro's native routing and i18n-tiny's type-safe translations.

## Configuration

Set up your `astro.config.mjs` using Astro's native `i18n` configuration.

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  }
})
```

## Translations

Since Astro handles the routing, you only need i18n-tiny for the messages. Astro's routing builds the pages of each locale, and `Astro.currentLocale` is a `string | undefined`, so narrow it with `isLocale()`:

```astro
---
import { i18n } from '../i18n'

const locale = Astro.currentLocale
if (!i18n.isLocale(locale)) {
  throw new Error(`Unknown locale: ${locale}`)
}
const t = i18n.getTranslations(locale)
---

<html lang={locale}>
  <body>
    <h1>{t('common.title')}</h1>
  </body>
</html>
```

Use the same `locales` and `defaultLocale` in `define()` as in `astro.config.mjs`.

### Benefits of this approach

- Use Astro's native `Astro.currentLocale`.
- Use Astro's automatic redirect features.
- Keep the ultra-simple and type-safe translation API of i18n-tiny.
