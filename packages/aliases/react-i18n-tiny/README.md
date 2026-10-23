# react-i18n-tiny

[![npm version](https://img.shields.io/npm/v/react-i18n-tiny.svg)](https://www.npmjs.com/package/react-i18n-tiny)
[![npm downloads](https://img.shields.io/npm/dm/react-i18n-tiny.svg)](https://www.npmjs.com/package/react-i18n-tiny)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/react/introduction)

Alternative package name for [`@i18n-tiny/react`](https://www.npmjs.com/package/@i18n-tiny/react).

> **Note**: This is an alias package. Both `react-i18n-tiny` and `@i18n-tiny/react` provide the exact same functionality.

## Installation

```bash
# Short name
npm install react-i18n-tiny

# Scoped name (recommended for monorepo consistency)
npm install @i18n-tiny/react
```

Use version 1.2.1 or later of `react-i18n-tiny`: earlier versions could not be imported.

## Documentation

See the full documentation at [docs.unlibra.com](https://docs.unlibra.com/i18n-tiny/react/introduction).

## Quick Start

```typescript
// i18n.ts
import { define } from 'react-i18n-tiny'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const messages = { en: enMessages, ja: jaMessages }

export const i18n = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages
})

// App.tsx
import { useState } from 'react'
import { i18n, messages } from './i18n'

function App() {
  const [locale, setLocale] = useState(i18n.defaultLocale)

  return (
    <i18n.Provider locale={locale} messages={messages[locale]}>
      <YourApp />
    </i18n.Provider>
  )
}

// Component.tsx
import { i18n } from './i18n'

function Component() {
  const messages = i18n.useMessages()
  const t = i18n.useTranslations()

  return <div>{messages.common.title}</div>
}
```

## Why Two Package Names?

- **`react-i18n-tiny`**: Shorter, easier to type
- **`@i18n-tiny/react`**: Scoped package, consistent with monorepo structure

Choose whichever you prefer - they're identical!

## License

MIT
