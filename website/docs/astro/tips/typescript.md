---
description: "Get autocomplete and compile-time errors for translation keys in Astro. i18n-tiny infers types from your message files, so a typo fails the type check."
---

# Type-Check Translation Keys in Astro

i18n-tiny is built with TypeScript and provides excellent type safety for your translations.

## Type-Safe Message Resolution

When you define your i18n instance using `define`, the types are automatically inferred from your message objects.

```typescript
// i18n.ts
import { define } from '@i18n-tiny/astro'

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
```

## Astro Locals Type

For type-safe access to `Astro.locals.locale` (when using SSR Rewrite Mode), add the type reference to your project's `src/env.d.ts`:

```typescript
/// <reference types="@i18n-tiny/astro/locals" />
```

With the alias package, `astro-i18n-tiny/locals` provides the same types.

This provides types for:

- `Astro.locals.locale` - Current locale string (rewrite mode only)
- `Astro.locals.locales` - Array of supported locales (every routing mode)
- `Astro.locals.originalPathname` - Original pathname before rewrite (rewrite mode only)

These values are set by the i18n-tiny middleware.