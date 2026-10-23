---
description: "API reference for define() in @i18n-tiny/next: options, return values and types for typed messages and translation functions in Next.js."
---

# Core

Core i18n functionality.

## `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | Array of supported locales (e.g., `['en', 'ja'] as const`) |
| `defaultLocale` | `string` | Required | The default locale |
| `messages` | `Record<Locale, Messages>` | Required | Message objects keyed by locale |

### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

#### `i18n.Provider`

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

### Server-side APIs

#### `i18n.server.getMessages(locale)`

Returns the message object for the specified locale (for Server Components).

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | The locale to retrieve messages for |

**Returns:**
- `Promise<Messages>`: A promise of the message object for the given locale.

**Example:**

```typescript
const messages = await getMessages('en')
console.log(messages.common.title)
```

#### `i18n.server.getTranslations(locale, namespace?)`

Returns a translation function `t` for the specified locale (for Server Components).

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | The locale to use for translations |
| `namespace` | `string` | | Optional path to a nested object in the messages, such as `'nav'` (type-checked). Keys are then relative to it. |

**Returns:**
- `Promise<t>`: A promise of the translation function `t(key, vars?)`.
    - `key`: The message key (type-safe with autocomplete). With a namespace, the key is relative to it.
    - `vars`: Interpolation variables for `{name}` placeholders (optional). The type is `Record<string, string | number>`; variable names are not type-checked.
    - Returns: `string` (The translated string).

**Example:**

```typescript
const t = await getTranslations('en')
const title = t('common.title')

const tNav = await getTranslations('en', 'nav')
const home = tNav('home') // Resolves 'nav.home'
tNav('nav.home')          // Type error: keys are relative to the namespace
```

### Client-side APIs

#### `i18n.client.useMessages()`

A hook to retrieve the message object from the current context (for Client Components).

**Returns:**
- `Messages`: Message object for the current locale.

**Example:**

```tsx
const messages = useMessages()
return <h1>{messages.common.title}</h1>
```

#### `i18n.client.useTranslations(namespace?)`

A hook to retrieve the translation function `t` from the current context (for Client Components).

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `namespace` | `string` | | Optional path to a nested object in the messages, such as `'common'` (type-checked). Keys are then relative to it. |

**Returns:**
- `t(key, vars?)`: The translation function, the same as the one from `getTranslations`.

**Example:**

```tsx
const t = useTranslations('common')
return <p>{t('welcome', { name: 'John' })}</p> // Resolves 'common.welcome'
```

#### `i18n.client.useLocale()`

A hook to retrieve the current locale string (for Client Components).

**Returns:**
- `string`: The current locale.

**Example:**

```tsx
const locale = useLocale() // 'en' | 'ja'
```

#### `i18n.client.useLocales()`

A hook to retrieve the array of supported locales (for Client Components).

**Returns:**
- `readonly string[]`: The configured locales array.

**Example:**

```tsx
const locales = useLocales() // ['en', 'ja']
```

#### `i18n.client.useDefaultLocale()`

A hook to retrieve the default locale string (for Client Components).

**Returns:**
- `string`: The default locale.

**Example:**

```tsx
const defaultLocale = useDefaultLocale() // 'en'
```

### Properties

#### `i18n.locales`

The configured `locales` array.

#### `i18n.defaultLocale`

The configured `defaultLocale` string.

## `DefineConfig` (type)

The type of the configuration object passed to `define()`. Can be imported directly from `@i18n-tiny/next`.
