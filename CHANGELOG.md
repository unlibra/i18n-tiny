# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0-beta.1] - Unreleased

The first beta of 2.0, with breaking changes. See [MIGRATION.md](./MIGRATION.md)
for how to update from 1.x.

### Changed

- The packages ship ES modules only and require Node.js 22.12 or later, and
  their types TypeScript 5.9 or later. `@i18n-tiny/astro` supports Astro 6
  and 7.
- `define()` takes `locales` and `defaultLocale` in every package, and checks
  the config: an empty or duplicated locale, a locale that cannot be a path
  segment, a `defaultLocale` that is not one of `locales`, and `messages`
  with a missing or extra locale throw. With `as const` or an inline config
  they are type errors too. The Astro middleware, the Next.js proxy and the
  URL functions check the same config. In the browser, the `define()` of
  `@i18n-tiny/react` and of `@i18n-tiny/next` in Client Components check it
  by type only, which keeps the check out of the client bundle.
- `getMessages()`, `getTranslations()` and the `Provider` take one of
  `locales`; any other value throws instead of falling back to the default
  locale. `useLocale()` returns one of `locales`.
- The URL functions of `@i18n-tiny/core/router`, `@i18n-tiny/astro/router`
  and `@i18n-tiny/next/router` take the config object:
  `localizedPath(path, locale, config)`, `alternatePath(pathname, locale, config)`,
  `removeLocalePrefix(pathname, config)` and `pathLocale(pathname, config)`.
  Paths must start with `/` and have no query or hash, and the results have
  no trailing slash.
- `getLinkHref()` takes `{ locale, normalize, config }` as its required fourth
  argument.
- `Link` (Astro and Next.js): a link for the default locale gets no prefix
  unless `prefixDefault` is true, a relative `href` throws, and
  `locale={false}` replaces `locale=""`.
- The Astro `Link` needs the `define()` result as the `i18n` prop, except
  with `locale={false}`. Without `locale`, it builds the link for the locale
  of the current page from the config, as the Next.js `Link` does, instead of
  following the current URL. It handles the `base`.
- Astro static builds put the pages under `src/pages/[...locale]/` and return
  `i18n.getStaticPaths()`: the default locale is built without a prefix.
- The Astro middleware serves the default locale through
  `src/pages/[...locale]/` instead of rewriting it to `/[defaultLocale]`.
- Without language detection, the Astro middleware and the Next.js proxy use
  `defaultLocale`; `fallbackLocale` is used only when detection finds no
  match.
- `excludePaths` of the Astro middleware matches whole path segments, and an
  entry that does not start with `/` throws.
- `Link` and the URL functions read `prefixDefault` from `define()` (in
  Next.js, through its `Provider`). A `prefixDefault` that 1.x passed to the
  Astro middleware, the Next.js proxy or the Astro integration goes in the
  config shared with `define()`: in `create()` only, links to the default
  locale have no prefix and are redirected.
- In the rewrite mode, the Astro middleware and the Next.js proxy accept
  `detectLanguage` and `prefixDefault`, so they take the same config as
  `define()`. With detection, `prefixDefault: true` is required: without it,
  the config is a type error and throws. In this mode `prefixDefault` changes
  the links only, and a URL without a locale prefix is not redirected.
- The Next.js `Link` without `locale` builds the link for the locale of the
  `Provider`, as `localizedPath()` does, instead of following the current URL.
- The Next.js `Link` loads a page of another locale in full, in every routing
  mode and also with `locale={false}`, and does not prefetch it.
- With `typedRoutes`, the `href` of the Next.js `Link` is typed as any URL
  instead of one of the generated routes.
- `DefineConfig` is replaced by `I18nConfig`, the locale settings
  `{ locales, defaultLocale, prefixDefault? }`. The `I18nConfig` of
  `@i18n-tiny/astro` is this type too.

### Added

- `isLocale()` in the result of `define()`, to narrow a `string` to one of
  `locales`.
- `i18n.getStaticPaths()` in `@i18n-tiny/astro`, which sets `params.locale`
  and `props.locale`, and takes the locales of the page.
- `localizedPath()` and `alternatePath()` in the result of `define()` in
  Astro and Next.js.
- The URL functions of `@i18n-tiny/next/router` work in Server Components.
- The middleware and the proxy add `Vary: Accept-Language` to responses that
  depend on language detection.

### Removed

- `@i18n-tiny/astro/integration` (and `astro-i18n-tiny/integration`).
- `getLocalizedPath()` and `hasLocalePrefix()`.
- `Astro.locals.locales`.
- The `normalize` prop of the Astro `Link`; use `i18n.alternatePath()`, or
  the path of the page with `locale`.
- `I18nProviderProps` of `@i18n-tiny/react/internal`; use `ProviderProps`, the
  same props of the internal provider (not those of the `Provider` of
  `define()`).
- The CommonJS builds (`.cjs`, `.d.cts`).

### Fixed

- In the rewrite mode, the Next.js proxy set `x-locale` on the response, so
  Server Components could not read it. It is now a request header, and an
  `x-locale` header sent by the client is replaced.
- `detectLocale()` picked languages marked with `q=0`.
- `excludePaths: ['/api']` of the Astro middleware also excluded `/apis` and
  `/api-docs`.
- The Next.js `Link` linked to `/en/...` on a page of the default locale `en`
  that Next.js served from `/en`.
- The middleware and the proxy no longer route a path that leads to another
  host, such as `/en//example.com`.

## [1.3.0] - 2026-10-23

### Changed

- With a namespace, translation keys are typed relative to it:
  `useTranslations('common')` and `getTranslations(locale, 'common')` accept
  `'title'` for `'common.title'`, in `@i18n-tiny/react`, `@i18n-tiny/next` and
  `@i18n-tiny/astro`. The namespace must be a path to a nested object. Code
  that passed full key paths together with a namespace, which returned the key
  itself at run time, now fails the type check.
- `define()` in `@i18n-tiny/astro` takes its types from the messages, so keys
  stay typed when `locales` is left out or passed without `as const`. Locales
  without messages still fall back to the default locale.

### Added

- `astro-i18n-tiny/locals`, the same `Astro.locals` types as
  `@i18n-tiny/astro/locals`.

### Fixed

- `Link` (Next.js and Astro) prefixed hrefs that are not paths on the site:
  `https://…` and `mailto:…` links, protocol-relative URLs, and `#…` or `?…`
  links became paths such as `/ja/https://…`. They are now left unchanged.
- The Next.js `Link` turned a `UrlObject` without `pathname`, such as
  `{ query: { page: 2 } }`, into a link to `/` or `/ja`.
- The Astro middleware dropped the query string when it redirected or
  rewrote a request.
- In Next.js, `getMessages()` and `getTranslations()` returned no messages
  for a locale without messages; they now fall back to the default locale,
  as in Astro.

## [1.2.1] - 2026-10-23

### Fixed

- The alias packages `next-i18n-tiny`, `react-i18n-tiny` and `astro-i18n-tiny`
  could not be imported: their `exports` pointed into the `@i18n-tiny` packages,
  which Node rejects with `ERR_INVALID_PACKAGE_TARGET`. They now ship their own
  files that re-export the matching `@i18n-tiny` entry points. This affected
  every earlier version of the aliases.
- CommonJS consumers now get the CommonJS type declarations (`.d.cts`) through
  the `require` condition of every export.
- Builds of `@i18n-tiny/next` and `@i18n-tiny/astro` could miss declaration
  files, because one of their parallel build steps cleaned the output folder.
- `@i18n-tiny/react` no longer repeats the `"use client"` directive in its
  output.

### Changed

- Each package's `homepage` now points to its documentation at
  https://docs.unlibra.com/i18n-tiny/.
- `@i18n-tiny/astro` has the `astro-integration` keyword, which lists it in the
  Astro integrations library.

## [1.2.0] - 2026-09-30

### Added

- `@i18n-tiny/astro` and `astro-i18n-tiny` support Astro 6 and 7.

## [1.1.1] - 2025-12-07

### Fixed

- Published packages depend on exact versions of other `@i18n-tiny` packages.
  In 1.1.0, they depended on `workspace:*`, which cannot be installed.

## [1.1.0] - 2025-12-07

### Added

- `@i18n-tiny/astro/integration`: an Astro integration for static builds that
  copies the default locale's pages to the site root.

## [1.0.0] - 2025-12-07

### Added

#### Core (`@i18n-tiny/core`)
- Core i18n utilities with automatic type inference
- `define()` function for creating type-safe i18n instances
- `detectLocale()` for Accept-Language header parsing
- Router utilities: `getLocalizedPath()`, `removeLocalePrefix()`, `getLinkHref()`
- Middleware utilities for locale detection and routing
- Full TypeScript support with zero dependencies

#### Astro (`@i18n-tiny/astro`)
- Type-safe i18n library for Astro 4.0+ and 5.0+
- Middleware support with multiple routing strategies:
  - Default mode: rewrites for default locale, redirects for others
  - Prefix mode: always prefix all locales (including default)
  - Rewrite mode: SSR-friendly with locale in `Astro.locals`
- `Link` component with automatic locale detection
- Support for both SSG (Static Site Generation) and SSR (Server-Side Rendering)
- TypeScript types for `Astro.locals.locale`

#### React (`@i18n-tiny/react`)
- Type-safe i18n library for React 18+ and 19+
- `I18nProvider` context provider
- `useMessages()` and `useTranslations()` hooks
- Full TypeScript support with automatic type inference

#### Next.js (`@i18n-tiny/next`)
- Type-safe i18n library for Next.js 15+ and 16+
- Server Components support (React Server Components)
- Client Components support with `use client` directive
- Proxy-based message access for optimal DX
- Router utilities compatible with Next.js App Router
- Full TypeScript support

### Documentation
- Comprehensive README for each package
- TypeScript type documentation
- Usage examples for SSG, SSR, and middleware
- API reference documentation

### Notes
- **Stable API**: This v1.0.0 release marks the API as stable
- **Production Ready**: All core features tested and documented
- **Type Safety**: Full TypeScript support with automatic type inference
- **Zero Dependencies**: Core functionality with no external dependencies
- **Framework Support**: Astro, React, and Next.js integrations
