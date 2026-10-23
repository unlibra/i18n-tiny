---
description: "API reference for the i18n-tiny Next.js Proxy (middleware): automatic locale detection, redirects and rewrites for localized routes."
---

# Proxy

Next.js Proxy (formerly Middleware) for automatic locale detection and routing.

## `create(config)`

Creates a Next.js Proxy handler for i18n routing.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Array of supported locales |
| `defaultLocale` | `string` | Required | - | Default locale, served without a prefix when `prefixDefault` is `false` |
| `fallbackLocale` | `string` | | `defaultLocale` | Used when detection fails, and for every URL without a locale prefix when `detectLanguage` is `false` |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale in URLs |
| `detectLanguage` | `boolean` | | `true` | Whether to detect language from Accept-Language header |
| `routing` | `'rewrite'` | | - | SSR rewrite mode (mutually exclusive with prefixDefault/detectLanguage) |

**Returns:**
- `(request: NextRequest) => NextResponse`: Next.js Proxy function.

**Routing Behavior Matrix:**

URLs with a locale prefix, such as `/ja/about`, are served as is. The matrix applies to every URL without a locale prefix, such as `/` or `/about`. The path is kept: `/about` goes to `/ja/about`.

| prefixDefault | detectLanguage | Behavior for URLs without a locale prefix |
| --- | --- | --- |
| `false` | `false` | Serves fallbackLocale (rewrite), no detection |
| `false` | `true` | Detects, redirects non-default, rewrites default |
| `true` | `false` | Redirects to `/[fallbackLocale]` (default: `defaultLocale`) |
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

## Rewrite Mode

With `routing: 'rewrite'`, the proxy never redirects. It passes the locale in the `x-locale` header:

- `/ja/about` is rewritten to `/about`, with `x-locale: ja`.
- A URL without a locale prefix, such as `/about`, is served as is. The locale is detected from Accept-Language, or `fallbackLocale` if nothing matches.

Because the proxy rewrites to paths without a prefix, put your routes directly under `app/`, without an `app/[locale]` segment:

```text
app/
├── layout.tsx
├── page.tsx
└── about/
    └── page.tsx
```

Read the locale with `headers()` in Server Components:

```tsx
// app/layout.tsx
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { Provider, server, defaultLocale } from '@/i18n'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await headers()).get('x-locale') ?? defaultLocale
  const messages = await server.getMessages(locale)

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

Pages read the locale the same way. Because they use `headers()`, they are rendered on each request, so [Static Site Generation](../tips/ssg) does not apply to this mode.

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
