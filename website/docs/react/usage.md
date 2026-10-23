---
description: "Add multiple languages to a React app, step by step: create message files, call define(), wrap your app in the Provider, and use typed hooks."
---

# How to Add i18n to a React App

**In short:** create one message file per locale, and call `define()` once to get a typed `Provider` and hooks. Wrap your app in `Provider` with the current locale and its messages. Then read translations with `useTranslations()` in any component.

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
import ReactDOM from 'react-dom/client'
import App from './App'
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

export default App
```

With a namespace, keys are relative to it: `useTranslations('common')` takes `'title'` for `common.title`. A full path such as `t('common.title')` is then a type error. The namespace must point to a nested object, such as `common`. Without a namespace, use full paths: `useTranslations()` takes `'common.title'`.
