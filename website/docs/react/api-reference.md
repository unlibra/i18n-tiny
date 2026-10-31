---
description: "API reference for @i18n-tiny/react: define() options and the Provider, hooks and constants it returns, with the types of the messages."
---

# API Reference

## `define(config)`

Creates an i18n instance with type-safe hooks.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | Supported locales. No `as const` needed |
| `defaultLocale` | one of `locales` | Required | The default locale |
| `messages` | `Record<Locale, Messages>` | Required | The messages of each locale. It must have exactly the locales of `locales` |

The config is invalid when `defaultLocale` is not one of `locales`, when `locales` is empty, lists a locale twice or has a locale that is empty, `.`, `..` or contains `/`, `\`, `?`, `#` or whitespace, and when `messages` misses a locale or has one that is not in `locales`. With `as const` or an inline config, these are type errors. `define()` does not check the config at run time, which keeps the check out of the browser bundle, so a config typed as `string[]` is not checked.

`Messages` is the type of the messages of `defaultLocale`: see [Messages](#messages).

To write the locales in one place, keep them in an object of their own and spread it:

```typescript
// src/i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const

// src/i18n.ts
export const i18n = define({ ...config, messages })
```

#### Return Value (Properties of `i18n`)

`define` returns an object (e.g., `i18n`) containing the following properties:

##### `i18n.Provider`

A component that wraps your app to provide the locale and its messages.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `Locale` | Required | The current locale, one of `locales`. Any other value is a type error and throws |
| `messages` | `LocaleMessages<Messages>` | Required | The messages of the current locale: the keys of the default locale's messages, with strings as values |
| `children` | `ReactNode` | Required | Child components |

**Example:**

```tsx
import { Provider, messages } from './i18n'

<Provider locale="en" messages={messages.en}>
  <App />
</Provider>
```

##### `i18n.useMessages()`

A hook to retrieve the messages of the current locale.

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
    - `vars`: The values of the `{name}` variables of the message. See [Messages](#messages) for their types.
    - Returns: `string`.

**Example:**

```tsx
const t = useTranslations('common')
return <p>{t('welcome', { name: 'John' })}</p> // reads common.welcome
```

With a namespace, a full path such as `t('common.welcome')` is a type error.

##### `i18n.useLocale()`

A hook to retrieve the current locale, typed as one of `locales`.

```tsx
const locale = useLocale() // 'en' (typed as 'en' | 'ja')
```

##### `i18n.useLocales()`

A hook to retrieve the `locales` array, with its tuple type, such as `readonly ['en', 'ja']`.

##### `i18n.useDefaultLocale()`

A hook to retrieve the default locale, typed as one of `locales`.

##### `i18n.isLocale(value)`

Whether a value is one of `locales`, as a type guard. Use it to narrow a value such as a URL parameter or a saved setting:

```tsx
const saved = localStorage.getItem('locale')
const [locale, setLocale] = useState(isLocale(saved) ? saved : defaultLocale)
```

##### `i18n.locales`, `i18n.defaultLocale`

The configured `locales` and `defaultLocale`.

---

## Messages

### Variables and braces

`{name}` in a message is replaced with the value of `name` in the vars, a string or a number. A name has letters, digits and `_`. To show a brace, write it twice:

```typescript
export default {
  welcome: 'Welcome, {name}!',         // t('welcome', { name: 'Ann' }) → 'Welcome, Ann!'
  syntax: 'Write {{name}} in messages' // t('syntax') → 'Write {name} in messages'
}
```

Two braces around a name are not a variable, as they are in some other libraries such as i18next: they show the name in one pair of braces. A variable without a value is left as it is, and a missing key returns the key itself, with a warning in development.

### Types of the messages

The keys are typed from the messages of `defaultLocale`, and the messages of every other locale must have the same keys: a missing or extra key is a type error in `define()`, with the reason at the end of the error.

```typescript
const t = useTranslations()

// Type error: 'invalid.key' doesn't exist
t('invalid.key')

// Type error: with a namespace, keys are relative to it
const tCommon = useTranslations('common')
tCommon('common.welcome')
```

With the messages of the default locale written `as const`, the vars of `t()` are typed from each message. A missing, misspelled or extra variable, and vars left out, are type errors, and a message without variables takes no vars:

```typescript
// src/messages/en.ts
export default {
  common: { welcome: 'Welcome, {name}!' }
} as const
```

```typescript
const t = useTranslations()
t('common.welcome', { name: 'Ann' }) // OK
t('common.welcome')                  // Type error: vars is missing
t('common.welcome', { nmae: 'Ann' }) // Type error: name is missing
```

To get these errors, and autocomplete, in the files of the other locales, type their messages with `LocaleMessages`, the keys of the default locale with strings as values:

```typescript
// src/messages/ja.ts
import type { LocaleMessages } from '@i18n-tiny/react'
import type en from './en'

const ja: LocaleMessages<typeof en> = {
  common: { welcome: 'ようこそ、{name}さん！' }
}

export default ja
```

- Without `as const`, a message is typed as `string`, and its vars are `Record<string, string | number>`, not checked.
- With a `defaultLocale` typed as the union of the locales, such as `'en' | 'ja'`, the vars come from the messages of every locale, and a message typed as `string` in any of them takes any vars, not checked. Write `defaultLocale` as a literal, such as `'en'`.
- For a key typed as a union, such as `t(isNew ? 'welcome' : 'goodbye', vars)`, the vars need the variables of every key.
- An extra variable is a type error only in an object literal in the call, as TypeScript checks extra properties only there.
- The variables of the other locales are not compared with those of the default locale: a translation without `{name}` is not an error.

---

## Types

### `I18nConfig`

The type of the locale settings `{ locales, defaultLocale }`. Check the config with `satisfies`, so that `as const` keeps its literal types:

```typescript
import type { I18nConfig } from '@i18n-tiny/react'

export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const satisfies I18nConfig
```

### `LocaleMessages<T>`

The messages of a locale: the keys of `T`, with strings as values. See [Types of the messages](#types-of-the-messages).

### `ProviderProps`

The props of the internal provider, with `locales` and `defaultLocale`. For the props of the `Provider` that `define()` returns, use `ComponentProps<typeof i18n.Provider>`.
