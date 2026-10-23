---
description: "Add i18n to the Next.js App Router without heavy setup. i18n-tiny gives fully typed translations in Server and Client Components, with zero dependencies."
---

# Type-Safe i18n for the Next.js App Router

A dependency-free, type-safe, minimal i18n library for **Next.js**.

Simply prepare translation files and call the `define` function—it's immediately usable in both Server and Client Components.
All key paths such as `messages.site.title` and `t("site.title")` are fully typed and auto-suggested, eliminating typos.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys.
- **Zero dependencies**: No external i18n libraries needed.
- **Server Components**: Native RSC support.
- **Minimal SSG**: Define `generateStaticParams` once in `layout.tsx` to statically generate all pages.
- **Simple API**: Single configuration, minimal boilerplate.
- **Lightweight**: Under 1KB minified and gzipped in the browser.
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
- [API Reference](./api-reference/)
- [TIPS](./tips/ssg)