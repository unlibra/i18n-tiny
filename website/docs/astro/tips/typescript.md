---
sidebar_position: 4
---

# TypeScript

## Astro.locals の型安全性

`Astro.locals.locale` への型安全なアクセスのために、プロジェクトに型参照を追加してください。

```typescript
// src/env.d.ts
/// <reference types="astro/client" />
/// <reference types="@i18n-tiny/astro/locals" />
```

これにより、以下の型が提供されます。
- `Astro.locals.locale` - 現在のロケール
- `Astro.locals.locales` - サポートされているロケールの配列
- `Astro.locals.originalPathname` - 元のパス（リライトモード時）
