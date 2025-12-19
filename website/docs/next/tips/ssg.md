---
sidebar_position: 1
---

# 静的サイト生成 (SSG)

Next.js (App Router) で静的サイト生成を行う場合、通常は各ページ (`page.tsx`) ごとに `generateStaticParams` を定義する必要があります。

しかし、**i18n-tiny では、ルートレイアウト (`layout.tsx`) に一度定義するだけで、配下のすべてのページを静的に生成することが可能です。**

これにより、新しいページを追加するたびに `generateStaticParams` を書く手間が省け、コードの重複を劇的に減らすことができます。

## 実装例

`app/[locale]/layout.tsx` に以下のコードを追加するだけです：

```typescript
// app/[locale]/layout.tsx
import { locales } from '@/i18n'

// これをルートレイアウトに一度書くだけで、
// 配下のすべてのページ（ページごとの追加設定なし）がビルド時に静的に生成されます。
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function Layout({ children, params }) {
  // ...
}
```
