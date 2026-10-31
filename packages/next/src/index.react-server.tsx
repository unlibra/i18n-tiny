/**
 * React Server Components version
 * This version throws errors for client-only APIs
 */

import type { ConfigCheck, LocaleMessages, NamespaceKeys, Translate } from '@i18n-tiny/core/internal'
import { validateConfig } from '@i18n-tiny/core/internal'
import { defineBase } from './shared'
import type { DefineOptions, MessagesOf } from './shared'

export type { I18nConfig, LocaleMessages } from '@i18n-tiny/core'

function clientOnlyError (name: string): never {
  throw new Error(
    `${name} is not available in Server Components. ` +
    'Use getMessages/getTranslations from server API instead, ' +
    'or move this component to a Client Component with "use client".'
  )
}

/**
 * Define i18n instance with automatic type inference (Server Components version)
 *
 * An invalid config throws, as the checks of validateConfig() describe.
 */
export function define<
  const L extends readonly string[],
  const D extends L[number],
  Msgs extends Record<string, object>
> (
  config: DefineOptions<L, D, Msgs> & ConfigCheck<{ locales: L, defaultLocale: D, messages: Msgs }>
) {
  type Locale = L[number]
  type MessageType = MessagesOf<D, Msgs>
  type Messages = LocaleMessages<MessageType>
  type Namespace = NamespaceKeys<MessageType>

  const { locales, defaultLocale, messages } = config
  validateConfig({ locales, defaultLocale, messages })
  const base = defineBase<L, D, Msgs>(config)

  // Client API - all throw errors on server
  const client = {
    useMessages: (): Messages => clientOnlyError('useMessages'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    useTranslations: <N extends Namespace | undefined = undefined>(_namespace?: N): Translate<MessageType, N> => clientOnlyError('useTranslations'),
    useLocale: (): Locale => clientOnlyError('useLocale'),
    useLocales: (): L => clientOnlyError('useLocales'),
    useDefaultLocale: (): Locale => clientOnlyError('useDefaultLocale')
  }

  return {
    ...base,
    client
  }
}
