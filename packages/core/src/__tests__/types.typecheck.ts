// Type-level checks, run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import type { ConfigCheck, ValidatableConfig } from '../internal'

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
