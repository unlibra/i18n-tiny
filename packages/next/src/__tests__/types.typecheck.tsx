// Type-level checks for define(), run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import { define as defineClient } from '../index.react-client'
import { define as defineServer } from '../index.react-server'

const config = {
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en' as const,
  messages: {
    en: { common: { title: 'Hello', nested: { deep: 'Deep' } }, top: 'Top' },
    ja: { common: { title: 'こんにちは', nested: { deep: '深い' } }, top: 'トップ' }
  }
}

for (const i18n of [defineClient(config), defineServer(config)]) {
  void (async () => {
    const t = await i18n.server.getTranslations('en')
    t('common.title')
    // @ts-expect-error unknown key
    t('common.missing')

    const common = await i18n.server.getTranslations('en', 'common')
    common('title')
    common('nested.deep')
    // @ts-expect-error with a namespace, keys are relative to it
    common('common.title')

    // @ts-expect-error a namespace must point to an object, not a string
    await i18n.server.getTranslations('en', 'top')
  })()
}

export function useClientTypeChecks () {
  const i18n = defineClient(config)
  const common = i18n.client.useTranslations('common')
  common('title')
  // @ts-expect-error with a namespace, keys are relative to it
  common('common.title')
  // @ts-expect-error unknown namespace
  i18n.client.useTranslations('missing')
}

// The Link props are the props of next/link's Link, with `locale` as a
// locale or false and `normalize`
import type NextLink from 'next/link'
import type { ComponentProps } from 'react'
import type { LinkProps } from '../router/Link'
type NextLinkWithLocale = Omit<ComponentProps<typeof NextLink>, 'locale'> & { locale?: string | false, normalize?: boolean }
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
export const linkPropsSame: Same<LinkProps, NextLinkWithLocale> = true
export const linkPropKeysSame: Same<keyof LinkProps, keyof NextLinkWithLocale> = true

// The old names are gone: the config type is I18nConfig
import type { I18nConfig } from '../index.react-client'
import type { I18nConfig as ServerI18nConfig } from '../index.react-server'
import type { I18nConfig as TypesI18nConfig } from '../types'
// @ts-expect-error DefineConfig is replaced by I18nConfig
import type { DefineConfig } from '../index.react-client'
// @ts-expect-error DefineConfig is replaced by I18nConfig
import type { DefineConfig as TypesDefineConfig } from '../types'
export type { I18nConfig, ServerI18nConfig, TypesI18nConfig, DefineConfig, TypesDefineConfig }

// The router has the URL functions that take the config object
import { alternatePath, localizedPath, pathLocale, removeLocalePrefix } from '../router'
// @ts-expect-error the positional form is gone: use localizedPath()
import { getLocalizedPath } from '../router'
// @ts-expect-error use pathLocale()
import { hasLocalePrefix } from '../router'
export { getLocalizedPath, hasLocalePrefix }
const routerConfig = { locales: ['en', 'ja'], defaultLocale: 'en' } as const
const routed: `/${string}` = localizedPath('/about', 'ja', routerConfig)
alternatePath('/ja/about', 'en', routerConfig)
removeLocalePrefix('/ja/about', routerConfig)
const routedLocale: 'en' | 'ja' | undefined = pathLocale('/ja/about', routerConfig)
// @ts-expect-error unknown locale
localizedPath('/about', 'fr', routerConfig)
void routed
void routedLocale

const messages = { en: { title: 'Hello' }, ja: { title: 'こんにちは' } }

for (const define of [defineClient, defineServer]) {
  // locales and defaultLocale are required, and the config is checked
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

  // The config can be spread from an object of its own
  const i18n = define({ ...routerConfig, prefixDefault: true, messages })
  const defaultLocale: 'en' | 'ja' = i18n.defaultLocale
  // @ts-expect-error define() does not return prefixDefault: it is in the config
  const prefixDefault: boolean = i18n.prefixDefault
  void defaultLocale
  void prefixDefault

  // The locale argument is a locale of the config
  void i18n.server.getMessages('ja')
  // @ts-expect-error unknown locale
  void i18n.server.getMessages('fr')
  // @ts-expect-error unknown locale
  void i18n.server.getTranslations('fr')
  const param: string = 'ja'
  // @ts-expect-error a string may be any locale: narrow it with isLocale()
  void i18n.server.getMessages(param)
  if (i18n.isLocale(param)) {
    void i18n.server.getMessages(param)
    void <i18n.Provider locale={param} messages={messages.en}>{null}</i18n.Provider>
  }
  // @ts-expect-error a string may be any locale: narrow it with isLocale()
  void <i18n.Provider locale={param} messages={messages.en}>{null}</i18n.Provider>

  // The URL functions
  const path: `/${string}` = i18n.localizedPath('/about', 'en')
  i18n.alternatePath('/en/about', 'ja')
  // @ts-expect-error define() has localizedPath and alternatePath only: use removeLocalePrefix() of the router entry
  i18n.removeLocalePrefix('/en/about')
  // @ts-expect-error define() has localizedPath and alternatePath only: use pathLocale() of the router entry
  const prefixLocale: 'en' | 'ja' | undefined = i18n.pathLocale('/en/about')
  // @ts-expect-error unknown locale
  i18n.localizedPath('/about', 'fr')
  void path
  void prefixLocale
}

export function clientTypeChecks () {
  const i18n = defineClient({ ...routerConfig, messages })
  const locale: 'en' | 'ja' = i18n.client.useLocale()
  // @ts-expect-error usePaths() is gone: use the URL functions of define(), or Link with normalize
  const paths = i18n.client.usePaths()
  // The URL functions of define() work in Client Components too
  const path: `/${string}` = i18n.localizedPath('/about', locale)
  return [path, paths]
}

// The proxy config is checked as define() checks it
import { create } from '../proxy'
import type { ProxyConfig } from '../proxy'
create({ ...routerConfig })
create({ ...routerConfig, prefixDefault: true, detectLanguage: false, fallbackLocale: 'ja' })
// The rewrite mode takes prefixDefault, so that the config of define() can be
// spread into it. With the language detection (detectLanguage: true), a URL
// without a locale prefix is the detected locale: prefixDefault must be true.
// Without detectLanguage, there is no detection
create({ ...routerConfig, routing: 'rewrite' })
create({ ...routerConfig, routing: 'rewrite', prefixDefault: false })
create({ ...routerConfig, routing: 'rewrite', prefixDefault: true })
create({ ...routerConfig, routing: 'rewrite', prefixDefault: true, detectLanguage: true })
create({ ...routerConfig, routing: 'rewrite', detectLanguage: false })
create({ ...routerConfig, routing: 'rewrite', detectLanguage: false, prefixDefault: false })
create({ ...routerConfig, routing: 'rewrite', detectLanguage: false, prefixDefault: true })
create({ ...routerConfig, routing: 'rewrite', detectLanguage: undefined })
const rewriteConfig = { ...routerConfig, prefixDefault: true } as const
create({ ...rewriteConfig, routing: 'rewrite', detectLanguage: true })
const satisfying = { ...routerConfig, routing: 'rewrite', detectLanguage: true, prefixDefault: true } as const satisfies ProxyConfig
create(satisfying)
// A config whose types say that it throws is a type error
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create({ ...routerConfig, routing: 'rewrite', detectLanguage: true })
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create({ ...routerConfig, routing: 'rewrite', detectLanguage: true, prefixDefault: false })
const throwing = { ...routerConfig, routing: 'rewrite', detectLanguage: true } as const satisfies ProxyConfig
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create(throwing)
// Where the types cannot tell, the config is left to the check of create()
// at run time: a value typed as boolean, a detectLanguage that may be
// undefined, a wider type, and a config typed as ProxyConfig
const someBoolean: boolean = Math.random() > 0.5
create({ ...routerConfig, routing: 'rewrite', detectLanguage: someBoolean })
create({ ...routerConfig, routing: 'rewrite', detectLanguage: true, prefixDefault: someBoolean })
create({ ...routerConfig, routing: 'rewrite', prefixDefault: someBoolean })
create({ ...routerConfig, routing: 'rewrite', detectLanguage: someBoolean, prefixDefault: true })
const maybeDetect = (Math.random() > 0.5 ? true : undefined) as true | undefined
create({ ...routerConfig, routing: 'rewrite', detectLanguage: maybeDetect })
interface WideRewriteConfig {
  readonly locales: readonly ['en', 'ja']
  readonly defaultLocale: 'en'
  readonly routing: 'rewrite'
  readonly detectLanguage?: boolean
  readonly prefixDefault?: boolean
}
const wideRewrite: WideRewriteConfig = { ...routerConfig, routing: 'rewrite', detectLanguage: true, prefixDefault: true }
create(wideRewrite)
const annotated: ProxyConfig = { ...routerConfig, routing: 'rewrite', detectLanguage: true, prefixDefault: true }
create(annotated)
const annotatedWithoutDetection: ProxyConfig = { ...routerConfig, routing: 'rewrite' }
create(annotatedWithoutDetection)
const annotatedStandard: ProxyConfig = { ...routerConfig, detectLanguage: true }
create(annotatedStandard)
function createAny (anyConfig: ProxyConfig): void {
  create(anyConfig)
}
createAny(routerConfig)
// A routing that may be 'rewrite' may also be the standard routing
const maybeRewrite = (Math.random() > 0.5 ? 'rewrite' : undefined) as 'rewrite' | undefined
create({ ...routerConfig, routing: maybeRewrite, detectLanguage: true })
// The type error says what to fix
const rewriteMessage: Parameters<typeof create<typeof throwing>>[0]['invalid i18n config'] =
  'the language detection of the rewrite mode needs prefixDefault: true; without it, detectLanguage must be false or left out'
export { rewriteMessage }
// @ts-expect-error the error of the config comes first
create({ locales: ['en', 'ja'], defaultLocale: 'fr', routing: 'rewrite' })
// @ts-expect-error defaultLocale is not one of locales
create({ locales: ['en', 'ja'], defaultLocale: 'fr' })
// @ts-expect-error fallbackLocale is not one of locales
create({ ...routerConfig, fallbackLocale: 'fr' })
// @ts-expect-error a locale is listed twice
create({ locales: ['en', 'ja', 'en'], defaultLocale: 'en' })

// Link: locale="" is gone, locale={false} leaves the path without a locale
import { Link } from '../router'
void <Link href="/about" locale="ja">ja</Link>
void <Link href="/about" locale={false}>raw</Link>
const someLocale: string = 'ja'
void <Link href="/about" locale={someLocale}>some</Link>
void <Link href="/about" locale={someLocale === 'ja' && 'ja'}>conditional</Link>
// @ts-expect-error locale="" is gone: use locale={false}
void <Link href="/about" locale="">empty</Link>

// Messages typed with an interface, which has no index signature, are taken too
interface InterfaceMessages {
  common: { title: string }
  top: string
}
const interfaceEn: InterfaceMessages = { common: { title: 'Hello' }, top: 'Top' }
const interfaceJa: InterfaceMessages = { common: { title: 'こんにちは' }, top: 'トップ' }
const clientWithInterface = defineClient({ ...routerConfig, messages: { en: interfaceEn, ja: interfaceJa } })
const serverWithInterface = defineServer({ ...routerConfig, messages: { en: interfaceEn, ja: interfaceJa } })
export async function interfaceTypeChecks () {
  const t = await clientWithInterface.server.getTranslations('en')
  t('common.title')
  // @ts-expect-error unknown key
  t('common.missing')
  const serverT = await serverWithInterface.server.getTranslations('en')
  serverT('common.title')
  // @ts-expect-error unknown key
  serverT('common.missing')
  const title: string = (await serverWithInterface.server.getMessages('ja')).common.title
  return title
}
export function useInterfaceTypeChecks () {
  const t = clientWithInterface.client.useTranslations()
  t('common.title')
  // @ts-expect-error unknown key
  t('common.missing')
  const title: string = clientWithInterface.client.useMessages().common.title
  return title
}

// Messages with `as const`: the default locale gives the keys and the vars,
// and the other locales are typed with LocaleMessages
import type { LocaleMessages } from '../index.react-client'
import type { LocaleMessages as ServerLocaleMessages } from '../index.react-server'
import type { LocaleMessages as TypesLocaleMessages } from '../types'
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
const enServerTyped: ServerLocaleMessages<typeof jaTyped> = enTyped
const enTypesTyped: TypesLocaleMessages<typeof jaTyped> = enTyped
void enServerTyped
void enTypesTyped
const typedConfig = { locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: enTyped, ja: jaTyped } } as const

for (const i18n of [defineClient(typedConfig), defineServer(typedConfig)]) {
  void (async () => {
    const t = await i18n.server.getTranslations('en')
    t('greeting', { name: 'Ann' })
    t('title')
    t('common.stats', { count: 1, total: 2 })
    // @ts-expect-error vars is missing
    t('greeting')
    // @ts-expect-error a variable is missing
    t('common.stats', { count: 1 })
    // @ts-expect-error an extra variable
    t('greeting', { name: 'Ann', extra: 1 })
    // @ts-expect-error a message without variables takes no vars
    t('title', { name: 'Ann' })

    const common = await i18n.server.getTranslations('en', 'common')
    common('stats', { count: 1, total: 2 })
    // @ts-expect-error vars is missing
    common('stats')

    // The messages of a locale are strings, not the literal types of the default locale
    const messages = await i18n.server.getMessages('en')
    const greeting: string = messages.greeting
    // @ts-expect-error not the literal type of the default locale
    const literal: 'こんにちは、{name}さん' = messages.greeting
    // The Provider takes the messages of any locale
    void <i18n.Provider locale="en" messages={messages}>{null}</i18n.Provider>
    void <i18n.Provider locale="ja" messages={jaTyped}>{null}</i18n.Provider>
    return [greeting, literal]
  })()
}

export function useClientMessagesTypeChecks () {
  const i18n = defineClient(typedConfig)
  const t = i18n.client.useTranslations()
  t('greeting', { name: 'Ann' })
  // @ts-expect-error vars is missing
  t('greeting')
  const common = i18n.client.useTranslations('common')
  common('stats', { count: 1, total: 2 })
  // @ts-expect-error a variable is missing
  common('stats', { total: 2 })
  const title: string = i18n.client.useMessages().title
  return title
}

// The keys of each locale must be those of the default locale
const jaPlain = { title: 'タイトル', common: { welcome: 'ようこそ' } }
const enMissing = { title: 'Title', common: {} }
const enExtra = { title: 'Title', common: { welcome: 'Welcome' }, extra: 'Extra' }
defineClient({ locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: { title: 'Title', common: { welcome: 'Welcome' } }, ja: jaPlain } })
// @ts-expect-error en misses common.welcome
defineClient({ locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: enMissing, ja: jaPlain } })
// @ts-expect-error en misses common.welcome
defineServer({ locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: enMissing, ja: jaPlain } })
// @ts-expect-error en has a key that ja does not have
defineClient({ locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: enExtra, ja: jaPlain } })
// @ts-expect-error en has a key that ja does not have
defineServer({ locales: ['en', 'ja'], defaultLocale: 'ja', messages: { en: enExtra, ja: jaPlain } })
