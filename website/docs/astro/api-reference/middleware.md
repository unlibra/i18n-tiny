---
description: "API reference for the i18n-tiny Astro middleware: automatic locale detection and routing for server-side rendered (SSR) sites."
---

# Middleware

SSR middleware for automatic locale detection and routing. It runs on each request, so it needs `output: 'server'` and an adapter (e.g., `@astrojs/node`) in `astro.config.mjs`.

## `create(config)`

Creates an Astro Middleware handler for i18n routing.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Array of supported locales |
| `defaultLocale` | `string` | Required | - | Decides whether a URL without a prefix is redirected or rewritten (see the matrix below) |
| `fallbackLocale` | `string` | | `defaultLocale` | Locale used when detection finds no match or is turned off |
| `excludePaths` | `string[]` | | `[]` | Additional paths to exclude from i18n processing (prefix match) |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale in URLs |
| `detectLanguage` | `boolean` | | `true` | Whether to detect language from Accept-Language header |
| `routing` | `'rewrite'` | | - | SSR rewrite mode (mutually exclusive with prefixDefault/detectLanguage) |

**Returns:**
- `MiddlewareHandler`: Astro middleware handler.

`/_astro` and `/_image` are always excluded. `excludePaths` uses a prefix match (`startsWith`), so `/api` also matches `/apiary`. Requests for static files (such as `.png`, `.css` or `.js`) are skipped as well.

**Routing Behavior Matrix:**

This applies to every URL without a locale prefix (`/`, `/about`, ...). Redirects go to the detected locale, or to `fallbackLocale` when detection finds no match. `defaultLocale` only decides between redirect and rewrite.

| prefixDefault | detectLanguage | Behavior for a URL without a locale prefix |
| --- | --- | --- |
| `false` | `false` | Serves fallbackLocale (rewrite), no detection |
| `false` | `true` | Detects, redirects non-default, rewrites default |
| `true` | `false` | Redirects to `/[fallbackLocale]` |
| `true` | `true` | Detects and redirects to detected locale |

**Example:**

```typescript
// Default: Language detection, non-default redirects, default rewrites
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en'
  })
)

// SSR rewrite mode (locale in Astro.locals)
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    routing: 'rewrite'
  })
)
```

### SSR Rewrite Mode

When using `routing: 'rewrite'`, the locale is stored in `Astro.locals.locale`, and the original pathname in `Astro.locals.originalPathname`. These two are set only in this mode. `Astro.locals.locales` is set in every routing mode.

```astro
---
// src/pages/index.astro (No [locale] folder needed)
import { getMessages } from '../i18n'

const locale = Astro.locals.locale  // 'en' or 'ja'
const messages = getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

## `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header.
Can be imported directly from `@i18n-tiny/astro/middleware`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `acceptLanguage` | `string` \| `null` | Required | Value of Accept-Language header |
| `supportedLocales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `string | null`: The matched locale, or `null` if no match is found.
