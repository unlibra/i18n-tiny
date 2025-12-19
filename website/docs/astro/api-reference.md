---
sidebar_position: 4
---

# API Reference

## @i18n-tiny/astro

### `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | | Array of supported locales (optional, inferred from messages) |
| `defaultLocale` | `string` | | Default locale (optional, defaults to the first locale) |
| `messages` | `Record<Locale, Messages>` | Required | Message objects keyed by locale |

#### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

##### `i18n.getMessages(locale)`

Returns the message object for the specified locale.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` \| `undefined` | Required | The locale to retrieve messages for |

**Returns:**
- `Messages`: The message object for the given locale.

**Example:**

```typescript
const messages = getMessages('en')
console.log(messages.common.title)
```

##### `i18n.getTranslations(locale, namespace?)`

Returns a translation function `t` for the specified locale.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` \| `undefined` | Required | The locale to use for translations |
| `namespace` | `string` | | Optional namespace to scope the keys |

**Returns:**
- `t(key, vars?)`: The translation function.
    - `key`: The message key.
    - `vars`: Interpolation variables (optional).
    - Returns: `string` (The translated string).

**Example:**

```typescript
const t = getTranslations('en', 'common')
const title = t('title')
```

##### `i18n.locales`

The configured (or inferred) `locales` array.

##### `i18n.defaultLocale`

The configured (or inferred) `defaultLocale` string.

### `DefineConfig` (type)

The type of the configuration object passed to `define()`. Can be imported directly from `@i18n-tiny/astro`.

---

## @i18n-tiny/astro/middleware (SSR Only)

### `create(config)`

Creates an Astro Middleware handler for i18n routing.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Array of supported locales |
| `defaultLocale` | `string` | Required | - | Default locale for redirects |
| `fallbackLocale` | `string` | | `defaultLocale` | Fallback if detection fails |
| `excludePaths` | `string[]` | | `[]` | Paths to exclude from i18n processing |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale in URLs |
| `detectLanguage` | `boolean` | | `true` | Whether to detect language from Accept-Language header |
| `routing` | `'rewrite'` | | - | SSR rewrite mode (mutually exclusive with prefixDefault/detectLanguage) |

**Returns:**
- `MiddlewareHandler`: Astro middleware handler.

**Routing Behavior Matrix:**

| prefixDefault | detectLanguage | Behavior at `/` |
| --- | --- | --- |
| `false` | `false` | Serves fallbackLocale, no detection |
| `false` | `true` | Detects, redirects non-default, rewrites default |
| `true` | `false` | Redirects to `/[defaultLocale]` |
| `true` | `true` | Detects and redirects to detected locale |

**Example:**

```typescript
// Default: Language detection, non-default redirects, default rewrites
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en'
  })
)

// SSR rewrite mode (locale in Astro.locals)
export const onRequest = defineMiddleware(
  create({
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    routing: 'rewrite'
  })
)
```

**SSR Rewrite Mode:**

When using `routing: 'rewrite'`, the locale is stored in `Astro.locals.locale`.

```astro
---
// src/pages/index.astro (No [locale] folder needed)
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

Detects the best matching locale from the Accept-Language header.
Can be imported directly from `@i18n-tiny/astro/middleware`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `acceptLanguage` | `string` \| `null` | Required | Value of Accept-Language header |
| `supportedLocales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `string | null`: The matched locale, or `null` if no match is found.

---

## @i18n-tiny/astro/integration (SSG Only)

### `create(config)`

Creates an Astro Integration for i18n static file generation.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `defaultLocale` | `string` | Required | - | Default locale - content from this locale is copied to root |

**Returns:**
- `AstroIntegration`: Astro integration object.

**Build Output Example:**

```
dist/
├── index.html        ← Copied from /en/index.html
├── about/index.html  ← Copied from /en/about/index.html
├── en/
│   ├── index.html
│   └── about/index.html
└── ja/
    ├── index.html
    └── about/index.html
```

> **Important**: In SSG mode, since there is no server, automatic language detection (redirects based on browser settings) does not work by default. If you use the Integration to copy the default locale to the root, accessing `/` will always display that default locale.

---

## @i18n-tiny/astro/router

### `Link`

A localized Link component that automatically detects the locale from the current URL.

**Props:**

| Prop | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `href` | `string` | Required | - | Destination path |
| `locale` | `string` \| `false` | | - | Explicitly set locale. `false` or `''` disables localization (raw path). |
| `normalize` | `boolean` | | `false` | If true, removes existing locale prefix from `href` before processing. |
| Others | `HTMLAttributes<'a'>` | | - | Attributes for standard HTML anchor tag |

**Example:**

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
---

<!-- Auto-localized (maintains current URL pattern) -->
<Link href="/about">About</Link>

<!-- Explicit locale override -->
<Link href="/" locale="ja">日本語</Link>

<!-- Raw path (no localization) -->
<Link href="/" locale="">English</Link>
<Link href="/" locale={false}>English</Link>

<!-- Path normalization -->
<Link href="/ja/about" locale="en" normalize>English</Link>
```

### `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

Generates a localized path with a locale prefix.
Can be imported from `@i18n-tiny/astro/router`.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `path` | `string` | Required | - | The path to localize |
| `locale` | `string` | Required | - | Target locale |
| `defaultLocale` | `string` | Required | - | Default locale |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale |

**Returns:**
- `string`: The localized path.

**Example:**

```typescript
import { getLocalizedPath } from '@i18n-tiny/astro/router'

getLocalizedPath('/about', 'ja', 'en')        // '/ja/about'
```

### `removeLocalePrefix(pathname, locales)`

Removes the locale prefix from a pathname.
Can be imported from `@i18n-tiny/astro/router`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | The pathname to process |
| `locales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `string`: Pathname without prefix.

**Example:**

```typescript
import { removeLocalePrefix } from '@i18n-tiny/astro/router'

removeLocalePrefix('/ja/about', ['en', 'ja'])  // '/about'
```

### `hasLocalePrefix(pathname, locales)`

Checks if a pathname contains a locale prefix.
Can be imported from `@i18n-tiny/astro/router`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | The pathname to check |
| `locales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `boolean`: `true` if prefix exists.

**Example:**

```typescript
import { hasLocalePrefix } from '@i18n-tiny/astro/router'

hasLocalePrefix('/ja/about', ['en', 'ja'])  // true
```

### `getLinkHref(href, currentPathname, currentLocale, options?)`

Utility to generate final URLs for links.
Can be imported from `@i18n-tiny/astro/router`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `href` | `string` | Required | Destination path |
| `currentPathname` | `string` | Required | Current pathname |
| `currentLocale` | `string` \| `undefined` | Required | Current locale |
| `options` | `GetLinkHrefOptions` | | Options for explicit locale or normalization |

**Returns:**
- `string`: The final generated URL.

**Example:**

```typescript
import { getLinkHref } from '@i18n-tiny/astro/router'

const href = getLinkHref('/about', '/ja', 'ja', { locale: 'en' }) // '/en/about'
```