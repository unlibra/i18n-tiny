---
sidebar_position: 1
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

### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

#### `i18n.getMessages(locale)`

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

#### `i18n.getTranslations(locale, namespace?)`

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

#### `i18n.locales`

The configured (or inferred) `locales` array.

#### `i18n.defaultLocale`

The configured (or inferred) `defaultLocale` string.

## `DefineConfig` (type)

The type of the configuration object passed to `define()`. Can be imported directly from `@i18n-tiny/astro`.
