---
sidebar_position: 1
---

# はじめに

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**Astro**のための、依存関係なし、型安全、最小限の国際化ライブラリです。

SSGとSSRの両方で動作します。設定は単一の `define` 関数で完了し、`messages.common.title` のようなキーパスの完全な自動補完が可能です。

## 特徴

- **型安全**: 完全なTypeScriptサポートと**自動型推論** - `messages.site.name`、`t('common.title')`、およびすべてのネストされたキーの自動補完
- **依存関係ゼロ**: 外部i18nライブラリは不要
- **サーバーファースト**: ネイティブAstroサーバーサイドレンダリングサポート
- **最小限のSSG**: Astroの静的サイト生成とシームレスに連携
- **シンプルなAPI**: 単一の設定、最小限のボイラープレート
- **軽量**: 最小限のバンドルサイズ
- **柔軟性**: Astro組み込みのi18nまたはスタンドアロンミドルウェアと一緒に使用可能

## インストール

```bash
npm install @i18n-tiny/astro
```

## 使い方

```typescript
// i18n.ts - define() ですべてを生成
import { define } from '@i18n-tiny/astro'

export const { getMessages, getTranslations } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

```astro
---
const messages = getMessages(locale)
const t = getTranslations(locale)
---
<h1>{messages.common.title}</h1>  <!-- ← 型安全！自動補完 -->
<p>{t('greeting', { name })}</p>  <!-- ← 補間もサポート -->
```

## 次のステップ

- [インストール](./installation)
- [使い方](./usage)
- [APIリファレンス](./api-reference)
- [TIPS](./tips/ssg)
