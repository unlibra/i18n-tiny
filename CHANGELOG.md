# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
