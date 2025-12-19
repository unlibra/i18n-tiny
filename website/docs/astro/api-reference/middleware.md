---
sidebar_position: 2
---

# Middleware

SSR middleware for automatic locale detection and routing.

## `create(config)`

Creates an Astro Middleware handler for i18n routing.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Array of supported locales |
| `defaultLocale` | `string` | Required | - | Default locale for redirects |
| `fallbackLocale` | `string` | | `defaultLocale` | Fallback if detection fails |
| `excludePaths` | `string[]` | | `[]` | Paths to exclude from i18n processing |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale in URLs |
| `detectLanguage` | `boolean` | | `true` | Whether to detect language from Accept-Language header |
| `routing` | `'rewrite'` | | - | SSR rewrite mode (mutually exclusive with prefixDefault/detectLanguage) |

**Returns:**
- `MiddlewareHandler`: Astro middleware handler.

**Routing Behavior Matrix:**

| prefixDefault | detectLanguage | Behavior at `/` |
| --- | --- | --- |
| `false` | `false` | Serves fallbackLocale, no detection |
| `false` | `true` | Detects, redirects non-default, rewrites default |
| `true` | `false` | Redirects to `/[defaultLocale]` |
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

When using `routing: 'rewrite'`, the locale is stored in `Astro.locals.locale`.

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
