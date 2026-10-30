# i18n-tiny

[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/)

The simplest i18n library for modern frameworks. Type-safe, zero-dependency, minimal setup, and under 1KB.

One function for fully-typed translations.
`define()` gives you complete autocomplete for every translation key.

*Optional routing support with `create()` for Next.js and Astro.*

Currently supports: **Next.js** | **Astro** | **React**

**[Documentation](https://docs.unlibra.com/i18n-tiny/)** · **[npm](https://www.npmjs.com/org/i18n-tiny)**

## Quick Start

### Next.js

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)

```bash
npm install @i18n-tiny/next
```

```typescript
// i18n.ts - define() gives you everything
import { define } from '@i18n-tiny/next'
import en from './messages/en' // { common: { title: 'Hello', greeting: 'Hello, {name}!' } }
import ja from './messages/ja'

const { client, server, Provider } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en, ja }
})

export { Provider }
export const { useMessages, useTranslations } = client
export const { getMessages, getTranslations } = server
```

```tsx
// Server Component (locale comes from the [locale] route params)
const messages = await getMessages(locale)
const t = await getTranslations(locale)
return <h1>{messages.common.title}</h1>  // ← Typed! Full autocomplete
return <p>{t('common.greeting', { name: 'Alice' })}</p>  // ← Interpolation

// Client Component
const messages = useMessages()
const t = useTranslations()
return <h1>{messages.common.title}</h1>  // ← Typed! Full autocomplete
return <p>{t('common.greeting', { name: 'Alice' })}</p>  // ← Interpolation
```

[Full documentation →](./packages/next/README.md)

### Astro

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)

```bash
npm install @i18n-tiny/astro
```

```typescript
// i18n.ts - define() gives you everything
import { define } from '@i18n-tiny/astro'
import ja from './messages/ja' // { common: { title: 'こんにちは', greeting: 'こんにちは、{name}さん' } }
import en from './messages/en'

export const i18n = define({
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  messages: { ja, en }
})
```

```astro
---
// src/pages/[...locale]/index.astro → / (ja) and /en (en)
import type { InferGetStaticPropsType } from 'astro'
import { i18n } from '../../i18n'

export function getStaticPaths() {
  return i18n.getStaticPaths()
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale } = Astro.props // 'ja' | 'en'
const messages = i18n.getMessages(locale)
const t = i18n.getTranslations(locale)
---
<h1>{messages.common.title}</h1>  <!-- ← Typed! Full autocomplete -->
<p>{t('common.greeting', { name: 'Alice' })}</p>  <!-- ← Interpolation -->
```

[Full documentation →](./packages/astro/README.md)

### React

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)

```bash
npm install @i18n-tiny/react
```

```typescript
// i18n.ts - define() gives you everything
import { define } from '@i18n-tiny/react'
import en from './messages/en' // { common: { title: 'Hello', greeting: 'Hello, {name}!' } }
import ja from './messages/ja'

export const messages = { en, ja }

export const { Provider, useMessages, useTranslations } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages
})
```

```tsx
// Wrap your app (locale is 'en' or 'ja', for example from useState)
<Provider locale={locale} messages={messages[locale]}>
  <App />
</Provider>

// Any component
const messages = useMessages()
const t = useTranslations()
return <h1>{messages.common.title}</h1>  // ← Typed! Full autocomplete
return <p>{t('common.greeting', { name: 'Alice' })}</p>  // ← Interpolation
```

[Full documentation →](./packages/react/README.md)

## Features

- **One function**: Just `define()` - get Provider, hooks, and utilities
- **Type-safe**: Full TypeScript support with automatic type inference
- **Zero dependencies**: No external i18n libraries needed
- **Framework support**: Next.js, Astro, React
- **Minimal bundle**: under 1KB minified and gzipped in the browser (`@i18n-tiny/react`, `@i18n-tiny/next`); `@i18n-tiny/astro` adds no JavaScript to the browser

## Security

Variable interpolation (`{name}`) inserts values as-is without HTML escaping.

**Safe usage (React/Astro auto-escape):**
```tsx
// ✅ Safe - framework escapes output
<p>{t('greeting', { name: userInput })}</p>
```

**Unsafe usage:**
```tsx
// ❌ Unsafe - bypasses escaping
<p dangerouslySetInnerHTML={{ __html: t('greeting', { name: userInput }) }} />
// Astro: <p set:html={t('greeting', { name: userInput })} />
```

When using `dangerouslySetInnerHTML` or `set:html`, sanitize user input first.

## Examples

See the [examples](./examples) directory for complete working examples.

## Development

This is a pnpm workspace monorepo.

```bash
pnpm install   # Install dependencies
pnpm build     # Build all packages
pnpm test      # Run tests
pnpm lint      # Lint
```

## License

MIT
