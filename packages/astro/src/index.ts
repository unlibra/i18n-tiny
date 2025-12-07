/**
 * @i18n-tiny/astro
 *
 * The simplest i18n library for Astro.
 * Type-safe, zero-dependency, minimal setup.
 */

import type { NestedKeys } from '@i18n-tiny/core/internal'
import { resolveMessage } from '@i18n-tiny/core/internal'

export interface I18nConfig<
  L extends readonly string[],
  M extends Record<string, unknown>,
  Msgs extends Record<L[number], M> = Record<L[number], M>
> {
  locales?: L
  defaultLocale?: L[number]
  messages: Msgs
}

/**
 * Define i18n instance with automatic type inference
 *
 * @example
 * ```typescript
 * import { define } from '@i18n-tiny/astro'
 * import enMessages from './messages/en'
 * import jaMessages from './messages/ja'
 *
 * export const i18n = define({
 *   locales: ['en', 'ja'] as const,
 *   defaultLocale: 'en',
 *   messages: { en: enMessages, ja: jaMessages }
 * })
 *
 * // In .astro files
 * const messages = i18n.getMessages(Astro.currentLocale)
 * const t = i18n.getTranslations(Astro.currentLocale)
 * ```
 */
export function define<
  L extends readonly string[],
  M extends Record<string, unknown>,
  Msgs extends Record<L[number], M>
>(config: { locales?: L; defaultLocale?: L[number]; messages: Msgs }) {
  const { locales, defaultLocale, messages } = config

  type MessageType = Msgs[L[number]]
  type MessageKeys = NestedKeys<MessageType>

  // Get available locales from messages if not provided
  const availableLocales = (locales ?? Object.keys(messages)) as L
  // Use first available locale as default if not provided
  const resolvedDefaultLocale = (defaultLocale ?? availableLocales[0]) as L[number]

  /**
   * Get messages object for a given locale
   * Types are automatically inferred from the messages passed to define
   */
  function getMessages(locale: string | undefined): MessageType {
    const resolvedLocale = locale ?? resolvedDefaultLocale
    const moduleObj = messages[resolvedLocale as L[number]] ?? messages[resolvedDefaultLocale as L[number]]
    // Convert ES module namespace to plain object
    return structuredClone(moduleObj) as MessageType
  }

  /**
   * Get translation function for a given locale
   * Keys are automatically inferred and provide autocomplete
   * Supports variable interpolation with {key} syntax
   */
  function getTranslations(
    locale: string | undefined,
    namespace?: string
  ): (key: MessageKeys, vars?: Record<string, string | number>) => string {
    const resolvedLocale = locale ?? resolvedDefaultLocale
    const moduleObj = messages[resolvedLocale as L[number]] ?? messages[resolvedDefaultLocale as L[number]]
    const msgs = structuredClone(moduleObj)

    return (key: MessageKeys, vars?: Record<string, string | number>): string => {
      return resolveMessage(msgs, key, namespace, resolvedLocale, vars)
    }
  }

  return {
    locales: availableLocales,
    defaultLocale: resolvedDefaultLocale,
    getMessages,
    getTranslations
  }
}

// Re-export DefineConfig for users who want to type their config
export type { DefineConfig } from '@i18n-tiny/core'
