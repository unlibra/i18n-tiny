---
description: "API reference for define() in @i18n-tiny/next: options, return values and types for typed messages, translation functions and localized paths in Next.js."
---

# Core

Core i18n functionality, from `@i18n-tiny/next`.

## `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | Supported locales. Each one is used as a path segment, such as `/en`. No `as const` needed |
| `defaultLocale` | one of `locales` | Required | The locale of URLs without a locale prefix |
| `prefixDefault` | `boolean` | | Whether URLs of the default locale also carry the prefix. Default: `false` |
| `messages` | `Record<Locale, Messages>` | Required | The messages of each locale. It must have exactly the locales of `locales` |

The config is invalid when:

- `locales` is empty, lists a locale twice, or has a locale that is empty, `.`, `..` or contains `/`, `\`, `?`, `#` or whitespace
- `defaultLocale` is not one of `locales`
- `messages` misses a locale or has one that is not in `locales`

With `as const` or an inline config, these are type errors. At run time, `define()` throws for them on the server, in Server Components and in the proxy. In the browser it does not check the config, which keeps the check out of the client bundle.

To use the locale settings where the messages are not loaded too, such as in the proxy, keep them in an object of their own and spread it:

```typescript
// i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const

// i18n.ts
export const i18n = define({ ...config, messages: { en, ja } })
```

### Return Value (Properties of `i18n`)

```typescript
{
  Provider: React.FC<{ locale: Locale; messages: LocaleMessages<Messages>; children: ReactNode }>
  locales: readonly Locale[]
  defaultLocale: Locale
  isLocale: (value: unknown) => value is Locale
  localizedPath: (path: string, locale: Locale) => string
  alternatePath: (pathname: string, locale: Locale) => string
  server: {
    getMessages: (locale: Locale) => Promise<LocaleMessages<Messages>>
    getTranslations: (locale: Locale, namespace?: Namespace) => Promise<TranslationFunction>
  }
  client: {
    useMessages: () => LocaleMessages<Messages>
    useTranslations: (namespace?: Namespace) => TranslationFunction
    useLocale: () => Locale
    useLocales: () => readonly Locale[]
    useDefaultLocale: () => Locale
  }
}
```

- `Locale` is one of `locales`. The `locale` of `getMessages()`, `getTranslations()` and the `Provider` is a `Locale`: any other value, `undefined` included, is a type error and throws. To use a `string`, such as a route parameter, narrow it with `isLocale()` first.
- `Messages` is the type of the messages of `defaultLocale`. `LocaleMessages<Messages>` has the same keys, with strings as values, so that the messages of any locale fit.
- `Namespace` is a path to a nested object in your messages, such as `'common'`.

#### `i18n.Provider`

A component that wraps your app to provide the locale and its messages to Client Components.

| Prop | Type | Required | Description |
| --- | --- | :---: | --- |
| `locale` | `Locale` | Required | The current locale. Any other value is a type error and throws |
| `messages` | `LocaleMessages<Messages>` | Required | The messages of the current locale |
| `children` | `ReactNode` | Required | Child components |

```tsx
<Provider locale={locale} messages={messages}>
  {children}
</Provider>
```

#### `i18n.isLocale(value)`

Whether a value is one of `locales`, as a type guard:

```typescript
import { notFound } from 'next/navigation'
import { getMessages, isLocale } from '@/i18n'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const messages = await getMessages(locale) // locale is 'en' | 'ja' here
  // ...
}
```

#### `i18n.locales`, `i18n.defaultLocale`

The configured `locales` and `defaultLocale`.

### Server-side APIs

#### `i18n.server.getMessages(locale)`

Returns a promise of the messages of `locale`, for Server Components.

```typescript
const messages = await getMessages(locale)
messages.common.title
```

#### `i18n.server.getTranslations(locale, namespace?)`

Returns a promise of the translation function `t(key, vars?)` for `locale`, for Server Components.

- `key`: The message key, type-checked with autocomplete. With a namespace, the key is relative to it.
- `vars`: The values of the `{name}` variables of the message. See [Messages](#messages) for their types.
- Returns: `string`.

```typescript
const t = await getTranslations(locale)
t('common.title')

const tNav = await getTranslations(locale, 'nav')
tNav('home')     // Resolves 'nav.home'
tNav('nav.home') // Type error: keys are relative to the namespace
```

### Client-side APIs

The `client` hooks work in Client Components inside the `Provider`. In Server Components they throw.

#### `i18n.client.useMessages()`

Returns the messages of the current locale.

```tsx
const messages = useMessages()
return <h1>{messages.common.title}</h1>
```

#### `i18n.client.useTranslations(namespace?)`

Returns the translation function `t`, the same as the one of `getTranslations()`.

```tsx
const t = useTranslations('common')
return <p>{t('welcome', { name: 'John' })}</p> // Resolves 'common.welcome'
```

#### `i18n.client.useLocale()`

Returns the current locale, typed as one of `locales`.

```tsx
const locale = useLocale() // 'en' | 'ja'
```

#### `i18n.client.useLocales()`, `i18n.client.useDefaultLocale()`

Return the configured `locales` and `defaultLocale`.

### URL functions

`localizedPath` and `alternatePath` are the functions of [`@i18n-tiny/next/router`](./router#url-functions) with the config of `define()`, and return the same results. They work in Server and Client Components:

```typescript
i18n.localizedPath('/about', 'ja')    // '/ja/about': the path of a page in a locale
i18n.localizedPath('/about', 'en')    // '/about' (the default locale has no prefix)
i18n.alternatePath('/ja/about', 'en') // '/about': the current page in another locale
```

For `removeLocalePrefix` and `pathLocale`, use the functions of [`@i18n-tiny/next/router`](./router#url-functions) with the config.

#### Paths and the `basePath`

The URL functions, and the `Link`, work on paths without the [`basePath`](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath). Next.js adds the `basePath` to what you pass to `Link`, `redirect()` and `router.push()`, so pass the paths as they are:

```typescript
import { redirect } from 'next/navigation'

redirect(i18n.localizedPath('/about', 'ja'))    // Next.js adds the basePath
router.push(i18n.alternatePath(pathname, 'ja')) // the same
```

Anywhere else, such as in a plain `<a>` or `window.location`, add the `basePath` yourself. For metadata, keep the URLs relative and put the `basePath` in `metadataBase`: Next.js joins relative URLs to `metadataBase`, and does not add the `basePath` to metadata.

#### Alternate links (hreflang)

A page knows its own path, so build its alternate links in `generateMetadata()` with `localizedPath()`:

```typescript
// app/[locale]/about/page.tsx
import type { Metadata } from 'next'
import { i18n } from '@/i18n'

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL('https://example.com'), // with a basePath: 'https://example.com/docs'
    alternates: {
      languages: Object.fromEntries(i18n.locales.map((locale) => [locale, i18n.localizedPath('/about', locale)]))
    }
  }
}
```

This gives `https://example.com/about` for `en` and `https://example.com/ja/about` for `ja`. Where you have the current pathname instead, such as from `usePathname()`, `i18n.alternatePath(pathname, locale)` gives the same paths.

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

With the messages of the default locale written `as const`, the vars of `t()` are typed from each message. A missing, misspelled or extra variable, and vars left out, are type errors, and a message without variables takes no vars:

```typescript
// messages/en.ts
export default {
  common: { welcome: 'Welcome, {name}!' }
} as const
```

```typescript
const t = await getTranslations(locale)
t('common.welcome', { name: 'Ann' }) // OK
t('common.welcome')                  // Type error: vars is missing
t('common.welcome', { nmae: 'Ann' }) // Type error: name is missing
```

To get these errors, and autocomplete, in the files of the other locales, type their messages with `LocaleMessages`, the keys of the default locale with strings as values:

```typescript
// messages/ja.ts
import type { LocaleMessages } from '@i18n-tiny/next'
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

## Types

### `I18nConfig`

The type of the locale settings `{ locales, defaultLocale, prefixDefault? }`, which `define()`, the proxy and the URL functions share. Check the config with `satisfies`, so that `as const` keeps its literal types:

```typescript
import type { I18nConfig } from '@i18n-tiny/next'

export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const satisfies I18nConfig
```

It is also exported from `@i18n-tiny/next/types` and `@i18n-tiny/next/router`.

### `LocaleMessages<T>`

The messages of a locale: the keys of `T`, with strings as values. See [Types of the messages](#types-of-the-messages).
