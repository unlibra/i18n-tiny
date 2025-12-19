---
sidebar_position: 3
---

# Router

Router utilities for localized navigation.

## `Link`

A localized Link component that automatically detects the locale from the current URL.

**Props:**

| Prop | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `href` | `string` \| `UrlObject` | Required | - | Destination path |
| `locale` | `string` \| `false` | | - | Explicitly set locale. `false` or `''` disables localization (raw path). |
| `normalize` | `boolean` | | `false` | If true, removes existing locale prefix from `href` before processing. |
| Others | `NextLinkProps` | | - | Other props for Next.js `Link` component |

**Example:**

```typescript
import { Link } from '@i18n-tiny/next/router'

// Auto-localized (maintains current URL pattern)
<Link href="/about">About</Link>

// Explicit locale override
<Link href="/" locale="ja">日本語</Link>

// Raw path (no localization)
<Link href="/" locale="">English</Link>
<Link href="/" locale={false}>English</Link>

// Conditional locale
<Link href="/" locale={condition && 'ja'}>Conditional</Link>

// Path normalization (useful for language switchers)
const pathname = usePathname() // '/ja/about'
<Link href={pathname} locale="en" normalize>English</Link> // -> '/en/about'
```

## `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

Generates a localized path with a locale prefix.
Can be imported from `@i18n-tiny/next/router`.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `path` | `string` | Required | - | The path to localize |
| `locale` | `string` | Required | - | Target locale |
| `defaultLocale` | `string` | Required | - | Default locale |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale |

**Returns:**
- `string`: The localized path (e.g., `/ja/about`).

**Example:**

```typescript
import { getLocalizedPath } from '@i18n-tiny/next/router'

getLocalizedPath('/about', 'ja', 'en')        // '/ja/about'
getLocalizedPath('/about', 'en', 'en')        // '/about'
getLocalizedPath('/about', 'en', 'en', true)  // '/en/about'
```

## `removeLocalePrefix(pathname, locales)`

Removes the locale prefix from a pathname.
Can be imported from `@i18n-tiny/next/router`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | The pathname to process |
| `locales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `string`: Pathname without prefix (e.g., `/ja/about` → `/about`).

**Example:**

```typescript
import { removeLocalePrefix } from '@i18n-tiny/next/router'

removeLocalePrefix('/ja/about', ['en', 'ja'])  // '/about'
```

## `hasLocalePrefix(pathname, locales)`

Checks if a pathname contains a locale prefix.
Can be imported from `@i18n-tiny/next/router`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | The pathname to check |
| `locales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `boolean`: `true` if prefix exists, otherwise `false`.

**Example:**

```typescript
import { hasLocalePrefix } from '@i18n-tiny/next/router'

hasLocalePrefix('/ja/about', ['en', 'ja'])  // true
```

## `getLinkHref(href, currentPathname, currentLocale, options?)`

Utility to generate final URLs for links. Used internally by the `Link` component.
Can be imported from `@i18n-tiny/next/router`.

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
import { getLinkHref } from '@i18n-tiny/next/router'

const href = getLinkHref('/about', '/ja', 'ja', { locale: 'en' }) // '/en/about'
```
