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

### Minimal Setup

**1. Create message files**

```typescript
// messages/en.ts
export default {
  site: {
    name: "My Site",
    description: "Welcome to my site"
  }
}
```

```typescript
// messages/ja.ts
export default {
  site: {
    name: "マイサイト",
    description: "サイトへようこそ"
  }
}
```

**2. Define i18n instance**

Place this file anywhere in your project (`src/i18n.ts`, `lib/i18n/index.ts`, etc.)

```typescript
// src/i18n.ts
import { define } from 'next-i18n-tiny'
import enMessages from '@/messages/en'
import jaMessages from '@/messages/ja'

export type Locale = 'ja' | 'en'
const locales: Locale[] = ['ja', 'en']
const defaultLocale: Locale = 'ja'

export const i18n = define({
  locales,
  defaultLocale,
  messages: { ja: jaMessages, en: enMessages }
})
```

**3. Use in Layout**

```typescript
// app/[locale]/layout.tsx
import { i18n, type Locale } from '@/i18n'

export default async function Layout({ children, params }) {
  const { locale } = await params
  const messages = await i18n.server.getMessages(locale)

  return (
    <i18n.Provider locale={locale} messages={messages}>
      {children}
    </i18n.Provider>
  )
}
```

**4. Use in Components**

```typescript
// Server Component
import { i18n, type Locale } from '@/i18n'

export async function ServerComponent({ locale }: { locale: Locale }) {
  /* Direct object access */
  const messages = await i18n.server.getMessages(locale)
  /* Function call */
  const t = await i18n.server.getTranslations(locale)

  return (
    <div>
      <h1>{messages.site.name}</h1>
      {/*           ^^^^ Auto-complete */}
      <p>{t('site.description')}</p>
      {/*    ^^^^^^^^^^^^^^^^ Auto-complete */}
    </div>
  )
}
```

```typescript
// Client Component
'use client'
import { i18n } from '@/i18n'

export function ClientComponent() {
  /* Direct object access */
  const messages = i18n.client.useMessages()
  /* Function call */
  const t = i18n.client.useTranslations()

  return (
    <div>
      <h1>{messages.common.title}</h1>
      {/*           ^^^^^ Auto-complete */}
      <i18n.Link href="/about">{t('nav.about')}</i18n.Link>
      {/*                          ^^^^^^^^^ Auto-complete */}
    </div>
  )
}
```

That's it! **Types are automatically inferred** - no manual type annotations needed.

**Two ways to access translations:**

- `messages.site.name` - Direct object access (simple and clear)
- `t('site.name')` - Function call (useful for dynamic keys)

Both are fully typed with autocomplete. Use whichever you prefer!

---

### Tips: Cleaner Imports

For shorter, cleaner imports, you can re-export from your i18n config:

**Create re-export files:**

```typescript
// src/lib/i18n/index.ts
import { define } from 'next-i18n-tiny'
import enMessages from '@/messages/en'
import jaMessages from '@/messages/ja'

export type Locale = 'ja' | 'en'
export const locales: Locale[] = ['ja', 'en']
export const defaultLocale: Locale = 'ja'

export const i18n = define({
  locales,
  defaultLocale,
  messages: { ja: jaMessages, en: enMessages }
})

// Re-export for convenience
export const Provider = i18n.Provider
export const Link = i18n.Link
```

```typescript
// src/lib/i18n/server.ts
import { i18n } from './index'

export const getMessages = i18n.server.getMessages
export const getTranslations = i18n.server.getTranslations
```

```typescript
// src/lib/i18n/client.ts
import { i18n } from './index'

export const useMessages = i18n.client.useMessages
export const useTranslations = i18n.client.useTranslations
export const useLocale = i18n.client.useLocale
```

**Then use with cleaner imports:**

```typescript
// Layout
import { Provider } from '@/lib/i18n'
import { getMessages } from '@/lib/i18n/server'

// Server Component
import { Link, type Locale } from '@/lib/i18n'
import { getMessages, getTranslations } from '@/lib/i18n/server'

// Client Component
import { Link } from '@/lib/i18n'
import { useTranslations, useLocale } from '@/lib/i18n/client'
```

---

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
  },
  locales,         // Available locales
  defaultLocale    // Default locale
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
