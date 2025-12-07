/**
 * React Server Components version
 * This version throws errors for client-only APIs
 */

import type { ReactNode } from 'react'
import { I18nProvider as BaseProvider } from '@i18n-tiny/react/internal'
import type { NestedKeys } from '@i18n-tiny/core/internal'
import { resolveMessage } from '@i18n-tiny/core/internal'

// Re-export DefineConfig for users who want to type their config
export type { DefineConfig } from '@i18n-tiny/core'

function clientOnlyError (name: string): never {
  throw new Error(
    `${name} is not available in Server Components. ` +
    'Use getMessages/getTranslations from server API instead, ' +
    'or move this component to a Client Component with "use client".'
  )
}

/**
 * Define i18n instance with automatic type inference (Server Components version)
 */
export function define<
  L extends readonly string[],
  M extends Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  Msgs extends Record<L[number], M>
> (config: { locales: L; defaultLocale: L[number]; messages: Msgs }) {
  const { locales, defaultLocale, messages } = config

  type MessageType = Msgs[L[0]]
  type MessageKeys = NestedKeys<MessageType>

  // Provider wrapper that binds locales and defaultLocale from closure
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

  // Server API - fully functional
  const server = {
    getMessages: async (locale: string): Promise<MessageType> => {
      const moduleObj = messages[locale as L[number]]
      return structuredClone(moduleObj) as MessageType
    },

    getTranslations: async (
      locale: string,
      namespace?: string
    ): Promise<(key: MessageKeys, vars?: Record<string, string | number>) => string> => {
      const moduleObj = messages[locale as L[number]]
      const msgs = structuredClone(moduleObj)

      return (key: MessageKeys, vars?: Record<string, string | number>): string => {
        return resolveMessage(msgs, key, namespace, locale, vars)
      }
    }
  }

  // Client API - all throw errors on server
  const client = {
    useMessages: (): MessageType => clientOnlyError('useMessages'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    useTranslations: (_namespace?: string): ((key: MessageKeys, vars?: Record<string, string | number>) => string) => clientOnlyError('useTranslations'),
    useLocale: (): string => clientOnlyError('useLocale'),
    useLocales: (): L => clientOnlyError('useLocales'),
    useDefaultLocale: (): L[number] => clientOnlyError('useDefaultLocale')
  }

  return {
    Provider,
    locales,
    defaultLocale,
    server,
    client
  }
}
