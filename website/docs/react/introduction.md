---
description: "i18n-tiny for React: a tiny, type-safe, zero-dependency i18n library with a Provider and hooks, automatic type inference and no global state."
---

# Introduction

A tiny, type-safe i18n library for **React** with automatic type inference and zero dependencies.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for message keys and interpolation variables.
- **Zero dependencies**: No external i18n libraries needed.
- **Simple API**: Single configuration with `define()`, returning everything you need (Provider, hooks, constants).
- **Small**: Minimal bundle size.
- **No global state**: Pure function factory pattern.

## Installation

```bash
npm install @i18n-tiny/react
```

## Quick Start

### 1. Define i18n - that's all you need

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/react'

// define() gives you everything
export const { Provider, useMessages, useTranslations, useLocale } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

### 2. Wrap with Provider

```tsx
// src/App.tsx
import { Provider } from './i18n'

function App() {
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