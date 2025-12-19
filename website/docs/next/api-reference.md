---
sidebar_position: 4
---

# API Reference

## @i18n-tiny/next

### `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | Array of supported locales (e.g., `['en', 'ja'] as const`) |
| `defaultLocale` | `string` | Required | The default locale |
| `messages` | `Record<Locale, Messages>` | Required | Message objects keyed by locale |

#### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

##### `i18n.Provider`

A component that wraps your app to provide i18n context to Client Components.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | The current locale |
| `messages` | `Messages` | Required | Message dictionary for the current locale |
| `children` | `ReactNode` | Required | Child components |

**Example:**

```tsx
<Provider locale={locale} messages={messages}>
  <App />
</Provider>
```

##### `i18n.server.getMessages(locale)`

Returns the message object for the specified locale (for Server Components).

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | The locale to retrieve messages for |

**Returns:**
- `Messages`: The message object for the given locale.

**Example:**

```typescript
const messages = await getMessages('en')
console.log(messages.common.title)
```

##### `i18n.server.getTranslations(locale, namespace?)`

Returns a translation function `t` for the specified locale (for Server Components).

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | The locale to use for translations |
| `namespace` | `string` | | Optional namespace to scope the keys |

**Returns:**
- `t(key, vars?)`: The translation function.
    - `key`: The message key (type-safe with autocomplete).
    - `vars`: Interpolation variables (optional, required variables are typed).
    - Returns: `string` (The translated string).

**Example:**

```typescript
const t = await getTranslations('en')
const title = t('common.title')

const tNav = await getTranslations('en', 'nav')
const home = tNav('home') // Shortcut for 'nav.home'
```

##### `i18n.client.useMessages()`

A hook to retrieve the message object from the current context (for Client Components).

**Returns:**
- `Messages`: Message object for the current locale.

**Example:**

```tsx
const messages = useMessages()
return <h1>{messages.common.title}</h1>
```

##### `i18n.client.useTranslations(namespace?)`

A hook to retrieve the translation function `t` from the current context (for Client Components).

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `namespace` | `string` | | Optional namespace to scope the keys |

**Returns:**
- `t(key, vars?)`: The translation function.

**Example:**

```tsx
const t = useTranslations('common')
return <p>{t('welcome', { name: 'John' })}</p>
```

##### `i18n.client.useLocale()`

A hook to retrieve the current locale string (for Client Components).

**Returns:**
- `string`: The current locale.

**Example:**

```tsx
const locale = useLocale() // 'en' | 'ja'
```

##### `i18n.client.useLocales()`

A hook to retrieve the array of supported locales (for Client Components).

**Returns:**
- `readonly string[]`: The configured locales array.

**Example:**

```tsx
const locales = useLocales() // ['en', 'ja']
```

##### `i18n.client.useDefaultLocale()`

A hook to retrieve the default locale string (for Client Components).

**Returns:**
- `string`: The default locale.

**Example:**

```tsx
const defaultLocale = useDefaultLocale() // 'en'
```

##### `i18n.locales`

The configured `locales` array.

##### `i18n.defaultLocale`

The configured `defaultLocale` string.

### `DefineConfig` (type)

The type of the configuration object passed to `define()`. Can be imported directly from `@i18n-tiny/next`.

---

## @i18n-tiny/next/proxy

### `create(config)`

Creates a Next.js Proxy (Middleware) handler for i18n routing.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `locales` | `readonly string[]` | Required | - | Array of supported locales |
| `defaultLocale` | `string` | Required | - | Default locale for redirects |
| `fallbackLocale` | `string` | | `defaultLocale` | Fallback if detection fails |
| `prefixDefault` | `boolean` | | `false` | Whether to prefix the default locale in URLs |
| `detectLanguage` | `boolean` | | `true` | Whether to detect language from Accept-Language header |
| `routing` | `'rewrite'` | | - | SSR rewrite mode (mutually exclusive with prefixDefault/detectLanguage) |

**Returns:**
- `(request: NextRequest) => NextResponse | void`: Next.js middleware function.

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
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en'
})

// Always prefix all locales (including default)
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  prefixDefault: true
})

// SSR rewrite mode (locale in x-locale header)
export const proxy = create({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  routing: 'rewrite'
})
```

### `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header.
Can be imported directly from `@i18n-tiny/next/proxy`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `acceptLanguage` | `string` \| `null` | Required | Value of Accept-Language header |
| `supportedLocales` | `readonly string[]` | Required | Array of supported locales |

**Returns:**
- `string | null`: The matched locale, or `null` if no match is found.

**Example:**

```typescript
import { detectLocale } from '@i18n-tiny/next/proxy'

const locale = detectLocale(request.headers.get('accept-language'), ['en', 'ja'])
```

---

## @i18n-tiny/next/router

### `Link`

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

### `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

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

### `removeLocalePrefix(pathname, locales)`

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

### `hasLocalePrefix(pathname, locales)`

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

### `getLinkHref(href, currentPathname, currentLocale, options?)`

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
