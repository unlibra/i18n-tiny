// Type-level checks for define(), run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import { define } from '../index'

const i18n = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: {
    en: { common: { title: 'Hello', nested: { deep: 'Deep' } }, top: 'Top' },
    ja: { common: { title: 'こんにちは', nested: { deep: '深い' } }, top: 'トップ' }
  }
})

export function useTypeChecks () {
  const t = i18n.useTranslations()
  t('common.title')
  t('common.nested.deep')
  t('top')
  // @ts-expect-error unknown key
  t('common.missing')

  const common = i18n.useTranslations('common')
  common('title')
  common('nested.deep')
  // @ts-expect-error with a namespace, keys are relative to it
  common('common.title')

  const nested = i18n.useTranslations('common.nested')
  nested('deep')

  // @ts-expect-error a namespace must point to an object, not a string
  i18n.useTranslations('top')
  // @ts-expect-error unknown namespace
  i18n.useTranslations('missing')
}

// The old names are gone: the config type is I18nConfig, the Provider props ProviderProps
import type { I18nConfig, ProviderProps } from '../index'
// @ts-expect-error DefineConfig is replaced by I18nConfig
import type { DefineConfig } from '../index'
// @ts-expect-error I18nProviderProps is replaced by ProviderProps
import type { I18nProviderProps } from '../components'

const localeConfig: I18nConfig<'en' | 'ja'> = { locales: ['en', 'ja'], defaultLocale: 'en' }
void localeConfig
export type { ProviderProps, DefineConfig, I18nProviderProps }

const messages = { en: { title: 'Hello' }, ja: { title: 'こんにちは' } }

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
const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const
const spread = define({ ...config, messages })

export function useLocaleTypeChecks () {
  const locale: 'en' | 'ja' = spread.useLocale()
  const defaultLocale: 'en' | 'ja' = spread.defaultLocale
  // @ts-expect-error the locale is one of locales, not any string
  const other: 'en' = spread.useLocale()

  // The Provider takes a locale of the config
  void <spread.Provider locale="ja" messages={messages.ja}>{null}</spread.Provider>
  // @ts-expect-error unknown locale
  void <spread.Provider locale="fr" messages={messages.en}>{null}</spread.Provider>
  const value: string = 'ja'
  // @ts-expect-error a string may be any locale: narrow it with isLocale()
  void <spread.Provider locale={value} messages={messages.en}>{null}</spread.Provider>
  if (spread.isLocale(value)) {
    void <spread.Provider locale={value} messages={messages.en}>{null}</spread.Provider>
  }
  return [locale, defaultLocale, other]
}

// Messages typed with an interface, which has no index signature, are taken too
interface InterfaceMessages {
  common: { title: string }
  top: string
}
const interfaceEn: InterfaceMessages = { common: { title: 'Hello' }, top: 'Top' }
const interfaceJa: InterfaceMessages = { common: { title: 'こんにちは' }, top: 'トップ' }
const withInterface = define({ ...config, messages: { en: interfaceEn, ja: interfaceJa } })

export function useInterfaceTypeChecks () {
  const t = withInterface.useTranslations()
  t('common.title')
  // @ts-expect-error unknown key
  t('common.missing')
  const title: string = withInterface.useMessages().common.title
  return title
}
