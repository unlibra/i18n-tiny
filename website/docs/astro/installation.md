---
description: "Install @i18n-tiny/astro, or its alias astro-i18n-tiny, with npm, pnpm or yarn to add type-safe i18n to your Astro site."
---

# Installation

Requires Astro 4, 5, 6 or 7.

The [middleware](./api-reference/middleware) uses `context.rewrite`, which became stable in Astro 4.13. If you use the middleware with Astro 4, use 4.13 or later.

You can install either the standard package or an alias package for shorter imports.

### Standard Package

```bash
npm install @i18n-tiny/astro
# or
pnpm add @i18n-tiny/astro
# or
yarn add @i18n-tiny/astro
```

### Alias Package

You can use `astro-i18n-tiny` as an alias for `@i18n-tiny/astro`. Use version 1.2.1 or later: earlier versions of the alias could not be imported.

```bash
npm install astro-i18n-tiny
# or
pnpm add astro-i18n-tiny
# or
yarn add astro-i18n-tiny
```
