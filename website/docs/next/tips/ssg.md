---
sidebar_position: 1
---

# Static Site Generation (SSG)

When using Static Site Generation in Next.js (App Router), you typically need to define `generateStaticParams` in every page (`page.tsx`).

However, **with i18n-tiny, you only need to define it once in the root layout (`layout.tsx`).**

This prevents you from having to write repetitive `generateStaticParams` for every new page, keeping your codebase extremely clean.

## Implementation

Simply add the following code to your `app/[locale]/layout.tsx`:

```typescript
// app/[locale]/layout.tsx
import { locales } from '@/i18n'

// By adding this to the root layout once,
// all child pages will be statically generated at build time.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default function Layout({ children, params }) {
  // ...
}
```