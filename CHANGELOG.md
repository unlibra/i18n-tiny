# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
