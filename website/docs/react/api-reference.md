---
sidebar_position: 4
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

#### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

##### `i18n.Provider`

A component that wraps your app to provide i18n context.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `string` | Required | The current locale |
| `messages` | `MessageType` | Required | Message dictionary for the current locale |
| `children` | `ReactNode` | Required | Child components |

**Example:**

```tsx
<Provider locale="en" messages={messages.en}>
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
| `namespace` | `string` | | Optional namespace to scope the keys |

**Returns:**
- `t(key, vars?)`: A translation function that supports interpolation.
    - `key`: The message key.
    - `vars`: Interpolation variables.
    - Returns: `string`.

**Example:**

```tsx
const t = useTranslations('common')
return <p>{t('welcome', { name: 'John' })}</p>
```

##### `i18n.useLocale()`

A hook to retrieve the current locale string.

**Returns:**
- `string`: The current locale.

**Example:**

```tsx
const locale = useLocale() // 'en' | 'ja'
```

##### `i18n.useLocales()`

A hook to retrieve the configured array of locales.

**Returns:**
- `readonly string[]`: Supported locales array.

**Example:**

```tsx
const locales = useLocales() // ['en', 'ja']
```

##### `i18n.useDefaultLocale()`

A hook to retrieve the configured default locale string.

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

---

### `DefineConfig` (type)

The type of the configuration object passed to `define()`. Can be imported directly from `@i18n-tiny/react`.

### `I18nProvider` (alias for `Provider`)

An alias for the `Provider` component.

---

## TypeScript

Type inference happens automatically based on your configuration:

```typescript
const { useTranslations } = i18n
const t = useTranslations()

// TypeScript Error: 'invalid.key' does not exist
t('invalid.key')

// TypeScript Error: Missing required interpolation variable 'name'
t('common.welcome') // Error: { name: string } required
```