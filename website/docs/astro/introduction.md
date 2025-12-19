---
sidebar_position: 1
---

# Introduction

[![npm version](https://img.shields.io/npm/v/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![npm downloads](https://img.shields.io/npm/dm/@i18n-tiny/astro.svg)](https://www.npmjs.com/package/@i18n-tiny/astro)
[![CI](https://github.com/unlibra/i18n-tiny/workflows/CI/badge.svg)](https://github.com/unlibra/i18n-tiny/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/unlibra/i18n-tiny/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

A zero-dependency, type-safe, minimal internationalization library for **Astro**.

Works with both SSG and SSR. Configuration is handled by a single `define` function, providing full auto-completion for key paths like `messages.common.title`.
Locale handling in `getStaticPaths` requires only minimal setup, avoiding repetitive per-page definitions.

## Features

- **Type-safe**: Full TypeScript support with **automatic type inference** - autocomplete for `messages.site.name`, `t('common.title')`, and all nested keys.
- **Zero dependencies**: No external i18n libraries needed.
- **Server-first**: Native Astro server-side rendering support.
- **Minimal SSG**: Works seamlessly with Astro's static site generation.
- **Simple API**: Single configuration, minimal boilerplate.
- **Lightweight**: Minimal bundle size.
- **Flexible**: Works with Astro's built-in i18n or as a standalone solution.

## Installation

```bash
npm install @i18n-tiny/astro
```

## Usage

```typescript
// src/i18n.ts
import { define } from '@i18n-tiny/astro'

export const { getMessages, getTranslations } = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})
```

```astro
---
// src/pages/[locale]/index.astro
import { getMessages, getTranslations } from '../../i18n'
const { locale } = Astro.params

const messages = getMessages(locale)
const t = getTranslations(locale)
---

<html lang={locale}>
  <head>
    <title>{messages.common.title}</title> {/* ← Type-safe! Autocomplete */}
  </head>
  <body>
    <h1>{messages.common.title}</h1>
    <p>{t('common.description')}</p> {/* ← Interpolation supported */}
  </body>
</html>
```

## Next Steps

- [Installation](./installation)
- [Usage](./usage)
- [API Reference](./api-reference)
- [TIPS](./tips/typescript)