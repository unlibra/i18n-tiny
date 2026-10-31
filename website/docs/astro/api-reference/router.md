---
description: "API reference for i18n-tiny router utilities in Astro: a localized Link component and URL functions for localized paths."
---

# Router

The `Link` component and the URL functions of `@i18n-tiny/astro/router`.

## `Link`

A link that keeps the locale of the current page, or points to another locale.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | :---: | --- |
| `href` | `string` | Required | The path of the page, starting with `/`, without the base and without a locale prefix |
| `locale` | `string` \| `false` | | Without it, the link keeps the locale of the current URL. A locale builds the link for it, and `false` leaves the path without a locale |
| `i18n` | `define()` result | With a locale | Required with a locale (other than `false`). The link is built with its `localizedPath()`, and so with its `prefixDefault` |
| Others | `HTMLAttributes<'a'>` | | Attributes of the `<a>` element, such as `hreflang` or `class` |

**Example:**

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
import { i18n } from '../i18n'
---

<!-- Keeps the locale of the current URL: /about on /, /en/about on /en -->
<Link href="/about">About</Link>

<!-- A link for a locale: /en, and / for the default locale -->
<Link href="/" locale="en" i18n={i18n}>English</Link>
<Link href="/" locale="ja" i18n={i18n}>日本語</Link>

<!-- The path without a locale -->
<Link href="/" locale={false}>Top</Link>
```

- Without `locale`, the link keeps the form of the current URL: it gets the prefix of the current locale only when the current URL has one. The current locale is `Astro.params.locale`, or in the rewrite mode `Astro.locals.locale`. The `Link` of `@i18n-tiny/next` builds this link from the config instead.
- With `locale`, the link is built as `localizedPath()` builds it: the default locale gets no prefix unless `prefixDefault` is true. A locale that is not one of `locales` throws.
- `locale` without `i18n` is a type error, and throws.
- An `href` that does not start with `/`, such as `about`, throws. Hrefs that are not paths of the site, such as `https://…`, `mailto:…` or `#top`, are left unchanged. A query and a hash in `href` are kept.
- The links have no trailing slash, except for the top page `/`.
- With a [`base`](https://docs.astro.build/en/reference/configuration-reference/#base), the link removes it from the current URL to find the locale, and adds it to the result: with the base `/docs`, `<Link href="/about">` on `/docs/en` is `/docs/en/about`. Write `href` without the base.

For links to the current page in each locale, see the [language switcher](../tips/language-switcher).

## URL functions

The functions of `@i18n-tiny/core/router`, for places where the messages are not loaded, such as `astro.config` or build scripts. They take the config object `{ locales, defaultLocale, prefixDefault? }`. In pages, [`localizedPath` and `alternatePath` of `define()`](./core#url-functions) need no config.

```typescript
import { localizedPath, alternatePath, removeLocalePrefix, pathLocale } from '@i18n-tiny/astro/router'

const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const

localizedPath('/about', 'en', config)    // '/en/about': the path of a page in a locale
localizedPath('/about', 'ja', config)    // '/about'
localizedPath('/', 'en', config)         // '/en'
alternatePath('/en/about', 'ja', config) // '/about': the current page in another locale
removeLocalePrefix('/en/about', config)  // '/about'
pathLocale('/en/about', config)          // 'en'
pathLocale('/about', config)             // undefined
```

| Function | Returns |
| --- | --- |
| `localizedPath(path, locale, config)` | The path of a page in `locale`. `path` has no locale prefix |
| `alternatePath(pathname, locale, config)` | The current page in another locale: removes the locale prefix of `pathname`, if it has one, and adds the prefix of `locale` |
| `removeLocalePrefix(pathname, config)` | `pathname` without its locale prefix |
| `pathLocale(pathname, config)` | The locale of the prefix of `pathname`, or `undefined`. Only whole path segments match |

- The results have no trailing slash, except for the top page `/`.
- They take a pathname only, and throw when it does not start with `/`, starts with `//` or `/\`, or contains `?` or `#`. Add the query and the hash after building the path.
- A locale that is not one of `locales` throws. With `as const`, it is a type error too.
- `localizedPath()` takes the path without a locale prefix, and adds one even when the path already has it. Use `alternatePath()` for the current page.
- The config is checked on every call, as `define()` checks it.

## `I18nConfig` (type)

The type of the locale settings, also exported from `@i18n-tiny/astro`: see [Core](./core#i18nconfig-type).
