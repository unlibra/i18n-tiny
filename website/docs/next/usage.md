---
sidebar_position: 3
---

# Usage

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

## 3. Setup Proxy (Middleware)

Create a `middleware.ts` file to handle routing and language detection.

```typescript
// middleware.ts
import { create } from '@i18n-tiny/next/proxy'
import { locales, defaultLocale } from './i18n'

export const middleware = create({
  locales,
  defaultLocale
})

export const config = {
  // Skip internal paths and static files
  matcher: ['/((?!api|_next|.*\..*).*)']
}
```

## 4. Integrate into Root Layout

Wrap your application with the `Provider` in your root layout.

```tsx
// app/[locale]/layout.tsx
import { Provider, server } from '@/i18n'

export default async function RootLayout({ children, params }) {
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

export default async function Page({ params }) {
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