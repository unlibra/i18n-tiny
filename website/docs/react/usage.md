---
sidebar_position: 3
---

# Usage

## 1. Create Messages

Create message files for each locale.

```typescript
// messages/en.ts
export default {
  common: {
    title: "My React App",
    welcome: "Hello, {name}!"
  }
}

// messages/ja.ts
export default {
  common: {
    title: "Reactアプリ",
    welcome: "こんにちは、{name}さん！"
  }
}
```

## 2. Define i18n Instance

Import `define` from `@i18n-tiny/react` to create your i18n instance.

```typescript
// i18n.ts
import { define } from '@i18n-tiny/react'
import en from './messages/en'
import ja from './messages/ja'

export const { Provider, useTranslations, useLocale } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en, ja }
})
```

## 3. Wrap Your App

Use the `Provider` to wrap your application and pass the current locale and messages.

```tsx
// main.tsx
import { Provider } from './i18n'
import enMessages from './messages/en'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider locale="en" messages={enMessages}>
    <App />
  </Provider>
)
```

## 4. Use Hooks in Components

Access your translations using the `useTranslations` hook.

```tsx
// App.tsx
import { useTranslations, useLocale } from './i18n'

function App() {
  const t = useTranslations('common')
  const locale = useLocale()

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome', { name: 'React User' })}</p>
      <p>Current Locale: {locale}</p>
    </div>
  )
}
```
