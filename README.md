# i18n-tiny

[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

The simplest i18n library for modern frameworks. Type-safe, zero-dependency, minimal setup.

One function for fully-typed translations.
`define()` gives you complete autocomplete for every translation key.

*Optional routing support with `create()` for Next.js and Astro.*

Currently supports: **Next.js** | **Astro**

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

const { client, server, Provider } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})

export { Provider }
export const { useMessages, useTranslations } = client
export const { getMessages, getTranslations } = server
```

```tsx
// Server Component
const messages = await getMessages(locale)
const t = await getTranslations(locale)
return <h1>{messages.common.title}</h1>  // ← Typed! Full autocomplete
return <p>{t('greeting', { name })}</p>  // ← Interpolation

// Client Component
const messages = useMessages()
const t = useTranslations()
return <p>{messages.common.welcome}</p>  // ← Typed! Full autocomplete
return <p>{t('greeting', { name })}</p>  // ← Interpolation
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

export const { getMessages, getTranslations } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

```astro
---
const messages = getMessages(locale)
const t = getTranslations(locale)
---
<h1>{messages.common.title}</h1>  <!-- ← Typed! Full autocomplete -->
<p>{t('greeting', { name })}</p>  <!-- ← Interpolation -->
```

[Full documentation →](./packages/astro/README.md)

## Features

- **One function**: Just `define()` - get Provider, hooks, and utilities
- **Type-safe**: Full TypeScript support with automatic type inference
- **Zero dependencies**: No external i18n libraries needed
- **Framework support**: Next.js, Astro
- **Minimal bundle**: No bloat, just what you need

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
