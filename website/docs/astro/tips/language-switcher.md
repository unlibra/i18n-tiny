---
sidebar_position: 2
---

# Language Switcher

To create a language switcher in Astro that maintains the current page, use the `normalize` prop of the `Link` component.

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