// Type-level checks, run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import type { ConfigCheck, ValidatableConfig } from '../internal'
import { alternatePath, getLinkHref, localizedPath, pathLocale, removeLocalePrefix } from '../router'
import type { I18nConfig } from '../router'

// The parameter type that define(), create() and the URL functions use
declare function check<const C extends ValidatableConfig> (config: C & ConfigCheck<C>): void

// Valid configs, `as const` or inline
const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
check(config)
check({ ...config, prefixDefault: true })
check({ locales: ['ja', 'en'], defaultLocale: 'en' })
check({ locales: ['zh-hans', 'en-US'], defaultLocale: 'en-US' })
check({ ...config, fallbackLocale: 'en' })
check({ ...config, messages: { ja: {}, en: {} } })

// Configs typed as string[] cannot be checked by type, only at runtime
const wide: { locales: string[], defaultLocale: string } = { locales: ['ja'], defaultLocale: 'fr' }
check(wide)

// Neither can a fallbackLocale typed as string, or messages whose locales are
// typed as string: these are left to the runtime check
const fallbackLocale: string = 'en'
check({ ...config, fallbackLocale })
const builtMessages = Object.fromEntries(config.locales.map(locale => [locale, {}]))
check({ ...config, messages: builtMessages })
const recordMessages: Record<string, object> = { ja: {}, en: {} }
check({ ...config, messages: recordMessages })

// @ts-expect-error defaultLocale is not one of locales
check({ locales: ['ja', 'en'], defaultLocale: 'fr' })
const badDefault = { locales: ['ja', 'en'], defaultLocale: 'fr' } as const
// @ts-expect-error defaultLocale is not one of locales, `as const`
check(badDefault)
// @ts-expect-error a locale is listed twice
check({ locales: ['ja', 'en', 'ja'], defaultLocale: 'ja' })
// @ts-expect-error locales is empty
check({ locales: [], defaultLocale: 'ja' })
// @ts-expect-error an empty locale
check({ locales: ['ja', ''], defaultLocale: 'ja' })
// @ts-expect-error "." is not a path segment
check({ locales: ['ja', '.'], defaultLocale: 'ja' })
// @ts-expect-error ".." is not a path segment
check({ locales: ['ja', '..'], defaultLocale: 'ja' })
// @ts-expect-error a locale with "/"
check({ locales: ['ja', '/'], defaultLocale: 'ja' })
// @ts-expect-error a locale with "/" inside
check({ locales: ['ja', 'en/us'], defaultLocale: 'ja' })
// @ts-expect-error a locale with "\\"
check({ locales: ['ja', 'en\\us'], defaultLocale: 'ja' })
// @ts-expect-error a locale with whitespace
check({ locales: ['ja', 'en US'], defaultLocale: 'ja' })
// @ts-expect-error a locale with "?"
check({ locales: ['ja', 'en?'], defaultLocale: 'ja' })
// @ts-expect-error fallbackLocale is not one of locales
check({ ...config, fallbackLocale: 'fr' })
// @ts-expect-error messages is missing a locale
check({ ...config, messages: { ja: {} } })
// @ts-expect-error messages has a locale that is not in locales
check({ ...config, messages: { ja: {}, en: {}, fr: {} } })

// URL functions

// The result is a path, not the literal type of the input
const localized: `/${string}` = localizedPath('/donate', 'en', config)
// @ts-expect-error the result is not the input's literal type
const sameAsInput: '/donate' = localizedPath('/donate', 'ja', config)
const alternate: `/${string}` = alternatePath('/en/donate', 'ja', config)
const removed: `/${string}` = removeLocalePrefix('/en/donate', config)
// pathLocale() returns a locale of the config
const prefix: 'ja' | 'en' | undefined = pathLocale('/en/donate', config)
// @ts-expect-error pathLocale() may find no prefix
const prefixAlways: 'ja' | 'en' = pathLocale('/en/donate', config)

// The locale must be one of locales
// @ts-expect-error unknown locale
localizedPath('/donate', 'fr', config)
// @ts-expect-error unknown locale
alternatePath('/donate', 'fr', config)
// @ts-expect-error unknown locale, inline config
localizedPath('/donate', 'fr', { locales: ['ja', 'en'], defaultLocale: 'ja' })
// The pathname can be any string, such as Astro.url.pathname
const pathname: string = '/en/donate'
alternatePath(pathname, 'ja', config)

// Invalid configs are type errors where the locales are literal types
// @ts-expect-error defaultLocale is not one of locales
localizedPath('/donate', 'en', { locales: ['ja', 'en'], defaultLocale: 'fr' })
// @ts-expect-error a locale is listed twice
alternatePath('/donate', 'en', { locales: ['ja', 'en', 'en'], defaultLocale: 'ja' })
// @ts-expect-error defaultLocale is not one of locales
removeLocalePrefix('/en/donate', badDefault)
// @ts-expect-error defaultLocale is not one of locales
pathLocale('/en/donate', badDefault)
// @ts-expect-error prefixDefault is a boolean
localizedPath('/donate', 'en', { ...config, prefixDefault: 'yes' })

// A config typed as I18nConfig takes any locale, checked at runtime
const typed: I18nConfig = { locales: ['ja', 'en'], defaultLocale: 'ja' }
localizedPath('/donate', 'fr', typed)
const typedLocale: string | undefined = pathLocale('/en/donate', typed)
// I18nConfig<L> keeps the locales
const narrow: I18nConfig<'ja' | 'en'> = config
localizedPath('/donate', 'en', narrow)
// @ts-expect-error unknown locale
localizedPath('/donate', 'fr', narrow)

// getLinkHref(): the config is required with a locale or normalize
getLinkHref('/about', '/en/page', 'en', {})
getLinkHref('/about', '/en/page', 'en', { locale: false })
getLinkHref('/about', '/en/page', 'en', { locale: 'ja', config })
getLinkHref('/en/about', '/en/page', 'en', { locale: 'ja', normalize: true, config })
getLinkHref('/en/about', '/en/page', 'en', { normalize: true, config })
getLinkHref('/about', '/en/page', 'en', { locale: 'fr', config: typed })
// @ts-expect-error a locale needs the config
getLinkHref('/about', '/en/page', 'en', { locale: 'ja' })
// @ts-expect-error normalize needs the config
getLinkHref('/en/about', '/en/page', 'en', { normalize: true })
// @ts-expect-error unknown locale
getLinkHref('/about', '/en/page', 'en', { locale: 'fr', config })
// @ts-expect-error the empty locale is not a way to leave the path without a locale
getLinkHref('/about', '/en/page', 'en', { locale: '', config })
// @ts-expect-error defaultLocale is not one of locales
getLinkHref('/about', '/en/page', 'en', { locale: 'en', config: { locales: ['ja', 'en'], defaultLocale: 'fr' } })
const linkHrefResult: string = getLinkHref('/about', '/en/page', 'en', {})

export { linkHrefResult, localized, sameAsInput, alternate, removed, prefix, prefixAlways, typedLocale }
