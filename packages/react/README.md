# @i18n-tiny/react

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/react/introduction)

Type-safe i18n library for React in under 2KB, with automatic type inference and zero dependencies.

## Installation

```bash
npm install @i18n-tiny/react
```

Requires React 18 or 19, and Node.js 22.12 or later when it runs on Node.js (for example in server rendering or tests). The package ships ES modules only. The types need TypeScript 5.9 or later.

## Quick Start

### 1. Define i18n - that's all you need

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/react'

const enMessages = {
  common: {
    title: 'Hello',
    welcome: 'Welcome, {name}!'
  }
}

type Messages = typeof enMessages

// satisfies checks the keys in this file too: define() checks that each
// locale has the keys of the default locale
const jaMessages = {
  common: {
    title: 'こんにちは',
    welcome: 'ようこそ、{name}さん！'
  }
} satisfies Messages

export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const messages = { en: enMessages, ja: jaMessages }

// define() gives you everything
export const { Provider, useMessages, useTranslations, useLocale, isLocale } = define({
  locales,
  defaultLocale,
  messages
})
```

### 2. Wrap with Provider

```tsx
// src/App.tsx
import { useState } from 'react'
import { defaultLocale, messages, Provider } from './i18n'

export default function App() {
  const [locale, setLocale] = useState(defaultLocale)

  return (
    <Provider locale={locale} messages={messages[locale]}>
      <YourApp />
      <button onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')}>
        Toggle Language
      </button>
    </Provider>
  )
}
```

### 3. Use in Components

```tsx
// src/components/Greeting.tsx
import { useMessages, useTranslations, useLocale } from '../i18n'

export function Greeting() {
  const messages = useMessages()
  const t = useTranslations()
  const locale = useLocale()

  return (
    <div>
      <h1>{messages.common.title}</h1>
      <p>{t('common.welcome', { name: 'User' })}</p>
      <p>Current locale: {locale}</p>
    </div>
  )
}
```

## Messages

### Variables and braces

`{name}` in a message is replaced with the value of `name` in the vars, a string or a number. A name has letters, digits and `_`. To show a brace, write it twice: `{{` shows `{` and `}}` shows `}`.

```typescript
export default {
  welcome: 'Welcome, {name}!',         // t('welcome', { name: 'Ann' }) → 'Welcome, Ann!'
  syntax: 'Write {{name}} in messages' // t('syntax') → 'Write {name} in messages'
}
```

`{{name}}` is not a variable, as it is in some other libraries such as i18next: it shows `{name}`. A variable without a value is left as it is, and a missing key returns the key itself, with a warning in development.

### Types of the messages

Full type inference is automatic:

```typescript
const t = useTranslations()

// Type error: 'invalid.key' doesn't exist
t('invalid.key')

// Type error: with a namespace, keys are relative to it
const tCommon = useTranslations('common')
tCommon('common.welcome')
```

The keys are typed from the messages of `defaultLocale`, and the messages of every other locale must have the same keys: a missing or extra key is a type error in `define()`, with the reason at the end of the error.

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

## API Reference

### `define(config)`

Creates an i18n instance with type-safe hooks.

```typescript
const { Provider, useMessages, useTranslations, useLocale } = define({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  messages: { en: {...}, ja: {...} }
})
```

`locales` and `defaultLocale` are required, and `messages` must have the messages of each locale. The config is invalid when `defaultLocale` is not one of `locales`, when `locales` is empty, lists a locale twice or has a locale that is empty, `.`, `..` or contains `/`, `\`, `?`, `#` or whitespace, and when `messages` misses a locale or has one that is not in `locales`. With `as const` or an inline config, these are type errors. `define()` does not check the config at run time, which keeps the check out of the browser bundle, so a config typed as `string[]` is not checked.

To write the locales in one place, keep them in an object of their own and spread it:

```typescript
// src/i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const

// src/i18n.ts
export const i18n = define({ ...config, messages })
```

Returns:

- `Provider` - React context provider component
- `useMessages()` - Hook to access raw message object
- `useTranslations(namespace?)` - Hook to get translation function
- `useLocale()` - Hook to get current locale, typed as one of `locales`
- `useLocales()` - Hook to get the `locales` array, with its tuple type
- `useDefaultLocale()` - Hook to get the default locale, typed as one of `locales`
- `isLocale(value)` - Whether a value is one of `locales`
- `locales` - Array of supported locales
- `defaultLocale` - Default locale

### `Provider`

Wraps your app to provide i18n context.

```tsx
<Provider locale="en" messages={messages.en}>
  {children}
</Provider>
```

Props:

- `locale` - Current locale, one of `locales`. Any other value is a type error and throws
- `messages` - Message dictionary for current locale, typed as `LocaleMessages<Messages>`: the keys of the default locale's messages (`Messages`), with strings as values
- `children: ReactNode` - Child components

### `isLocale(value)`

Narrows a value, such as a URL parameter or a saved setting, to one of `locales`:

```tsx
const saved = localStorage.getItem('locale')
const [locale, setLocale] = useState(isLocale(saved) ? saved : defaultLocale)
```

### `useMessages()`

Returns the raw message object with full type inference.

```tsx
const messages = useMessages()
// messages.common.title is typed as string
```

### `useTranslations(namespace?)`

Returns a translation function with interpolation support.

```tsx
const t = useTranslations()
t('common.welcome', { name: 'John' }) // "Welcome, John!"

// With namespace: keys are relative to it
const tCommon = useTranslations('common')
tCommon('welcome', { name: 'John' }) // "Welcome, John!"
```

The namespace must point to a nested object, such as `common`. With a namespace, a full path such as `tCommon('common.welcome')` is a type error.

### `useLocale()`

Returns the current locale.

```tsx
const locale = useLocale() // "en" (typed as 'en' | 'ja')
```

## License

MIT
