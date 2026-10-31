# Migrating from 1.x to 2.0

This guide covers the changes from i18n-tiny 1.x to **2.0.0-beta.1**. Each section shows the 1.x code and the 2.0 code. The 2.0 code is taken from the [examples](./examples).

2.0 is in beta, and a later 2.0 beta may bring more changes. This guide will be updated with them.

```bash
npm install @i18n-tiny/next@2.0.0-beta.1    # or @i18n-tiny/astro, @i18n-tiny/react
```

The alias packages `next-i18n-tiny`, `astro-i18n-tiny` and `react-i18n-tiny` have the same version and the same changes as the `@i18n-tiny` packages.

## Overview

| Area | 1.x | 2.0 | Section |
| --- | --- | --- | --- |
| Node.js | Not specified | 22.12 or later | [Requirements](#requirements) |
| Module format | ES modules and CommonJS | ES modules only | [Requirements](#requirements) |
| Astro | 4 to 7 | 6 or 7 | [Requirements](#requirements) |
| TypeScript | Not specified | 5.9 or later | [Requirements](#requirements) |
| `define()` config | `locales` and `defaultLocale` optional in Astro, nothing checked | Both required, the config is checked | [The config](#the-config) |
| `messages` | A locale without messages fell back to the default locale | `messages` must have exactly the locales of `locales` | [The config](#the-config) |
| `prefixDefault` of the middleware, the proxy and the integration | Set in `create()` only | In the shared config, passed to `define()` too | [One config for everything](#one-config-for-everything) |
| Config type | `DefineConfig` | `I18nConfig`, the locale settings only | [Config types](#config-types) |
| `@i18n-tiny/astro` `I18nConfig` | A config with `messages` | The locale settings, as in the core | [Config types](#config-types) |
| `getMessages()`, `getTranslations()`, `Provider` | Any `string`, unknown locales fell back to the default locale | One of `locales`, anything else throws | [Locales are typed](#locales-are-typed) |
| `useLocale()` | `string` | One of `locales` | [Locales are typed](#locales-are-typed) |
| URL functions | `getLocalizedPath()`, `removeLocalePrefix(pathname, locales)`, `hasLocalePrefix()` | `localizedPath()`, `alternatePath()`, `removeLocalePrefix(pathname, config)`, `pathLocale()` | [URL functions](#url-functions) |
| Path input | A missing `/` was added, a query or hash was kept | Must start with `/`, no `?` or `#` | [URL functions](#url-functions) |
| Trailing slash | Kept | Removed, except for `/` | [URL functions](#url-functions) |
| `getLinkHref()` | Fourth argument optional, a string or `{ locale, locales }` | Fourth argument required, `{ locale, normalize, config }` | [getLinkHref()](#getlinkhref) |
| `Link` `locale=""` | The path without a locale | Use `locale={false}` | [Link](#link) |
| `Link` `locale` for the default locale | Always prefixed (`/en`) | No prefix unless `prefixDefault` (`/`) | [Link](#link) |
| `Link` relative `href` | `/` was added | Throws | [Link](#link) |
| Astro `Link` `locale`, `normalize` | Read `Astro.locals.locales` | Need the `i18n` prop | [Astro: Link](#astro-link) |
| Astro `Link` with a `base` | Not handled | `href` without the base, the link adds it | [Astro: Link](#astro-link) |
| Astro static builds | `src/pages/[locale]/`, `@i18n-tiny/astro/integration` | `src/pages/[...locale]/`, `i18n.getStaticPaths()` | [Astro: static builds](#astro-static-builds) |
| `@i18n-tiny/astro/integration` | Copied the default locale to the root | Removed | [Astro: static builds](#astro-static-builds) |
| Astro middleware, standard routing | Rewrote the default locale to `/[defaultLocale]` | Serves `src/pages/[...locale]/` | [Astro: server rendering](#astro-server-rendering) |
| Middleware and proxy without detection | Used `fallbackLocale` | Uses `defaultLocale` | [Astro: server rendering](#astro-server-rendering), [Next.js: proxy](#nextjs-proxy) |
| Astro `excludePaths` | Prefix match (`/api` matched `/apis`) | Whole path segments, each entry starts with `/` | [Astro: server rendering](#astro-server-rendering) |
| `Astro.locals.locales` | Set in every routing mode | Removed | [Astro: server rendering](#astro-server-rendering) |
| Rewrite mode with detection | `prefixDefault` not accepted | `prefixDefault: true` required | [Astro: rewrite mode](#astro-rewrite-mode), [Next.js: rewrite mode](#nextjs-rewrite-mode) |
| Next.js `x-locale` | Set on the response | Passed as a request header | [Next.js: rewrite mode](#nextjs-rewrite-mode) |
| Next.js `Link` without `locale` | Copied the pattern of the current URL | The link for the current locale, from the `Provider` | [Next.js: Link](#nextjs-link) |
| Next.js `Link` to a page of another locale | Navigated on the client | Loaded in full, not prefetched | [Next.js: Link](#nextjs-link) |
| Next.js `Link` with `typedRoutes` | `href` checked against the routes | `href` typed as any URL | [Next.js: Link](#nextjs-link) |
| React `I18nProviderProps` | Deprecated alias of `ProviderProps` | Removed | [React](#react) |

## Requirements

- **Node.js 22.12 or later.** Each package has `"engines": { "node": ">=22.12" }`. Astro may need a newer Node.js than this: use the version your Astro version requires.
- **ES modules only.** The `.cjs` and `.d.cts` files are gone, and `exports` has only the `types` and `default` conditions. On Node.js 22.12 or later, `require()` can still load the packages, since Node.js loads ES modules from `require()`.
- **Astro 6 or 7.** Astro 4 and 5 are no longer supported.
- **TypeScript 5.9 or later** for the types.
- Next.js 15 or 16 and React 18 or 19, as in 1.x.

## The config

`define()` takes `locales` and `defaultLocale` in every package. In Astro they were optional and came from the keys of `messages`: add them.

```typescript
// 1.x (Astro): locales and defaultLocale could be left out
export const i18n = define({ messages: { en: enMessages, ja: jaMessages } })

// 2.0
export const i18n = define({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

`define()`, the Astro middleware, the Next.js proxy and the URL functions check the config, and throw when:

- `locales` is empty or lists a locale twice
- a locale cannot be a path segment: empty, `.`, `..`, or containing `/`, `\`, `?`, `#` or whitespace
- `defaultLocale` or `fallbackLocale` is not one of `locales`
- `messages` misses a locale or has one that is not in `locales`. In 1.x, a locale without messages fell back to the default locale

With `as const` or an inline config, these are type errors too. `locales` needs no `as const` in `define()`.

### One config for everything

The middleware, the proxy and the URL functions take the same locale settings as `define()`. The examples keep them in a file of their own and spread them:

```typescript
// i18n.config.ts (examples/next)
// The locale settings, shared by define() and the proxy
export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const
```

```typescript
// i18n.ts (examples/next)
export const i18n = define({
  ...config,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})
```

The 1.x way, with `locales` and `defaultLocale` as constants of their own, still works, as in [examples/react](./examples/react).

**Move `prefixDefault` to the shared config.** In 1.x, `prefixDefault` was an option of the Astro middleware, the Next.js proxy and `@i18n-tiny/astro/integration`, and the links did not read it. In 2.0, `Link` and the URL functions read it from `define()` (in Next.js, through its `Provider`). If your 1.x code passed `prefixDefault` to `create()`, move it to the shared config, so that `define()` gets it too. With `prefixDefault: true` in `create()` only, a link to the default locale has no prefix, so the middleware or the proxy redirects it, and with detection to the detected locale, which may not be the default one.

```typescript
// 1.x
export const proxy = create({ locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true })

// 2.0: i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const

// 2.0: i18n.ts
export const i18n = define({ ...config, messages: { en: enMessages, ja: jaMessages } })

// 2.0: proxy.ts
export const proxy = create({ ...config })
```

### Config types

`DefineConfig` is removed from every package. The 2.0 type is `I18nConfig`, the locale settings `{ locales, defaultLocale, prefixDefault? }`, without `messages`. It is exported from `@i18n-tiny/core`, `@i18n-tiny/core/router`, `@i18n-tiny/astro`, `@i18n-tiny/astro/router`, `@i18n-tiny/next`, `@i18n-tiny/next/router`, `@i18n-tiny/next/types` and `@i18n-tiny/react`.

```typescript
// 1.x
import type { DefineConfig } from '@i18n-tiny/next/types'

// 2.0
import type { I18nConfig } from '@i18n-tiny/next/types'

export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const satisfies I18nConfig
```

Use `satisfies` rather than a type annotation: `const config: I18nConfig<'en' | 'ja'>` widens `prefixDefault: true` to `boolean`, which the rewrite mode with detection rejects.

`@i18n-tiny/astro` exported its own `I18nConfig<L, M, Msgs>` in 1.x, a config with `messages` and optional `locales` and `defaultLocale`. In 2.0, `I18nConfig` from `@i18n-tiny/astro` is the locale settings above. Let `define()` infer the type of the messages, and use `typeof i18n` for the type of the instance.

## Locales are typed

The `locale` argument of `getMessages()` and `getTranslations()`, and the `locale` prop of the `Provider` (Next.js and React), take one of `locales`. Any other value, `undefined` included, is a type error and throws. In 1.x, an unknown locale fell back to the default locale.

Narrow a `string` with the new `isLocale()` of `define()`:

```typescript
// 1.x (examples/next)
const { locale } = await params
const messages = await getMessages(locale)

// 2.0 (examples/next)
const { locale } = await params
if (!isLocale(locale)) notFound()
const messages = await getMessages(locale)
```

`useLocale()` returns one of `locales` instead of `string`, in Next.js and React.

## URL functions

The URL functions of `@i18n-tiny/core/router`, `@i18n-tiny/astro/router` and `@i18n-tiny/next/router` take the config object instead of positional arguments. `define()` in Astro and Next.js returns the same functions with its config, so they take no config there.

With `config = { locales: ['en', 'ja'], defaultLocale: 'en' }`:

| 1.x | 2.0 | 2.0 with `define()` |
| --- | --- | --- |
| `getLocalizedPath('/about', 'ja', 'en')` | `localizedPath('/about', 'ja', config)` | `i18n.localizedPath('/about', 'ja')` |
| `getLocalizedPath('/about', 'en', 'en', true)` | `localizedPath('/about', 'en', { ...config, prefixDefault: true })` | `i18n.localizedPath('/about', 'en')` with `prefixDefault: true` in `define()` |
| `getLocalizedPath(removeLocalePrefix(pathname, ['en', 'ja']), 'en', 'en')` for the current page | `alternatePath(pathname, 'en', config)` | `i18n.alternatePath(pathname, 'en')` |
| `removeLocalePrefix('/ja/about', ['en', 'ja'])` | `removeLocalePrefix('/ja/about', config)` | `i18n.removeLocalePrefix('/ja/about')` |
| `hasLocalePrefix('/ja/about', 'ja')` | `pathLocale('/ja/about', config) === 'ja'` | `i18n.pathLocale('/ja/about') === 'ja'` |

`getLocalizedPath()` and `hasLocalePrefix()` are removed, and `removeLocalePrefix()` no longer takes an array of locales.

The rules for paths changed:

- The path must start with `/`. 1.x added a missing `/`; 2.0 throws.
- The path is a pathname only: a path that contains `?` or `#`, or starts with `//` or `/\`, throws. Add the query and the hash after building the path.
- A locale that is not one of `locales` throws.
- The results have no trailing slash, except for the top page `/`: `localizedPath('/about/', 'ja', config)` is `'/ja/about'`.
- `localizedPath()` no longer avoids a double prefix: `localizedPath('/ja/about', 'ja', config)` is `'/ja/ja/about'`. For the current page in another locale, use `alternatePath()`.

In Next.js, Client Components get the same functions from the `Provider` with `client.usePaths()`. The functions of `@i18n-tiny/next/router` now also work in Server Components, such as in `app/sitemap.ts` of [examples/next](./examples/next/app/sitemap.ts).

## getLinkHref()

`getLinkHref()` of `@i18n-tiny/core/router`, which the `Link` components use, takes an options object as its required fourth argument. A link for a locale and `normalize` need the config.

| 1.x | 2.0 |
| --- | --- |
| `getLinkHref(href, pathname, locale)` | `getLinkHref(href, pathname, locale, {})` |
| `getLinkHref(href, pathname, locale, 'ja')` or `{ locale: 'ja' }` | `getLinkHref(href, pathname, locale, { locale: 'ja', config })` |
| `getLinkHref(href, pathname, locale, '')`, `{ locale: '' }` or `{ locale: false }` | `getLinkHref(href, pathname, locale, { locale: false })` |
| `getLinkHref(href, pathname, locale, { locale: 'en', locales })` | `getLinkHref(href, pathname, locale, { locale: 'en', normalize: true, config })` |

A link for the default locale gets no prefix unless `prefixDefault` is true. A string as the fourth argument throws.

## Link

These changes apply to the `Link` of both Astro and Next.js.

- `locale=""` is removed. Use `locale={false}` for the path without a locale.
- A link for the default locale gets no prefix unless `prefixDefault` is true. In 1.x, `<Link href="/" locale="en">` was `/en` even for the default locale `en`; in 2.0 it is `/`.
- With `prefixDefault: false` and detection, the default, a browser that prefers another locale than the default one cannot reach the pages of the default locale: the link to the default locale has no prefix, and the middleware or the proxy detects its language again, so a browser that prefers Japanese follows the link to `/` for English, the default locale, and is redirected back to `/ja`. In 1.x, the link was `/en` and was served as it was. With a language switcher, either pass `detectLanguage: false` to the middleware or the proxy, or put `prefixDefault: true` in the [shared config](#one-config-for-everything), so that the URLs of the default locale have the prefix too (`/en`).
- `href` must start with `/`. A relative path such as `about` throws. Hrefs that are not paths of the site, such as `https://…`, `mailto:…` or `#top`, are left unchanged, as in 1.x.
- The query and the hash of `href` are kept, and the path has no trailing slash, except for `/`.

## Astro

### Astro: static builds

In 1.x, the pages were under `src/pages/[locale]/`, and `@i18n-tiny/astro/integration` (or a page at `/`) served the default locale at the root. In 2.0, the pages are under `src/pages/[...locale]/` and return `i18n.getStaticPaths()`: the default locale has no prefix (`/about`), the others have one (`/en/about`). The build has no `/ja` pages for the default locale `ja`.

`@i18n-tiny/astro/integration` is removed. Remove it from `astro.config`:

```typescript
// 1.x: astro.config.mjs
import { create } from '@i18n-tiny/astro/integration'

export default defineConfig({
  integrations: [
    create({
      defaultLocale: 'en'
    })
  ]
})
```

If the integration had `prefixDefault: true`, put `prefixDefault: true` in the shared config instead (see [One config for everything](#one-config-for-everything)): `i18n.getStaticPaths()` then builds the default locale with its prefix too, and the links have it.

The 1.x example used English as the default locale; the 2.0 example uses Japanese.

```typescript
// 1.x: src/i18n.ts (examples/astro)
import { define } from '@i18n-tiny/astro'
import { getLocalizedPath } from '@i18n-tiny/astro/router'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const {
  getMessages,
  getTranslations
} = define({
  locales,
  defaultLocale,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export { getLocalizedPath }
```

```typescript
// 2.0: src/i18n.config.ts (examples/astro)
// The locale settings, shared by define() and the URL functions
export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
```

```typescript
// 2.0: src/i18n.ts (examples/astro)
import { define } from '@i18n-tiny/astro'
import { config } from './i18n.config'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const i18n = define({
  ...config,
  messages: {
    ja: jaMessages,
    en: enMessages
  }
})

export type Locale = (typeof i18n.locales)[number]
```

Move each page from `src/pages/[locale]/` to `src/pages/[...locale]/`, and remove the page at `src/pages/index.astro` that redirected to the default locale. Read the locale from `Astro.props`, not from `Astro.params`: `Astro.params.locale` is `undefined` for the default locale.

```astro
---
// 1.x: src/pages/[locale]/about.astro (examples/astro)
import { locales, getMessages } from '../../i18n'
import Link from '@i18n-tiny/astro/router/Link.astro'

export function getStaticPaths() {
  return locales.map(locale => ({ params: { locale } }))
}

const { locale } = Astro.params
const messages = getMessages(locale!)
---
```

```astro
---
// 2.0: src/pages/[...locale]/about.astro (examples/astro)
import type { InferGetStaticPropsType } from 'astro'
import LanguageSwitcher from '../../components/LanguageSwitcher.astro'
import Nav from '../../components/Nav.astro'
import { i18n } from '../../i18n'

// /about in Japanese (the default locale) and /en/about in English
export function getStaticPaths() {
  return i18n.getStaticPaths()
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale, pageLocales } = Astro.props
const messages = i18n.getMessages(locale)
---
```

Write `getStaticPaths` as a function declaration, as above: on Astro 6, `export const getStaticPaths = () => …` fails the build.

A route with other dynamic parameters passes them as `paths`, and each one is built in each locale:

```astro
---
// 2.0: src/pages/[...locale]/lab/[tool].astro (examples/astro)
export function getStaticPaths() {
  return i18n.getStaticPaths({
    paths: tools.map((tool) => ({ params: { tool }, props: { tool } }))
  })
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale, pageLocales, tool } = Astro.props
---
```

If your 1.x site was published with `/ja/...` URLs for the default locale, those URLs no longer exist in the build. Redirect them at your host if links to them must keep working.

### Astro: Link

`locale` (other than `false`) and `normalize` need the `define()` result as the `i18n` prop. Without it, they are a type error and throw. In 1.x, `normalize` read the locales from `Astro.locals.locales`, which the middleware set.

```astro
<!-- 1.x: src/pages/[locale]/index.astro (examples/astro) -->
<Link href="/" locale="en" style={buttonStyle(locale === 'en')}>
  English
</Link>
<Link href="/" locale="ja" style={buttonStyle(locale === 'ja')}>
  日本語
</Link>
```

```astro
<!-- 2.0: src/components/LanguageSwitcher.astro (examples/astro) -->
<!-- The current page in each locale it is built in -->
<div>
  {pageLocales.map((pageLocale) => (
    <Link
      href={Astro.url.pathname}
      locale={pageLocale}
      normalize
      i18n={i18n}
      hreflang={pageLocale}
      style={buttonStyle(pageLocale === locale)}
    >
      {names[pageLocale]}
    </Link>
  ))}
</div>
```

`pageLocales` comes from `Astro.props.pageLocales`, which `i18n.getStaticPaths()` sets.

With a [`base`](https://docs.astro.build/en/reference/configuration-reference/#base), write `href` without the base: the link removes the base from the current URL to find the locale, and adds it to the result. With `normalize`, the base is also removed from `href`, so `href={Astro.url.pathname}` works.

The `Link` currently removes the trailing slash of every link except `/`, also when `astro.config` has `trailingSlash: 'always'`: on such a site, the links point to URLs without the slash, which Astro or your host may redirect or not serve.

### Astro: server rendering

In the standard routing (without `routing: 'rewrite'`), the pages are under `src/pages/[...locale]/`, as for a static build. In 1.x, they were under `src/pages/[locale]/`, and the middleware rewrote a URL of the default locale without a prefix to `/[defaultLocale]/...`. In 2.0, the middleware passes it on, and `[...locale]` serves it with `Astro.params.locale` set to `undefined`:

```astro
---
// 2.0: src/pages/[...locale]/about.astro (standard routing, server output)
import { i18n } from '../../i18n'

// undefined for the default locale. [...locale] also matches /fr/about, so check it
const locale = Astro.params.locale ?? i18n.defaultLocale
if (!i18n.isLocale(locale)) {
  return new Response(null, { status: 404 })
}
const messages = i18n.getMessages(locale)
---
```

The middleware takes the shared config:

```typescript
// 1.x
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en'
  })
)

// 2.0
import { config } from './i18n.config'

export const onRequest = defineMiddleware(create({ ...config }))
```

Other changes of the middleware:

- **Without detection, the default locale.** With `detectLanguage: false`, a URL without a locale prefix is the default locale, and `prefixDefault: true` redirects to `/[defaultLocale]`. In 1.x, both used `fallbackLocale`. `fallbackLocale` is now used only when detection finds no match. If you set `fallbackLocale` to another locale than `defaultLocale` with `detectLanguage: false`, the locale of those URLs and the redirect target change.
- **`excludePaths` matches whole path segments.** `'/api'` matches `/api` and `/api/users`, but no longer `/apis` or `/api-docs`. An entry that does not start with `/` throws when `create()` runs. Write the entries without the `base`.
- **`Astro.locals.locales` is removed.** Read the locales from `i18n.locales`.
- **`prefixDefault` goes in the shared config**, which `define()` takes too: see [One config for everything](#one-config-for-everything).
- **The config is checked** as `define()` checks it: see [The config](#the-config).
- With a `base`, the middleware removes it from the URL before routing and adds it to the redirect and rewrite targets.

### Astro: rewrite mode

With `routing: 'rewrite'`, `detectLanguage` and `prefixDefault` are now accepted, so the middleware takes the same config as `define()`. Detection (`detectLanguage: true`, the default) needs `prefixDefault: true`: a URL without a locale prefix is the detected locale, so a link to the default locale needs the prefix too. Without it, the config is a type error and throws. Put `prefixDefault: true` in the shared config, or turn detection off with `detectLanguage: false`, where `prefixDefault` may be `false`.

In the rewrite mode, `prefixDefault` changes the links only: a URL without a locale prefix is still served, not redirected.

```typescript
// 1.x: src/i18n.ts (examples/astro-ssr)
export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const {
  getMessages,
  getTranslations
} = define({
  locales,
  defaultLocale,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})
```

```typescript
// 1.x: src/middleware.ts (examples/astro-ssr)
import { defineMiddleware } from 'astro:middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { locales, defaultLocale } from './i18n'

export const onRequest = defineMiddleware(
  create({
    locales,
    defaultLocale,
    routing: 'rewrite'
  })
)
```

```typescript
// 2.0: src/i18n.config.ts (examples/astro-ssr)
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const
```

```typescript
// 2.0: src/i18n.ts (examples/astro-ssr)
export const i18n = define({
  ...config,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export type Locale = (typeof i18n.locales)[number]
```

```typescript
// 2.0: src/middleware.ts (examples/astro-ssr)
import { defineMiddleware } from 'astro:middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { config } from './i18n.config'

export const onRequest = defineMiddleware(
  create({
    ...config,
    routing: 'rewrite',
    excludePaths: ['/api']
  })
)
```

`Astro.locals.locale` is a `string` in `@i18n-tiny/astro/locals`, and `getMessages()` takes one of the locales. Narrow it with `isLocale()`, or, when every page goes through the middleware, declare it with your locales:

```typescript
// 2.0: src/env.d.ts (examples/astro-ssr)
declare namespace App {
  interface Locals {
    /** Set by the middleware on every page. The excluded paths (/api) have none */
    locale: import('./i18n').Locale
    /** The URL before the rewrite, set by the middleware */
    originalPathname?: string
  }
}
```

The language links need the `i18n` prop, and `locale=""` becomes `locale={false}`:

```astro
<!-- 1.x: src/pages/index.astro (examples/astro-ssr) -->
<Link href="/" locale='en' style={buttonStyle(locale === 'en')}>
  English
</Link>
<Link href="/" locale="" style="color: #666;">
  {"< Auto (detect from browser)"}
</Link>
```

```astro
<!-- 2.0: src/pages/index.astro (examples/astro-ssr) -->
<Link href="/" locale="en" i18n={i18n} style={buttonStyle(locale === 'en')}>
  English
</Link>
<Link href="/" locale={false} style="color: #666;">
  {"< Auto (detect from browser)"}
</Link>
```

## Next.js

### Next.js: setup

```typescript
// 1.x: i18n.ts (examples/next)
import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

const {
  client,
  server,
  Provider,
} = define({
  locales,
  defaultLocale,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export const { useMessages, useTranslations, useLocale } = client
export const { getMessages, getTranslations } = server
export { Link, Provider }
```

```typescript
// 2.0: i18n.config.ts (examples/next)
// The locale settings, shared by define() and the proxy
export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const
```

```typescript
// 2.0: i18n.ts (examples/next)
import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import { config } from './i18n.config'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const i18n = define({
  ...config,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export type Locale = (typeof i18n.locales)[number]

export const { client, server, Provider, isLocale, locales } = i18n
export const { useMessages, useTranslations, useLocale, usePaths } = client
export const { getMessages, getTranslations } = server
export { Link }
```

The proxy takes the shared config. On Next.js 16, the file is `proxy.ts` with the export `proxy`; on Next.js 15, it is `middleware.ts` with the export `middleware`, as in 1.x:

```typescript
// 1.x: proxy.ts (examples/next)
import { create } from '@i18n-tiny/next/proxy'
import { locales, defaultLocale } from './i18n'

export const proxy = create({
  locales,
  defaultLocale
})
```

```typescript
// 2.0, Next.js 16: proxy.ts (examples/next)
import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from './i18n.config'

export const proxy = create({ ...i18nConfig })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

```typescript
// 2.0, Next.js 15: middleware.ts
import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from './i18n.config'

export const middleware = create({ ...i18nConfig })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

`app/[locale]/` also receives paths that are not locales, such as `/favicon.ico`. Narrow the parameter with `isLocale()` in the layout, the pages and `generateMetadata()`:

```typescript
// 2.0: app/[locale]/layout.tsx (examples/next)
import { notFound } from 'next/navigation'
import { Link, Provider, getMessages, isLocale, locales } from '@/i18n'

export default async function Layout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // [locale] also receives paths such as /favicon.ico: only the locales are pages
  if (!isLocale(locale)) notFound()
  const messages = await getMessages(locale)
  // ...
}
```

### Next.js: Link

Besides the [changes to both Link components](#link):

- **Without `locale`, the link is for the current locale**, built from the locale of the `Provider` and its settings as `localizedPath()` builds it, whatever the current URL is. With `defaultLocale: 'en'`, `href="/about"` is `/about` on an English page and `/ja/about` on a Japanese page. In 1.x, it copied the pattern of the current URL:
  - In the standard routing, a page of the default locale that Next.js served from `/en`, after the proxy rewrote `/` to `/en`, linked to `/en/about`. On a URL with the prefix of the default locale, such as `/en/about`, the links now have no prefix.
  - In the rewrite mode with detection, which now needs `prefixDefault: true`, the links of a page at `/` that was detected as Japanese are `/ja/about` instead of `/about`.
- **A link to a page of another locale is loaded in full** by the browser, not by the router of Next.js, and is not prefetched. This applies in every routing mode, also to links with `locale={false}`: the locale of the page is read from the path, as the locale of its prefix, or for a path without a prefix, the default locale. With `prefixDefault: true`, a path without a prefix is the detected locale, which only the server knows, so it is loaded in full too. State in Client Components, such as the value of an input, is not kept across such a link. Clicks with a modifier key, `target="_blank"` and `download` are left to the browser.
- **`typedRoutes`.** With `typedRoutes` on, the `href` of this `Link` is typed as any URL, not as one of the generated routes, since it has no locale prefix. In 1.x, it was checked against the routes.

The Astro `Link` without `locale` still keeps the pattern of the current URL.

Language buttons in [examples/next](./examples/next/app/[locale]/client-component.tsx) link to the current page in each locale:

```tsx
// 1.x: app/[locale]/client-component.tsx (examples/next)
<Link href="/" locale='' style={buttonStyle(false)}>
  Auto
</Link>
<Link href="/" locale="en" style={buttonStyle(locale === 'en')}>
  English
</Link>
```

```tsx
// 2.0: app/[locale]/client-component.tsx (examples/next)
const pathname = usePathname()
const { alternatePath } = usePaths()

<Link href="/" locale={false} style={buttonStyle(false)}>
  Auto
</Link>
<Link href={alternatePath(pathname, 'en')} locale={false} style={buttonStyle(locale === 'en')}>
  English
</Link>
```

`<Link href={pathname} locale="en" normalize>` gives the same link.

### Next.js: proxy

- **Without detection, the default locale.** With `detectLanguage: false`, a URL without a locale prefix is rewritten to `/[defaultLocale]`, and `prefixDefault: true` redirects to it. In 1.x, both used `fallbackLocale`. `fallbackLocale` is now used only when detection finds no match.
- **`prefixDefault` goes in the shared config**, which `define()` takes too: see [One config for everything](#one-config-for-everything).
- **The config is checked** as `define()` checks it: see [The config](#the-config).

### Next.js: rewrite mode

The proxy now passes the locale to the pages as the `x-locale` **request** header, so Server Components read it with `headers()`. In 1.x, it was set on the response, which Server Components did not see. An `x-locale` header sent by the client is replaced.

As in Astro, `detectLanguage` and `prefixDefault` are now accepted with `routing: 'rewrite'`, and detection (the default) needs `prefixDefault: true`: without it, the config is a type error and throws. Put it in the shared config. `prefixDefault` changes the links only: a URL without a locale prefix is still served, not redirected. With `detectLanguage: false`, `prefixDefault` may be `false`.

```typescript
// 1.x: proxy.ts (rewrite mode)
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  routing: 'rewrite'
})
```

```typescript
// 2.0: i18n.config.ts (examples/next-ssr)
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const
```

```typescript
// 2.0, Next.js 16: proxy.ts (examples/next-ssr)
import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from './i18n.config'

export const proxy = create({ ...i18nConfig, routing: 'rewrite' })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

On Next.js 15, name the file `middleware.ts` and the export `middleware`.

```typescript
// 2.0: locale.ts (examples/next-ssr)
import { headers } from 'next/headers'
import { i18n } from './i18n'

// The locale of the request, which the proxy passes in the x-locale header.
// For Server Components only: Client Components read it with useLocale().
export async function getLocale () {
  const locale = (await headers()).get('x-locale')
  return i18n.isLocale(locale) ? locale : i18n.defaultLocale
}
```

With `prefixDefault: true`, the language buttons link to `/en` and `/ja`:

```tsx
// 2.0: app/client-component.tsx (examples/next-ssr)
<Link href="/" locale={false} style={buttonStyle(false)}>
  Auto
</Link>
<Link href="/" locale="en" style={buttonStyle(locale === 'en')}>
  English
</Link>
<Link href="/" locale="ja" style={buttonStyle(locale === 'ja')}>
  日本語
</Link>
```

See [examples/next-ssr](./examples/next-ssr) for the whole app.

## React

[examples/react](./examples/react) needs no change. The changes are in the types and the checks:

- `define()` checks the config: see [The config](#the-config).
- The `locale` of the `Provider` is one of `locales`; any other value is a type error and throws. `useLocale()` returns one of `locales`.
- `I18nProviderProps` is removed from `@i18n-tiny/react/internal`. Use `ProviderProps`, the same type: the props of the internal `I18nProvider`, with `locales` and `defaultLocale`. It is also exported from `@i18n-tiny/react`. It is not the type of the props of the `Provider` that `define()` returns: for those, use `ComponentProps<typeof i18n.Provider>`.
- `DefineConfig` is removed: see [Config types](#config-types).
- `define()` returns `isLocale()`, to narrow a value such as a saved setting:

  ```tsx
  const saved = localStorage.getItem('locale')
  const [locale, setLocale] = useState(isLocale(saved) ? saved : defaultLocale)
  ```

## Other changes in behavior

- `detectLocale()`, and the detection of the middleware and the proxy, never pick a language marked with `q=0`, also through another tag (`en-US,en;q=0` does not give `en`). Tags whose `q` is not a number from 0 to 1 are ignored.
- When detection decides the response, the middleware and the proxy add `Vary: Accept-Language` to it. Next.js replaces it on the pages it renders: see the Next.js README on [language detection and caches](./packages/next/README.md#language-detection-and-caches).
- A request whose path leads to another host, such as `/en//example.com`, gets no i18n handling in the middleware and the proxy.
