---
description: "Add multiple languages to a Next.js App Router app, step by step: create message files, call define(), add locale routing, and use typed translations."
---

# How to Add i18n to a Next.js App Router Project

**In short:** create one message file per locale, and call `define()` once to get typed helpers. Add the i18n-tiny proxy for locale routing, and wrap the root layout in `Provider`. Then read translations with `server.getTranslations()` in Server Components and `client.useTranslations()` in Client Components.

## 1. Create Messages

Create message files for each locale.

```typescript
// messages/en.ts
export default {
  common: {
    title: "My App",
    welcome: "Welcome, {name}!"
  }
}

// messages/ja.ts
export default {
  common: {
    title: "マイアプリ",
    welcome: "ようこそ、{name}さん！"
  }
}
```

## 2. Define i18n Instance

Import `define` from `@i18n-tiny/next` to create your i18n instance.

```typescript
// i18n.ts
import { define } from '@i18n-tiny/next'
import en from './messages/en'
import ja from './messages/ja'

export const {
  locales,
  defaultLocale,
  server,
  client,
  Provider
} = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en, ja }
})
```

## 3. Setup Proxy

Create a `proxy.ts` file to handle routing and language detection. Next.js 16 calls this file convention Proxy (formerly Middleware).

```typescript
// proxy.ts
import { create } from '@i18n-tiny/next/proxy'
import { locales, defaultLocale } from './i18n'

export const proxy = create({
  locales,
  defaultLocale
})

export const config = {
  // Skip internal paths and static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

## 4. Integrate into Root Layout

Wrap your application with the `Provider` in your root layout.

```tsx
// app/[locale]/layout.tsx
import type { ReactNode } from 'react'
import { Provider, server } from '@/i18n'

export default async function RootLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await server.getMessages(locale)

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} messages={messages}>
          {children}
        </Provider>
      </body>
    </html>
  )
}
```

## 5. Use in Components

### Server Components

```tsx
import { server } from '@/i18n'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await server.getTranslations(locale)

  return <h1>{t('common.title')}</h1>
}
```

### Client Components

```tsx
'use client'
import { client } from '@/i18n'

export default function ClientComponent() {
  const t = client.useTranslations('common')
  return <p>{t('welcome', { name: 'User' })}</p>
}
```

With a namespace, keys are relative to it and still type-checked: `t('welcome')` resolves `common.welcome`, and `t('common.welcome')` is a type error.