---
sidebar_position: 2
---

# Proxy

Next.js middleware for automatic locale detection and routing.

## `create(config)`

Creates a Next.js Proxy (Middleware) handler for i18n routing.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Array of supported locales |
| `defaultLocale` | `string` | Required | - | Default locale for redirects |
| `fallbackLocale` | `string` | | `defaultLocale` | Fallback if detection fails |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale in URLs |
| `detectLanguage` | `boolean` | | `true` | Whether to detect language from Accept-Language header |
| `routing` | `'rewrite'` | | - | SSR rewrite mode (mutually exclusive with prefixDefault/detectLanguage) |

**Returns:**
- `(request: NextRequest) => NextResponse | void`: Next.js middleware function.

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
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en'
})

// Always prefix all locales (including default)
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  prefixDefault: true
})

// SSR rewrite mode (locale in x-locale header)
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  routing: 'rewrite'
})
```

## `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header.
Can be imported directly from `@i18n-tiny/next/proxy`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `acceptLanguage` | `string` \| `null` | Required | Value of Accept-Language header |
| `supportedLocales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `string | null`: The matched locale, or `null` if no match is found.

**Example:**

```typescript
import { detectLocale } from '@i18n-tiny/next/proxy'

const locale = detectLocale(request.headers.get('accept-language'), ['en', 'ja'])
```
