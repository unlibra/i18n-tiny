---
sidebar_position: 1
---

# はじめに

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**Next.js**のための、依存関係なし、型安全、最小限のi18nライブラリです。

翻訳ファイルを用意して `define` 関数を呼び出すだけで、サーバーコンポーネントとクライアントコンポーネントの両方ですぐに使用できます。
`messages.site.title` や `t("site.title")` のようなすべてのキーパスは完全に型付けされ、自動補完されるため、タイプミスを排除できます。

## 特徴

- **型安全**: 完全なTypeScriptサポートと**自動型推論** - `messages.site.name`、`t('common.title')`、およびすべてのネストされたキーの自動補完
- **依存関係ゼロ**: 外部i18nライブラリは不要
- **サーバーコンポーネント**: ネイティブRSCサポート
- **最小限のSSG**: `layout.tsx` で一度 `generateStaticParams` を定義するだけで、すべてのページを静的に生成できます。
- **シンプルなAPI**: 単一の設定、最小限のボイラープレート
- **軽量**: 最小限のバンドルサイズ
- **グローバル状態なし**: 純粋な関数ファクトリーパターン

## インストール

```bash
npm install @i18n-tiny/next
```

## 使い方

```typescript
// i18n.ts - define() ですべてを生成
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
return <h1>{messages.common.title}</h1>  // ← 型安全！自動補完
return <p>{t('greeting', { name })}</p>  // ← 補間もサポート

// Client Component
const messages = useMessages()
const t = useTranslations()
return <p>{messages.common.welcome}</p>  // ← 型安全！自動補完
return <p>{t('greeting', { name })}</p>  // ← 補間もサポート
```

## 次のステップ

- [インストール](./installation)
- [使い方](./usage)
- [APIリファレンス](./api-reference)
- [TIPS](./tips/ssg)
