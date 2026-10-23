---
description: "API reference for @i18n-tiny/react: define() options and the Provider, hooks and constants it returns, with their TypeScript types."
---

# API Reference

## `define(config)`

Creates an i18n instance with type-safe hooks.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | Array of supported locales |
| `defaultLocale` | `string` | Required | The default locale |
| `messages` | `Record<Locale, Messages>` | Required | Message objects keyed by locale |

`Messages` is the type of the messages of the first locale in `locales`. The messages of the other locales must have the same shape. `define()` itself does not check this: to catch missing keys, write the other locales with `satisfies`, for example `{ ... } satisfies typeof enMessages`.

#### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

##### `i18n.Provider`

A component that wraps your app to provide i18n context.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | The current locale |
| `messages` | `Messages` | Required | Message dictionary for the current locale |
| `children` | `ReactNode` | Required | Child components |

**Example:**

```tsx
import { Provider } from './i18n'
import enMessages from './messages/en'

<Provider locale="en" messages={enMessages}>
  <App />
</Provider>
```

##### `i18n.useMessages()`

A hook to retrieve the raw message object from the current context.

**Returns:**
- `Messages`: The message dictionary for the current locale.

**Example:**

```tsx
const messages = useMessages()
return <h1>{messages.common.title}</h1>
```

##### `i18n.useTranslations(namespace?)`

A hook to retrieve the translation function `t` from the current context.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `namespace` | `string` | | Optional namespace to scope the keys. It must point to a nested object in `Messages`, such as `'common'` |

**Returns:**
- `t(key, vars?)`: A translation function that supports interpolation.
    - `key`: The message key. Without a namespace, a full path such as `'common.welcome'`. With a namespace, a key relative to it, such as `'welcome'`.
    - `vars`: Interpolation variables, `Record<string, string | number>`. They are not type-checked.
    - Returns: `string`.

**Example:**

```tsx
const t = useTranslations('common')
return <p>{t('welcome', { name: 'John' })}</p> // reads common.welcome
```

With a namespace, a full path such as `t('common.welcome')` is a type error.

##### `i18n.useLocale()`

A hook to retrieve the current locale string.

**Returns:**
- `string`: The current locale.

**Example:**

```tsx
const locale = useLocale() // 'en' (typed as string)
```

##### `i18n.useLocales()`

A hook to retrieve the configured array of locales.

**Returns:**
- The `locales` array with its tuple type, such as `readonly ['en', 'ja']`.

**Example:**

```tsx
const locales = useLocales() // ['en', 'ja']
```

##### `i18n.useDefaultLocale()`

A hook to retrieve the configured default locale string.

**Returns:**
- One of `locales`, typed as their union, such as `'en' | 'ja'`.

**Example:**

```tsx
const defaultLocale = useDefaultLocale() // 'en'
```

##### `i18n.locales`

The configured `locales` array.

##### `i18n.defaultLocale`

The configured `defaultLocale` string.

---

### `DefineConfig` (type)

The type of the configuration object passed to `define()`. It takes two type arguments: the locale union and the message type. Can be imported directly from `@i18n-tiny/react`.

```typescript
import type { DefineConfig } from '@i18n-tiny/react'
import enMessages from './messages/en'

type Config = DefineConfig<'en' | 'ja', typeof enMessages>
```

---

## TypeScript

Type inference happens automatically based on your configuration:

```typescript
const { useTranslations } = i18n
const t = useTranslations()

// TypeScript Error: 'invalid.key' does not exist
t('invalid.key')

const tCommon = useTranslations('common')

// OK: reads common.welcome
tCommon('welcome', { name: 'John' })

// TypeScript Error: with a namespace, keys are relative to it
tCommon('common.welcome')
```

Interpolation variables are not type-checked.