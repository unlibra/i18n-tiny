---
sidebar_position: 1
---

# Introduction

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

A dependency-free, type-safe, minimal i18n library for **Next.js**.

Simply prepare translation files and call the `define` function—it's immediately usable in both Server and Client Components.
All key paths such as `messages.site.title` and `t("site.title")` are fully typed and auto-suggested, eliminating typos.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys.
- **Zero dependencies**: No external i18n libraries needed.
- **Server Components**: Native RSC support.
- **Minimal SSG**: Define `generateStaticParams` once in `layout.tsx` to statically generate all pages.
- **Simple API**: Single configuration, minimal boilerplate.
- **Lightweight**: Minimal bundle size.
- **No global state**: Pure function factory pattern.

## Installation

```bash
npm install @i18n-tiny/next
```

## Usage

```typescript
// i18n.ts - define() generates everything you need
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
return <h1>{messages.common.title}</h1>  // ← Type-safe! Autocomplete
return <p>{t('greeting', { name })}</p>  // ← Interpolation support

// Client Component
const messages = useMessages()
const t = useTranslations()
return <p>{messages.common.welcome}</p>  // ← Type-safe! Autocomplete
return <p>{t('greeting', { name })}</p>  // ← Interpolation support
```

## Next Steps

- [Installation](./installation)
- [Usage](./usage)
- [API Reference](./api-reference)
- [TIPS](./tips/ssg)