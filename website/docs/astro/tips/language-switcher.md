---
description: "Switch languages in Astro without sending users back to the home page with the normalize prop of the i18n-tiny Link component, and add hreflang alternate links with alternatePath()."
---

# Astro Language Switcher That Keeps the Page

A language switcher links to the current page in each locale. Pass the current URL to the `Link` component with each locale and the `normalize` prop.

## Implementation Example

```astro
---
// src/components/LanguageSwitcher.astro
import Link from '@i18n-tiny/astro/router/Link.astro'
import { i18n } from '../i18n'

const names = { ja: '日本語', en: 'English' }
---

<nav>
  {i18n.locales.map((locale) => (
    <Link href={Astro.url.pathname} locale={locale} normalize i18n={i18n}>
      {names[locale]}
    </Link>
  ))}
</nav>
```

## How It Works

1.  On `/en/about`, `Astro.url.pathname` is `/en/about`.
2.  `normalize` removes the [`base`](https://docs.astro.build/en/reference/configuration-reference/#base), if any, and the locale prefix `/en`: `/about`.
3.  The link is built for each locale: `/about` for Japanese, the default locale, and `/en/about` for English. With a `base`, the `Link` adds it.

For a page in some locales only, map over its locales instead of `i18n.locales`.

## With Language Detection

Without detection, the default, the language switcher works as it is. A static build has no middleware and no detection.

If you turn on detection in the [middleware](../api-reference/middleware) with `detectLanguage: true`, also put `prefixDefault: true` in the config shared with `define()` (see [`I18nConfig`](../api-reference/core#i18nconfig-type)). With `prefixDefault: false`, a browser that prefers another locale than the default one cannot reach the pages of the default locale: the link to the default locale has no prefix, and the middleware detects its language again, so a browser that prefers English follows the Japanese link to `/about` and is redirected back to `/en/about`. With `prefixDefault: true`, the URLs of the default locale have the prefix too (`/ja/about`), and are not detected.

## Alternate Links (hreflang)

The current page in each locale, in the `<head>` of a layout:

```astro
---
import { i18n } from '../i18n'

const site = 'https://example.com'
---

{i18n.locales.map((locale) => (
  <link rel="alternate" hreflang={locale} href={site + i18n.alternatePath(Astro.url.pathname, locale)} />
))}
```

On `/en/about`, this gives `https://example.com/about` for `ja` and `https://example.com/en/about` for `en`. For a page in some locales only, map over its locales. With a `base`, build the paths from the path of the page instead, `localizedPath(path, locale)`, and add the base to them. In the rewrite mode, use `Astro.locals.originalPathname`, the URL before the rewrite.
