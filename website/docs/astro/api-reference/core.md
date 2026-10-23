---
description: "API reference for define() in @i18n-tiny/astro: options, return values and types for typed messages and translation functions in Astro."
---

# Core

Core i18n functionality.

## `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | | Array of supported locales (optional, inferred from messages) |
| `defaultLocale` | `string` | | Default locale (optional, defaults to the first locale) |
| `messages` | `Record<Locale, Messages>` | Required | Message objects keyed by locale |

Types are taken from `messages`, so keys are typed even when `locales` is left out, and `locales` needs no `as const`. A locale without messages falls back to the default locale at run time.

### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

#### `i18n.getMessages(locale)`

Returns the message object for the specified locale. If `locale` is `undefined` or has no messages, it falls back to `defaultLocale`.

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

#### `i18n.getTranslations(locale, namespace?)`

Returns a translation function `t` for the specified locale. If `locale` is `undefined` or has no messages, it falls back to `defaultLocale`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` \| `undefined` | Required | The locale to use for translations |
| `namespace` | `string` | | Optional namespace to scope the keys. Must point to a nested object (e.g., `'common'`), not to a string |

**Returns:**
- `t(key, vars?)`: The translation function.
    - `key`: The message key. With a namespace, the key is relative to it.
    - `vars`: Interpolation variables (optional), `Record<string, string | number>`. Variable names are not type-checked.
    - Returns: `string` (The translated string).

**Example:**

```typescript
const t = getTranslations('en', 'common')
t('title')        // reads 'common.title'
t('common.title') // Type error: with a namespace, use the relative key
```

#### `i18n.locales`

The configured (or inferred) `locales` array.

#### `i18n.defaultLocale`

The configured (or inferred) `defaultLocale` string.

## `DefineConfig<L, M>` (type)

A config type with two type arguments: `L` for the locale strings and `M` for the message type. Unlike the argument of `define()`, `locales` and `defaultLocale` are required in it.

```typescript
interface DefineConfig<L extends string, M extends Record<string, any>> {
  locales: readonly L[]
  defaultLocale: L
  messages: Record<L, M>
}
```

Can be imported directly from `@i18n-tiny/astro`.
