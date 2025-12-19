---
sidebar_position: 1
---

# はじめに

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)

**React**のための、自動型推論と依存関係ゼロの、小さくて型安全なi18nライブラリです。

## 特徴

- **型安全**: 完全なTypeScriptサポートと**自動型推論**
- **依存関係ゼロ**: 外部i18nライブラリは不要
- **シンプルなAPI**: 単一の設定、最小限のボイラープレート
- **軽量**: 最小限のバンドルサイズ

## インストール

```bash
npm install @i18n-tiny/react
```

## 使い方

```typescript
// i18n.ts - define() ですべてを生成
import { define } from '@i18n-tiny/react'

export const { Provider, useMessages, useTranslations } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

```tsx
// Component
const messages = useMessages()
const t = useTranslations()
return <h1>{messages.common.title}</h1>  // ← 型安全！自動補完
return <p>{t('greeting', { name })}</p>  // ← 補間もサポート
```

## 次のステップ

- [インストール](./installation)
- [使い方](./usage)
- [APIリファレンス](./api-reference)
