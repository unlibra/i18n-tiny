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

// The forms of 1.x are gone
// @ts-expect-error removeLocalePrefix() takes the config, not the locales
removeLocalePrefix('/en/donate', ['ja', 'en'])
// @ts-expect-error getLinkHref() takes the options, not a locale string
getLinkHref('/donate', '/en', 'en', 'ja')
// @ts-expect-error the options need the config, not the locales
getLinkHref('/donate', '/en', 'en', { locale: 'ja', locales: ['ja', 'en'] })
// @ts-expect-error locale "" is gone: use false
getLinkHref('/donate', '/en', 'en', { locale: '', config })
// @ts-expect-error use localizedPath()
import { getLocalizedPath } from '../router'
// @ts-expect-error use pathLocale()
import { hasLocalePrefix } from '../router'
// @ts-expect-error use LinkHrefOptions
import type { GetLinkHrefOptions } from '../router'
// @ts-expect-error DefineConfig is replaced by I18nConfig
import type { DefineConfig } from '../index'
export type { getLocalizedPath, hasLocalePrefix, GetLinkHrefOptions, DefineConfig }

// Messages

import type { LocaleMessages, Translate, VariableNames } from '../internal'
import type { LocaleMessages as PublicLocaleMessages } from '../index'
import { grammarCases } from './grammar.cases'

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false

// The variable names of each message of the grammar table, which
// grammar.test.ts runs: the messages whose names differ, or never
type GrammarCase = (typeof grammarCases)[number]
type GrammarMismatch = GrammarCase extends infer C
  ? C extends GrammarCase
    ? Equal<VariableNames<C['message']>, C['names'][number]> extends true ? never : C['message']
    : never
  : never
const grammarMatches: [GrammarMismatch] extends [never] ? true : GrammarMismatch = true
// A message typed as string has no names to find
const wideNames: Equal<VariableNames<string>, never> = true
export { grammarMatches, wideNames }

// The vars of t() are typed from messages with literal types
const typedMessages = {
  title: 'Title',
  greeting: 'Hello, {name}!',
  stats: '{count} of {total}',
  braces: 'Use {{name}} for {name}',
  escaped: 'Write {{name}}',
  common: { welcome: 'Welcome, {user}', plain: 'Plain' }
} as const
declare const t: Translate<typeof typedMessages>

t('title')
t('greeting', { name: 'Ann' })
t('greeting', { name: 1 })
t('stats', { count: 1, total: 2 })
t('braces', { name: 'Ann' })
t('escaped')
t('common.welcome', { user: 'Ann' })
t('common.plain')
// @ts-expect-error vars is missing
t('greeting')
// @ts-expect-error a variable is missing
t('greeting', {})
// @ts-expect-error a variable is missing
t('stats', { count: 1 })
// @ts-expect-error an extra variable
t('greeting', { name: 'Ann', extra: 1 })
// @ts-expect-error a misspelled variable
t('greeting', { nmae: 'Ann' })
// @ts-expect-error a value that is not a string or a number
t('greeting', { name: true })
// @ts-expect-error a value that is undefined
t('greeting', { name: undefined })
// @ts-expect-error a message without variables takes no vars
t('title', {})
// @ts-expect-error "{{name}}" is no variable
t('escaped', { name: 'Ann' })
// @ts-expect-error unknown key
t('missing')

// A namespace: the keys and their vars are relative to it
declare const common: Translate<typeof typedMessages, 'common'>
common('welcome', { user: 'Ann' })
common('plain')
// @ts-expect-error vars is missing
common('welcome')
// @ts-expect-error a variable of another message
common('welcome', { name: 'Ann' })
// @ts-expect-error with a namespace, keys are relative to it
common('common.welcome', { user: 'Ann' })

// A union of keys takes the vars of all of them
declare const unionKey: 'greeting' | 'stats'
t(unionKey, { name: 'Ann', count: 1, total: 2 })
// @ts-expect-error the vars of one of the keys only
t(unionKey, { name: 'Ann' })
declare const titleOrGreeting: 'title' | 'greeting'
t(titleOrGreeting, { name: 'Ann' })
// @ts-expect-error vars is needed when one of the keys has variables
t(titleOrGreeting)

// The vars are checked exactly for an object literal only: a variable of a
// wider type is taken, as TypeScript does for any object type
const withExtra = { name: 'Ann', extra: 1 }
t('greeting', withExtra)

// Messages typed as string take any vars, or none
const wideMessages: { title: string, greeting: string } = { title: 'Title', greeting: 'Hello, {name}!' }
declare const wideT: Translate<typeof wideMessages>
wideT('greeting')
wideT('greeting', { name: 'Ann' })
wideT('greeting', { anything: 1 })
wideT('title', {})
// @ts-expect-error the values are still strings or numbers
wideT('greeting', { name: true })
// @ts-expect-error unknown key
wideT('missing')

// LocaleMessages: the same keys, with strings as values
type Ja = typeof typedMessages
const en: LocaleMessages<Ja> = {
  title: 'Title in English',
  greeting: 'Hi, {name}',
  stats: '{count}/{total}',
  braces: '{name}',
  escaped: 'Write',
  common: { welcome: 'Hi {user}', plain: 'Plain' }
}
const publicEn: PublicLocaleMessages<Ja> = en
// @ts-expect-error a missing key
const missingKey: LocaleMessages<Ja> = { ...en, common: { welcome: 'Hi' } }
// @ts-expect-error an extra key, in an object literal
const extraKey: LocaleMessages<Ja> = { ...en, other: 'Other' }
// @ts-expect-error a string for a nested object
const notNested: LocaleMessages<Ja> = { ...en, common: 'Common' }
// @ts-expect-error a value that is not a string
const notString: LocaleMessages<Ja> = { ...en, title: 1 }
export { en, publicEn, missingKey, extraKey, notNested, notString, typedMessages, wideMessages }

// The config check compares the keys of each locale with those of the
// default locale, for messages imported from files too
const jaFile = { title: 'タイトル', common: { welcome: 'ようこそ' } } as const
const enFile = { title: 'Title', common: { welcome: 'Welcome' } }
const enMissing = { title: 'Title', common: {} }
const enExtra = { title: 'Title', common: { welcome: 'Welcome', other: 'Other' } }
const enFlat = { title: 'Title', common: 'Common' }
const enDeeper = { title: 'Title', common: { welcome: { deep: 'Deep' } } }
check({ ...config, messages: { ja: jaFile, en: enFile } })
// @ts-expect-error a locale misses a key
check({ ...config, messages: { ja: jaFile, en: enMissing } })
// @ts-expect-error a locale has a key that the default locale does not have
check({ ...config, messages: { ja: jaFile, en: enExtra } })
// @ts-expect-error a string where the default locale has a nested object
check({ ...config, messages: { ja: jaFile, en: enFlat } })
// @ts-expect-error a nested object where the default locale has a string
check({ ...config, messages: { ja: jaFile, en: enDeeper } })
// @ts-expect-error the default locale is the base: it misses a key of the other one
check({ ...config, defaultLocale: 'en', messages: { ja: jaFile, en: enMissing } })
// Messages typed with string keys cannot be compared
const recordEn: Record<string, string> = { title: 'Title' }
check({ ...config, messages: { ja: jaFile, en: recordEn } })
// A default locale typed with string keys cannot be compared either
const recordJa: Record<string, string> = { title: 'タイトル' }
check({ ...config, messages: { ja: recordJa, en: { title: 'Title' } } })
check({ ...config, messages: { ja: { nested: recordJa }, en: { nested: { title: 'Title' } } } })
// Arrays are not compared item by item, whichever locale is written as const
const jaList = { title: 'タイトル', items: ['一', '二'] } as const
const enList = { title: 'Title', items: ['One', 'Two'] }
check({ ...config, messages: { ja: jaList, en: enList } })
check({ ...config, defaultLocale: 'en', messages: { ja: jaList, en: enList } })
check({ ...config, messages: { ja: jaList, en: { ...enList, items: ['One'] } } })
// The keys next to an array are still compared
// @ts-expect-error a locale misses a key next to an array
check({ ...config, messages: { ja: jaList, en: { items: ['One', 'Two'] } } })
// @ts-expect-error a locale has a key next to an array that the default locale does not have
check({ ...config, messages: { ja: jaList, en: { ...enList, other: 'Other' } } })
// @ts-expect-error a string where the default locale has an array
check({ ...config, messages: { ja: jaList, en: { ...enList, items: 'One, Two' } } })
