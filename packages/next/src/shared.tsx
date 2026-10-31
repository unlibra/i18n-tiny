// The parts of define() shared by the Client and the Server Components
// versions. Bundled into each entry point, not an entry of its own.

import type { ReactNode } from 'react'
import { I18nProvider as BaseProvider } from '@i18n-tiny/react/internal'
import type { I18nConfig } from '@i18n-tiny/core'
import type { NamespaceKeys, TranslationKeys } from '@i18n-tiny/core/internal'
import { alternatePathOf, localizedPathOf, resolveMessage } from '@i18n-tiny/core/internal'

/** A path on the site, such as '/about' */
export type Path = `/${string}`

/** The config of define() */
export interface DefineOptions<L extends readonly string[], Msgs> {
  /** Supported locales. Each one is used as a path segment, such as /en */
  readonly locales: L
  /** The locale of URLs without a locale prefix */
  readonly defaultLocale: NoInfer<L[number]>
  /**
   * Whether URLs of the default locale also carry the locale prefix
   * @default false
   */
  readonly prefixDefault?: boolean
  /** The messages of each locale */
  readonly messages: Msgs
}

/** The type of the messages: those of the first locale */
export type MessagesOf<L extends readonly string[], Msgs> = Msgs[L[0] & keyof Msgs]

function unknownLocale (locale: unknown, locales: readonly string[]): Error {
  return new Error(
    `[i18n] Unknown locale ${JSON.stringify(locale)}. ` +
    `Expected one of ${locales.map(l => JSON.stringify(l)).join(', ')}.`
  )
}

/**
 * Builds what both versions of define() return: the locale settings,
 * isLocale(), the Provider, the server API and the URL functions. The config
 * is not checked here: the Server Components version checks it, and the
 * Client Components version leaves it out of the browser bundle.
 */
export function defineBase<
  const L extends readonly string[],
  Msgs extends Record<string, object>
> (config: DefineOptions<L, Msgs>) {
  type Locale = L[number]
  type MessageType = MessagesOf<L, Msgs>
  type Namespace = NamespaceKeys<MessageType>

  const { locales, defaultLocale, prefixDefault = false, messages } = config
  const urlConfig: I18nConfig = { locales, defaultLocale, prefixDefault }

  function isLocale (value: unknown): value is Locale {
    return typeof value === 'string' && locales.includes(value)
  }

  function checkLocale (locale: unknown): asserts locale is Locale {
    if (!isLocale(locale)) {
      throw unknownLocale(locale, locales)
    }
  }

  // Convert ES module namespace to plain object (required for Client Components)
  function messagesOf (locale: Locale): MessageType {
    checkLocale(locale)
    return structuredClone(messages[locale as keyof Msgs]) as MessageType
  }

  /**
   * Provider of the locale and its messages for Client Components. A locale
   * that is not one of `locales` throws.
   */
  function Provider ({ locale, messages: msgs, children }: {
    locale: Locale
    messages: MessageType
    children: ReactNode
  }) {
    checkLocale(locale)
    return (
      <BaseProvider
        locale={locale}
        // Messages typed with an interface have no index signature
        messages={msgs as Record<string, unknown>}
        defaultLocale={defaultLocale}
        locales={locales}
        prefixDefault={prefixDefault}
      >
        {children}
      </BaseProvider>
    )
  }

  const server = {
    /**
     * Get messages object for server components. A locale that is not one
     * of `locales` throws: narrow a string with isLocale() first.
     */
    getMessages: async (locale: Locale): Promise<MessageType> => messagesOf(locale),

    /**
     * Get translation function for server components. A locale that is not
     * one of `locales` throws: narrow a string with isLocale() first.
     */
    // With a namespace, keys are relative to it: getTranslations(locale, 'common') takes 'title' for 'common.title'
    getTranslations: async <N extends Namespace | undefined = undefined>(
      locale: Locale,
      namespace?: N
    ): Promise<(key: TranslationKeys<MessageType, N>, vars?: Record<string, string | number>) => string> => {
      const msgs = messagesOf(locale)

      return (key: TranslationKeys<MessageType, N>, vars?: Record<string, string | number>): string => {
        return resolveMessage(msgs, key, namespace, locale, vars)
      }
    }
  }

  return {
    Provider,
    locales,
    defaultLocale: defaultLocale as Locale,
    isLocale,
    server,
    /** The URL path of a page in a locale, as localizedPath() of @i18n-tiny/core/router does with this config */
    localizedPath: (path: string, locale: Locale): Path => localizedPathOf(path, locale, urlConfig),
    /** The URL path of the current page in another locale, as alternatePath() of @i18n-tiny/core/router does with this config */
    alternatePath: (pathname: string, locale: Locale): Path => alternatePathOf(pathname, locale, urlConfig)
  }
}
