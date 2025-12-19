---
sidebar_position: 3
---

# 使い方

## クイックスタート

### 1. i18nの定義 - これだけでOK

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/react'

const enMessages = {
  common: {
    title: 'Hello',
    welcome: 'Welcome, {name}!'
  }
} as const

const jaMessages = {
  common: {
    title: 'こんにちは',
    welcome: 'ようこそ、{name}さん！'
  }
} as const

// define() が必要なものすべてを提供します
export const { Provider, useMessages, useTranslations, useLocale } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

### 2. Providerでラップする

```tsx
// src/App.tsx
import { useState } from 'react'
import { Provider } from './i18n'

function App() {
  const [locale, setLocale] = useState('en')

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

### 3. コンポーネントでの使用

```tsx
// src/components/Greeting.tsx
import { useMessages, useTranslations, useLocale } from '../i18n'

function Greeting() {
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