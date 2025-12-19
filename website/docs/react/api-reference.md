---
sidebar_position: 4
---

# APIリファレンス

## `define(config)`

型安全なフックを備えたi18nインスタンスを作成します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | サポートするロケールの配列 |
| `defaultLocale` | `string` | Required | デフォルトロケール |
| `messages` | `Record<Locale, Messages>` | Required | ロケールをキーとしたメッセージオブジェクト |

#### 戻り値 (Properties of `i18n`)

`define` は、以下のプロパティを含むオブジェクト（例: `i18n`）を返します。

##### `i18n.Provider`

アプリをラップしてi18nコンテキストを提供します。

**Props:**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | 現在のロケール |
| `messages` | `MessageType` | Required | 現在のロケールのメッセージ辞書 |
| `children` | `ReactNode` | Required | 子コンポーネント |

##### `i18n.useMessages()`

現在のコンテキストから生のメッセージオブジェクトを取得します。

##### `i18n.useTranslations(namespace?)`

現在のコンテキストから翻訳関数 `t` を取得します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `namespace` | `string` | | キーを絞り込むための名前空間（オプション） |

##### `i18n.useLocale()`

現在のコンテキストからロケール文字列を取得します。

##### `i18n.useLocales()`

設定された `locales` 配列を取得します。

##### `i18n.useDefaultLocale()`

設定された `defaultLocale` 文字列を取得します。

##### `i18n.locales`

設定された `locales` 配列。

##### `i18n.defaultLocale`

設定された `defaultLocale` 文字列。

### `DefineConfig` (type)

`define()` に渡される設定オブジェクトの型。

## `I18nProvider` (alias for `Provider`)

`Provider` コンポーネントの別名。

## TypeScript

完全な型推論が自動的に行われます:

```typescript
const { useTranslations } = i18n
const t = useTranslations()

// 型エラー: 'invalid.key' は存在しません
t('invalid.key')

// 型エラー: 必要な変数が不足しています
t('common.welcome') // エラー: { name: string } が必要です
```