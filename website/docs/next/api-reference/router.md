---
description: "API reference for i18n-tiny router utilities in Next.js: a localized Link component and URL functions for locale-aware paths."
---

# Router

A localized `Link` and URL functions, from `@i18n-tiny/next/router`.

## `Link`

A localized wrapper around the Next.js `Link` component, a Client Component. It reads the current locale and the locale settings from the `Provider`, so use it inside the `Provider`.

**Props:**

| Prop | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `href` | `string` \| `UrlObject` | Required | - | A path without a locale prefix and without the `basePath`, starting with `/` |
| `locale` | one of `locales` \| `false` | | - | Without it, the link is for the current locale. A locale builds the link for it, and `false` leaves the path without a locale |
| `normalize` | `boolean` | | `false` | Removes a locale prefix from `href` first, such as when `href` is the current pathname |
| Others | `NextLinkProps` | | - | Other props for Next.js `Link` component |

**Example:**

```tsx
import { Link } from '@i18n-tiny/next/router'

// The link for the current locale
<Link href="/about">About</Link>

// A link for another locale
<Link href="/" locale="ja">日本語</Link>

// Raw path (no localization)
<Link href="/" locale={false}>Top</Link>

// Conditional locale (false = raw path)
<Link href="/" locale={condition && 'ja'}>Conditional</Link>
```

- Without `locale`, the link is for the current locale, as `localizedPath()` builds it: with `defaultLocale: 'en'`, `href="/about"` is `/about` on an English page and `/ja/about` on a Japanese page, whatever the current URL is.
- With `locale`, the default locale gets no prefix unless `prefixDefault` is true. A locale that is not one of `locales` throws.
- An `href` that does not start with `/`, such as `about`, throws. Hrefs that are not paths on this site, such as `https://…` or `#top`, are left as they are, and the query and the hash of a path are kept.
- A link to a page of another locale is loaded in full by the browser, not by the router of Next.js, and is not prefetched. The locale of the page is read from the path, also with `locale={false}`: the locale of its prefix, or for a path without a prefix, the default locale. With `prefixDefault`, a path without a prefix is the detected locale, which only the server knows, and is loaded in full too. Clicks with a modifier key, `target="_blank"` and `download` are left to the browser.
- With `typedRoutes`, the `href` of this `Link` is typed as any URL, not as one of the generated routes, since it has no locale prefix.

## URL functions

The functions of `@i18n-tiny/core/router`. They take the locale settings, and work in Server and Client Components, in the proxy and in scripts that do not load the messages, such as `app/sitemap.ts`. In components, `localizedPath` and `alternatePath` of [`define()`](./core#url-functions) need no config.

```typescript
import { localizedPath, alternatePath, removeLocalePrefix, pathLocale } from '@i18n-tiny/next/router'

const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const

localizedPath('/about', 'ja', config)       // '/ja/about': the path of a page in a locale
localizedPath('/about', 'en', config)       // '/about'
localizedPath('/', 'ja', config)            // '/ja'
alternatePath('/ja/about', 'en', config)    // '/about': the current page in another locale
removeLocalePrefix('/ja/about', config)     // '/about'
pathLocale('/ja/about', config)             // 'ja'
pathLocale('/about', config)                // undefined
```

- The results have no trailing slash, except for the top page `/`, and no `basePath`.
- They take a pathname only: a path that does not start with `/`, starts with `//` or `/\`, or contains `?` or `#`, throws, as does a locale that is not one of `locales`. Add the query and the hash after building the path.
- `localizedPath()` takes the path without a locale prefix, and adds one even when the path already has it. Use `alternatePath()` for the current page.

A sitemap needs absolute URLs: build them from the site, the `basePath` and the path.

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { localizedPath } from '@i18n-tiny/next/router'
import { config } from '@/i18n.config'

const site = 'https://example.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/about'].flatMap((path) => config.locales.map((locale) => ({
    url: site + localizedPath(path, locale, config)
  })))
}
```
