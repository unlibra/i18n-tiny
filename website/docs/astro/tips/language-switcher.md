---
description: "Switch languages in Astro without sending users back to the home page. Use the normalize prop of the i18n-tiny Link component."
---

# Astro Language Switcher That Keeps the Page

To create a language switcher in Astro that maintains the current page, use the `normalize` prop of the `Link` component.

`normalize` reads the supported locales from `Astro.locals.locales`, which only the i18n-tiny [middleware](../api-reference/middleware) sets. Without the middleware (for example, a static build), see [Without the middleware](#without-the-middleware).

## Implementation Example

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
import { locales } from '../i18n'

const { locale: currentLocale } = Astro.params
const pathname = Astro.url.pathname
---

<div class="flex gap-4">
  {locales.map((loc) => (
    <Link
      href={pathname}
      locale={loc}
      normalize
      class={loc === currentLocale ? 'font-bold' : ''}
    >
      {loc.toUpperCase()}
    </Link>
  ))}
</div>
```

### How it works

1.  `Astro.url.pathname` returns the current path (e.g., `/ja/about`).
2.  `Link` receives `/ja/about` as `href` and `en` as `locale`.
3.  Because `normalize` is set to `true`, the `Link` component removes the existing `/ja` prefix before applying the new `/en` prefix, resulting in `/en/about`.

## Without the middleware

Remove the prefix with `removeLocalePrefix` and pass the result as `href`:

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
import { removeLocalePrefix } from '@i18n-tiny/astro/router'
import { locales } from '../i18n'

const { locale: currentLocale } = Astro.params
---

<div class="flex gap-4">
  {locales.map((loc) => (
    <Link
      href={removeLocalePrefix(Astro.url.pathname, locales)}
      locale={loc}
      class={loc === currentLocale ? 'font-bold' : ''}
    >
      {loc.toUpperCase()}
    </Link>
  ))}
</div>
```
