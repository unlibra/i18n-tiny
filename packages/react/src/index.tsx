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
import type { ConfigCheck, LocaleMessages, NamespaceKeys, Translate, TranslationKeys } from '@i18n-tiny/core/internal'

// Re-export types for Provider
export type { ProviderProps } from './components'

export type { I18nConfig, LocaleMessages } from '@i18n-tiny/core'

/**
 * Define i18n instance with automatic type inference
 *
 * `locales` and `defaultLocale` are required, and `messages` must have the
 * messages of each locale. With `as const` or an inline config, an invalid
 * config is a type error. The config is not checked at run time, to keep the
 * browser bundle small.
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
  const D extends L[number],
  Msgs extends Record<string, object>
> (
  config: {
    /** Supported locales */
    readonly locales: L
    /** The default locale */
    readonly defaultLocale: D
    /** The messages of each locale */
    readonly messages: Msgs
  } & ConfigCheck<{ locales: L, defaultLocale: D, messages: Msgs }>
) {
  type Locale = L[number]
  const { locales, defaultLocale } = config

  // The keys, and the vars of `as const` messages, come from the messages of
  // the default locale. The messages of a locale have its keys, with strings.
  type MessageType = Msgs[D & keyof Msgs]
  type Messages = LocaleMessages<MessageType>
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
    messages: Messages
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
        // Messages typed with an interface have no index signature
        messages={msgs as Record<string, unknown>}
        defaultLocale={defaultLocale}
        locales={locales}
      >
        {children}
      </BaseProvider>
    )
  }

  // Type-safe hooks with automatic inference
  function useMessages (): Messages {
    return baseUseMessages<Messages>()
  }

  // With a namespace, keys are relative to it: useTranslations('common') takes 'title' for 'common.title'
  function useTranslations<N extends Namespace | undefined = undefined> (namespace?: N): Translate<MessageType, N> {
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
