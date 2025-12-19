---
sidebar_position: 2
---

# Language Switcher

To create a language switcher that maintains the current page, use the `normalize` prop of the `Link` component.

The `normalize` prop removes any existing locale prefix from the `href` before applying the new locale, which is perfect when used with `usePathname()`.

## Implementation Example

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { Link } from '@i18n-tiny/next/router'
import { locales, client } from '@/i18n'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const currentLocale = client.useLocale()

  return (
    <div className="flex gap-4">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          normalize
          className={locale === currentLocale ? 'font-bold' : ''}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
```

### How it works

1.  `usePathname()` returns the current path (e.g., `/ja/about`).
2.  `Link` receives `/ja/about` as `href` and `en` as `locale`.
3.  Because `normalize` is set to `true`, the `Link` component removes `/ja` and then applies `/en`, resulting in `/en/about`.