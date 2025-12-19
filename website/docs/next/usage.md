--- 
sidebar_position: 3
---

# 使い方

## プロジェクト構成

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

## 最低限のセットアップ

### 1. メッセージファイルの作成

このファイルはプロジェクト内のどこにでも配置できます。

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

### 2. i18nインスタンスの定義

このファイルはプロジェクト内のどこにでも配置できます（`i18n.ts`、`lib/i18n/index.ts` など）。

```typescript
// i18n.ts
import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import enMessages from '@/messages/en'
import jaMessages from '@/messages/ja'

// 重要: 型推論のために `as const` が必要です
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

### 3. プロキシのセットアップ

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

### 4. レイアウトでの使用

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

### 5. コンポーネントでの使用

```typescript
// Server Component
import { getMessages, getTranslations, type Locale } from '@/i18n'

export async function ServerComponent({ locale }: { locale: Locale }) {
  /* オブジェクトへの直接アクセス */
  const messages = await getMessages(locale)
  /* 関数呼び出し */
  const t = await getTranslations(locale)

  return (
    <div>
      <h1>{messages.common.title}</h1>
      {/*           ^^^^^ 自動補完 */}
      <p>{t('common.description')}</p>
      {/*    ^^^^^^^^^^^^^^^^^^ 自動補完 */}
    </div>
  )
}
```

```typescript
// Client Component
'use client'
import { Link, useMessages, useTranslations } from '@/i18n'

export function ClientComponent() {
  /* オブジェクトへの直接アクセス */
  const messages = useMessages()
  /* 関数呼び出し */
  const t = useTranslations()

  return (
    <div>
      <h1>{messages.common.title}</h1>
      {/*           ^^^^^ 自動補完 */}
      <Link href="/about">{t('nav.about')}</Link>
      {/*                    ^^^^^^^^^ 自動補完 */}
    </div>
  )
}
```

以上です！**型は自動的に推論されます** - 手動で型注釈を付ける必要はありません。

**翻訳にアクセスする2つの方法:**

- `messages.common.title` - オブジェクトへの直接アクセス（シンプルで明確）
- `t('common.title')` - 関数呼び出し（動的なキーに便利）

どちらも完全に型付けされ、自動補完されます。お好きな方をお使いください！
