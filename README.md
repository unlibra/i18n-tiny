# next-i18n-tiny

[![npm version](https://img.shields.io/npm/v/next-i18n-tiny.svg)](https://www.npmjs.com/package/next-i18n-tiny)
<!-- [![npm downloads](https://img.shields.io/npm/dm/next-i18n-tiny.svg)](https://www.npmjs.com/package/next-i18n-tiny) -->
[![CI](https://github.com/unlibra/next-i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/next-i18n-tiny/actions)
[![License](https://img.shields.io/npm/l/next-i18n-tiny.svg)](https://github.com/unlibra/next-i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Type-safe, zero-dependency i18n library for Next.js App Router with React Server Components support.

Inspired by next-intl, designed for simplicity and type safety.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys
- **Zero dependencies**: No external i18n libraries needed
- **Server Components**: Native RSC support
- **Simple API**: Single configuration, minimal boilerplate
- **Small**: Minimal bundle size
- **No global state**: Pure function factory pattern

## Installation

```bash
npm install next-i18n-tiny
# or
pnpm add next-i18n-tiny
# or
yarn add next-i18n-tiny
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
import { define } from 'next-i18n-tiny'
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
import { NextRequest, NextResponse } from 'next/server'

const locales = ['ja', 'en']
const defaultLocale = 'ja'

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (hasLocale) return

  // Redirect to default locale
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

<details>
<summary>Next.js 15 or earlier (middleware.ts)</summary>

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const locales = ['ja', 'en']
const defaultLocale = 'ja'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (hasLocale) return NextResponse.next()

  // Redirect to default locale
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
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

## License

MIT
