'use client'

import type { ReactNode } from 'react'
import {
  I18nProvider as BaseProvider,
  useMessages as baseUseMessages,
  useTranslations as baseUseTranslations,
  useLocale as baseUseLocale
} from './components'
import type { NestedKeys } from '@i18n-tiny/core'

// Re-export core utilities
export { removeLocalePrefix } from '@i18n-tiny/core'

// Re-export types for Provider
export type { ProviderProps } from './components'

export interface I18nConfig<
  L extends readonly string[],
  M extends Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  Msgs extends Record<L[number], M> = Record<L[number], M>
> {
  locales: L
  defaultLocale: L[number]
  messages: Msgs
}

/**
 * Define i18n instance with automatic type inference
 *
 * @example
 * import { define } from '@i18n-tiny/react'
 * import jaMessages from './messages/ja'
 * import enMessages from './messages/en'
 *
 * export const i18n = define({
 *   locales: ['ja', 'en'] as const,
 *   defaultLocale: 'ja',
 *   messages: { ja: jaMessages, en: enMessages }
 * })
 *
 * // App.tsx
 * function App() {
 *   const [locale, setLocale] = useState('ja')
 *   const messages = i18n.messages[locale]
 *
 *   return (
 *     <i18n.Provider locale={locale} messages={messages}>
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
  const { locales, defaultLocale, messages } = config

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

  return {
    Provider,
    useMessages,
    useTranslations,
    useLocale,
    locales,
    defaultLocale,
    messages
  }
}
