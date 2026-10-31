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
const rewriteConfig = { ...routerConfig, prefixDefault: true } as const
create({ ...rewriteConfig, routing: 'rewrite', detectLanguage: true })
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create({ ...routerConfig, routing: 'rewrite', detectLanguage: true })
// @ts-expect-error the language detection in the rewrite mode needs prefixDefault: true
create({ ...routerConfig, routing: 'rewrite', detectLanguage: true, prefixDefault: false })
const someBoolean: boolean = Math.random() > 0.5
// @ts-expect-error a detectLanguage that may be true needs prefixDefault: true
create({ ...routerConfig, routing: 'rewrite', detectLanguage: someBoolean })
// @ts-expect-error a prefixDefault that may be false does not go with the language detection
create({ ...routerConfig, routing: 'rewrite', detectLanguage: true, prefixDefault: someBoolean })
// Without the language detection, prefixDefault may be any boolean
create({ ...routerConfig, routing: 'rewrite', prefixDefault: someBoolean })
create({ ...routerConfig, routing: 'rewrite', detectLanguage: someBoolean, prefixDefault: true })
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
