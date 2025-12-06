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
import type { NestedKeys } from '@i18n-tiny/core/internal'

// Re-export types for Provider
export type { ProviderProps } from './components'

// Re-export DefineConfig for users who want to type their config
export type { DefineConfig } from '@i18n-tiny/core'

/**
 * Define i18n instance with automatic type inference
 *
 * @example
 * import { define } from '@i18n-tiny/react'
 * import jaMessages from './messages/ja'
 * import enMessages from './messages/en'
 *
 * const messages = { ja: jaMessages, en: enMessages }
 *
 * export const i18n = define({
 *   locales: ['ja', 'en'] as const,
 *   defaultLocale: 'ja',
 *   messages
 * })
 *
 * // App.tsx
 * function App() {
 *   const [locale, setLocale] = useState('ja')
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
  L extends readonly string[],
  M extends Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  Msgs extends Record<L[number], M>
> (config: { locales: L; defaultLocale: L[number]; messages: Msgs }) {
  const { locales, defaultLocale } = config

  // Type aliases for automatic inference
  type MessageType = Msgs[L[0]]
  type MessageKeys = NestedKeys<MessageType>

  // Provider wrapper
  function Provider ({ locale, messages: msgs, children }: {
    locale: string
    messages: MessageType
    children: ReactNode
  }) {
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

  function useTranslations (namespace?: string): (key: MessageKeys, vars?: Record<string, string | number>) => string {
    return baseUseTranslations<MessageKeys>(namespace)
  }

  function useLocale (): string {
    return baseUseLocale()
  }

  function useLocales (): L {
    return baseUseLocales() as L
  }

  function useDefaultLocale (): L[number] {
    return baseUseDefaultLocale() as L[number]
  }

  return {
    Provider,
    useMessages,
    useTranslations,
    useLocale,
    useLocales,
    useDefaultLocale,
    locales,
    defaultLocale
  }
}
