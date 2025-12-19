---
sidebar_position: 4
---

# APIリファレンス

## @i18n-tiny/next

### `define(config)`

自動型推論を備えたi18nインスタンスを定義します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | サポートするロケールの配列 (例: `['en', 'ja'] as const`) |
| `defaultLocale` | `string` | Required | デフォルトのロケール |
| `messages` | `Record<Locale, Messages>` | Required | ロケールをキーとしたメッセージオブジェクト |

#### 戻り値 (Properties of `i18n`)

`define` は、以下のプロパティを含むオブジェクト（例: `i18n`）を返します。

##### `i18n.Provider`

アプリをラップしてクライアントコンポーネントにi18nコンテキストを提供するコンポーネント。

**Props:**

| プロパティ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | 現在のロケール |
| `messages` | `Messages` | Required | 現在のロケールのメッセージ辞書 |
| `children` | `ReactNode` | Required | 子コンポーネント |

##### `i18n.server.getMessages(locale)`

指定されたロケールのメッセージオブジェクトを返します（サーバーコンポーネント用）。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | 取得するメッセージのロケール |

##### `i18n.server.getTranslations(locale, namespace?)`

指定されたロケールの翻訳関数 `t` を返します（サーバーコンポーネント用）。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | 翻訳に使用するロケール |
| `namespace` | `string` | | キーを絞り込むための名前空間（オプション） |

##### `i18n.client.useMessages()`

現在のコンテキストからメッセージオブジェクトを取得するフック（クライアントコンポーネント用）。

##### `i18n.client.useTranslations(namespace?)`

現在のコンテキストから翻訳関数 `t` を取得するフック（クライアントコンポーネント用）。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `namespace` | `string` | | キーを絞り込むための名前空間（オプション） |

##### `i18n.client.useLocale()`

現在のコンテキストからロケール文字列を取得するフック（クライアントコンポーネント用）。

##### `i18n.client.useLocales()`

サポートされているロケールの配列を取得するフック（クライアントコンポーネント用）。

##### `i18n.client.useDefaultLocale()`

デフォルトのロケール文字列を取得するフック（クライアントコンポーネント用）。

##### `i18n.locales`

設定された `locales` 配列。

##### `i18n.defaultLocale`

設定された `defaultLocale` 文字列。

### `DefineConfig` (type)

`define()` に渡される設定オブジェクトの型。

## @i18n-tiny/next/proxy

### `create(config)`

i18nルーティング用のNext.jsプロキシ（ミドルウェア）ハンドラを作成します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | サポートするロケールの配列 |
| `defaultLocale` | `string` | Required | - | リダイレクト用のデフォルトロケール |
| `fallbackLocale` | `string` | | `defaultLocale` | 検出に失敗した場合のフォールバック |
| `prefixDefault` | `boolean` | | `false` | デフォルトロケールのURLにプレフィックスを付けるかどうか |
| `detectLanguage` | `boolean` | | `true` | Accept-Languageから検出するかどうか |
| `routing` | `'rewrite'` | | - | SSRリライトモード（prefixDefault/detectLanguageとは排他） |

**ルーティング動作マトリックス:**

| prefixDefault | detectLanguage | `/` の動作 |
| --- | --- | --- |
| `false` | `false` | fallbackLocaleを提供、検出なし |
| `false` | `true` | 検出、非デフォルトをリダイレクト、デフォルトをリライト |
| `true` | `false` | `/[defaultLocale]` にリダイレクト |
| `true` | `true` | 検出して、検出されたロケールにリダイレクト |

**例:**

```typescript
// デフォルト: 言語検出、非デフォルトをリダイレクト、デフォルトをリライト
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en'
})

// 常にすべてのロケール（デフォルトを含む）にプレフィックスを付ける
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  prefixDefault: true
})

// SSRリライトモード（x-localeヘッダー内のロケール）
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  routing: 'rewrite'
})
```

### `detectLocale(acceptLanguage, supportedLocales)`

Accept-Languageヘッダーから最も一致するロケールを検出します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `acceptLanguage` | `string` \| `null` | Required | Accept-Languageヘッダーの値 |
| `supportedLocales` | `readonly string[]` | Required | サポートされているロケールの配列 |

## @i18n-tiny/next/router

### `Link`

現在のURLからロケールを自動検出するローカライズされたLinkコンポーネント。

**Props:**

| プロパティ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | :---: | --- | --- |
| `href` | `string` \| `UrlObject` | Required | - | リンク先のパス |
| `locale` | `string` \| `false` | | - | ロケールを明示的に指定する場合に使用。`false` または `''` でローカライズを無効化（生のパス）。 |
| `normalize` | `boolean` | | `false` | `href` に既存のロケールプレフィックスが含まれている場合、それを削除してから処理します。 |
| その他 | `NextLinkProps` | | - | Next.jsの `Link` コンポーネントのその他のProps |

### `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

ロケールプレフィックス付きのローカライズされたパスを生成します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | :---: | --- | --- |
| `path` | `string` | Required | - | ローカライズするパス |
| `locale` | `string` | Required | - | ターゲットロケール |
| `defaultLocale` | `string` | Required | - | デフォルトロケール |
| `prefixDefault` | `boolean` | | `false` | デフォルトロケールにプレフィックスを付けるかどうか |

### `removeLocalePrefix(pathname, locales)`

パス名からロケールプレフィックスを削除します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | 処理するパス名 |
| `locales` | `readonly string[]` | Required | サポートされているロケールの配列 |

### `hasLocalePrefix(pathname, locales)`

パス名にロケールプレフィックスが含まれているかチェックします。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | チェックするパス名 |
| `locales` | `readonly string[]` | Required | サポートされているロケールの配列 |

### `getLinkHref(href, currentPathname, currentLocale, options?)`

リンク用のURLを生成するユーティリティ。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `href` | `string` | Required | リンク先のパス |
| `currentPathname` | `string` | Required | 現在のパス名 |
| `currentLocale` | `string` \| `undefined` | Required | 現在のロケール |
| `options` | `GetLinkHrefOptions` | | ロケール指定や正規化用のオプション |
