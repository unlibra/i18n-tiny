'use client'

import {
  useMessages as baseUseMessages,
  useTranslations as baseUseTranslations,
  useLocale as baseUseLocale,
  useLocales as baseUseLocales,
  useDefaultLocale as baseUseDefaultLocale
} from '@i18n-tiny/react/internal'
import type { ConfigCheck, NamespaceKeys, TranslationKeys } from '@i18n-tiny/core/internal'
import { defineBase } from './shared'
import type { DefineOptions, MessagesOf } from './shared'

export type { I18nConfig } from '@i18n-tiny/core'

/**
 * Define i18n instance with automatic type inference
 * This is a pure function that creates a self-contained i18n runtime
 *
 * `locales` and `defaultLocale` are required, and `messages` must have the
 * messages of each locale. With `as const` or an inline config, an invalid
 * config is a type error. At run time it throws in the Server Components
 * version of define(), which checks it: this version, for the browser, does
 * not check it, to keep the bundle small.
 *
 * @example
 * import { define } from '@i18n-tiny/next'
 * import jaMessages from './messages/ja'
 * import enMessages from './messages/en'
 *
 * export const i18n = define({
 *   locales: ['ja', 'en'],
 *   defaultLocale: 'ja',
 *   messages: { ja: jaMessages, en: enMessages }
 * })
 *
 * // Server Component - types are automatically inferred
 * if (!i18n.isLocale(locale)) notFound()
 * const messages = await i18n.server.getMessages(locale)
 * const t = await i18n.server.getTranslations(locale)
 *
 * // Layout
 * <i18n.Provider locale={locale} messages={messages}>
 *   {children}
 * </i18n.Provider>
 */
export function define<
  const L extends readonly string[],
  Msgs extends Record<string, object>
> (
  config: DefineOptions<L, Msgs> & ConfigCheck<{ locales: L, defaultLocale: L[number], messages: Msgs }>
) {
  type Locale = L[number]
  // Use the first locale's message type for consistent typing
  type MessageType = MessagesOf<L, Msgs>
  type Namespace = NamespaceKeys<MessageType>

  const base = defineBase<L, Msgs>(config)

  // Type-safe wrappers for client hooks with automatic inference
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

  // Client API (hooks only)
  const client = {
    useMessages,
    useTranslations,
    useLocale,
    useLocales,
    useDefaultLocale
  }

  return {
    ...base,
    client
  }
}
