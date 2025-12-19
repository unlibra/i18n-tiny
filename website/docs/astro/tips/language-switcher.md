---
sidebar_position: 2
---

# 言語スイッチャー

```astro
---
// src/components/LanguageSwitcher.astro
import Link from '@i18n-tiny/astro/router/Link.astro'
import { locales } from '../i18n'

const locale = Astro.params.locale ?? Astro.locals.locale

const localeNames: Record<string, string> = {
  en: 'English',
  ja: '日本語'
}
---

<nav>
  {locales.map((loc) => (
    <Link
      href="/"
      locale={loc}
    >
      {localeNames[loc]}
    </Link>
  ))}
</nav>
```
