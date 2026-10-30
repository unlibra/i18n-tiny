/**
 * React Server Components version
 * This version throws errors for client-only APIs
 */

import type { ConfigCheck, NamespaceKeys, TranslationKeys } from '@i18n-tiny/core/internal'
import { defineBase } from './shared'
import type { DefineOptions, MessagesOf, PathFunctions } from './shared'

export type { I18nConfig } from '@i18n-tiny/core'

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
  const L extends readonly string[],
  Msgs extends Record<string, Record<string, unknown>>
> (
  config: DefineOptions<L, Msgs> & ConfigCheck<{ locales: L, defaultLocale: L[number], messages: Msgs }>
) {
  type Locale = L[number]
  type MessageType = MessagesOf<L, Msgs>
  type Namespace = NamespaceKeys<MessageType>

  const base = defineBase<L, Msgs>(config)

  // Client API - all throw errors on server
  const client = {
    useMessages: (): MessageType => clientOnlyError('useMessages'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    useTranslations: <N extends Namespace | undefined = undefined>(_namespace?: N): ((key: TranslationKeys<MessageType, N>, vars?: Record<string, string | number>) => string) => clientOnlyError('useTranslations'),
    useLocale: (): Locale => clientOnlyError('useLocale'),
    useLocales: (): L => clientOnlyError('useLocales'),
    useDefaultLocale: (): Locale => clientOnlyError('useDefaultLocale'),
    usePaths: (): PathFunctions<Locale> => clientOnlyError('usePaths')
  }

  return {
    ...base,
    client
  }
}
