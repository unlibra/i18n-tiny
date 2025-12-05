# Migration Guide: next-i18n-tiny → @i18n-tiny/next

> **Note**: This guide is for users of the deprecated `next-i18n-tiny` package.
> The package has been renamed to `@i18n-tiny/next` as part of a monorepo restructuring.

## Quick Migration

The API is **100% compatible**. Just change the package name:

### 1. Update package.json

```diff
{
  "dependencies": {
-   "next-i18n-tiny": "^0.1.5"
+   "@i18n-tiny/next": "^0.1.0"
  }
}
```

### 2. Update imports

```diff
- import { define } from 'next-i18n-tiny'
+ import { define } from '@i18n-tiny/next'
```

### 3. Reinstall dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

That's it! Your code will work exactly the same way.

## Why the rename?

The library is expanding to support more frameworks beyond Next.js:

- `@i18n-tiny/next` - Next.js App Router
- `@i18n-tiny/astro` - Astro (coming soon)
- More frameworks in the future

The scoped package naming allows for a family of related packages while keeping the core logic shared.

## No Breaking Changes

All APIs, types, and behavior remain identical:

- ✅ `define()` works the same
- ✅ `Provider`, `Link` components unchanged
- ✅ `server.getMessages()`, `server.getTranslations()` unchanged
- ✅ `client.useMessages()`, `client.useTranslations()`, `client.useLocale()` unchanged
- ✅ Type inference works the same

## Need Help?

If you encounter any issues during migration, please [open an issue](https://github.com/unlibra/i18n-tiny/issues).
