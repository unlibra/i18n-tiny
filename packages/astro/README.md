# @i18n-tiny/astro

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

A zero-dependency, type-safe, minimal internationalization library for Astro.
Works with both SSG and SSR. Configuration is completed by a single `define` function, with full auto-completion for key paths like `messages.common.title`.
Locale handling in `getStaticPaths` requires only minimal setup, avoiding repetitive per-page definitions.

**SSR**: Use `middleware.create()` for routing with automatic language detection.
**SSG**: Use `integration.create()` to copy default locale content to root at build time.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys
- **Zero dependencies**: No external i18n libraries needed
- **Server-first**: Native Astro server-side rendering support
- **Minimal SSG**: Works seamlessly with Astro's static site generation
- **Simple API**: Single configuration, minimal boilerplate
- **Small**: Minimal bundle size
- **Flexible**: Use with Astro's built-in i18n or standalone middleware

## Installation

```bash
npm install @i18n-tiny/astro
# or
pnpm add @i18n-tiny/astro
# or
yarn add @i18n-tiny/astro
```

## Usage

### Project Structure

```text
src/
├── pages/
│   └── [locale]/
│       ├── index.astro
│       └── about.astro
├── messages/
│   ├── en.ts
│   └── ja.ts
├── i18n.ts
└── middleware.ts
```

### Minimal Setup

Place this file anywhere in your project.

#### **1. Create message files**

```typescript
// src/messages/en.ts
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
// src/messages/ja.ts
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
// src/i18n.ts
import { define } from '@i18n-tiny/astro'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

// IMPORTANT: `as const` is required for type inference
export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const { getMessages, getTranslations } = define({
  locales,
  defaultLocale,
  messages: { en: enMessages, ja: jaMessages }
})
```

#### **3. Setup middleware**

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { locales, defaultLocale } from './i18n'

const middleware = create({
  locales,
  defaultLocale
})

export const onRequest = defineMiddleware(middleware)
```

#### **4. Use in pages**

```astro
---
// src/pages/[locale]/index.astro
import { getMessages, getTranslations } from '../../i18n'
const { locale } = Astro.params

const messages = getMessages(locale)
const t = getTranslations(locale)
---

<html lang={locale}>
  <head>
    <title>{messages.common.title}</title>
    {/*           ^^^^^ Auto-complete */}
  </head>
  <body>
    <h1>{messages.common.title}</h1>
    <p>{t('common.description')}</p>
    {/*    ^^^^^^^^^^^^^^^^^^ Auto-complete */}
  </body>
</html>
```

That's it! **Types are automatically inferred** - no manual type annotations needed.

## API Reference

### `@i18n-tiny/astro`

#### `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter       | Type                       | Description                                                   |
| --------------- | -------------------------- | ------------------------------------------------------------- |
| `locales`       | `readonly string[]`        | Array of supported locales (optional, inferred from messages) |
| `defaultLocale` | `string`                   | Default locale (optional, uses first locale)                  |
| `messages`      | `Record<Locale, Messages>` | Messages object keyed by locale                               |

**Returns:**

```typescript
{
  locales: readonly string[]
  defaultLocale: string
  getMessages: (locale: string | undefined) => Messages
  getTranslations: (locale: string | undefined, namespace?: string) => TranslationFunction
}
```

#### `DefineConfig` (type)

Type for the configuration object passed to `define()`.

### `@i18n-tiny/astro/middleware` (SSR only)

#### `create(config)`

Creates an Astro middleware handler for i18n routing.

> **Note**: Middleware only works in SSR mode. For SSG, use the integration instead.

**Parameters:**

| Parameter        | Type                | Default         | Description                                                             |
| ---------------- | ------------------- | --------------- | ----------------------------------------------------------------------- |
| `locales`        | `readonly string[]` | -               | Array of supported locales                                              |
| `defaultLocale`  | `string`            | -               | Default locale for redirects                                            |
| `fallbackLocale` | `string`            | `defaultLocale` | Fallback when detection fails                                           |
| `excludePaths`   | `string[]`          | `[]`            | Paths to exclude from i18n handling                                     |
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
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en'
  })
)

// Always prefix all locales (including default)
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    prefixDefault: true
  })
)

// No detection, always use fallback
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    detectLanguage: false
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

**SSR Rewrite Mode:**

When using `routing: 'rewrite'`, the locale is stored in `Astro.locals.locale`:

```astro
---
// src/pages/index.astro (no [locale] folder needed)
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

#### `MiddlewareConfig` (type)

Type for the configuration object passed to `create()`.

### `@i18n-tiny/astro/integration` (SSG only)

#### `create(config)`

Creates an Astro integration for i18n static file generation.

> **Note**: This integration is for SSG mode only. It copies the default locale's content to the root directory after build, enabling `/` to serve the default locale without a prefix.

**Parameters:**

| Parameter       | Type      | Default | Description                                              |
| --------------- | --------- | ------- | -------------------------------------------------------- |
| `defaultLocale` | `string`  | -       | Default locale - content from this locale is copied to root |
| `prefixDefault` | `boolean` | `false` | If true, skips copying (all locales remain prefixed)    |

**Example:**

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import { create } from '@i18n-tiny/astro/integration'

export default defineConfig({
  integrations: [
    create({
      defaultLocale: 'en'
    })
  ]
})
```

**Build Output:**

```
dist/
├── index.html        ← copied from /en/index.html
├── about/index.html  ← copied from /en/about/index.html
├── en/
│   ├── index.html
│   └── about/index.html
└── ja/
    ├── index.html
    └── about/index.html
```

> **Important**: In SSG mode, automatic language detection (`detectLanguage`) does not work because there is no server to read the `Accept-Language` header. Users will always see the default locale first when visiting `/`.

#### `IntegrationConfig` (type)

Type for the configuration object passed to `create()`.

### `@i18n-tiny/astro/router`

#### `Link` Component

Localized Link component that auto-detects locale from current URL.

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
---

<!-- Auto-localized (maintains current URL pattern) -->
<Link href="/about">About</Link>

<!-- Explicit locale override -->
<Link href="/" locale="ja">日本語</Link>

<!-- Raw path (no localization) -->
<Link href="/" locale="">English</Link>
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

For static sites, use `getStaticPaths` and the integration:

**1. Add the integration to `astro.config.mjs`:**

```typescript
import { defineConfig } from 'astro/config'
import { create } from '@i18n-tiny/astro/integration'

export default defineConfig({
  integrations: [
    create({ defaultLocale: 'en' })
  ]
})
```

**2. Use `getStaticPaths` in your pages:**

```astro
---
// src/pages/[locale]/index.astro
import { locales, getMessages } from '../../i18n'

export function getStaticPaths() {
  return locales.map((locale) => ({
    params: { locale }
  }))
}

const { locale } = Astro.params
const messages = getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

> **Note**: The integration copies `/en/*` to `/*` after build, so users can access the site at `/` without a locale prefix. Middleware is not needed for SSG.

### Language Switcher

```astro
---
// src/components/LanguageSwitcher.astro
import Link from '@i18n-tiny/astro/router/Link.astro'
import { locales } from '../i18n'

const locale = Astro.params.locale ?? Astro.locals.locale

const localeNames: Record<string, string> = {
  en: 'English',
  ja: '日本語'
}
---

<nav>
  {locales.map((loc) => (
    <Link
      href="/"
      locale={loc}
      style={loc === locale ? 'font-weight: bold;' : ''}
    >
      {localeNames[loc]}
    </Link>
  ))}
</nav>
```

### With Astro's Built-in i18n

You can also use Astro's built-in i18n routing with @i18n-tiny/astro for translations only:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
    routing: {
      prefixDefaultLocale: false
    }
  }
})
```

```astro
---
// src/pages/[locale]/index.astro
import { getMessages } from '../../i18n'

// Astro.currentLocale is available in Astro 4.0+
const locale = Astro.currentLocale
const messages = getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

## TypeScript

### Astro.locals Type Safety

For type-safe access to `Astro.locals.locale`, add the type reference to your project:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />
/// <reference types="@i18n-tiny/astro/locals" />
```

This provides types for:
- `Astro.locals.locale` - Current locale
- `Astro.locals.locales` - Supported locales array
- `Astro.locals.originalPathname` - Original path (rewrite mode)

## License

MIT
