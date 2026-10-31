---
description: "API reference for define() in @i18n-tiny/astro: options, return values, getStaticPaths(), URL functions and the types of messages and translation functions."
---

# Core

`define()` and the types of `@i18n-tiny/astro`.

## `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | :---: | --- |
| `locales` | `readonly string[]` | Required | Supported locales. Each one is a path segment, such as `/en` |
| `defaultLocale` | `string` | Required | The locale of URLs without a locale prefix. One of `locales` |
| `prefixDefault` | `boolean` | | Whether URLs of the default locale also have the prefix. Default: `false` |
| `messages` | `Record<Locale, Messages>` | Required | The messages of each locale. It must have exactly the locales of `locales` |

The config is checked when `define()` runs: an empty `locales`, a locale listed twice, a locale that cannot be a path segment (empty, `.`, `..`, or containing `/`, `\`, `?`, `#` or whitespace), a `defaultLocale` that is not one of `locales`, and `messages` with a missing or extra locale throw an error. With `as const` or an inline config, they are type errors too.

Types are taken from the messages of `defaultLocale` (`Messages` below), and `locales` needs no `as const`.

### Return Value (Properties of `i18n`)

```typescript
{
  locales: readonly Locale[]
  defaultLocale: Locale
  isLocale: (value: unknown) => value is Locale
  getMessages: (locale: Locale) => LocaleMessages<Messages>
  getTranslations: (locale: Locale, namespace?: string) => TranslationFunction
  getStaticPaths: (options?: { locales?: Locale[] }) => { params: { locale: Locale | undefined }, props: { locale: Locale } }[]
  localizedPath: (path: string, locale: Locale) => string
  alternatePath: (pathname: string, locale: Locale) => string
}
```

`Locale` is one of `locales`. The `locale` argument of `getMessages` and `getTranslations` is a `Locale`: any other value, `undefined` included, is a type error and throws. To use a `string` from elsewhere, narrow it with `isLocale()` first.

#### `i18n.getMessages(locale)`

Returns the messages of `locale`.

```typescript
const messages = i18n.getMessages('en')
messages.common.title // typed as string
```

#### `i18n.getTranslations(locale, namespace?)`

Returns a translation function `t(key, vars?)` for `locale`. With a namespace, keys are relative to it, and a full path is a type error. The namespace must point to a nested object, such as `'common'`.

```typescript
const t = i18n.getTranslations('en', 'common')
t('title')        // reads 'common.title'
t('common.title') // Type error: with a namespace, use the relative key
```

A missing key returns the key itself, with a warning in development. The vars are typed from the messages: see [Messages](#messages).

#### `i18n.isLocale(value)`

Whether `value` is one of `locales`. In TypeScript, it narrows `value` to the locale type:

```typescript
const lang = Astro.url.searchParams.get('lang') // string | null
const messages = i18n.getMessages(i18n.isLocale(lang) ? lang : i18n.defaultLocale)
```

#### `i18n.getStaticPaths(options?)`

The paths of a page under `src/pages/[...locale]/`, one for each locale, to return from the page's `getStaticPaths()`:

```astro
---
// src/pages/[...locale]/about.astro
import type { InferGetStaticPropsType } from 'astro'
import { i18n } from '../../i18n'

export function getStaticPaths() {
  return i18n.getStaticPaths()
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale } = Astro.props // 'ja' | 'en'
const messages = i18n.getMessages(locale)
---
```

- `params.locale` is `undefined` for the default locale, so its page has no prefix (`/about`), and the locale for the others (`/en/about`). With `prefixDefault: true`, the default locale gets its prefix too.
- `props.locale` is the locale of the page, typed as one of `locales`. Use it rather than `Astro.params.locale`, which is `undefined` for the default locale.
- Write `getStaticPaths` as a function declaration, as above: on Astro 6, `export const getStaticPaths = () => …` fails the build.

| Option | Type | Description |
| --- | --- | --- |
| `locales` | `Locale[]` | The locales the page is built in, such as `['ja']` for a page in Japanese only. Default: all `locales` |

An empty `locales`, and a locale listed twice or not one of `locales`, throw an error.

`getStaticPaths()` returns the paths of the locales only. Combine them with the other parameters of the route:

```astro
---
// src/pages/[...locale]/lab/[tool].astro: /lab/color, /en/lab/color, ...
import type { InferGetStaticPropsType } from 'astro'
import { i18n } from '../../../i18n'
import { tools } from '../../../tools'

export function getStaticPaths() {
  return tools.flatMap((tool) =>
    i18n.getStaticPaths().map(({ params, props }) => ({ params: { ...params, tool: tool.slug }, props: { ...props, tool } }))
  )
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale, tool } = Astro.props
---
```

#### URL functions

`i18n.localizedPath(path, locale)` and `i18n.alternatePath(pathname, locale)` are the URL functions of the [router](./router#url-functions) with the config of `define()`, and return the same results:

```typescript
i18n.localizedPath('/about', 'en')    // '/en/about': the path of a page in a locale
i18n.localizedPath('/about', 'ja')    // '/about' (the default locale has no prefix)
i18n.alternatePath('/en/about', 'ja') // '/about': the current page in another locale
```

For `removeLocalePrefix` and `pathLocale`, use the functions of the [router](./router#url-functions) with the config.

#### `i18n.locales` and `i18n.defaultLocale`

The `locales` and `defaultLocale` of the config.

## Messages

### Variables and braces

`{name}` in a message is replaced with the value of `name` in the vars, a string or a number. A name has letters, digits and `_`. To show a brace, write it twice:

```typescript
export default {
  welcome: 'Welcome, {name}!',         // t('welcome', { name: 'Ann' }) → 'Welcome, Ann!'
  syntax: 'Write {{name}} in messages' // t('syntax') → 'Write {name} in messages'
}
```

Two braces around a name are not a variable, as they are in some other libraries such as i18next: they show the name in one pair of braces. A variable without a value is left as it is.

### Types of the messages

The keys are typed from the messages of `defaultLocale`, and the messages of every other locale must have the same keys: a missing or extra key is a type error in `define()`, with the reason at the end of the error.

With the messages of the default locale written `as const`, the vars of `t()` are typed from each message. A missing, misspelled or extra variable, and vars left out, are type errors, and a message without variables takes no vars. Without `as const`, the vars are `Record<string, string | number>`, not checked. See [Type-Check Translation Keys in Astro](../tips/typescript) for examples.

## `I18nConfig` (type)

The type of the locale settings, `{ locales, defaultLocale, prefixDefault? }`, which `define()`, the middleware and the URL functions take. Write them once in a file of their own and spread them where they are needed:

```typescript
// src/i18n.config.ts
import type { I18nConfig } from '@i18n-tiny/astro'

export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const satisfies I18nConfig

// src/i18n.ts
export const i18n = define({ ...config, messages: { ja, en } })
```

Check the config with `satisfies` rather than with a type annotation, which widens the config to its type: with `const config: I18nConfig<'ja' | 'en'>`, `prefixDefault` is a `boolean`, and the rewrite mode with detection is checked only when `create()` runs, not by type.

## `LocaleMessages<T>` (type)

The keys of the messages `T` with strings as values. Type the messages of the other locales with it, to get the errors and autocomplete in their files: see [Type-Check Translation Keys in Astro](../tips/typescript#messages-of-the-other-locales).
