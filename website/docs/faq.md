---
description: "Answers to common i18n-tiny questions: type-safe keys, missing keys, interpolation, plurals, language detection and locale prefixes."
---

# i18n-tiny FAQ

## How are translation keys type-checked?

`define()` infers the key types from the messages you pass to it. Your editor autocompletes keys such as `t('common.title')`, and a key that does not exist fails the TypeScript type check. See [Type-Check Translation Keys in Astro](./astro/tips/typescript) for examples.

## What happens if a key is missing at runtime?

The translation function returns the key itself, such as `"common.missing"`, so the page still renders. In development (`NODE_ENV=development`), it also logs a warning: `[i18n] Missing key: "common.missing" in locale "ja"`. The same happens when a key points to a nested object instead of a string.

## How do I insert values into a message?

Write placeholders in braces, and pass the values as the second argument:

```typescript
// messages/en.ts: { greeting: 'Hello, {name}!' }
t('greeting', { name: 'Alice' }) // "Hello, Alice!"
```

Values can be strings or numbers. A placeholder without a matching value is left as is.

## Are interpolated values HTML-escaped?

No. Values are inserted as they are. Rendering the result as normal text is safe, because React and Astro escape it:

```tsx
<p>{t('greeting', { name: userInput })}</p>
```

If you render the result as HTML, with `dangerouslySetInnerHTML` in React or `set:html` in Astro, sanitize user input first.

## Does it support plurals?

There are no built-in plural rules; messages support placeholders only. To choose between plural forms, keep one key per form and pick the key in your code, for example with the standard [`Intl.PluralRules`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) API.

## How do I detect the visitor's language?

Use the i18n-tiny proxy in Next.js, or the middleware in Astro with server-side rendering. By default, for a URL without a locale prefix, they pick the best match from the browser's `Accept-Language` header. If it is another locale, they redirect to its prefixed URL, such as `/ja/about`. If it is the default locale, they serve the page as is. Set `detectLanguage: false` to turn this off. See the [Next.js Proxy](./next/api-reference/proxy) and [Astro middleware](./astro/api-reference/middleware) references.

## Can the default locale have no URL prefix?

Yes, and it is the default. With `prefixDefault: false`, the proxy or middleware serves the default locale at URLs without a prefix, such as `/about`, and other locales use one, such as `/ja/about`. Set `prefixDefault: true` to prefix every locale, including the default.

## Do I need `generateStaticParams` in every Next.js page?

No. Define it once in the root layout, and Next.js statically generates every page for every locale. See [Statically Generate Every Locale in Next.js](./next/tips/ssg).

## Can I use it with Astro's built-in i18n routing?

Yes. Keep Astro's `i18n` configuration for routing, and use i18n-tiny for type-safe translations. See [Typed Translations with Astro's Built-in i18n](./astro/tips/built-in-i18n).

## What is the difference between `@i18n-tiny/next` and `next-i18n-tiny`?

Nothing but the name. `next-i18n-tiny`, `astro-i18n-tiny` and `react-i18n-tiny` are aliases that re-export `@i18n-tiny/next`, `@i18n-tiny/astro` and `@i18n-tiny/react`. Use version 1.2.1 or later of the aliases: earlier versions could not be imported.
