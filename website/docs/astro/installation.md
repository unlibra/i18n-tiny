---
description: "Install @i18n-tiny/astro, or its alias astro-i18n-tiny, with npm, pnpm or yarn to add type-safe i18n to your Astro site."
---

# Installation

Requires Astro 6 or 7. The package itself runs on Node.js 22.12 or later, but Astro may need a newer one: Astro 7.4.4, for example, requires Node.js 22.23.4 or later. Use the Node.js version your Astro version requires.

The package ships ES modules only. The types need TypeScript 5.9 or later.

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

You can use `astro-i18n-tiny` as an alias for `@i18n-tiny/astro`. It has the same version and the same entry points, such as `astro-i18n-tiny/middleware` and `astro-i18n-tiny/locals`.

```bash
npm install astro-i18n-tiny
# or
pnpm add astro-i18n-tiny
# or
yarn add astro-i18n-tiny
```
