# @i18n-tiny/astro

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/astro/introduction)

A zero-dependency, type-safe, minimal internationalization library for Astro that ships no client JavaScript.
Works with both SSG and SSR. Configuration is completed by a single `define` function, with full auto-completion for key paths like `messages.common.title`.

**SSG**: Put the pages under `src/pages/[...locale]/` and return `i18n.getStaticPaths()` from their `getStaticPaths`. The default locale is served without a prefix (`/about`), the others with one (`/en/about`).
**SSR**: Use `middleware.create()` for routing, with language detection if you turn it on.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys
- **Zero dependencies**: No external i18n libraries needed
- **Server-first**: Native Astro server-side rendering support
- **Minimal SSG**: Works seamlessly with Astro's static site generation
- **Simple API**: Single configuration, minimal boilerplate
- **No client JavaScript**: in `.astro` files it runs at build time or on the server, so it adds no JavaScript to the browser
- **Flexible**: Use with Astro's built-in i18n or standalone middleware

## Installation

```bash
npm install @i18n-tiny/astro
# or
pnpm add @i18n-tiny/astro
# or
yarn add @i18n-tiny/astro
```

Requires Astro 6 or 7. The package itself runs on Node.js 22.12 or later, but Astro may need a newer one: Astro 7.4.4, for example, requires Node.js 22.23.4 or later. Use the Node.js version your Astro version requires.

The package ships ES modules only. The types need TypeScript 5.9 or later.

## Usage

### Project Structure

```text
src/
├── pages/
│   └── [...locale]/
│       ├── index.astro    → /, /en
│       └── about.astro    → /about, /en/about
├── messages/
│   ├── en.ts
│   └── ja.ts
├── i18n.config.ts
└── i18n.ts
```

### Minimal Setup

#### **1. Create message files**

```typescript
// src/messages/ja.ts
export default {
  common: {
    title: "マイサイト",
    description: "サイトへようこそ"
  },
  nav: {
    home: "ホーム",
    about: "概要"
  }
}
```

```typescript
// src/messages/en.ts
export default {
  common: {
    title: "My Site",
    description: "Welcome to my site"
  },
  nav: {
    home: "Home",
    about: "About"
  }
}
```

#### **2. Define i18n instance**

Place this file anywhere in your project (`i18n.ts`, `lib/i18n/index.ts`, etc.)

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/astro'
import jaMessages from './messages/ja'
import enMessages from './messages/en'

export const i18n = define({
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  messages: { ja: jaMessages, en: enMessages }
})
```

To use the locale settings where the messages are not loaded too, such as in the middleware or `astro.config`, write them once in a file of their own and spread them: see [`I18nConfig`](#i18nconfig-type).

#### **3. Use in pages**

```astro
---
// src/pages/[...locale]/index.astro
import type { InferGetStaticPropsType } from 'astro'
import { i18n } from '../../i18n'

// / in Japanese (the default locale) and /en in English
export function getStaticPaths() {
  return i18n.getStaticPaths()
}
type Props = InferGetStaticPropsType<typeof getStaticPaths>

const { locale } = Astro.props // 'ja' | 'en'
const messages = i18n.getMessages(locale)
const t = i18n.getTranslations(locale)
---

<html lang={locale}>
  <head>
    <title>{messages.common.title}</title>
    {/*           ^^^^^ Auto-complete */}
  </head>
  <body>
    <h1>{messages.common.title}</h1>
    <p>{t('common.description')}</p>
    {/*    ^^^^^^^^^^^^^^^^^^ Auto-complete */}
  </body>
</html>
```

That's it! **Types are automatically inferred** - no manual type annotations needed.

The build output has `/` and `/about` in Japanese and `/en` and `/en/about` in English, with no `/ja`. Use `Astro.props.locale`, typed as one of the locales, rather than `Astro.params.locale`, which is `undefined` for the default locale.

For server rendering, and for language detection, add the [middleware](#i18n-tinyastromiddleware-ssr-only).

## Messages

### Variables and braces

`{name}` in a message is replaced with the value of `name` in the vars, a string or a number. A name has letters, digits and `_`. To show a brace, write it twice: `{{` shows `{` and `}}` shows `}`.

```typescript
export default {
  welcome: 'Welcome, {name}!',         // t('welcome', { name: 'Ann' }) → 'Welcome, Ann!'
  syntax: 'Write {{name}} in messages' // t('syntax') → 'Write {name} in messages'
}
```

`{{name}}` is not a variable, as it is in some other libraries such as i18next: it shows `{name}`. A variable without a value is left as it is, and a missing key returns the key itself, with a warning in development.

### Types of the messages

The keys are typed from the messages of `defaultLocale`, and the messages of every other locale must have the same keys: a missing or extra key is a type error in `define()`, with the reason at the end of the error.

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

- Without `as const`, a message is typed as `string`, and its vars are `Record<string, string | number>`, not checked.
- With a `defaultLocale` typed as the union of the locales, such as `'en' | 'ja'`, the vars come from the messages of every locale, and a message typed as `string` in any of them takes any vars, not checked. Write `defaultLocale` as a literal, such as `'en'`.
- For a key typed as a union, such as `t(isNew ? 'welcome' : 'goodbye', vars)`, the vars need the variables of every key.
- An extra variable is a type error only in an object literal in the call, as TypeScript checks extra properties only there.
- The variables of the other locales are not compared with those of the default locale: a translation without `{name}` is not an error.

## API Reference

### `@i18n-tiny/astro`

#### `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter       | Type                       | Description                                                                     |
| --------------- | -------------------------- | ------------------------------------------------------------------------------- |
| `locales`       | `readonly string[]`        | Supported locales (required). Each one is a path segment, such as `/en`         |
| `defaultLocale` | `string`                   | The locale of URLs without a locale prefix (required). One of `locales`         |
| `prefixDefault` | `boolean`                  | Whether URLs of the default locale also have the prefix. Default: `false`       |
| `messages`      | `Record<Locale, Messages>` | The messages of each locale. It must have exactly the locales of `locales`      |

The config is checked when `define()` runs: an empty `locales`, a locale listed twice, a locale that cannot be a path segment (empty, `.`, `..`, or containing `/`, `\`, `?`, `#` or whitespace), a `defaultLocale` that is not one of `locales`, and `messages` with a missing or extra locale throw an error. With `as const` or an inline config, they are type errors too.

Types are taken from the messages of `defaultLocale`, `Messages` below, and `locales` needs no `as const`. The `locale` argument of `getMessages` and `getTranslations` is one of `locales`: any other value, `undefined` included, is a type error and throws. To use a `string` from elsewhere, narrow it with `isLocale()` first.

With a namespace, keys are relative to it: `getTranslations(locale, 'common')` takes `'title'` for `common.title`, and a full path is a type error. The namespace must point to a nested object. Keys and variables (`vars`) are typed from the messages of `defaultLocale`: see [Messages](#messages).

**Returns:**

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

#### `isLocale(value)`

Whether `value` is one of `locales`. In TypeScript, it narrows `value` to the locale type:

```typescript
const lang = Astro.url.searchParams.get('lang') // string | null
const messages = i18n.getMessages(i18n.isLocale(lang) ? lang : i18n.defaultLocale)
```

#### `getStaticPaths(options?)`

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

| Option    | Type       | Description                                                                                             |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `locales` | `Locale[]` | The locales the page is built in, such as `['ja']` for a page in Japanese only. Default: all `locales` |

An empty `locales`, and a locale listed twice or not one of `locales`, throw an error. For the other dynamic parameters of a route, see [Other Dynamic Parameters](#other-dynamic-parameters).

#### URL functions

`localizedPath` and `alternatePath` are the functions of [`@i18n-tiny/astro/router`](#i18n-tinyastrorouter) with the config of `define()`, and return the same results:

```typescript
i18n.localizedPath('/about', 'en')    // '/en/about'
i18n.localizedPath('/about', 'ja')    // '/about' (the default locale has no prefix)
i18n.alternatePath('/en/about', 'ja') // '/about': the current page in another locale
```

For `removeLocalePrefix` and `pathLocale`, use the functions of [`@i18n-tiny/astro/router`](#i18n-tinyastrorouter) with the config.

#### `I18nConfig` (type)

The type of the locale settings, `{ locales, defaultLocale, prefixDefault? }`, which `define()`, the middleware and the URL functions take. Write them once in a file of their own and spread them where they are needed:

```typescript
// src/i18n.config.ts
export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const

// src/i18n.ts
export const i18n = define({ ...config, messages: { ja, en } })
```

```typescript
import type { I18nConfig } from '@i18n-tiny/astro'

export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const satisfies I18nConfig
```

Check the config with `satisfies` rather than with a type annotation: `const config: I18nConfig<'ja' | 'en'>` widens `prefixDefault: true` to `boolean`, which the rewrite mode with detection rejects.

### `@i18n-tiny/astro/middleware` (SSR only)

#### `create(config)`

Creates an Astro middleware handler for i18n routing.

> **Note**: Middleware only works in SSR mode (`output: 'server'` with an adapter). Static builds need no middleware.

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro/middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { config } from './i18n.config' // { locales: ['ja', 'en'], defaultLocale: 'ja' }

export const onRequest = defineMiddleware(create({ ...config }))
```

**Parameters:**

| Parameter        | Type                | Default         | Description                                                                          |
| ---------------- | ------------------- | --------------- | ------------------------------------------------------------------------------------ |
| `locales`        | `readonly string[]` | -               | Supported locales (required)                                                         |
| `defaultLocale`  | `string`            | -               | The locale of URLs without a locale prefix (required). One of `locales`              |
| `fallbackLocale` | `string`            | `defaultLocale` | The locale used when language detection finds no match. One of `locales`            |
| `excludePaths`   | `string[]`          | `[]`            | Paths to leave out of i18n handling, such as `['/api']`. Each one starts with `/`    |
| `prefixDefault`  | `boolean`           | `false`         | Whether URLs of the default locale also have the prefix. Put it in the config shared with `define()`, see below. `true` for the rewrite mode with detection |
| `detectLanguage` | `boolean`           | `false`         | Whether to detect the language of a URL without a locale prefix from `Accept-Language` |
| `routing`        | `'rewrite'`         | -               | The SSR rewrite mode                                                                 |

The config is checked as `define()` checks it: an invalid config, an `excludePaths` entry that does not start with `/`, and the rewrite mode with detection without `prefixDefault: true` throw an error.

- `/_astro` and `/_image` are always excluded. An excluded path matches itself and the paths under it: `/api` matches `/api` and `/api/users`, but not `/apis` or `/api-docs`. Requests for static files (such as `.png`, `.css` or `.js`) are skipped as well.
- With a [`base`](https://docs.astro.build/en/reference/configuration-reference/#base), the middleware removes it from the URL before routing and adds it to the redirect and rewrite targets. Write `excludePaths` without the base.
- Redirects keep the query string and the trailing slash of the URL: `/about/?x=1` redirects to `/en/about/?x=1`.
- A URL whose path leads to another host, such as `/en//example.com`, gets no i18n handling.

**Routing modes:**

| Mode                       | Where the pages are                            | A URL with a locale prefix (`/en/about`) | A URL without a locale prefix (`/about`)                                    |
| -------------------------- | ---------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Standard                   | `src/pages/[...locale]/about.astro`            | Served as it is                          | Served as the default locale                                                |
| Standard, detection        | `src/pages/[...locale]/about.astro`            | Served as it is                          | Redirects to the detected locale, or is served as the default locale        |
| `prefixDefault: true` in the shared config | `src/pages/[...locale]/about.astro` | Served as it is                 | Redirects to `/[defaultLocale]/about`                                       |
| `prefixDefault: true` in the shared config, detection | `src/pages/[...locale]/about.astro` | Served as it is      | Redirects to the detected locale                                            |
| `routing: 'rewrite'`       | `src/pages/about.astro`                        | Rewritten to `/about`, the locale in `Astro.locals.locale` | The default locale in `Astro.locals.locale`               |
| `routing: 'rewrite'`, detection, `prefixDefault: true` in the shared config | `src/pages/about.astro` | Rewritten to `/about`, the locale in `Astro.locals.locale` | The detected locale in `Astro.locals.locale` |

The shared config is the one that `define()` and the middleware both take, such as `src/i18n.config.ts`. `Link` and the URL functions read `prefixDefault` from the config of `define()`, not from the middleware: with `prefixDefault: true` in `create()` only, a link to the default locale has no prefix, so the middleware redirects it, and with detection to the detected locale, which may not be the default one.

```typescript
// src/i18n.config.ts
export const config = { locales: ['ja', 'en'], defaultLocale: 'ja', prefixDefault: true } as const

// src/i18n.ts
export const i18n = define({ ...config, messages: { ja, en } })

// src/middleware.ts
export const onRequest = defineMiddleware(create({ ...config }))
```

"Detection" is `detectLanguage: true`. Without it, there is no detection. It uses `fallbackLocale` when `Accept-Language` matches none of `locales`. Languages marked with `q=0` are never picked.

When detection decides the response, the response gets `Vary: Accept-Language`, added to any `Vary` the page sets. A CDN or a shared cache that ignores `Vary` may serve one visitor's language to another: cache these URLs per `Accept-Language`, or not at all.

**Standard routing:**

The pages are under `src/pages/[...locale]/`, as for a static build. With server output there is no `getStaticPaths()`, so read the locale from the params:

```astro
---
// src/pages/[...locale]/about.astro
import { i18n } from '../../i18n'

// undefined for the default locale. [...locale] also matches /fr/about, so check it
const locale = Astro.params.locale ?? i18n.defaultLocale
if (!i18n.isLocale(locale)) {
  return new Response(null, { status: 404 })
}
const messages = i18n.getMessages(locale)
---
```

**SSR Rewrite Mode:**

With `routing: 'rewrite'`, the pages are not under a locale folder. The locale is stored in `Astro.locals.locale`, and the original pathname in `Astro.locals.originalPathname`. These two are set only in this mode, and not for the excluded paths:

```astro
---
// src/pages/index.astro (no [...locale] folder needed)
import { i18n } from '../i18n'

const locale = Astro.locals.locale // typed with the locales, see below
const messages = i18n.getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

Without detection, a URL without a prefix is the default locale, and `prefixDefault` may be `false`.

With `detectLanguage: true`, a URL without a prefix is the detected locale, so a link to the default locale needs its prefix too. Put `prefixDefault: true` in the config that `define()` and the middleware share: with detection, the rewrite mode without it is a type error and throws. `<Link href="/" locale="en" i18n={i18n}>` is then `/en`, and `<Link href="/" locale={false}>` is `/`, the detected locale. A URL without a prefix is still served, not redirected.

```typescript
// src/i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const

// src/i18n.ts
export const i18n = define({ ...config, messages: { en, ja } })

// src/middleware.ts
export const onRequest = defineMiddleware(create({ ...config, routing: 'rewrite', detectLanguage: true }))
```

#### `MiddlewareConfig` (type)

Type for the configuration object passed to `create()`.

#### `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header. Languages marked with `q=0` are never returned.

```typescript
import { detectLocale } from '@i18n-tiny/astro/middleware'

const acceptLanguage = request.headers.get('accept-language')
const locale = detectLocale(acceptLanguage, ['en', 'ja'])
// Returns: 'en' | 'ja' | null
```

### `@i18n-tiny/astro/router`

#### `Link` Component

A link that keeps the locale of the current page, or points to another locale.

```astro
---
import Link from '@i18n-tiny/astro/router/Link.astro'
import { i18n } from '../i18n'
---

<!-- Keeps the locale of the current URL: /about on /, /en/about on /en -->
<Link href="/about">About</Link>

<!-- A link for a locale: /en, and / for the default locale -->
<Link href="/" locale="en" i18n={i18n}>English</Link>
<Link href="/" locale="ja" i18n={i18n}>日本語</Link>

<!-- The path without a locale -->
<Link href="/" locale={false}>Top</Link>
```

| Prop     | Type              | Description                                                                                                   |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| `href`   | `string`          | The path of the page, starting with `/`, without the base and without a locale prefix                         |
| `locale` | `string \| false` | Without it, the link keeps the locale of the current URL. A locale builds the link for it, and `false` leaves the path without a locale |
| `i18n`   | `define()` result | Required with a locale (other than `false`). The link is built with its `localizedPath()`, and so with its `prefixDefault` |

- Without `locale`, the link keeps the form of the current URL: it gets the prefix of the current locale only when the current URL has one. The current locale is `Astro.params.locale`, or in the rewrite mode `Astro.locals.locale`. The `Link` of `@i18n-tiny/next` builds this link from the config instead.
- With `locale`, the link is built as `localizedPath()` builds it: the default locale gets no prefix unless `prefixDefault` is true. A locale that is not one of `locales` throws.
- `locale` without `i18n` is a type error, and throws.
- An `href` that does not start with `/`, such as `about`, throws. Hrefs that are not paths of the site, such as `https://…`, `mailto:…` or `#top`, are left unchanged. A query and a hash in `href` are kept.
- The links have no trailing slash, except for the top page `/`.
- With a [`base`](https://docs.astro.build/en/reference/configuration-reference/#base), the link removes it from the current URL to find the locale, and adds it to the result: with the base `/docs`, `<Link href="/about">` on `/docs/en` is `/docs/en/about`. Write `href` without the base.

#### URL functions

The functions of [`@i18n-tiny/core/router`](https://www.npmjs.com/package/@i18n-tiny/core), for places where the messages are not loaded, such as `astro.config` or build scripts. They take the config object `{ locales, defaultLocale, prefixDefault? }`. In pages, `localizedPath` and `alternatePath` of `define()` need no config.

```typescript
import { localizedPath, alternatePath, removeLocalePrefix, pathLocale } from '@i18n-tiny/astro/router'

const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const

localizedPath('/about', 'en', config)    // '/en/about': the path of a page in a locale
localizedPath('/about', 'ja', config)    // '/about'
localizedPath('/', 'en', config)         // '/en'
alternatePath('/en/about', 'ja', config) // '/about': the current page in another locale
removeLocalePrefix('/en/about', config)  // '/about'
pathLocale('/en/about', config)          // 'en'
pathLocale('/about', config)             // undefined
```

- The results have no trailing slash, except for the top page `/`.
- They take a pathname only, and throw when it does not start with `/`, starts with `//` or `/\`, or contains `?` or `#`. Add the query and the hash after building the path.
- A locale that is not one of `locales` throws. With `as const`, it is a type error too.
- `localizedPath()` takes the path without a locale prefix, and adds one even when the path already has it. Use `alternatePath()` for the current page.

## Advanced Usage

### Pages in Some Locales Only

Pass the locales of the page to `getStaticPaths()`:

```astro
---
// src/pages/[...locale]/privacy.astro: /privacy in Japanese only
export function getStaticPaths() {
  return i18n.getStaticPaths({ locales: ['ja'] })
}
---
```

### Other Dynamic Parameters

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

### Language Switcher

The current page in each locale. The page passes its path, without a locale prefix:

```astro
---
// src/components/LanguageSwitcher.astro
import Link from '@i18n-tiny/astro/router/Link.astro'
import { i18n } from '../i18n'

interface Props {
  path: string // such as '/about'
}

const names = { ja: '日本語', en: 'English' }
---

<nav>
  {i18n.locales.map((locale) => (
    <Link href={Astro.props.path} locale={locale} i18n={i18n}>
      {names[locale]}
    </Link>
  ))}
</nav>
```

For a page in some locales only, map over its locales instead of `i18n.locales`. Without a `base`, `i18n.alternatePath(Astro.url.pathname, locale)` gives the same paths from the current URL.

If you turn on detection in the [middleware](#i18n-tinyastromiddleware-ssr-only) with `detectLanguage: true`, also put `prefixDefault: true` in the [config shared with `define()`](#i18nconfig-type). With `prefixDefault: false`, a browser that prefers another locale than the default one cannot reach the pages of the default locale: the link to the default locale has no prefix, and the middleware detects its language again, so a browser that prefers English follows the Japanese link to `/about` and is redirected back to `/en/about`. With `prefixDefault: true`, the URLs of the default locale have the prefix too (`/ja/about`), and are not detected.

Without detection, the default, the language switcher works as it is. A static build has no middleware and no detection.

### With Astro's Built-in i18n

You can also use Astro's built-in i18n routing with @i18n-tiny/astro for translations only. Astro's routing then builds the pages of each locale, and `Astro.currentLocale` is a `string | undefined`, so narrow it with `isLocale()`:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config'

export default defineConfig({
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  }
})
```

```astro
---
import { i18n } from '../i18n'

const locale = Astro.currentLocale
if (!i18n.isLocale(locale)) {
  throw new Error(`Unknown locale: ${locale}`)
}
const messages = i18n.getMessages(locale)
---

<html lang={locale}>
  <body>
    <h1>{messages.common.title}</h1>
  </body>
</html>
```

## TypeScript

### Astro.locals Type Safety

For `Astro.locals.locale` and `Astro.locals.originalPathname`, which the middleware sets only in `routing: 'rewrite'` mode, add the type reference to your project:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />
/// <reference types="@i18n-tiny/astro/locals" />
```

This provides types for:

- `Astro.locals.locale` - Current locale as a `string` (rewrite mode only)
- `Astro.locals.originalPathname` - Original path (rewrite mode only)

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

## License

MIT
