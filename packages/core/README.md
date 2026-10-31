# @i18n-tiny/core

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/core.svg)](https://www.npmjs.com/package/@i18n-tiny/core)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/core.svg)](https://www.npmjs.com/package/@i18n-tiny/core)

Framework-agnostic core of i18n-tiny. The framework packages ([`@i18n-tiny/astro`](https://www.npmjs.com/package/@i18n-tiny/astro), [`@i18n-tiny/next`](https://www.npmjs.com/package/@i18n-tiny/next), [`@i18n-tiny/react`](https://www.npmjs.com/package/@i18n-tiny/react)) are built on it.

Use it directly to build localized URLs where the messages are not loaded, such as in build scripts, workers or edge functions.

## Installation

```bash
npm install @i18n-tiny/core
```

Requires Node.js 22.12 or later when it runs on Node.js. The package ships ES modules only. The types need TypeScript 5.9 or later.

`@i18n-tiny/core/router` and `@i18n-tiny/core/middleware` use no Node.js APIs, so they also run outside Node.js, such as in edge runtimes and workers.

## The config

The URL functions take the same locale settings as `define()` and the middleware. Write them once in a file of their own and spread them where they are needed:

```typescript
// src/i18n.config.ts
export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
```

| Option | Type | Description |
| --- | --- | --- |
| `locales` | `readonly string[]` | Supported locales. Each one is a path segment, such as `/en` |
| `defaultLocale` | `string` | The locale of URLs without a locale prefix. One of `locales` |
| `prefixDefault` | `boolean` | Whether URLs of the default locale also have the prefix. Default: `false` |

The config is checked on every call. An empty `locales`, a locale listed twice, a locale that cannot be a path segment (empty, `.`, `..`, or containing `/`, `\`, `?`, `#` or whitespace), and a `defaultLocale` that is not one of `locales` throw an error. With `as const`, they are type errors too.

Check the config with `I18nConfig`, using `satisfies` rather than a type annotation, so that `as const` keeps the literal types of the config:

```typescript
import type { I18nConfig } from '@i18n-tiny/core/router'

export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const satisfies I18nConfig
```

## URL functions

```typescript
import { localizedPath, alternatePath, removeLocalePrefix, pathLocale } from '@i18n-tiny/core/router'
import { config } from './i18n.config'
```

### `localizedPath(path, locale, config)`

The path of a page in a locale. `path` is the page's path without a locale prefix.

```typescript
localizedPath('/donate', 'en', config) // '/en/donate'
localizedPath('/donate', 'ja', config) // '/donate'
localizedPath('/', 'en', config)       // '/en'

localizedPath('/donate', 'ja', { ...config, prefixDefault: true }) // '/ja/donate'
```

### `alternatePath(pathname, locale, config)`

The path of the current page in another locale: removes the locale prefix of `pathname`, if it has one, and adds the prefix of `locale`. Use it for language switchers.

```typescript
alternatePath('/en/donate', 'ja', config) // '/donate'
alternatePath('/donate', 'en', config)    // '/en/donate'
```

### `removeLocalePrefix(pathname, config)`

```typescript
removeLocalePrefix('/en/donate', config) // '/donate'
removeLocalePrefix('/en', config)        // '/'
removeLocalePrefix('/donate', config)    // '/donate'
```

### `pathLocale(pathname, config)`

The locale of the prefix of `pathname`, or `undefined` when it has none.

```typescript
pathLocale('/en/donate', config) // 'en'
pathLocale('/donate', config)    // undefined
pathLocale('/english', config)   // undefined: only whole path segments match
```

### Paths in and out

- The results have no trailing slash, except for the top page `/`.
- The functions take a pathname only. They throw when it does not start with `/`, starts with `//` or `/\` (which browsers read as another host, also once the locale prefix is removed), or contains `?` or `#`. Add the query and the hash after building the path:

  ```typescript
  const { pathname, search, hash } = new URL(location.href)
  const href = alternatePath(pathname, 'en', config) + search + hash
  ```

- A locale that is not one of `locales` throws. With `as const`, it is a type error too.
- `localizedPath()` adds a prefix even when the path already has one: `localizedPath('/en/donate', 'en', config)` is `'/en/en/donate'`. Use `alternatePath()` for the current page.

## `detectLocale(acceptLanguage, locales)`

The best match of the `Accept-Language` header among `locales`, or `null`. Languages marked as not acceptable with `q=0` are never returned.

```typescript
import { detectLocale } from '@i18n-tiny/core/middleware'

detectLocale('fr,ja;q=0.8,en;q=0.6', ['ja', 'en']) // 'ja'
detectLocale('en-US', ['ja', 'en'])                // 'en'
detectLocale('de', ['ja', 'en'])                   // null
```

## License

MIT
