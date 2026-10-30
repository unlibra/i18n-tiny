// The locale settings, shared by define() and the proxy. In the rewrite
// mode with the language detection, a URL without a locale prefix is the
// detected locale, so the links for a locale always get its prefix: /en, /ja
export const config = { locales: ['en', 'ja'], defaultLocale: 'en', prefixDefault: true } as const
