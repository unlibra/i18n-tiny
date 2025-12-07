# @i18n-tiny/next

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Type-safe, zero-dependency i18n library for Next.js App Router with React Server Components support.

Inspired by next-intl, designed for simplicity and type safety.

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

```text
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

#### **1. Create message files**

Place this file anywhere in your project.

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

#### **2. Define i18n instance**

Place this file anywhere in your project (`i18n.ts`, `lib/i18n/index.ts`, etc.)

```typescript
// i18n.ts
import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import enMessages from '@/messages/en'
import jaMessages from '@/messages/ja'

// IMPORTANT: `as const` is required for type inference
export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

const { client, server, Provider } = define({
  locales,
  defaultLocale,
  messages: { en: enMessages, ja: jaMessages }
})

export { Link, Provider }
export const { useMessages, useTranslations, useLocale } = client
export const { getMessages, getTranslations } = server
```

#### **3. Setup Proxy**

```typescript
// proxy.ts (Next.js 16+) or middleware.ts (Next.js 15)
import { create } from '@i18n-tiny/next/proxy'
import { locales, defaultLocale } from '@/i18n'

export const proxy = create({
  locales,
  defaultLocale
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)*']
}
```

#### **4. Use in Layout**

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

#### **5. Use in Components**

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

### `@i18n-tiny/next`

#### `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter       | Type                       | Description                                                |
| --------------- | -------------------------- | ---------------------------------------------------------- |
| `locales`       | `readonly string[]`        | Array of supported locales (e.g., `['en', 'ja'] as const`) |
| `defaultLocale` | `string`                   | Default locale                                             |
| `messages`      | `Record<Locale, Messages>` | Messages object keyed by locale                            |

**Returns:**

```typescript
{
  Provider: React.FC<{ locale: string; messages: Messages; children: ReactNode }>
  locales: readonly string[]
  defaultLocale: string
  server: {
    getMessages: (locale: string) => Promise<Messages>
    getTranslations: (locale: string, namespace?: string) => Promise<TranslationFunction>
  }
  client: {
    useMessages: () => Messages
    useTranslations: (namespace?: string) => TranslationFunction
    useLocale: () => string
  }
}
```

#### `DefineConfig` (type)

Type for the configuration object passed to `define()`.

### `@i18n-tiny/next/proxy`

#### `create(config)`

Creates a Next.js proxy (middleware) handler for i18n routing.

**Parameters:**

| Parameter        | Type                | Default         | Description                                                             |
| ---------------- | ------------------- | --------------- | ----------------------------------------------------------------------- |
| `locales`        | `readonly string[]` | -               | Array of supported locales                                              |
| `defaultLocale`  | `string`            | -               | Default locale for redirects                                            |
| `fallbackLocale` | `string`            | `defaultLocale` | Fallback when detection fails                                           |
| `prefixDefault`  | `boolean`           | `false`         | Whether to prefix default locale in URLs                                |
| `detectLanguage` | `boolean`           | `true`          | Whether to detect from Accept-Language                                  |
| `routing`        | `'rewrite'`         | -               | SSR rewrite mode (mutually exclusive with prefixDefault/detectLanguage) |

**Routing Behavior Matrix:**

| prefixDefault | detectLanguage | `/` behavior                                     |
| ------------- | -------------- | ------------------------------------------------ |
| `false`       | `false`        | Serves fallbackLocale, no detection              |
| `false`       | `true`         | Detects, redirects non-default, rewrites default |
| `true`        | `false`        | Redirects to `/[defaultLocale]`                  |
| `true`        | `true`         | Detects and redirects to detected locale         |

**Examples:**

```typescript
// Default: detect language, redirect non-default, rewrite default
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

// No detection, always use fallback
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  detectLanguage: false
})

// SSR rewrite mode (locale in x-locale header)
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  routing: 'rewrite'
})
```

#### `ProxyConfig` (type)

Type for the configuration object passed to `create()`.

### `@i18n-tiny/next/router`

#### `Link`

Localized Link component that auto-detects locale from current URL.

```typescript
import { Link } from '@i18n-tiny/next/router'

// Auto-localized (maintains current URL pattern)
<Link href="/about">About</Link>

// Explicit locale override
<Link href="/" locale="ja">日本語</Link>

// Raw path (no localization)
<Link href="/" locale="">English</Link>
<Link href="/" locale={false}>English</Link>

// Conditional locale (false = raw path)
<Link href="/" locale={condition && 'ja'}>Conditional</Link>
```

### `@i18n-tiny/core`

#### `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header.

```typescript
import { detectLocale } from '@i18n-tiny/core/middleware'

const acceptLanguage = request.headers.get('accept-language')
const locale = detectLocale(acceptLanguage, ['en', 'ja'])
// Returns: 'en' | 'ja' | null
```

### `@i18n-tiny/core/router`

#### `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

Generate a localized path with locale prefix.

```typescript
import { getLocalizedPath } from '@i18n-tiny/core/router'

getLocalizedPath('/about', 'ja', 'en')        // '/ja/about'
getLocalizedPath('/about', 'en', 'en')        // '/about'
getLocalizedPath('/about', 'en', 'en', true)  // '/en/about'
```

#### `removeLocalePrefix(pathname, locales)`

Remove locale prefix from pathname.

```typescript
import { removeLocalePrefix } from '@i18n-tiny/core/router'

removeLocalePrefix('/ja/about', ['en', 'ja'])  // '/about'
removeLocalePrefix('/ja', ['en', 'ja'])        // '/'
removeLocalePrefix('/about', ['en', 'ja'])     // '/about'
```

## Advanced Usage

### Static Site Generation (SSG)

To generate static pages for all locales at build time, add `generateStaticParams` to your **root layout**.

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

### Language Switcher

```typescript
'use client'
import { Link, useLocale } from '@/i18n'

export function LanguageSwitcher() {
  const pathname = usePathname()

  return (
    <div>
      <Link href={pathname} locale="en" normalize> // /ja/about -> /en/about
        English
      </Link>
      <Link href={pathname} locale="ja" normalize> // /en/about -> /ja/about
        日本語
      </Link>
    </div>
  )
}
```

## Examples

See the [examples](../../examples) directory for complete working examples.

## License

MIT
