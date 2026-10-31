---
description: "API reference for the i18n-tiny Astro middleware: locale routing for server-rendered (SSR) sites, with optional language detection and a rewrite mode."
---

# Middleware

SSR middleware for locale routing, with optional language detection. It runs on each request, so it needs `output: 'server'` and an adapter (e.g., `@astrojs/node`) in `astro.config.mjs`. Static builds need no middleware.

## `create(config)`

Creates an Astro middleware handler for i18n routing.

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { config } from './i18n.config' // { locales: ['ja', 'en'], defaultLocale: 'ja' }

export const onRequest = defineMiddleware(create({ ...config }))
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Supported locales |
| `defaultLocale` | `string` | Required | - | The locale of URLs without a locale prefix. One of `locales` |
| `fallbackLocale` | `string` | | `defaultLocale` | The locale used when language detection finds no match. One of `locales` |
| `excludePaths` | `string[]` | | `[]` | Paths to leave out of i18n handling, such as `['/api']`. Each one starts with `/` |
| `prefixDefault` | `boolean` | | `false` | Whether URLs of the default locale also have the prefix. Put it in the config shared with `define()`, see below |
| `detectLanguage` | `boolean` | | `false` | Whether to detect the language of a URL without a locale prefix from `Accept-Language` |
| `routing` | `'rewrite'` | | - | The SSR rewrite mode |

**Returns:**
- `MiddlewareHandler`: Astro middleware handler.

The config is checked as `define()` checks it: an invalid config, an `excludePaths` entry that does not start with `/`, and the rewrite mode with detection without `prefixDefault: true` throw an error.

- `/_astro` and `/_image` are always excluded. An excluded path matches itself and the paths under it: `/api` matches `/api` and `/api/users`, but not `/apis` or `/api-docs`. Requests for static files (such as `.png`, `.css` or `.js`) are skipped as well.
- With a [`base`](https://docs.astro.build/en/reference/configuration-reference/#base), the middleware removes it from the URL before routing and adds it to the redirect and rewrite targets. Write `excludePaths` without the base.
- Redirects keep the query string and the trailing slash of the URL: `/about/?x=1` redirects to `/en/about/?x=1`.
- A URL whose path leads to another host, such as `/en//example.com`, gets no i18n handling.

**Routing modes:**

| Mode | Where the pages are | A URL with a locale prefix (`/en/about`) | A URL without a locale prefix (`/about`) |
| --- | --- | --- | --- |
| Standard | `src/pages/[...locale]/about.astro` | Served as it is | Served as the default locale |
| Standard, detection | `src/pages/[...locale]/about.astro` | Served as it is | Redirects to the detected locale, or is served as the default locale |
| `prefixDefault: true` | `src/pages/[...locale]/about.astro` | Served as it is | Redirects to `/[defaultLocale]/about` |
| `prefixDefault: true`, detection | `src/pages/[...locale]/about.astro` | Served as it is | Redirects to the detected locale |
| `routing: 'rewrite'` | `src/pages/about.astro` | Rewritten to `/about`, the locale in `Astro.locals.locale` | The default locale in `Astro.locals.locale` |
| `routing: 'rewrite'`, detection, `prefixDefault: true` | `src/pages/about.astro` | Rewritten to `/about`, the locale in `Astro.locals.locale` | The detected locale in `Astro.locals.locale` |

"Detection" is `detectLanguage: true`. Without it, there is no detection. It uses `fallbackLocale` when `Accept-Language` matches none of `locales`. Languages marked with `q=0` are never picked.

When detection decides the response, the response gets `Vary: Accept-Language`, added to any `Vary` the page sets. A CDN or a shared cache that ignores `Vary` may serve one visitor's language to another: cache these URLs per `Accept-Language`, or not at all.

### `prefixDefault` in the shared config

`Link` and the URL functions read `prefixDefault` from the config of `define()`, not from the middleware. Put it in the config that `define()` and the middleware both take: with `prefixDefault: true` in `create()` only, a link to the default locale has no prefix, so the middleware redirects it, and with detection to the detected locale, which may not be the default one.

```typescript
// src/i18n.config.ts
export const config = { locales: ['ja', 'en'], defaultLocale: 'ja', prefixDefault: true } as const

// src/i18n.ts
export const i18n = define({ ...config, messages: { ja, en } })

// src/middleware.ts
export const onRequest = defineMiddleware(create({ ...config }))
```

With detection, also put `prefixDefault: true` in the shared config, as the [language switcher](../tips/language-switcher#with-language-detection) explains.

### Standard Routing

The pages are under `src/pages/[...locale]/`, as for a static build. With server output there is no `getStaticPaths()`, so read the locale from the params:

```astro
---
// src/pages/[...locale]/about.astro
import { i18n } from '../../i18n'

// undefined for the default locale. [...locale] also matches /fr/about, so check it
const locale = Astro.params.locale ?? i18n.defaultLocale
if (!i18n.isLocale(locale)) {
  return new Response(null, { status: 404 })
}
const messages = i18n.getMessages(locale)
---
```

### SSR Rewrite Mode

With `routing: 'rewrite'`, the pages are not under a locale folder. The locale is stored in `Astro.locals.locale`, and the original pathname in `Astro.locals.originalPathname`. These two are set only in this mode, and not for the excluded paths:

```astro
---
// src/pages/index.astro (no [...locale] folder needed)
import { i18n } from '../i18n'

const locale = Astro.locals.locale // typed with the locales, see TypeScript Support
const messages = i18n.getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

For the type of `Astro.locals.locale`, see [TypeScript Support](../tips/typescript#astro-locals-type).

Without detection, a URL without a prefix is the default locale, and `prefixDefault` may be `false`.

With `detectLanguage: true`, a URL without a prefix is the detected locale, so a link to the default locale needs its prefix too. Put `prefixDefault: true` in the config that `define()` and the middleware share: with detection, `create()` throws without it, and a config written inline, with `as const` or with `satisfies` is a type error too. `<Link href="/" locale="en" i18n={i18n}>` is then `/en`, and `<Link href="/" locale={false}>` is `/`, the detected locale. A URL without a prefix is still served, not redirected.

```typescript
// src/i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const

// src/i18n.ts
export const i18n = define({ ...config, messages: { en, ja } })

// src/middleware.ts
export const onRequest = defineMiddleware(create({ ...config, routing: 'rewrite', detectLanguage: true }))
```

## `MiddlewareConfig` (type)

The type of the config passed to `create()`.

## `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header. Languages marked with `q=0` are never returned.
Can be imported directly from `@i18n-tiny/astro/middleware`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `acceptLanguage` | `string` \| `null` | Required | Value of Accept-Language header |
| `supportedLocales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `string | null`: The matched locale, or `null` if no match is found.

```typescript
import { detectLocale } from '@i18n-tiny/astro/middleware'

detectLocale(request.headers.get('accept-language'), ['en', 'ja']) // 'en' | 'ja' | null
```
