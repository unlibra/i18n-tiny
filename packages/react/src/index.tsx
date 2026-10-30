'use client'

import type { ReactNode } from 'react'
import {
  I18nProvider as BaseProvider,
  useMessages as baseUseMessages,
  useTranslations as baseUseTranslations,
  useLocale as baseUseLocale,
  useLocales as baseUseLocales,
  useDefaultLocale as baseUseDefaultLocale
} from './components'
import type { ConfigCheck, NamespaceKeys, TranslationKeys } from '@i18n-tiny/core/internal'
import { validateConfig } from '@i18n-tiny/core/internal'

// Re-export types for Provider
export type { ProviderProps } from './components'

export type { I18nConfig } from '@i18n-tiny/core'

/**
 * Define i18n instance with automatic type inference
 *
 * `locales` and `defaultLocale` are required, and `messages` must have the
 * messages of each locale. An invalid config throws, and with `as const` or
 * an inline config it is a type error too.
 *
 * @example
 * import { define } from '@i18n-tiny/react'
 * import jaMessages from './messages/ja'
 * import enMessages from './messages/en'
 *
 * export const messages = { ja: jaMessages, en: enMessages }
 *
 * export const i18n = define({
 *   locales: ['ja', 'en'],
 *   defaultLocale: 'ja',
 *   messages
 * })
 *
 * // App.tsx
 * function App() {
 *   const [locale, setLocale] = useState(i18n.defaultLocale)
 *
 *   return (
 *     <i18n.Provider locale={locale} messages={messages[locale]}>
 *       <YourApp />
 *     </i18n.Provider>
 *   )
 * }
 *
 * // Component.tsx
 * function Component() {
 *   const messages = i18n.useMessages()
 *   const t = i18n.useTranslations()
 *   const locale = i18n.useLocale()
 *
 *   return <div>{messages.common.title}</div>
 * }
 */
export function define<
  const L extends readonly string[],
  Msgs extends Record<string, Record<string, unknown>>
> (
  config: {
    /** Supported locales */
    readonly locales: L
    /** The default locale */
    readonly defaultLocale: NoInfer<L[number]>
    /** The messages of each locale */
    readonly messages: Msgs
  } & ConfigCheck<{ locales: L, defaultLocale: L[number], messages: Msgs }>
) {
  type Locale = L[number]
  const { locales, defaultLocale, messages } = config
  validateConfig({ locales, defaultLocale, messages })

  // Type aliases for automatic inference
  type MessageType = Msgs[L[0] & keyof Msgs]
  type Namespace = NamespaceKeys<MessageType>

  function isLocale (value: unknown): value is Locale {
    return typeof value === 'string' && locales.includes(value)
  }

  /**
   * Provider of the locale and its messages. A locale that is not one of
   * `locales` throws.
   */
  function Provider ({ locale, messages: msgs, children }: {
    locale: Locale
    messages: MessageType
    children: ReactNode
  }) {
    if (!isLocale(locale)) {
      throw new Error(
        `[i18n] Unknown locale ${JSON.stringify(locale)}. ` +
        `Expected one of ${locales.map(l => JSON.stringify(l)).join(', ')}.`
      )
    }
    return (
      <BaseProvider
        locale={locale}
        messages={msgs}
        defaultLocale={defaultLocale}
        locales={locales}
      >
        {children}
      </BaseProvider>
    )
  }

  // Type-safe hooks with automatic inference
  function useMessages (): MessageType {
    return baseUseMessages<MessageType>()
  }

  // With a namespace, keys are relative to it: useTranslations('common') takes 'title' for 'common.title'
  function useTranslations<N extends Namespace | undefined = undefined> (namespace?: N): (key: TranslationKeys<MessageType, N>, vars?: Record<string, string | number>) => string {
    return baseUseTranslations<TranslationKeys<MessageType, N>>(namespace)
  }

  function useLocale (): Locale {
    return baseUseLocale() as Locale
  }

  function useLocales (): L {
    return baseUseLocales() as L
  }

  function useDefaultLocale (): Locale {
    return baseUseDefaultLocale() as Locale
  }

  return {
    Provider,
    useMessages,
    useTranslations,
    useLocale,
    useLocales,
    useDefaultLocale,
    isLocale,
    locales,
    defaultLocale: defaultLocale as Locale
  }
}
