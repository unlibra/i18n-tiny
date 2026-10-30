# @i18n-tiny/next

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/next.svg)](https://www.npmjs.com/package/@i18n-tiny/next)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Documentation](https://img.shields.io/badge/docs-website-blue.svg)](https://docs.unlibra.com/i18n-tiny/next/introduction)

A dependency-free, type-safe, minimal i18n library for Next.js, under 2KB in the browser.
Simply prepare translation files and call the define function—usable in both Server and Client Components immediately.
All key paths such as `messages.site.title` and `t("site.title")` are fully typed and auto-suggested, eliminating typos.
With the `app/[locale]` root layout, `generateStaticParams` is defined once there, and Next.js applies it to every page below.
Routing, prefixes, and automatic language detection are all handled by a single `create()` call in the Next.js Proxy (formerly Middleware).

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys
- **Zero dependencies**: No external i18n libraries needed
- **Server Components**: Native RSC support
- **Minimal SSG**: With the `app/[locale]` root layout, define `generateStaticParams` once there; Next.js applies it to every page below. No per-page configuration needed.
- **Simple API**: Single configuration, minimal boilerplate
- **Small**: under 2KB minified and gzipped in the browser
- **No global state**: Pure function factory pattern

## Installation

```bash
npm install @i18n-tiny/next
# or
pnpm add @i18n-tiny/next
# or
yarn add @i18n-tiny/next
```

Requires Next.js 15 or 16, React 18 or 19, and Node.js 22.12 or later. The package ships ES modules only. The types need TypeScript 5.9 or later.

## Usage

### Project Structure

```text
your-app/
├── app/
│   └── [locale]/
│       ├── layout.tsx
│       └── page.tsx
├── messages/
│   ├── en.ts
│   └── ja.ts
├── i18n.config.ts
├── i18n.ts
└── proxy.ts
```

### Minimal Setup

#### **1. Create message files**

Place this file anywhere in your project.

```typescript
// messages/en.ts
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

```typescript
// messages/ja.ts
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

#### **2. Define i18n instance**

The locales are written once, in an object of their own that `define()` and the proxy both take. Place the files anywhere in your project (`i18n.ts`, `lib/i18n/index.ts`, etc.)

```typescript
// i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const
```

```typescript
// i18n.ts
import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import { config } from '@/i18n.config'
import enMessages from '@/messages/en'
import jaMessages from '@/messages/ja'

export const i18n = define({
  ...config,
  messages: { en: enMessages, ja: jaMessages }
})

export type Locale = (typeof i18n.locales)[number]

export { Link }
export const { Provider, isLocale, locales } = i18n
export const { useMessages, useTranslations, useLocale, usePaths } = i18n.client
export const { getMessages, getTranslations } = i18n.server
```

#### **3. Setup Proxy**

```typescript
// proxy.ts
import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from '@/i18n.config'

export const proxy = create({ ...i18nConfig })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

On Next.js 15, name the file `middleware.ts` and the export `middleware`.

#### **4. Use in Layout**

`[locale]` also receives paths that are not locales, such as `/favicon.ico`. `getMessages()` takes one of the locales only, so narrow the parameter with `isLocale()` and show the 404 page for anything else:

```typescript
// app/[locale]/layout.tsx
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { Provider, getMessages, isLocale } from '@/i18n'

export default async function Layout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} messages={messages}>
          {children}
        </Provider>
      </body>
    </html>
  )
}
```

#### **5. Use in Components**

```typescript
// Server Component
import { getMessages, getTranslations, type Locale } from '@/i18n'

export async function ServerComponent({ locale }: { locale: Locale }) {
  /* Direct object access */
  const messages = await getMessages(locale)
  /* Function call */
  const t = await getTranslations(locale)

  return (
    <div>
      <h1>{messages.common.title}</h1>
      {/*           ^^^^^ Auto-complete */}
      <p>{t('common.description')}</p>
      {/*    ^^^^^^^^^^^^^^^^^^ Auto-complete */}
    </div>
  )
}
```

```typescript
// Client Component
'use client'
import { Link, useMessages, useTranslations } from '@/i18n'

export function ClientComponent() {
  /* Direct object access */
  const messages = useMessages()
  /* Function call */
  const t = useTranslations()

  return (
    <div>
      <h1>{messages.common.title}</h1>
      {/*           ^^^^^ Auto-complete */}
      <Link href="/about">{t('nav.about')}</Link>
      {/*                    ^^^^^^^^^ Auto-complete */}
    </div>
  )
}
```

That's it! **Types are automatically inferred** - no manual type annotations needed.

**Two ways to access translations:**

- `messages.common.title` - Direct object access (simple and clear)
- `t('common.title')` - Function call (useful for dynamic keys)

Both are fully typed with autocomplete. Use whichever you prefer!

## API Reference

### `@i18n-tiny/next`

#### `define(config)`

Defines an i18n instance with automatic type inference.

**Parameters:**

| Parameter       | Type                       | Description                                                          |
| --------------- | -------------------------- | -------------------------------------------------------------------- |
| `locales`       | `readonly string[]`        | Supported locales. Each one is used as a path segment, such as `/en` |
| `defaultLocale` | one of `locales`           | The locale of URLs without a locale prefix                           |
| `prefixDefault` | `boolean`                  | Whether URLs of the default locale also carry the prefix (default `false`) |
| `messages`      | `Record<Locale, Messages>` | Messages object keyed by locale                                      |

`locales` and `defaultLocale` are required, and `locales` needs no `as const`. `define()` throws when `defaultLocale` is not one of `locales`, when `locales` is empty, lists a locale twice or has a locale that is empty, `.`, `..` or contains `/`, `\`, `?`, `#` or whitespace, and when `messages` misses a locale or has one that is not in `locales`. With `as const` or an inline config, these are type errors too.

**Returns:**

```typescript
{
  Provider: React.FC<{ locale: Locale; messages: Messages; children: ReactNode }>
  locales: readonly Locale[]
  defaultLocale: Locale
  prefixDefault: boolean
  isLocale: (value: unknown) => value is Locale
  localizedPath: (path: string, locale: Locale) => string
  alternatePath: (pathname: string, locale: Locale) => string
  removeLocalePrefix: (pathname: string) => string
  pathLocale: (pathname: string) => Locale | undefined
  server: {
    getMessages: (locale: Locale) => Promise<Messages>
    getTranslations: (locale: Locale, namespace?: Namespace) => Promise<TranslationFunction>
  }
  client: {
    useMessages: () => Messages
    useTranslations: (namespace?: Namespace) => TranslationFunction
    useLocale: () => Locale
    useLocales: () => readonly Locale[]
    useDefaultLocale: () => Locale
    usePaths: () => { localizedPath, alternatePath, removeLocalePrefix, pathLocale }
  }
}
```

`Locale` is one of `locales`. The `locale` of `getMessages()`, `getTranslations()` and the `Provider` is a `Locale`: any other value is a type error and throws. To use a `string`, such as a route parameter, narrow it with `isLocale()` first.

`Namespace` is a path to a nested object in your messages, such as `'common'`. With a namespace, the keys of `TranslationFunction` are relative to it and still type-checked: `useTranslations('common')` accepts `'title'` for `common.title`, and `'common.title'` is a type error. Interpolation variables are `Record<string, string | number>` and are not type-checked.

The `client` hooks work in Client Components inside the `Provider`. In Server Components they throw.

#### `isLocale(value)`

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

#### URL functions

`localizedPath`, `alternatePath`, `removeLocalePrefix` and `pathLocale` are the functions of [`@i18n-tiny/next/router`](#i18n-tinynextrouter) with the config of `define()`, and return the same results:

```typescript
i18n.localizedPath('/about', 'ja')    // '/ja/about'
i18n.localizedPath('/about', 'en')    // '/about' (the default locale has no prefix)
i18n.alternatePath('/ja/about', 'en') // '/about': the current page in another locale
i18n.removeLocalePrefix('/ja/about')  // '/about'
i18n.pathLocale('/ja/about')          // 'ja'
```

In Client Components, `client.usePaths()` gives the same functions with the config of the `Provider`:

```typescript
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { usePaths } from '@/i18n'

export function SwitchToJapanese() {
  const pathname = usePathname()
  const router = useRouter()
  const { alternatePath } = usePaths()
  return <button onClick={() => router.push(alternatePath(pathname, 'ja'))}>日本語</button>
}
```

#### Paths and the `basePath`

The URL functions, and the `Link`, work on paths without the [`basePath`](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath). Next.js adds the `basePath` to what you pass to `Link`, `redirect()` and `router.push()`, so pass the paths as they are:

```typescript
import { redirect } from 'next/navigation'

redirect(i18n.localizedPath('/about', 'ja'))       // Next.js adds the basePath
router.push(alternatePath(pathname, 'ja'))         // the same
```

Anywhere else, add the `basePath` yourself:

```typescript
const basePath = '/docs' // the basePath of next.config.ts

// A plain <a>, or window.location
window.location.href = basePath + i18n.localizedPath('/about', 'ja')
```

For metadata, keep the URLs relative and put the `basePath` in `metadataBase`: Next.js joins relative URLs to `metadataBase`, and does not add the `basePath` to metadata.

```typescript
// app/[locale]/about/page.tsx
import type { Metadata } from 'next'
import { i18n } from '@/i18n'

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL('https://example.com/docs'), // the site and the basePath
    alternates: {
      languages: Object.fromEntries(i18n.locales.map((locale) => [locale, i18n.localizedPath('/about', locale)]))
    }
  }
}
```

A sitemap needs absolute URLs: build them from the site, the `basePath` and the path. The router functions take only the locale settings, so the sitemap does not load the messages:

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { localizedPath } from '@i18n-tiny/next/router'
import { config } from '@/i18n.config'

const site = 'https://example.com/docs' // the site and the basePath

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/about'].flatMap((path) => config.locales.map((locale) => ({
    url: site + localizedPath(path, locale, config)
  })))
}
```

#### `I18nConfig` (type)

The type of the locale settings `{ locales, defaultLocale, prefixDefault? }`, which `define()`, the proxy and the URL functions share:

```typescript
import type { I18nConfig } from '@i18n-tiny/next'

export const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const satisfies I18nConfig
```

It is also exported from `@i18n-tiny/next/types` and `@i18n-tiny/next/router`.

### `@i18n-tiny/next/proxy`

#### `create(config)`

Creates a Next.js Proxy handler for i18n routing. It returns `(request: NextRequest) => NextResponse`. The config is checked as `define()` checks it, and the rewrite mode with detection without `prefixDefault: true` is a type error and throws.

**Parameters:**

| Parameter        | Type                | Default         | Description                                                                |
| ---------------- | ------------------- | --------------- | -------------------------------------------------------------------------- |
| `locales`        | `readonly string[]` | -               | Array of supported locales                                                 |
| `defaultLocale`  | one of `locales`    | -               | The locale of URLs without a locale prefix                                 |
| `fallbackLocale` | one of `locales`    | `defaultLocale` | Used when the detection finds no match                                     |
| `prefixDefault`  | `boolean`           | `false`         | Whether to prefix default locale in URLs. Put it in the config shared with `define()`. `true` for `routing: 'rewrite'` with detection |
| `detectLanguage` | `boolean`           | `true`          | Whether to detect the language of URLs without a prefix from Accept-Language |
| `routing`        | `'rewrite'`         | -               | SSR rewrite mode                                                           |

**Routing Behavior Matrix:**

Applies to every URL without a locale prefix, such as `/` or `/about` (the path and the query are kept). URLs with a locale prefix are served as is.

| prefixDefault | detectLanguage | Behavior for URLs without a locale prefix                     |
| ------------- | -------------- | ------------------------------------------------------------- |
| `false`       | `false`        | Serves the default locale (rewrite to `/[defaultLocale]`)     |
| `false`       | `true`         | Detects, redirects non-default, rewrites default              |
| `true`        | `false`        | Redirects to `/[defaultLocale]`                               |
| `true`        | `true`         | Detects and redirects to detected locale                      |

Without the detection, a URL without a prefix is always the default locale; `fallbackLocale` is used only when the detection finds no match. A pathname that starts with `//` or `/\`, also after the locale prefix, gets no i18n handling.

**Examples:**

```typescript
import { config as i18nConfig } from '@/i18n.config'

// Default: detect language, redirect non-default, rewrite default
export const proxy = create({ ...i18nConfig })

// No detection: URLs without a prefix are the default locale
export const proxy = create({ ...i18nConfig, detectLanguage: false })

// SSR rewrite mode (locale in the x-locale request header). With detection,
// the config has prefixDefault: true, see below
export const proxy = create({ ...i18nConfig, routing: 'rewrite' })
```

To prefix all locales, including the default one, set `prefixDefault: true`. `Link` and the URL functions read it from `define()` and its `Provider`, not from the proxy, so put it in the config that `define()` and the proxy share, not in `create()` only: with `prefixDefault: true` in the proxy only, a link to the default locale has no prefix, so the proxy redirects it, and with detection to the detected locale, which may not be the default one.

```typescript
// i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const

// i18n.ts
export const i18n = define({ ...config, messages: { en, ja } })

// proxy.ts
export const proxy = create({ ...config })
```

#### Rewrite Mode

In rewrite mode, the proxy rewrites `/ja/about` to `/about` and passes the locale to the pages in the `x-locale` request header. For URLs without a prefix, the locale is detected from Accept-Language, or is the default locale with `detectLanguage: false`. An `x-locale` header sent by the client is replaced, and the other request headers, such as cookies, are passed on.

With detection, a URL without a prefix is the detected locale, so a link to the default locale needs its prefix too. Put `prefixDefault: true` in the config that `define()` and the proxy share: with detection, the rewrite mode without it is a type error and throws. A URL without a prefix is still served, not redirected. With `detectLanguage: false`, `prefixDefault` may be `false`.

```typescript
// i18n.config.ts
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const

// i18n.ts
export const i18n = define({ ...config, messages: { en, ja } })

// proxy.ts
export const proxy = create({ ...config, routing: 'rewrite' })
```

Put routes directly under `app/`, without `app/[locale]`, and read the locale in Server Components:

```typescript
// locale.ts (for Server Components only)
import { headers } from 'next/headers'
import { i18n } from '@/i18n'

export async function getLocale() {
  const locale = (await headers()).get('x-locale')
  return i18n.isLocale(locale) ? locale : i18n.defaultLocale
}
```

See [`examples/next-ssr`](../../examples/next-ssr) for a complete example.

#### Language detection and caches

A response that depends on the detection, such as the redirect of `/about` to `/ja/about` for a Japanese browser, gets `Vary: Accept-Language` from the proxy. Next.js keeps it on redirects, but sets its own `Vary` header on the pages it renders, so a page served without a prefix (the default locale, or any locale in rewrite mode) does not carry it. With the detection, do not let a shared cache (a CDN) store the pages without a locale prefix, or make it key them by `Accept-Language`; or use `detectLanguage: false`.

#### `ProxyConfig` (type)

Type for the configuration object passed to `create()`.

#### `detectLocale(acceptLanguage, supportedLocales)`

Detects the best matching locale from the Accept-Language header. Languages marked with `q=0` are never returned.

```typescript
import { detectLocale } from '@i18n-tiny/next/proxy'

const acceptLanguage = request.headers.get('accept-language')
const locale = detectLocale(acceptLanguage, ['en', 'ja'])
// Returns: 'en' | 'ja' | null
```

### `@i18n-tiny/next/router`

#### `Link`

Localized Link component, a Client Component. It reads the current locale and the locale settings from the `Provider`, so use it inside the `Provider`. The `href` is a path without a locale prefix and without the `basePath`, and must start with `/`: a relative path such as `about` throws. Hrefs that are not paths on this site, such as `https://…` or `#top`, are left as they are, and the query and the hash of a path are kept.

```typescript
import { Link } from '@i18n-tiny/next/router'

// The link for the current locale
<Link href="/about">About</Link>

// A link for another locale
<Link href="/" locale="ja">日本語</Link>

// Raw path (no localization)
<Link href="/" locale={false}>English</Link>

// Conditional locale (false = raw path)
<Link href="/" locale={condition && 'ja'}>Conditional</Link>
```

- Without `locale`, the link is for the current locale, as `localizedPath()` builds it: with `defaultLocale: 'en'`, `href="/about"` is `/about` on an English page and `/ja/about` on a Japanese page, whatever the current URL is.
- With `locale`, the link is built as `localizedPath()` builds it: the default locale gets no prefix unless `prefixDefault` is true. A locale that is not one of `locales` throws. `locale=""` is a type error and throws: use `locale={false}`.
- With `normalize`, a locale prefix is removed from `href` first, such as when `href` is the current pathname.
- A link to a page of another locale is loaded in full by the browser, not by the router of Next.js, and is not prefetched. In the rewrite mode the pages of all locales are the same route, and the router would show the page of the current locale from its cache. The locale of the page is read from the path, also with `locale={false}`: the locale of its prefix, or for a path without a prefix, the default locale. With `prefixDefault`, a path without a prefix is the detected locale, which only the server knows, and is loaded in full too. Clicks with a modifier key, `target="_blank"` and `download` are left to the browser. In such a link, the `onNavigate` and `transitionTypes` props and the pending state of `useLinkStatus` of Next.js have no effect, and a `Link` with `legacyBehavior` (deprecated) does not load the page in full.
- With `typedRoutes`, the `href` of this `Link` is typed as any URL, not as one of the generated routes, since it has no locale prefix.

#### URL functions

The functions of `@i18n-tiny/core/router`. They take the locale settings, and work in Server and Client Components, in the proxy and in scripts that do not load the messages:

```typescript
import { localizedPath, alternatePath, removeLocalePrefix, pathLocale } from '@i18n-tiny/next/router'

const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const

localizedPath('/about', 'ja', config)       // '/ja/about': the path of a page in a locale
localizedPath('/about', 'en', config)       // '/about'
localizedPath('/', 'ja', config)            // '/ja'
alternatePath('/ja/about', 'en', config)    // '/about': the current page in another locale
removeLocalePrefix('/ja/about', config)     // '/about'
pathLocale('/ja/about', config)             // 'ja'
pathLocale('/about', config)                // undefined
```

- The results have no trailing slash, except for the top page `/`, and no `basePath`.
- They take a pathname only: a path that does not start with `/`, starts with `//` or `/\`, or contains `?` or `#`, throws, as does a locale that is not one of `locales`. Add the query and the hash after building the path.
- `localizedPath()` takes the path without a locale prefix, and adds one even when the path already has it. Use `alternatePath()` for the current page.

## Advanced Usage

### Static Site Generation (SSG)

To generate static pages for all locales at build time, add `generateStaticParams` to your **root layout**.

```typescript
// app/[locale]/layout.tsx
import type { ReactNode } from 'react'
import { locales } from '@/i18n'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function Layout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  // ...
}
```

The params apply to every page below the layout. This is Next.js behavior.

### Language Switcher

The current page in each locale, with `normalize`:

```typescript
'use client'
import { usePathname } from 'next/navigation'
import { Link } from '@/i18n'

export function LanguageSwitcher() {
  const pathname = usePathname()

  return (
    <div>
      {/* /ja/about -> /about (en is the default locale) */}
      <Link href={pathname} locale="en" normalize>
        English
      </Link>
      {/* /about -> /ja/about */}
      <Link href={pathname} locale="ja" normalize>
        日本語
      </Link>
    </div>
  )
}
```

## Examples

See the [examples](../../examples) directory for complete working examples.

## License

MIT
