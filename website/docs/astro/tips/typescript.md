---
sidebar_position: 1
---

# TypeScript Support

i18n-tiny is built with TypeScript and provides excellent type safety for your translations.

## Type-Safe Message Resolution

When you define your i18n instance using `define`, the types are automatically inferred from your message objects.

```typescript
// i18n.ts
const messages = {
  en: {
    welcome: "Welcome, {name}!"
  },
  ja: {
    welcome: "ようこそ、{name}さん！"
  }
}

export const { getTranslations } = define({ messages })

// Usage
const t = getTranslations('en')

t('welcome', { name: 'John' }) // Valid
t('invalid') // TypeScript Error: Argument of type '"invalid"' is not assignable...
t('welcome') // TypeScript Error: Property 'name' is missing...
```

## Astro Locals Type

For type-safe access to `Astro.locals.locale` (when using SSR Rewrite Mode), add the type reference to your project's `src/env.d.ts`:

```typescript
/// <reference types="@i18n-tiny/astro/locals" />
```

This provides types for:

- `Astro.locals.locale` - Current locale string
- `Astro.locals.locales` - Array of supported locales
- `Astro.locals.originalPathname` - Original pathname (before rewrite)