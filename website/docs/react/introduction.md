---
description: "Add i18n to a React app with a Provider and hooks. i18n-tiny infers types from your messages, needs zero dependencies, and uses no global state."
---

# Type-Safe i18n for React with Hooks

A tiny, type-safe i18n library for **React** with automatic type inference and zero dependencies.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for message keys.
- **Zero dependencies**: No external i18n libraries needed.
- **Simple API**: Single configuration with `define()`, returning everything you need (Provider, hooks, constants).
- **Small**: Under 1KB minified and gzipped in the browser.
- **No global state**: The locale and messages live in React context. Call `define()` once per app.

## Installation

```bash
npm install @i18n-tiny/react
```

## Quick Start

### 1. Define i18n - that's all you need

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/react'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const messages = { en: enMessages, ja: jaMessages }

// define() gives you everything
export const { Provider, useMessages, useTranslations, useLocale } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages
})
```

### 2. Wrap with Provider

```tsx
// src/App.tsx
import { Provider, messages } from './i18n'

export default function App() {
  return (
    <Provider locale="en" messages={messages.en}>
      <YourApp />
    </Provider>
  )
}
```

### 3. Use in Components

```tsx
import { useMessages, useTranslations } from './i18n'

function Greeting() {
  const messages = useMessages()
  const t = useTranslations()

  return (
    <div>
      <h1>{messages.common.title}</h1> {/* ← Type-safe! Autocomplete */}
      <p>{t('common.welcome', { name: 'User' })}</p> {/* ← Interpolation supported */}
    </div>
  )
}
```

## Next Steps

- [Installation](./installation)
- [Usage](./usage)
- [API Reference](./api-reference)