---
description: "API reference for the i18n-tiny Next.js Proxy (middleware): locale prefixes, optional language detection, redirects and rewrites for localized routes."
---

# Proxy

Next.js Proxy (formerly Middleware) for locale routing, from `@i18n-tiny/next/proxy`.

## `create(config)`

Creates a Next.js Proxy handler for i18n routing.

```typescript
// proxy.ts
import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from '@/i18n.config' // { locales: ['en', 'ja'], defaultLocale: 'en' }

export const proxy = create({ ...i18nConfig })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

On Next.js 15, name the file `middleware.ts` and the export `middleware`.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Supported locales |
| `defaultLocale` | one of `locales` | Required | - | The locale of URLs without a locale prefix |
| `fallbackLocale` | one of `locales` | | `defaultLocale` | Used when the detection finds no match |
| `prefixDefault` | `boolean` | | `false` | Whether URLs of the default locale also have the prefix. Put it in the config shared with `define()`. `true` for `routing: 'rewrite'` with detection |
| `detectLanguage` | `boolean` | | `false` | Whether to detect the language of URLs without a prefix from `Accept-Language` |
| `routing` | `'rewrite'` | | - | SSR rewrite mode |

**Returns:**
- `(request: NextRequest) => NextResponse`: Next.js Proxy function.

The config is checked as [`define()`](./core#define-config) checks it, and the rewrite mode with detection without `prefixDefault: true` throws when `create()` runs. A config written inline, with `as const` or with `satisfies` is a type error too.

**Routing Behavior Matrix:**

URLs with a locale prefix, such as `/ja/about`, are served as is. The matrix applies to every URL without a locale prefix, such as `/` or `/about`. The path and the query are kept: `/about` goes to `/ja/about`.

| prefixDefault | detectLanguage | Behavior for URLs without a locale prefix |
| --- | --- | --- |
| `false` | `false` | Serves the default locale (rewrite to `/[defaultLocale]`) |
| `false` | `true` | Detects, redirects non-default, rewrites default |
| `true` | `false` | Redirects to `/[defaultLocale]` |
| `true` | `true` | Detects and redirects to the detected locale |

Without the detection, a URL without a prefix is always the default locale; `fallbackLocale` is used only when the detection finds no match. Languages marked with `q=0` are never picked. A pathname that starts with `//` or `/\`, also after the locale prefix, gets no i18n handling.

**Examples:**

```typescript
import { config as i18nConfig } from '@/i18n.config'

// Default: no detection, URLs without a prefix are the default locale
export const proxy = create({ ...i18nConfig })

// Detect language, redirect non-default, rewrite default
export const proxy = create({ ...i18nConfig, detectLanguage: true })

// SSR rewrite mode (locale in the x-locale request header)
export const proxy = create({ ...i18nConfig, routing: 'rewrite' })
```

### `prefixDefault`

To prefix all locales, including the default one, set `prefixDefault: true`. `Link` and the URL functions read it from `define()` and its `Provider`, not from the proxy, so put it in the config that `define()` and the proxy share, not in `create()` only: with `prefixDefault: true` in the proxy only, a link to the default locale has no prefix, so the proxy redirects it, and with detection to the detected locale, which may not be the default one.

```typescript
// i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const

// i18n.ts
export const i18n = define({ ...config, messages: { en, ja } })

// proxy.ts
export const proxy = create({ ...config })
```

With `detectLanguage: true`, also put `prefixDefault: true` in the shared config. With `prefixDefault: false`, a browser that prefers another locale than the default one cannot reach the pages of the default locale: the link to the default locale has no prefix, and the proxy detects its language again.

## Rewrite Mode

With `routing: 'rewrite'`, the proxy never redirects. It rewrites `/ja/about` to `/about`, and passes the locale to the pages in the `x-locale` request header. For URLs without a prefix, the locale is the default locale, or with `detectLanguage: true` is detected from `Accept-Language`. An `x-locale` header sent by the client is replaced, and the other request headers, such as cookies, are passed on.

With `detectLanguage: true`, a URL without a prefix is the detected locale, so a link to the default locale needs its prefix too. Put `prefixDefault: true` in the config that `define()` and the proxy share. Without it, `create()` throws, and a config written inline, with `as const` or with `satisfies` is a type error too. A URL without a prefix is still served, not redirected. Without detection, `prefixDefault` may be `false`.

```typescript
// i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const

// proxy.ts
export const proxy = create({ ...config, routing: 'rewrite', detectLanguage: true })
```

Because the proxy rewrites to paths without a prefix, put your routes directly under `app/`, without an `app/[locale]` segment:

```text
app/
├── layout.tsx
├── page.tsx
└── about/
    └── page.tsx
```

Read the locale with `headers()` in Server Components:

```typescript
// locale.ts (for Server Components only)
import { headers } from 'next/headers'
import { i18n } from '@/i18n'

export async function getLocale() {
  const locale = (await headers()).get('x-locale')
  return i18n.isLocale(locale) ? locale : i18n.defaultLocale
}
```

```tsx
// app/layout.tsx
import type { ReactNode } from 'react'
import { Provider, getMessages } from '@/i18n'
import { getLocale } from '@/locale'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} messages={messages}>
          {children}
        </Provider>
      </body>
    </html>
  )
}
```

Client Components read the locale with `useLocale()`. Because the pages use `headers()`, they are rendered on each request, so [Static Site Generation](../tips/ssg) does not apply to this mode.

## Language detection and caches

A response that depends on the detection, such as the redirect of `/about` to `/ja/about` for a Japanese browser, gets `Vary: Accept-Language` from the proxy. Next.js keeps it on redirects, but sets its own `Vary` header on the pages it renders, so a page served without a prefix (the default locale, or any locale in rewrite mode) does not carry it. With the detection, do not let a shared cache (a CDN) store the pages without a locale prefix, or make it key them by `Accept-Language`; or leave the detection off.

## `ProxyConfig` (type)

The type of the configuration object passed to `create()`.

## `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header. Languages marked with `q=0` are never returned.
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
// Returns: 'en' | 'ja' | null
```
