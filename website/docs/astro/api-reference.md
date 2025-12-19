---
sidebar_position: 4
---

# APIリファレンス

## @i18n-tiny/astro

### `define(config)`

自動型推論を備えたi18nインスタンスを定義します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | | サポートするロケールの配列（オプション、メッセージから推論されます） |
| `defaultLocale` | `string` | | デフォルトロケール（オプション、最初のロケールを使用） |
| `messages` | `Record<Locale, Messages>` | Required | ロケールをキーとしたメッセージオブジェクト |

#### 戻り値 (Properties of `i18n`)

`define` は、以下のプロパティを含むオブジェクト（例: `i18n`）を返します。

##### `i18n.getMessages(locale)`

指定されたロケールのメッセージオブジェクトを返します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locale` | `string` \| `undefined` | Required | 取得するメッセージのロケール |

**戻り値:**
- `Messages`: 該当するロケールのメッセージオブジェクト。

**例:**

```typescript
const messages = getMessages('ja')
console.log(messages.common.title)
```

##### `i18n.getTranslations(locale, namespace?)`

指定されたロケールの翻訳関数 `t` を返します。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `locale` | `string` \| `undefined` | Required | 翻訳に使用するロケール |
| `namespace` | `string` | | キーを絞り込むための名前空間（オプション） |

**戻り値:**
- `t(key, vars?)`: 翻訳関数。
    - `key`: メッセージキー。
    - `vars`: 補間用変数（オプション）。
    - 戻り値: `string`（翻訳された文字列）。

**例:**

```typescript
const t = getTranslations('ja', 'common')
const title = t('title')
```

##### `i18n.locales`

設定された（または推論された） `locales` 配列。

##### `i18n.defaultLocale`

設定された（または推論された） `defaultLocale` 文字列。

### `DefineConfig` (type)

`define()` に渡される設定オブジェクトの型。 `@i18n-tiny/astro` から直接インポートできます。

---

## @i18n-tiny/astro/middleware (SSRのみ)

### `create(config)`

i18nルーティング用のAstroミドルウェアハンドラを作成します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | サポートするロケールの配列 |
| `defaultLocale` | `string` | Required | - | リダイレクト用のデフォルトロケール |
| `fallbackLocale` | `string` | | `defaultLocale` | 検出に失敗した場合のフォールバック |
| `excludePaths` | `string[]` | | `[]` | i18n処理から除外するパス |
| `prefixDefault` | `boolean` | | `false` | デフォルトロケールのURLにプレフィックスを付けるかどうか |
| `detectLanguage` | `boolean` | | `true` | Accept-Languageから検出するかどうか |
| `routing` | `'rewrite'` | | - | SSRリライトモード（prefixDefault/detectLanguageとは排他） |

**戻り値:**
- `MiddlewareHandler`: Astroのミドルウェアハンドラ。

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
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en'
  })
)

// SSRリライトモード（Astro.locals内のロケール）
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    routing: 'rewrite'
  })
)
```

**SSRリライトモード:**

`routing: 'rewrite'` を使用する場合、ロケールは `Astro.locals.locale` に格納されます。

```astro
---
// src/pages/index.astro ([locale] フォルダは不要)
import { getMessages } from '../i18n'

const locale = Astro.locals.locale  // 'en' or 'ja'
const messages = getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

### `detectLocale(acceptLanguage, supportedLocales)`

Accept-Languageヘッダーから最も一致するロケールを検出します。
`@i18n-tiny/astro/middleware` から直接インポートできます。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `acceptLanguage` | `string` \| `null` | Required | Accept-Languageヘッダーの値 |
| `supportedLocales` | `readonly string[]` | Required | サポートされているロケールの配列 |

**戻り値:**
- `string | null`: 一致したロケール、または一致しない場合は `null`。

---

## @i18n-tiny/astro/integration (SSGのみ)

### `create(config)`

i18n静的ファイル生成用のAstroインテグレーションを作成します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | :---: | --- | --- |
| `defaultLocale` | `string` | Required | - | デフォルトロケール - このロケールのコンテンツがルートにコピーされます |

**戻り値:**
- `AstroIntegration`: Astroのインテグレーションオブジェクト。

**ビルド出力の例:**

```
dist/
├── index.html        ← /en/index.html からコピー
├── about/index.html  ← /en/about/index.html からコピー
├── en/
│   ├── index.html
│   └── about/index.html
└── ja/
    ├── index.html
    └── about/index.html
```

> **重要**: SSGモードではサーバーが存在しないため、ブラウザの言語設定に基づいた自動言語検出（リダイレクト等）は標準では機能しません。インテグレーションを使用してデフォルトロケールをルートにコピーした場合、`/` にアクセスすると常にそのデフォルトロケールが表示されます。

---

## @i18n-tiny/astro/router

### `Link`

現在のURLからロケールを自動検出するローカライズされたLinkコンポーネント。

**Props:**

| プロパティ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | :---: | --- | --- |
| `href` | `string` | Required | - | リンク先のパス |
| `locale` | `string` \| `false` | | - | ロケールを明示的に指定する場合に使用。`false` または `''` でローカライズを無効化（生のパス）。 |
| `normalize` | `boolean` | | `false` | `href` に既存のロケールプレフィックスが含まれている場合、それを削除してから処理します。 |
| その他 | `HTMLAttributes<'a'>` | | - | 標準のHTMLアンカータグの属性 |

**例:**

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
---

<!-- 自動ローカライズ（現在のURLパターンを維持） -->
<Link href="/about">About</Link>

<!-- ロケールの明示的な指定 -->
<Link href="/" locale="ja">日本語</Link>

<!-- 生のパス（ローカライズなし） -->
<Link href="/" locale="">English</Link>
<Link href="/" locale={false}>English</Link>

<!-- パスの正規化 -->
<Link href="/ja/about" locale="en" normalize>English</Link>
```

### `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

ロケールプレフィックス付きのローカライズされたパスを生成します。
`@i18n-tiny/astro/router` からインポートできます。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト値 | 説明 |
| --- | --- | :---: | --- | --- |
| `path` | `string` | Required | - | ローカライズするパス |
| `locale` | `string` | Required | - | ターゲットロケール |
| `defaultLocale` | `string` | Required | - | デフォルトロケール |
| `prefixDefault` | `boolean` | | `false` | デフォルトロケールにプレフィックスを付けるかどうか |

**戻り値:**
- `string`: ローカライズされたパス。

**例:**

```typescript
import { getLocalizedPath } from '@i18n-tiny/astro/router'

getLocalizedPath('/about', 'ja', 'en')        // '/ja/about'
```

### `removeLocalePrefix(pathname, locales)`

パス名からロケールプレフィックスを削除します。
`@i18n-tiny/astro/router` からインポートできます。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | 処理するパス名 |
| `locales` | `readonly string[]` | Required | サポートされているロケールの配列 |

**戻り値:**
- `string`: プレフィックスが削除されたパス名。

### `hasLocalePrefix(pathname, locales)`

パス名にロケールプレフィックスが含まれているかチェックします。
`@i18n-tiny/astro/router` からインポートできます。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | チェックするパス名 |
| `locales` | `readonly string[]` | Required | サポートされているロケールの配列 |

**戻り値:**
- `boolean`: プレフィックスが含まれていれば `true`。

### `getLinkHref(href, currentPathname, currentLocale, options?)`

リンク用のURLを生成するユーティリティ。
`@i18n-tiny/astro/router` からインポートできます。

**パラメータ:**

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | :---: | --- |
| `href` | `string` | Required | リンク先のパス |
| `currentPathname` | `string` | Required | 現在のパス名 |
| `currentLocale` | `string` \| `undefined` | Required | 現在のロケール |
| `options` | `GetLinkHrefOptions` | | ロケール指定や正規化用のオプション |

**戻り値:**
- `string`: 生成された最終的なURL。

**例:**

```typescript
import { getLinkHref } from '@i18n-tiny/astro/router'

const href = getLinkHref('/about', '/ja', 'ja', { locale: 'en' }) // '/en/about'
```
