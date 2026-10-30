// Type-level checks for define(), run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import type { InferGetStaticParamsType, InferGetStaticPropsType } from 'astro'
import { define } from '../index'
import type { I18nConfig } from '../index'
// @ts-expect-error DefineConfig is replaced by I18nConfig
import type { DefineConfig } from '../index'
import type { LinkProps } from '../internal'
import { create } from '../middleware'
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
const pageLocales: readonly ('en' | 'ja')[] = props.pageLocales
const urlLocale: 'en' | 'ja' | undefined = params.locale
// @ts-expect-error params.locale is undefined for the default locale
const urlLocaleAlways: 'en' | 'ja' = params.locale
// @ts-expect-error props.locale is a locale of the config, not any string
const notWide: 'en' = props.locale

i18n.getStaticPaths({ locales: ['ja'] })
// @ts-expect-error unknown locale
i18n.getStaticPaths({ locales: ['fr'] })

// With other dynamic parameters, their params and props are kept
const tools = ['color', 'hex'] as const
const getToolPaths = () => i18n.getStaticPaths({
  locales: ['en'],
  paths: tools.map(tool => ({ params: { tool }, props: { label: tool.toUpperCase() } }))
})
type ToolProps = InferGetStaticPropsType<typeof getToolPaths>
type ToolParams = InferGetStaticParamsType<typeof getToolPaths>
declare const toolProps: ToolProps
declare const toolParams: ToolParams
const toolLocale: 'en' | 'ja' = toolProps.locale
const label: string = toolProps.label
const tool: 'color' | 'hex' = toolParams.tool
const toolUrlLocale: 'en' | 'ja' | undefined = toolParams.locale
// Paths with and without props: the props of each path stay as they are
const getMixedPaths = () => i18n.getStaticPaths({
  paths: [{ params: { tool: 'a' }, props: { label: 'A' } }, { params: { tool: 'b' } }]
})
type MixedProps = InferGetStaticPropsType<typeof getMixedPaths>
declare const mixedProps: MixedProps
const mixedLocale: 'en' | 'ja' = mixedProps.locale
// @ts-expect-error the path without props has no label
const mixedLabel: string = mixedProps.label
const maybeLabel: string | undefined = 'label' in mixedProps ? mixedProps.label : undefined
// @ts-expect-error getStaticPaths() sets params.locale
i18n.getStaticPaths({ paths: [{ params: { locale: 'en' } }] })
// @ts-expect-error getStaticPaths() sets props.locale
i18n.getStaticPaths({ paths: [{ params: { tool: 'color' }, props: { locale: 'en' } }] })
// @ts-expect-error getStaticPaths() sets props.pageLocales
i18n.getStaticPaths({ paths: [{ params: { tool: 'color' }, props: { pageLocales: [] } }] })

// URL functions of define()
const localized: `/${string}` = i18n.localizedPath('/about', 'ja')
const alternate: `/${string}` = i18n.alternatePath('/ja/about', 'en')
const removed: `/${string}` = i18n.removeLocalePrefix('/ja/about')
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

// Props of the Link component: locale and normalize need the define() result
const keepLocale: LinkProps = { href: '/about' }
const withoutLocale: LinkProps = { href: '/about', locale: false }
const forLocale: LinkProps = { href: '/about', locale: 'en', i18n }
const normalized: LinkProps = { href: '/en/about', locale: 'ja', normalize: true, i18n }
const withAttributes: LinkProps = { href: '/about', class: 'nav', 'aria-current': 'page', i18n }
// @ts-expect-error a locale needs i18n
const localeWithoutI18n: LinkProps = { href: '/about', locale: 'en' }
// @ts-expect-error normalize needs i18n
const normalizeWithoutI18n: LinkProps = { href: '/about', normalize: true }
// @ts-expect-error locale="" without i18n, the 1.x way to leave the path without a locale: use locale={false}.
// With i18n, locale="" passes the type check and throws as an unknown locale.
const emptyLocale: LinkProps = { href: '/about', locale: '' }
// @ts-expect-error i18n is the define() result, not the locales
const localesAsI18n: LinkProps = { href: '/about', locale: 'en', i18n: ['ja', 'en'] }

// create() takes the same config, checked by type too
create({ ...config })
create({ ...config, prefixDefault: true, detectLanguage: false, excludePaths: ['/api'] })
create({ ...config, fallbackLocale: 'ja' })
// The rewrite mode takes detectLanguage too
create({ ...config, routing: 'rewrite', detectLanguage: false })
// @ts-expect-error prefixDefault does not apply to the rewrite mode
create({ ...config, routing: 'rewrite', prefixDefault: true })
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
  keepLocale, withoutLocale, forLocale, normalized, withAttributes, localeWithoutI18n, normalizeWithoutI18n,
  emptyLocale, localesAsI18n,
  title, locales, defaultLocale, prefixDefault, pageLocale, pageLocales, urlLocale, urlLocaleAlways, notWide,
  toolLocale, label, tool, toolUrlLocale, localized, alternate, removed, prefix, sameAsInput, routed,
  routedLocale, routedRemoved, getStaticPaths, getToolPaths, getMixedPaths, mixedLocale, mixedLabel, maybeLabel
}
export type { DefineConfig, getLocalizedPath, hasLocalePrefix }
