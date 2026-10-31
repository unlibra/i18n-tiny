---
description: "Add multiple languages to a Next.js App Router app, step by step: create message files, call define(), add locale routing, and use typed translations."
---

# How to Add i18n to a Next.js App Router Project

**In short:** create one message file per locale, and call `define()` once to get typed helpers. Add the i18n-tiny proxy for locale routing, and wrap the root layout in `Provider`. Then read translations with `getTranslations()` in Server Components and `useTranslations()` in Client Components.

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

Every locale must have the keys of the default locale: a missing or extra key is a type error in `define()`. See [Messages](./api-reference/core#messages) for variables, braces and the types of the messages.

## 2. Define i18n Instance

The locales are written once, in an object of their own that `define()` and the proxy both take:

```typescript
// i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const
```

```typescript
// i18n.ts
import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import { config } from '@/i18n.config'
import en from '@/messages/en'
import ja from '@/messages/ja'

export const i18n = define({
  ...config,
  messages: { en, ja }
})

export type Locale = (typeof i18n.locales)[number]

export { Link }
export const { Provider, isLocale, locales } = i18n
export const { useMessages, useTranslations, useLocale } = i18n.client
export const { getMessages, getTranslations } = i18n.server
```

`locales` and `defaultLocale` are required. `define()` checks the config: see [`define()`](./api-reference/core#define-config).

## 3. Setup Proxy

Create a `proxy.ts` file for locale routing. Next.js 16 calls this file convention Proxy (formerly Middleware).

```typescript
// proxy.ts
import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from '@/i18n.config'

export const proxy = create({ ...i18nConfig })

export const config = {
  // Skip internal paths and static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

On Next.js 15, name the file `middleware.ts` and the export `middleware`.

URLs without a locale prefix, such as `/about`, are the default locale, and the others have a prefix, such as `/ja/about`. The proxy does not detect the language unless you pass `detectLanguage: true`: see [Proxy](./api-reference/proxy).

## 4. Integrate into Root Layout

Wrap your application with the `Provider` in your root layout. `[locale]` also receives paths that are not locales, such as `/favicon.ico`. `getMessages()` takes one of the locales only, so narrow the parameter with `isLocale()` and show the 404 page for anything else:

```tsx
// app/[locale]/layout.tsx
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Provider, getMessages, isLocale } from '@/i18n'

export default async function RootLayout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const messages = await getMessages(locale)

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
import { notFound } from 'next/navigation'
import { getTranslations, isLocale } from '@/i18n'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = await getTranslations(locale)

  return <h1>{t('common.title')}</h1>
}
```

### Client Components

```tsx
'use client'
import { Link, useTranslations } from '@/i18n'

export default function ClientComponent() {
  const t = useTranslations('common')
  return (
    <div>
      <p>{t('welcome', { name: 'User' })}</p>
      <Link href="/about">About</Link>
    </div>
  )
}
```

With a namespace, keys are relative to it and still type-checked: `t('welcome')` resolves `common.welcome`, and `t('common.welcome')` is a type error.

The `Link` builds the link for the current locale: `/about` on an English page and `/ja/about` on a Japanese page. See [Router](./api-reference/router).
