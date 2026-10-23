---
description: "Stop repeating generateStaticParams in every page. Define it once in the root layout and Next.js generates every page for every locale."
---

# Statically Generate Every Locale in Next.js

In the Next.js App Router, the params that a layout returns from `generateStaticParams` apply to every page below it. This is Next.js behavior, not an i18n-tiny feature.

**With i18n-tiny's `app/[locale]` root layout, you only need to define it once there**, instead of in every page (`page.tsx`).

This prevents you from having to write repetitive `generateStaticParams` for every new page, keeping your codebase clean. Pages with their own dynamic segments, such as `[slug]`, still define `generateStaticParams` for those segments.

## Implementation

Simply add the following code to your `app/[locale]/layout.tsx`:

```tsx
// app/[locale]/layout.tsx
import type { ReactNode } from 'react'
import { locales } from '@/i18n'

// By adding this to the root layout once,
// Next.js statically generates all child pages for every locale at build time.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function Layout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  // ...
}
```

This applies to the default `[locale]` routing. [Rewrite mode](../api-reference/proxy#rewrite-mode) reads the locale from request headers, so its pages are rendered on each request.
