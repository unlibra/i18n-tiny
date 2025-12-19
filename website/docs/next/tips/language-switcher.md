---
sidebar_position: 2
---

# 言語スイッチャー

```typescript
'use client'
import { Link, useLocale } from '@/i18n'

export function LanguageSwitcher() {
  const pathname = usePathname()

  return (
    <div>
      <Link href={pathname} locale="en" normalize> // /ja/about -> /en/about
        English
      </Link>
      <Link href={pathname} locale="ja" normalize> // /en/about -> /ja/about
        日本語
      </Link>
    </div>
  )
}
```
