---
description: "Answers to common i18n-tiny questions: type-safe keys, missing keys, interpolation, plurals, language detection, locale prefixes and the Next.js proxy."
---

# i18n-tiny FAQ

## How are translation keys type-checked?

`define()` infers the key types from the messages of the default locale. Your editor autocompletes keys such as `t('common.title')`, and a key that does not exist fails the TypeScript type check. The messages of the other locales must have the same keys: a missing or extra key fails the type check of `define()`.

With a namespace, such as `useTranslations('common')` or `getTranslations(locale, 'common')`, keys are relative to it: `t('title')` reads `common.title`, and the full path `t('common.title')` fails the type check. The namespace must point to a nested object. Without a namespace, use full paths.

A key that points to a nested object, such as `t('common')` without a namespace, still passes the type check. At run time it returns the key and, in development, logs a warning. See [Type-Check Translation Keys in Astro](./astro/tips/typescript) for examples.

## What happens if a key is missing at runtime?

The translation function returns the key itself, such as `"common.missing"`, so the page still renders. In development (`NODE_ENV=development`), it also logs a warning: `[i18n] Missing key: "common.missing" in locale "ja"`. The same happens when a key points to a nested object instead of a string.

## How do I insert values into a message?

Write placeholders in braces, and pass the values as the second argument:

```typescript
// messages/en.ts: { greeting: 'Hello, {name}!' }
t('greeting', { name: 'Alice' }) // "Hello, Alice!"
```

Values can be strings or numbers. A placeholder without a matching value is left as is. To show a brace, write it twice:

```typescript
// messages/en.ts: { syntax: 'Write {{name}} in messages' }
t('syntax') // "Write {name} in messages"
```

With the messages of the default locale written `as const`, the values are type-checked too: a missing or misspelled value fails the type check.

## Are interpolated values HTML-escaped?

No. Values are inserted as they are. Rendering the result as normal text is safe, because React and Astro escape it:

```tsx
<p>{t('greeting', { name: userInput })}</p>
```

If you render the result as HTML, with `dangerouslySetInnerHTML` in React or `set:html` in Astro, sanitize user input first.

## Does it support plurals?

There are no built-in plural rules; messages support placeholders only. To choose between plural forms, keep one key per form and pick the key in your code, for example with the standard [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) API.

## How do I detect the visitor's language?

Use the i18n-tiny proxy in Next.js, or the middleware in Astro with server-side rendering, with `detectLanguage: true`. Detection is off by default. With it, for a URL without a locale prefix, they pick the best match from the browser's `Accept-Language` header. If it is another locale, they redirect to its prefixed URL, such as `/ja/about`. If it is the default locale, they serve it and keep the URL unchanged. With detection, also set `prefixDefault: true` in the config shared with `define()`, so that the links to the default locale have a prefix and are not detected again. See the [Next.js Proxy](./next/api-reference/proxy) and [Astro middleware](./astro/api-reference/middleware) references.

## Can the default locale have no URL prefix?

Yes, and it is the default. With `prefixDefault: false`, the proxy or middleware serves the default locale at URLs without a prefix, such as `/about`, and other locales use one, such as `/ja/about`. Set `prefixDefault: true` to prefix every locale, including the default.

## Should I use `middleware.ts` or `proxy.ts` in Next.js?

Use `proxy.ts`. Next.js 16 deprecated the Middleware file convention and renamed it to Proxy, so the file is `proxy.ts` and it exports a function named `proxy`. The i18n-tiny handler comes from `@i18n-tiny/next/proxy`:

```typescript
// proxy.ts
import { create } from '@i18n-tiny/next/proxy'
import { config } from './i18n.config' // { locales: ['en', 'ja'], defaultLocale: 'en' }

export const proxy = create({ ...config })
```

If your project still has a `middleware.ts`, run the [Next.js codemod](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#migration-to-proxy), which renames the file and the export: `npx @next/codemod@canary middleware-to-proxy .`. For the full setup, including the `matcher`, see [How to Add i18n to a Next.js App Router Project](./next/usage).

Astro still calls this feature middleware: use `@i18n-tiny/astro/middleware` in `src/middleware.ts`.

## Do I need `generateStaticParams` in every Next.js page?

No. Define it once in the root layout, and Next.js statically generates every page for every locale. See [Statically Generate Every Locale in Next.js](./next/tips/ssg).

## Can I use it with Astro's built-in i18n routing?

Yes. Keep Astro's `i18n` configuration for routing, and use i18n-tiny for type-safe translations. See [Typed Translations with Astro's Built-in i18n](./astro/tips/built-in-i18n).

## What is the difference between `@i18n-tiny/next` and `next-i18n-tiny`?

Nothing but the name. `next-i18n-tiny`, `astro-i18n-tiny` and `react-i18n-tiny` are aliases that re-export `@i18n-tiny/next`, `@i18n-tiny/astro` and `@i18n-tiny/react`, with the same version and the same entry points.

## How do I update from 1.x?

2.0 has breaking changes. See the [migration guide](https://github.com/unlibra/i18n-tiny/blob/main/MIGRATION.md), which shows the 1.x code and the 2.0 code for each change.
