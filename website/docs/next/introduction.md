---
description: "Add i18n to the Next.js App Router without heavy setup. i18n-tiny gives fully typed translations in Server and Client Components, with zero dependencies."
---

# Type-Safe i18n for the Next.js App Router

A dependency-free, type-safe, minimal i18n library for **Next.js**.

Simply prepare translation files and call the `define` function—it's immediately usable in both Server and Client Components.
All key paths such as `messages.site.title` and `t("site.title")` are fully typed and auto-suggested, eliminating typos.

Updating from 1.x? See the [migration guide](https://github.com/unlibra/i18n-tiny/blob/main/MIGRATION.md).

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys.
- **Zero dependencies**: No external i18n libraries needed.
- **Server Components**: Native RSC support.
- **Minimal SSG**: With the `app/[locale]` root layout, define `generateStaticParams` once there; Next.js applies it to every page below.
- **Simple API**: Single configuration, minimal boilerplate.
- **Lightweight**: `define()` is under 1.5KB minified and gzipped in the browser. The `Link` of `@i18n-tiny/next/router` is not counted in this size.
- **No global state**: Pure function factory pattern.

## Installation

```bash
npm install @i18n-tiny/next
```

## Usage

```typescript
// i18n.ts - define() generates everything you need
import { define } from '@i18n-tiny/next'
import en from './messages/en' // { common: { title: 'Hello', greeting: 'Hello, {name}!' } }
import ja from './messages/ja'

const { client, server, Provider, isLocale } = define({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  messages: { en, ja }
})

export { Provider, isLocale }
export const { useMessages, useTranslations } = client
export const { getMessages, getTranslations } = server
```

```tsx
// Server Component (locale comes from the [locale] route params)
if (!isLocale(locale)) notFound()  // ← Only the locales are pages
const messages = await getMessages(locale)
const t = await getTranslations(locale)
return <h1>{messages.common.title}</h1>  // ← Type-safe! Autocomplete
return <p>{t('common.greeting', { name: 'Alice' })}</p>  // ← Interpolation

// Client Component
const messages = useMessages()
const t = useTranslations()
return <h1>{messages.common.title}</h1>  // ← Type-safe! Autocomplete
return <p>{t('common.greeting', { name: 'Alice' })}</p>  // ← Interpolation
```

## Next Steps

- [Installation](./installation)
- [Usage](./usage)
- [API Reference](./api-reference/)
- [TIPS](./tips/ssg)
