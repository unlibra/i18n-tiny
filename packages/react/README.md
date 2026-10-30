# @i18n-tiny/react

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/react.svg)](https://www.npmjs.com/package/@i18n-tiny/react)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/react/introduction)

Type-safe i18n library for React in under 1KB, with automatic type inference and zero dependencies.

## Installation

```bash
npm install @i18n-tiny/react
```

Requires React 18 or 19, and Node.js 22.12 or later when it runs on Node.js (for example in server rendering or tests). The package ships ES modules only.

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

// satisfies checks that ja has the same keys as en
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

`locales` and `defaultLocale` are required, and `messages` must have the messages of each locale. `define()` throws when `defaultLocale` is not one of `locales`, when `locales` is empty, lists a locale twice or has a locale that is empty, `.`, `..` or contains `/`, `\`, `?`, `#` or whitespace, and when `messages` misses a locale or has one that is not in `locales`. With `as const` or an inline config, these are type errors too.

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
- `messages: Messages` - Message dictionary for current locale. `Messages` is the type of the first locale's messages; the other locales must have the same shape
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

## TypeScript

Full type inference is automatic:

```typescript
const t = useTranslations()

// Type error: 'invalid.key' doesn't exist
t('invalid.key')

// Type error: with a namespace, keys are relative to it
const tCommon = useTranslations('common')
tCommon('common.welcome')
```

Interpolation variables are not type-checked.

## License

MIT
