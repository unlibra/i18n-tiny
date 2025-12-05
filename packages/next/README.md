# @i18n-tiny/next

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Type-safe, zero-dependency i18n library for Next.js App Router with React Server Components support.

Inspired by next-intl, designed for simplicity and type safety.

## Live Demo

This library is used at **[8px.app](https://8px.app)**.
You can try the language switcher in the header to see it in action.

Source code: [https://github.com/unlibra/8px.app](https://github.com/unlibra/8px.app)

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys
- **Zero dependencies**: No external i18n libraries needed
- **Server Components**: Native RSC support
- **Minimal SSG**: Define `generateStaticParams` once in `layout.tsx` to statically generate all pages. No per-page configuration needed.
- **Simple API**: Single configuration, minimal boilerplate
- **Small**: Minimal bundle size
- **No global state**: Pure function factory pattern

## Installation

```bash
npm install @i18n-tiny/next
# or
pnpm add @i18n-tiny/next
# or
yarn add @i18n-tiny/next
```

## Usage

### Project Structure

```
your-app/
├── app/
│   └── [locale]/
│       ├── layout.tsx
│       └── page.tsx
├── messages/
│   ├── en.ts
│   └── ja.ts
├── i18n.ts
└── proxy.ts
```

### Minimal Setup

**1. Create message files**

```typescript
// messages/en.ts
export default {
  common: {
    title: "My Site",
    description: "Welcome to my site"
  },
  nav: {
    home: "Home",
    about: "About"
  }
}
```

```typescript
// messages/ja.ts
export default {
  common: {
    title: "マイサイト",
    description: "サイトへようこそ"
  },
  nav: {
    home: "ホーム",
    about: "概要"
  }
}
```

**2. Define i18n instance**

Place this file anywhere in your project (`i18n.ts`, `lib/i18n.ts`, etc.)

```typescript
// i18n.ts
import { define } from '@i18n-tiny/next'
import enMessages from '@/messages/en'
import jaMessages from '@/messages/ja'

export type Locale = 'ja' | 'en'
const locales: Locale[] = ['ja', 'en']
const defaultLocale: Locale = 'ja'

const { client, server, Link, Provider } = define({
  locales,
  defaultLocale,
  messages: { ja: jaMessages, en: enMessages }
})

export { Link, Provider }
export const { useMessages, useTranslations, useLocale } = client
export const { getMessages, getTranslations } = server
```

**3. Setup Proxy** (Next.js 16+)

```typescript
// proxy.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { defaultLocale, locales } from '@/i18n'

export function proxy (request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If locale is present, continue
  if (hasLocale) return NextResponse.next()

  // Redirect to default locale (rewrite strategy)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.rewrite(request.nextUrl)
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

<details>
<summary>Next.js 15 or earlier (middleware.ts)</summary>

```typescript
// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { defaultLocale, locales } from '@/i18n'

export function middleware (request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If locale is present, continue
  if (hasLocale) return NextResponse.next()

  // Redirect to default locale (rewrite strategy)
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.rewrite(request.nextUrl)
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

</details>

**4. Use in Layout**

```typescript
// app/[locale]/layout.tsx
import { Provider, getMessages, type Locale } from '@/i18n'

export default async function Layout({ children, params }) {
  const { locale } = await params
  const messages = await getMessages(locale)

  return (
    <Provider locale={locale} messages={messages}>
      {children}
    </Provider>
  )
}
```

**5. Use in Components**

```typescript
// Server Component
import { getMessages, getTranslations, type Locale } from '@/i18n'

export async function ServerComponent({ locale }: { locale: Locale }) {
  /* Direct object access */
  const messages = await getMessages(locale)
  /* Function call */
  const t = await getTranslations(locale)

  return (
    <div>
      <h1>{messages.common.title}</h1>
      {/*           ^^^^^ Auto-complete */}
      <p>{t('common.description')}</p>
      {/*    ^^^^^^^^^^^^^^^^^^ Auto-complete */}
    </div>
  )
}
```

```typescript
// Client Component
'use client'
import { Link, useMessages, useTranslations } from '@/i18n'

export function ClientComponent() {
  /* Direct object access */
  const messages = useMessages()
  /* Function call */
  const t = useTranslations()

  return (
    <div>
      <h1>{messages.common.title}</h1>
      {/*           ^^^^^ Auto-complete */}
      <Link href="/about">{t('nav.about')}</Link>
      {/*                    ^^^^^^^^^ Auto-complete */}
    </div>
  )
}
```

That's it! **Types are automatically inferred** - no manual type annotations needed.

**Two ways to access translations:**

- `messages.common.title` - Direct object access (simple and clear)
- `t('common.title')` - Function call (useful for dynamic keys)

Both are fully typed with autocomplete. Use whichever you prefer!

## API Reference

### `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

- `config.locales` - Array of supported locales
- `config.defaultLocale` - Default locale
- `config.messages` - Messages object keyed by locale

**Returns:**

```typescript
{
  Provider,        // Context provider component
  Link,            // Next.js Link with locale handling
  server: {
    getMessages,   // Get messages object
    getTranslations // Get translation function
  },
  client: {
    useMessages,   // Get messages object (hook)
    useTranslations, // Get translation function (hook)
    useLocale      // Get current locale (hook)
  }
}
```

### `detectLocale(acceptLanguage, supportedLocales)` (from `@i18n-tiny/core`)

Detects the best matching locale from the Accept-Language header.

**Parameters:**

- `acceptLanguage` - The Accept-Language header value from the request (e.g., `"ja,en-US;q=0.9,en;q=0.8"`)
- `supportedLocales` - Array of locale codes supported by your application

**Returns:**

- The best matching locale string, or `null` if no match is found

**Example:**

```typescript
import { detectLocale } from '@i18n-tiny/core'

const acceptLanguage = request.headers.get('accept-language')
const locale = detectLocale(acceptLanguage, ['ja', 'en']) // Returns: 'ja' or 'en' or null
```

**How it works:**

- Parses the Accept-Language header and sorts languages by quality value
- Returns the highest priority locale that matches your supported locales
- Normalizes language codes (e.g., `en-US` → `en`, `ja-JP` → `ja`)
- Returns `null` if no supported locale matches

## Advanced Usage

### Static Site Generation (SSG)

To generate static pages for all locales at build time, simply add `generateStaticParams` to your **root layout** (`app/[locale]/layout.tsx`).

Unlike some other libraries, **you do not need to add this to every page**. Defining it once in the layout automatically enables static generation for all child routes.

```typescript
// app/[locale]/layout.tsx
import { locales } from '@/i18n'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function Layout({ children, params }) {
  // ...
}
```

### Automatic Language Detection

Detect user's preferred language from the `Accept-Language` header and redirect to the appropriate locale.

```typescript
// proxy.ts (Next.js 16+) or middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { detectLocale } from '@i18n-tiny/core'
import { locales } from '@/i18n'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (hasLocale) return NextResponse.next()

  // Detect user's preferred language
  const acceptLanguage = request.headers.get('accept-language')
  const detectedLocale = detectLocale(acceptLanguage, locales) ?? 'en'

  // Redirect to the detected locale
  return NextResponse.redirect(new URL(`/${detectedLocale}${pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

**How it works:**

- Parses `Accept-Language` header (e.g., `"ja,en-US;q=0.9,en;q=0.8"`)
- Returns the highest priority locale that matches your supported locales
- Falls back to your specified default if no match is found
- **Maintains SSG** - only root path (`/`) is redirected, all locale pages remain static

### Language Switcher

Create a component to switch between languages while preserving the current path.

```typescript
// components/LanguageSwitcher.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Import i18n settings and hooks
import { defaultLocale, locales, useLocale } from '@/i18n'

// Define display names for locales
const localeNames: Record<string, string> = {
  ja: '日本語',
  en: 'English'
}

export function LanguageSwitcher () {
  const locale = useLocale() // Get the current active locale
  const pathname = usePathname() // Get the current path without locale prefix (e.g., /about)

  // Helper function to get the base path, removing the current locale prefix
  const getBasePath = () => {
    const localePrefix = new RegExp(`^/${locale}(/|$)`)
    const basePath = pathname.replace(localePrefix, '/')
    return basePath === '' ? '/' : basePath
  }

  // Generate the path for a new locale
  const getLocalizedPath = (newLocale: string) => {
    const basePath = getBasePath()

    // If the new locale is the default, remove the locale prefix from the path
    if (newLocale === defaultLocale) {
      return basePath
    }
    // Otherwise, prepend the new locale to the base path
    return `/${newLocale}${basePath}`
  }

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {locales.map((locale) => (
        // Create a link for each locale
        <Link key={locale} href={getLocalizedPath(locale)}>
          {localeNames[locale]} {/* Display locale name */}
        </Link>
      ))}
    </div>
  )
}
```

## Technical Notes

### Message Serialization

This library uses `JSON.parse(JSON.stringify())` to convert ES module namespace objects to plain objects, ensuring React Server Components compatibility.

### Link Component

The `Link` component automatically handles both string paths and Next.js `UrlObject`:

```typescript
<Link href="/about">About</Link>
<Link href={{ pathname: '/search', query: { q: 'test' } }}>Search</Link>
```

Both will have the locale prefix automatically added based on the current locale.

## Migration from next-i18n-tiny

If you're using the old `next-i18n-tiny` package:

```diff
- import { define } from 'next-i18n-tiny'
+ import { define } from '@i18n-tiny/next'
```

The API is 100% compatible. Just change the package name.

## License

MIT
