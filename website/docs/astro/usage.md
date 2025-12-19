---
sidebar_position: 3
---

# 使い方

## 1. メッセージの作成

ロケールごとにメッセージファイルを作成します。

```typescript
// src/messages/en.ts
export default {
  common: {
    title: "My Site",
    description: "Welcome"
  }
}

// src/messages/ja.ts
export default {
  common: {
    title: "マイサイト",
    description: "ようこそ"
  }
}
```

## 2. i18nインスタンスの定義

`@i18n-tiny/astro` から `define` をインポートし、インスタンスを作成します。

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/astro'
import en from './messages/en'
import ja from './messages/ja'

export const { getMessages, getTranslations } = define({
  messages: { en, ja }
})
```

## 3. 追加の設定 (Optional)

必要に応じて、インテグレーション（SSG用）やミドルウェア（SSR用）を追加できます。

### SSG

ビルド後にデフォルトロケールのコンテンツをルートディレクトリにコピーし、ロケールプレフィックスなし（例: `/about`）でアクセス可能にする場合にインテグレーションを使用します。

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import { create } from '@i18n-tiny/astro/integration'

export default defineConfig({
  output: 'static', // デフォルト
  integrations: [
    create({ defaultLocale: 'en' })
  ]
})
```

### SSR

サーバーサイドレンダリングの場合、言語検出やリダイレクトを行うためにミドルウェアを使用します。

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware'
import { create } from '@i18n-tiny/astro/middleware'

export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en'
  })
)
```

## 4. ページでの利用

`[locale]` ディレクトリ配下でメッセージを取得します。

```astro
---
// src/pages/[locale]/index.astro
import { getMessages } from '../../i18n'
const { locale } = Astro.params

const messages = getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```
