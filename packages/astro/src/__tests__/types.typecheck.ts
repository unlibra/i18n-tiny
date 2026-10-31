// Type-level checks for define(), run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import type { InferGetStaticParamsType, InferGetStaticPropsType } from 'astro'
import { define } from '../index'
import type { I18nConfig } from '../index'
// @ts-expect-error DefineConfig is replaced by I18nConfig
import type { DefineConfig } from '../index'
import type { LinkProps } from '../internal'
import { create } from '../middleware'
import type { MiddlewareConfig } from '../middleware'
import { alternatePath, localizedPath, pathLocale, removeLocalePrefix } from '../router'
// @ts-expect-error the positional form is gone: use localizedPath()
import { getLocalizedPath } from '../router'
// @ts-expect-error use pathLocale()
import { hasLocalePrefix } from '../router'

const messages = {
  en: { common: { title: 'Hello', nested: { deep: 'Deep' } }, top: 'Top' },
  ja: { common: { title: 'こんにちは', nested: { deep: '深い' } }, top: 'トップ' }
}

// locales and defaultLocale are required
// @ts-expect-error locales and defaultLocale are missing
define({ messages })
// @ts-expect-error defaultLocale is missing
define({ locales: ['en', 'ja'], messages })
// @ts-expect-error defaultLocale is not one of locales
define({ locales: ['en', 'ja'], defaultLocale: 'fr', messages })
// @ts-expect-error a locale is listed twice
define({ locales: ['en', 'ja', 'en'], defaultLocale: 'en', messages })
// @ts-expect-error messages is missing a locale
define({ locales: ['en', 'ja', 'fr'], defaultLocale: 'en', messages })
// @ts-expect-error messages has a locale that is not in locales
define({ locales: ['en'], defaultLocale: 'en', messages })

// The config of the URL functions can be spread into define()
const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const satisfies I18nConfig
const i18n = define({ ...config, messages })
const prefixed = define({ ...config, prefixDefault: true, messages })

// Locales widened to string[] are left to the runtime check
const wideLocales: string[] = ['en', 'ja']
define({ locales: wideLocales, defaultLocale: 'en', messages })

// The returned config keeps the locale types
const locales: readonly ['en', 'ja'] = i18n.locales
const defaultLocale: 'en' | 'ja' = i18n.defaultLocale
// @ts-expect-error define() does not return prefixDefault: it is in the config
const prefixDefault: boolean = prefixed.prefixDefault

// Keys are typed from the messages
const title: string = i18n.getMessages('en').common.title
i18n.getTranslations('en')('common.title')
// @ts-expect-error unknown key
i18n.getTranslations('en')('common.missing')

const common = i18n.getTranslations('en', 'common')
common('title')
common('nested.deep')
// @ts-expect-error with a namespace, keys are relative to it
common('common.title')
// @ts-expect-error a namespace must point to an object, not a string
i18n.getTranslations('en', 'top')

// The locale argument is a locale of the config
// @ts-expect-error unknown locale
i18n.getMessages('fr')
// @ts-expect-error no locale
i18n.getMessages(undefined)
// @ts-expect-error unknown locale
i18n.getTranslations('fr')
declare const param: string | undefined
// @ts-expect-error a string may be any locale: narrow it with isLocale()
i18n.getMessages(param)
if (i18n.isLocale(param)) {
  const narrowed: 'en' | 'ja' = param
  i18n.getMessages(narrowed)
}

// getStaticPaths()
const getStaticPaths = () => i18n.getStaticPaths()
type Props = InferGetStaticPropsType<typeof getStaticPaths>
type Params = InferGetStaticParamsType<typeof getStaticPaths>
declare const props: Props
declare const params: Params
const pageLocale: 'en' | 'ja' = props.locale
// @ts-expect-error the props have the locale of the page only
const pageLocales: readonly ('en' | 'ja')[] = props.pageLocales
const urlLocale: 'en' | 'ja' | undefined = params.locale
// @ts-expect-error params.locale is undefined for the default locale
const urlLocaleAlways: 'en' | 'ja' = params.locale
// @ts-expect-error props.locale is a locale of the config, not any string
const notWide: 'en' = props.locale

i18n.getStaticPaths({ locales: ['ja'] })
// @ts-expect-error unknown locale
i18n.getStaticPaths({ locales: ['fr'] })

// @ts-expect-error getStaticPaths() takes the locales only
i18n.getStaticPaths({ paths: [{ params: { tool: 'color' } }] })

// Other dynamic parameters are combined with the paths of the locales
const tools = ['color', 'hex'] as const
const getToolPaths = () => tools.flatMap(tool => i18n.getStaticPaths({ locales: ['en'] })
  .map(({ params, props }) => ({ params: { ...params, tool }, props: { ...props, label: tool.toUpperCase() } })))
type ToolProps = InferGetStaticPropsType<typeof getToolPaths>
type ToolParams = InferGetStaticParamsType<typeof getToolPaths>
declare const toolProps: ToolProps
declare const toolParams: ToolParams
const toolLocale: 'en' | 'ja' = toolProps.locale
const label: string = toolProps.label
const tool: 'color' | 'hex' = toolParams.tool
const toolUrlLocale: 'en' | 'ja' | undefined = toolParams.locale

// URL functions of define()
const localized: `/${string}` = i18n.localizedPath('/about', 'ja')
const alternate: `/${string}` = i18n.alternatePath('/ja/about', 'en')
// @ts-expect-error define() has localizedPath and alternatePath only: use removeLocalePrefix() of the router entry
const removed: `/${string}` = i18n.removeLocalePrefix('/ja/about')
// @ts-expect-error define() has localizedPath and alternatePath only: use pathLocale() of the router entry
const prefix: 'en' | 'ja' | undefined = i18n.pathLocale('/ja/about')
// @ts-expect-error unknown locale
i18n.localizedPath('/about', 'fr')
// @ts-expect-error unknown locale
i18n.alternatePath('/about', 'fr')
// @ts-expect-error the result is not the input's literal type
const sameAsInput: '/about' = i18n.localizedPath('/about', 'en')

// URL functions of the router entry take the config object
const routed: `/${string}` = localizedPath('/about', 'ja', config)
alternatePath('/ja/about', 'en', config)
const routedLocale: 'en' | 'ja' | undefined = pathLocale('/ja/about', config)
const routedRemoved: `/${string}` = removeLocalePrefix('/ja/about', config)
// @ts-expect-error the locales array form is gone: pass the config object
removeLocalePrefix('/ja/about', ['en', 'ja'])
// @ts-expect-error unknown locale
localizedPath('/about', 'fr', config)
// @ts-expect-error defaultLocale is not one of locales
removeLocalePrefix('/ja/about', { locales: ['en', 'ja'], defaultLocale: 'fr' })

// Props of the Link component: a locale needs the define() result
const keepLocale: LinkProps = { href: '/about' }
const keepLocaleWithI18n: LinkProps = { href: '/about', i18n }
const withoutLocale: LinkProps = { href: '/about', locale: false }
const withoutLocaleWithI18n: LinkProps = { href: '/about', locale: false, i18n }
const forLocale: LinkProps = { href: '/about', locale: 'en', i18n }
const forPrefixed: LinkProps = { href: '/about', locale: 'en', i18n: prefixed }
const withAttributes: LinkProps = { href: '/about', class: 'nav', 'aria-current': 'page' }
// @ts-expect-error a locale needs i18n
const localeWithoutI18n: LinkProps = { href: '/about', locale: 'en' }
// @ts-expect-error normalize is gone: use alternatePath() of define() for the current page
const normalized: LinkProps = { href: '/en/about', locale: 'ja', normalize: true, i18n }
// @ts-expect-error locale="" without i18n, the 1.x way to leave the path without a locale: use locale={false}.
// With i18n, locale="" passes the type check and throws as an unknown locale.
const emptyLocale: LinkProps = { href: '/about', locale: '' }
// @ts-expect-error i18n is the define() result, not the locales
const localesAsI18n: LinkProps = { href: '/about', locale: 'en', i18n: ['ja', 'en'] }
// @ts-expect-error i18n is the define() result, not the config
const configAsI18n: LinkProps = { href: '/about', locale: 'en', i18n: config }

// create() takes the same config, checked by type too
create({ ...config })
create({ ...config, prefixDefault: true, detectLanguage: false, excludePaths: ['/api'] })
create({ ...config, fallbackLocale: 'ja' })
// The rewrite mode takes prefixDefault, so that the config of define() can be
// spread into it. With the language detection (detectLanguage: true), a URL
// without a locale prefix is the detected locale: prefixDefault must be true.
// Without detectLanguage, there is no detection
create({ ...config, routing: 'rewrite' })
create({ ...config, routing: 'rewrite', prefixDefault: false })
create({ ...config, routing: 'rewrite', prefixDefault: true })
create({ ...config, routing: 'rewrite', prefixDefault: true, detectLanguage: true })
create({ ...config, routing: 'rewrite', detectLanguage: false })
create({ ...config, routing: 'rewrite', detectLanguage: false, prefixDefault: false })
create({ ...config, routing: 'rewrite', detectLanguage: false, prefixDefault: true })
create({ ...config, routing: 'rewrite', detectLanguage: undefined })
const rewriteConfig = { ...config, prefixDefault: true } as const
create({ ...rewriteConfig, routing: 'rewrite', detectLanguage: true })
const satisfying = { ...config, routing: 'rewrite', detectLanguage: true, prefixDefault: true } as const satisfies MiddlewareConfig
create(satisfying)
// A config whose types say that it throws is a type error
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create({ ...config, routing: 'rewrite', detectLanguage: true })
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create({ ...config, routing: 'rewrite', detectLanguage: true, prefixDefault: false })
const throwing = { ...config, routing: 'rewrite', detectLanguage: true } as const satisfies MiddlewareConfig
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create(throwing)
// Where the types cannot tell, the config is left to the check of create()
// at run time: a value typed as boolean, a detectLanguage that may be
// undefined, a wider type, and a config typed as MiddlewareConfig
const someBoolean: boolean = Math.random() > 0.5
create({ ...config, routing: 'rewrite', detectLanguage: someBoolean })
create({ ...config, routing: 'rewrite', detectLanguage: true, prefixDefault: someBoolean })
create({ ...config, routing: 'rewrite', prefixDefault: someBoolean })
create({ ...config, routing: 'rewrite', detectLanguage: someBoolean, prefixDefault: true })
const maybeDetect = (Math.random() > 0.5 ? true : undefined) as true | undefined
create({ ...config, routing: 'rewrite', detectLanguage: maybeDetect })
interface WideRewriteConfig {
  readonly locales: readonly ['en', 'ja']
  readonly defaultLocale: 'en'
  readonly routing: 'rewrite'
  readonly detectLanguage?: boolean
  readonly prefixDefault?: boolean
}
const wideRewrite: WideRewriteConfig = { ...config, routing: 'rewrite', detectLanguage: true, prefixDefault: true }
create(wideRewrite)
const annotated: MiddlewareConfig = { ...config, routing: 'rewrite', detectLanguage: true, prefixDefault: true }
create(annotated)
const annotatedWithoutDetection: MiddlewareConfig = { ...config, routing: 'rewrite' }
create(annotatedWithoutDetection)
const annotatedStandard: MiddlewareConfig = { ...config, detectLanguage: true }
create(annotatedStandard)
function createAny (anyConfig: MiddlewareConfig): void {
  create(anyConfig)
}
createAny(config)
// A routing that may be 'rewrite' may also be the standard routing
const maybeRewrite = (Math.random() > 0.5 ? 'rewrite' : undefined) as 'rewrite' | undefined
create({ ...config, routing: maybeRewrite, detectLanguage: true })
// The type error says what to fix
const rewriteMessage: Parameters<typeof create<typeof throwing>>[0]['invalid i18n config'] =
  'the language detection of the rewrite mode needs prefixDefault: true; without it, detectLanguage must be false or left out'
export { rewriteMessage }
// @ts-expect-error the error of the config comes first
create({ locales: ['en', 'ja'], defaultLocale: 'fr', routing: 'rewrite' })
// @ts-expect-error defaultLocale is not one of locales
create({ locales: ['en', 'ja'], defaultLocale: 'fr' })
// @ts-expect-error fallbackLocale is not one of locales
create({ ...config, fallbackLocale: 'fr' })
// @ts-expect-error a locale is listed twice
create({ locales: ['en', 'en'], defaultLocale: 'en' })
// @ts-expect-error defaultLocale is required
create({ locales: ['en', 'ja'] })

// Messages typed with an interface, which has no index signature, are taken too
interface InterfaceMessages {
  common: { title: string }
  top: string
}
const interfaceEn: InterfaceMessages = { common: { title: 'Hello' }, top: 'Top' }
const interfaceJa: InterfaceMessages = { common: { title: 'こんにちは' }, top: 'トップ' }
const withInterface = define({ ...config, messages: { en: interfaceEn, ja: interfaceJa } })
const interfaceT = withInterface.getTranslations('en')
interfaceT('common.title')
// @ts-expect-error unknown key
interfaceT('common.missing')
const interfaceTitle: string = withInterface.getMessages('ja').common.title

export {
  interfaceTitle,
  keepLocale, keepLocaleWithI18n, withoutLocale, withoutLocaleWithI18n, forLocale, forPrefixed, normalized, withAttributes,
  localeWithoutI18n, emptyLocale, localesAsI18n, configAsI18n,
  title, locales, defaultLocale, prefixDefault, pageLocale, pageLocales, urlLocale, urlLocaleAlways, notWide,
  toolLocale, label, tool, toolUrlLocale, localized, alternate, removed, prefix, sameAsInput, routed,
  routedLocale, routedRemoved, getStaticPaths, getToolPaths
}
export type { DefineConfig, getLocalizedPath, hasLocalePrefix }

// Messages with `as const`: the default locale gives the keys and the vars,
// and the other locales are typed with LocaleMessages
import type { LocaleMessages } from '../index'
const jaTyped = {
  greeting: 'こんにちは、{name}さん',
  title: 'タイトル',
  common: { stats: '{count} / {total}' }
} as const
const enTyped: LocaleMessages<typeof jaTyped> = {
  greeting: 'Hello, {name}',
  title: 'Title',
  common: { stats: '{count} of {total}' }
}
const typed = define({ locales: ['ja', 'en'], defaultLocale: 'ja', messages: { ja: jaTyped, en: enTyped } })
const typedT = typed.getTranslations('en')
typedT('greeting', { name: 'Ann' })
typedT('title')
typedT('common.stats', { count: 1, total: 2 })
// @ts-expect-error vars is missing
typedT('greeting')
// @ts-expect-error a variable is missing
typedT('common.stats', { count: 1 })
// @ts-expect-error an extra variable
typedT('greeting', { name: 'Ann', extra: 1 })
// @ts-expect-error a message without variables takes no vars
typedT('title', { name: 'Ann' })
const typedCommon = typed.getTranslations('ja', 'common')
typedCommon('stats', { count: 1, total: 2 })
// @ts-expect-error vars is missing
typedCommon('stats')
// The messages of a locale are strings, not the literal types of the default locale
const typedGreeting: string = typed.getMessages('en').greeting
// @ts-expect-error not the literal type of the default locale
const typedLiteral: 'こんにちは、{name}さん' = typed.getMessages('en').greeting
export { typedGreeting, typedLiteral }

// Messages typed as string take any vars, as in 1.x
const wideT = i18n.getTranslations('en')
wideT('common.title')
wideT('common.title', { any: 1 })

// The keys come from the default locale, not from all locales
const enOnly = { common: { title: 'Hello' }, extra: 'Extra' }
const jaBase = { common: { title: 'こんにちは' } }
// @ts-expect-error en has a key that ja, the default locale, does not have
define({ locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: enOnly, ja: jaBase } })
// @ts-expect-error ja misses the key "extra" of en, the default locale
define({ locales: ['en', 'ja'], defaultLocale: 'en', messages: { en: enOnly, ja: jaBase } })
const enMissing = { common: {} }
// @ts-expect-error en misses common.title
define({ locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: enMissing, ja: jaBase } })
