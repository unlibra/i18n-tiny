---
description: "Switch languages in Next.js without sending users back to the home page. Use the normalize prop of the i18n-tiny Link component with usePathname()."
---

# Next.js Language Switcher That Keeps the Page

To create a language switcher that keeps the current page, pass the current pathname to the `Link` with the `normalize` prop.

`normalize` removes the locale prefix of the `href` before the link for the new locale is built, which is what `usePathname()` returns.

## Implementation Example

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { Link, locales, useLocale } from '@/i18n'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const currentLocale = useLocale()

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

With `defaultLocale: 'en'`:

1.  `usePathname()` returns the current path, such as `/ja/about`.
2.  `Link` receives `/ja/about` as `href` and `en` as `locale`.
3.  `normalize` removes `/ja`, and the link is built for `en`: `/about`, as the default locale has no prefix.

`i18n.alternatePath(pathname, locale)` gives the same paths, for example for `router.push()`.

## With language detection

If you turn on detection in the proxy with `detectLanguage: true`, also put `prefixDefault: true` in the [config shared with `define()`](../api-reference/proxy#prefixdefault). With `prefixDefault: false`, a browser that prefers another locale than the default one cannot reach the pages of the default locale: the link to the default locale has no prefix, and the proxy detects its language again, so a browser that prefers Japanese follows the English link to `/about` and is redirected back to `/ja/about`. With `prefixDefault: true`, the URLs of the default locale have the prefix too (`/en/about`), and are not detected.

Without detection, the default, the language switcher works as it is.
