---
description: "Get autocomplete and compile-time errors for translation keys and variables in Astro. i18n-tiny infers types from your message files, so a typo fails the type check."
---

# Type-Check Translation Keys in Astro

`define()` infers the types from your messages, with no type annotations. The types need TypeScript 5.9 or later.

## Keys

The keys are typed from the messages of `defaultLocale`. Your editor autocompletes them, and a key that does not exist fails the type check:

```typescript
const t = i18n.getTranslations(locale)

t('common.title') // OK
t('invalid')      // Type error

// With a namespace, keys are relative to it
const tCommon = i18n.getTranslations(locale, 'common')
tCommon('title')        // reads 'common.title'
tCommon('common.title') // Type error
```

The messages of every other locale must have the same keys: a missing or extra key is a type error in `define()`, with the reason at the end of the error. The check is by type only.

## Variables

With the messages of the default locale written `as const`, the vars of `t()` are typed from each message. A missing, misspelled or extra variable, and vars left out, are type errors, and a message without variables takes no vars:

```typescript
// src/messages/ja.ts
export default {
  common: { welcome: 'ようこそ、{name}さん！' }
} as const
```

```typescript
const t = i18n.getTranslations(locale)
t('common.welcome', { name: 'Ann' }) // OK
t('common.welcome')                  // Type error: vars is missing
t('common.welcome', { nmae: 'Ann' }) // Type error: name is missing
```

- Without `as const`, a message is typed as `string`, and its vars are `Record<string, string | number>`, not checked.
- With a `defaultLocale` typed as the union of the locales, such as `'en' | 'ja'`, the vars come from the messages of every locale, and a message typed as `string` in any of them takes any vars, not checked. Write `defaultLocale` as a literal, such as `'ja'`.
- For a key typed as a union, such as `t(isNew ? 'welcome' : 'goodbye', vars)`, the vars need the variables of every key.
- An extra variable is a type error only in an object literal in the call, as TypeScript checks extra properties only there.
- The variables of the other locales are not compared with those of the default locale: a translation without `{name}` is not an error.

## Messages of the Other Locales

To get these errors, and autocomplete, in the files of the other locales, type their messages with `LocaleMessages`, the keys of the default locale with strings as values:

```typescript
// src/messages/en.ts
import type { LocaleMessages } from '@i18n-tiny/astro'
import type ja from './ja'

const en: LocaleMessages<typeof ja> = {
  common: { welcome: 'Welcome, {name}!' }
}

export default en
```

## Locales

The `locale` of `getMessages()` and `getTranslations()` is one of `locales`: any other value, `undefined` included, is a type error and throws. Narrow a `string` with `isLocale()`:

```typescript
const lang = Astro.url.searchParams.get('lang') // string | null
const messages = i18n.getMessages(i18n.isLocale(lang) ? lang : i18n.defaultLocale)
```

For the type of the locale, use `(typeof i18n.locales)[number]`:

```typescript
// src/i18n.ts
export type Locale = (typeof i18n.locales)[number] // 'ja' | 'en'
```

## Astro Locals Type

For `Astro.locals.locale` and `Astro.locals.originalPathname`, which the middleware sets only in `routing: 'rewrite'` mode, add the type reference to your project:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />
/// <reference types="@i18n-tiny/astro/locals" />
```

With the alias package, `astro-i18n-tiny/locals` provides the same types.

This provides types for:

- `Astro.locals.locale` - Current locale as a `string` (rewrite mode only)
- `Astro.locals.originalPathname` - Original pathname before the rewrite (rewrite mode only)

`getMessages()` takes one of the locales, so narrow the `string` with `isLocale()`. Or, when every page goes through the middleware, declare the type with your locales in place of the reference:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: import('./i18n').Locale // export type Locale = (typeof i18n.locales)[number]
    originalPathname?: string
  }
}
```
