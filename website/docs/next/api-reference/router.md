---
description: "API reference for i18n-tiny router utilities in Next.js: a localized Link component and helpers for locale-aware navigation."
---

# Router

Router utilities for localized navigation.

## `Link`

A localized wrapper around the Next.js `Link` component. It takes the current locale from the `Provider` (`useLocale()`), so use it inside the `Provider`. The current URL only decides whether to add a locale prefix: on a prefixed URL such as `/ja/page`, `href="/about"` becomes `/ja/about`; on a URL without a prefix, it stays `/about`.

**Props:**

| Prop | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `href` | `string` \| `UrlObject` | Required | - | Destination path |
| `locale` | `string` \| `false` | | - | Explicitly set locale. `false` or `''` disables localization (raw path). |
| `normalize` | `boolean` | | `false` | If true, removes existing locale prefix from `href` before processing. |
| Others | `NextLinkProps` | | - | Other props for Next.js `Link` component |

**Example:**

```tsx
import { usePathname } from 'next/navigation'
import { Link } from '@i18n-tiny/next/router'

// Auto-localized (current locale, current URL pattern)
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

## `hasLocalePrefix(pathname, locale)`

Checks if a pathname starts with the given locale prefix.
Can be imported from `@i18n-tiny/next/router`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | The pathname to check |
| `locale` | `string` | Required | The locale to check for |

**Returns:**
- `boolean`: `true` if the pathname is `/[locale]` or starts with `/[locale]/`, otherwise `false`.

**Example:**

```typescript
import { hasLocalePrefix } from '@i18n-tiny/next/router'

hasLocalePrefix('/ja/about', 'ja')  // true
hasLocalePrefix('/about', 'ja')     // false
```
