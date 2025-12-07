# react-i18n-tiny

[![npm version](https://img.shields.io/npm/v/react-i18n-tiny.svg)](https://www.npmjs.com/package/react-i18n-tiny)
[![npm downloads](https://img.shields.io/npm/dm/react-i18n-tiny.svg)](https://www.npmjs.com/package/react-i18n-tiny)

Alternative package name for [`@i18n-tiny/react`](https://www.npmjs.com/package/@i18n-tiny/react).

> **Note**: This is an alias package. Both `react-i18n-tiny` and `@i18n-tiny/react` provide the exact same functionality.

## Installation

```bash
# Short name
npm install react-i18n-tiny

# Scoped name (recommended for monorepo consistency)
npm install @i18n-tiny/react
```

## Documentation

See the full documentation at [@i18n-tiny/react](https://github.com/unlibra/i18n-tiny/tree/main/packages/react).

## Quick Start

```typescript
// i18n.ts
import { define } from 'react-i18n-tiny'

export const i18n = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})

// App.tsx
function App() {
  const [locale, setLocale] = useState('en')

  return (
    <i18n.Provider locale={locale} messages={messages[locale]}>
      <YourApp />
    </i18n.Provider>
  )
}

// Component.tsx
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
