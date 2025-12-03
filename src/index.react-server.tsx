/**
 * React Server Components version
 * This version throws errors for client-only APIs
 */

import type { ReactNode } from 'react'
import type { NestedKeys } from './types'
import { resolveMessage } from './utils'

export interface I18nConfig<
  L extends readonly string[],
  M extends Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  Msgs extends Record<L[number], M> = Record<L[number], M>
> {
  locales: L
  defaultLocale: L[number]
  messages: Msgs
}

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
  const { messages } = config

  type MessageType = Msgs[L[0]]
  type MessageKeys = NestedKeys<MessageType>

  // Server API - fully functional
  const server = {
    getMessages: async (locale: string): Promise<MessageType> => {
      const moduleObj = messages[locale as L[number]]
      return JSON.parse(JSON.stringify(moduleObj)) as MessageType
    },

    getTranslations: async (
      locale: string,
      namespace?: string
    ): Promise<(key: MessageKeys) => string> => {
      const moduleObj = messages[locale as L[number]]
      const msgs = JSON.parse(JSON.stringify(moduleObj))

      return (key: MessageKeys): string => {
        return resolveMessage(msgs, key, namespace, locale)
      }
    }
  }

  // Provider - throws error on server
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function Provider (_props: {
    locale: string
    messages: MessageType
    children: ReactNode
  }): ReactNode {
    clientOnlyError('Provider')
  }

  // Link - throws error on server
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function Link (_props: Record<string, unknown>): ReactNode {
    clientOnlyError('Link')
  }

  // Client API - all throw errors on server
  const client = {
    useMessages: (): MessageType => clientOnlyError('useMessages'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    useTranslations: (_namespace?: string): ((key: MessageKeys) => string) => clientOnlyError('useTranslations'),
    useLocale: (): string => clientOnlyError('useLocale')
  }

  return {
    Provider,
    Link,
    server,
    client
  }
}
