/**
 * @i18n-tiny/astro
 *
 * The simplest i18n library for Astro.
 * Type-safe, zero-dependency, minimal setup.
 */

import type { I18nConfig } from '@i18n-tiny/core'
import type { ConfigCheck, NamespaceKeys, TranslationKeys } from '@i18n-tiny/core/internal'
import { alternatePathOf, localizedPathOf, resolveMessage, validateConfig } from '@i18n-tiny/core/internal'

export type { I18nConfig } from '@i18n-tiny/core'

/** A path on the site, such as '/about' */
type Path = `/${string}`

/** Options of getStaticPaths() */
export interface StaticPathsOptions<L extends string> {
  /** The locales the page is built in. Default: all locales */
  readonly locales?: readonly L[]
}

/** A path returned by getStaticPaths(), for one page in one locale */
export interface LocalizedStaticPath<L extends string> {
  params: {
    /** The locale of the URL: undefined for the default locale without a prefix */
    locale: L | undefined
  }
  props: {
    /** The locale of the page */
    locale: L
  }
}

function unknownLocale (locale: unknown, locales: readonly string[]): Error {
  return new Error(
    `[i18n] Unknown locale ${JSON.stringify(locale)}. ` +
    `Expected one of ${locales.map(l => JSON.stringify(l)).join(', ')}.`
  )
}

/**
 * Define i18n instance with automatic type inference
 *
 * `locales` and `defaultLocale` are required, and `messages` must have the
 * messages of each locale. An invalid config throws, and with `as const` or
 * an inline config it is a type error too.
 *
 * @example
 * ```typescript
 * import { define } from '@i18n-tiny/astro'
 * import enMessages from './messages/en'
 * import jaMessages from './messages/ja'
 *
 * export const i18n = define({
 *   locales: ['ja', 'en'],
 *   defaultLocale: 'ja',
 *   messages: { ja: jaMessages, en: enMessages }
 * })
 *
 * // In .astro files under src/pages/[...locale]/
 * export function getStaticPaths() {
 *   return i18n.getStaticPaths()
 * }
 * const { locale } = Astro.props
 * const t = i18n.getTranslations(locale)
 * ```
 */
export function define<
  const L extends readonly string[],
  Msgs extends Record<string, object>
> (
  config: {
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
  } & ConfigCheck<{ locales: L, defaultLocale: L[number], messages: Msgs }>
) {
  type Locale = L[number]
  const { locales, defaultLocale, prefixDefault = false, messages } = config
  validateConfig({ locales, defaultLocale, messages })

  // The URL functions get the locale settings only
  const urlConfig: I18nConfig = { locales, defaultLocale, prefixDefault }

  // Typed from the messages of all locales
  type MessageType = Msgs[keyof Msgs & string]
  type Namespace = NamespaceKeys<MessageType>

  function isLocale (value: unknown): value is Locale {
    return typeof value === 'string' && locales.includes(value)
  }

  function messagesOf (locale: Locale): MessageType {
    if (!isLocale(locale)) {
      throw unknownLocale(locale, locales)
    }
    // Convert ES module namespace to plain object
    return structuredClone(messages[locale as keyof Msgs]) as MessageType
  }

  /**
   * Get messages object for a given locale
   * Types are automatically inferred from the messages passed to define
   */
  function getMessages (locale: Locale): MessageType {
    return messagesOf(locale)
  }

  /**
   * Get translation function for a given locale
   * Keys are automatically inferred and provide autocomplete
   * Supports variable interpolation with {key} syntax
   */
  // With a namespace, keys are relative to it: getTranslations(locale, 'common') takes 'title' for 'common.title'
  function getTranslations<N extends Namespace | undefined = undefined> (
    locale: Locale,
    namespace?: N
  ): (key: TranslationKeys<MessageType, N>, vars?: Record<string, string | number>) => string {
    const msgs = messagesOf(locale)

    return (key: TranslationKeys<MessageType, N>, vars?: Record<string, string | number>): string => {
      return resolveMessage(msgs, key, namespace, locale, vars)
    }
  }

  /**
   * The paths of a page under src/pages/[...locale]/ in each locale, for
   * getStaticPaths()
   *
   * `params.locale` is undefined for the default locale, unless
   * `prefixDefault` is true. `props.locale` is the locale of the page.
   * `locales` builds the page in these locales only.
   *
   * Throws when `locales` is empty, lists a locale twice or has an unknown
   * locale.
   */
  function getStaticPaths (options: StaticPathsOptions<Locale> = {}): LocalizedStaticPath<Locale>[] {
    const pageLocales = options.locales === undefined ? locales : checkPageLocales(options.locales)
    return pageLocales.map(locale => ({
      params: { locale: locale === defaultLocale && !prefixDefault ? undefined : locale },
      props: { locale }
    }))
  }

  function checkPageLocales (pageLocales: readonly string[]): readonly Locale[] {
    if (!Array.isArray(pageLocales) || pageLocales.length === 0) {
      throw new Error('[i18n] The locales of getStaticPaths() must be a non-empty array of locales.')
    }
    const seen = new Set<string>()
    for (const locale of pageLocales) {
      if (!isLocale(locale)) {
        throw unknownLocale(locale, locales)
      }
      if (seen.has(locale)) {
        throw new Error(`[i18n] Locale ${JSON.stringify(locale)} is listed more than once in the locales of getStaticPaths().`)
      }
      seen.add(locale)
    }
    return pageLocales
  }

  /**
   * The URL path of a page in a locale, as localizedPath() of
   * @i18n-tiny/core/router does with this config
   */
  function localizedPath (path: string, locale: Locale): Path {
    return localizedPathOf(path, locale, urlConfig)
  }

  /**
   * The URL path of the current page in another locale, as alternatePath()
   * of @i18n-tiny/core/router does with this config
   */
  function alternatePath (pathname: string, locale: Locale): Path {
    return alternatePathOf(pathname, locale, urlConfig)
  }

  return {
    locales,
    defaultLocale: defaultLocale as Locale,
    isLocale,
    getMessages,
    getTranslations,
    getStaticPaths,
    localizedPath,
    alternatePath
  }
}
