---
description: "API reference for i18n-tiny router utilities in Astro: a localized Link component and helpers for locale-aware navigation."
---

# Router

Router utilities for localized navigation.

## `Link`

A localized Link component that automatically detects the locale from the current URL.

**Props:**

| Prop | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `href` | `string` | Required | - | Destination path |
| `locale` | `string` \| `false` | | - | Explicitly set locale. `false` or `''` disables localization (raw path). |
| `normalize` | `boolean` | | `false` | If true, removes existing locale prefix from `href` before processing. Reads the locales from `Astro.locals.locales`, which only the i18n-tiny [middleware](./middleware) sets. |
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

<!-- Path normalization (requires the i18n-tiny middleware) -->
<Link href="/ja/about" locale="en" normalize>English</Link>
```

"Maintains current URL pattern" means the link gets a locale prefix only when the current URL has one. With the SSG [integration](./integration), the root pages are copies of the `/[defaultLocale]/` pages, so their links still point to `/[defaultLocale]/...` (e.g., `/en/about`).

Without the middleware, `normalize` does nothing, because `Astro.locals.locales` is not set. Remove the prefix yourself instead:

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
import { removeLocalePrefix } from '@i18n-tiny/astro/router'
import { locales } from '../i18n'
---

{locales.map((loc) => (
  <Link href={removeLocalePrefix(Astro.url.pathname, locales)} locale={loc}>{loc}</Link>
))}
```

## `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

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

## `removeLocalePrefix(pathname, locales)`

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

## `hasLocalePrefix(pathname, locale)`

Checks if a pathname starts with the given locale prefix.
Can be imported from `@i18n-tiny/astro/router`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `pathname` | `string` | Required | The pathname to check |
| `locale` | `string` | Required | The locale to check for |

**Returns:**
- `boolean`: `true` if the pathname starts with `/[locale]/` or equals `/[locale]`.

**Example:**

```typescript
import { hasLocalePrefix } from '@i18n-tiny/astro/router'

hasLocalePrefix('/ja/about', 'ja')  // true
hasLocalePrefix('/about', 'ja')     // false
```
