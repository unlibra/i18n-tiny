/**
 * @i18n-tiny/astro
 *
 * The simplest i18n library for Astro.
 * Type-safe, zero-dependency, minimal setup.
 */

import type { I18nConfig } from '@i18n-tiny/core'
import type { ConfigCheck, NamespaceKeys, TranslationKeys } from '@i18n-tiny/core/internal'
import { resolveMessage, validateConfig } from '@i18n-tiny/core/internal'
import {
  alternatePath as coreAlternatePath,
  localizedPath as coreLocalizedPath,
  pathLocale as corePathLocale,
  removeLocalePrefix as coreRemoveLocalePrefix
} from '@i18n-tiny/core/router'

export type { I18nConfig } from '@i18n-tiny/core'

/** A path on the site, such as '/about' */
type Path = `/${string}`

/**
 * A page that getStaticPaths() builds in each locale: the other dynamic
 * parameters of the route and the props of the page. `locale` is set by
 * getStaticPaths(), in the params and in the props, as is `pageLocales`.
 */
export interface StaticPathInput {
  readonly params: Readonly<Record<string, string | undefined>> & { readonly locale?: never }
  readonly props?: Readonly<Record<string, unknown>> & { readonly locale?: never, readonly pageLocales?: never }
}

/** Options of getStaticPaths() */
export interface StaticPathsOptions<L extends string, P extends StaticPathInput = StaticPathInput> {
  /** The locales the page is built in. Default: all locales */
  readonly locales?: readonly L[]
  /** The other dynamic parameters of the route, such as `[{ params: { tool: 'color' } }]` */
  readonly paths?: readonly P[]
}

/** A path returned by getStaticPaths(), for one page in one locale */
export type LocalizedStaticPath<L extends string, P extends StaticPathInput = { params: Record<never, never> }> =
  P extends unknown
    ? {
        params: P['params'] & {
          /** The locale of the URL: undefined for the default locale without a prefix */
          locale: L | undefined
        }
        // A path without props, also when an array literal gives it
        // `props?: undefined`, gets only the props below
        props: ([NonNullable<P['props']>] extends [never] ? unknown : NonNullable<P['props']>) & {
          /** The locale of the page */
          locale: L
          /** The locales the page is built in */
          pageLocales: readonly L[]
        }
      }
    : never

function hasOwn (object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key)
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
 * export const getStaticPaths = () => i18n.getStaticPaths()
 * const { locale } = Astro.props
 * const t = i18n.getTranslations(locale)
 * ```
 */
export function define<
  const L extends readonly string[],
  Msgs extends Record<string, Record<string, unknown>>
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
   * `prefixDefault` is true. `props.locale` is the locale of the page, and
   * `props.pageLocales` the locales it is built in. With `paths`, each path
   * is built in each locale.
   *
   * Throws when `locales` is empty, lists a locale twice or has an unknown
   * locale, or when a path sets `locale` or `pageLocales` itself.
   */
  function getStaticPaths (options?: StaticPathsOptions<Locale, never>): LocalizedStaticPath<Locale>[]
  function getStaticPaths<P extends StaticPathInput> (
    options: StaticPathsOptions<Locale, P> & { readonly paths: readonly P[] }
  ): LocalizedStaticPath<Locale, P>[]
  function getStaticPaths (
    options: StaticPathsOptions<Locale> = {}
  ): { params: Record<string, string | undefined>, props: Record<string, unknown> }[] {
    const pageLocales = options.locales === undefined ? [...locales] : checkPageLocales(options.locales)
    const paths = options.paths ?? [{ params: {} }]
    for (const path of paths) {
      if (hasOwn(path.params, 'locale')) {
        throw new Error('[i18n] getStaticPaths() sets params.locale: leave it out of the params of paths.')
      }
      for (const name of ['locale', 'pageLocales']) {
        if (path.props !== undefined && hasOwn(path.props, name)) {
          throw new Error(`[i18n] getStaticPaths() sets props.${name}: leave it out of the props of paths.`)
        }
      }
    }

    return pageLocales.flatMap(locale => paths.map(path => ({
      params: { ...path.params, locale: locale === defaultLocale && !prefixDefault ? undefined : locale },
      props: { ...path.props, locale, pageLocales }
    })))
  }

  function checkPageLocales (pageLocales: readonly string[]): Locale[] {
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
    return [...pageLocales]
  }

  /**
   * The URL path of a page in a locale, as localizedPath() of
   * @i18n-tiny/core/router does with this config
   */
  function localizedPath (path: string, locale: Locale): Path {
    return coreLocalizedPath(path, locale, urlConfig)
  }

  /**
   * The URL path of the current page in another locale, as alternatePath()
   * of @i18n-tiny/core/router does with this config
   */
  function alternatePath (pathname: string, locale: Locale): Path {
    return coreAlternatePath(pathname, locale, urlConfig)
  }

  /**
   * The pathname without its locale prefix, as removeLocalePrefix() of
   * @i18n-tiny/core/router does with this config
   */
  function removeLocalePrefix (pathname: string): Path {
    return coreRemoveLocalePrefix(pathname, urlConfig)
  }

  /**
   * The locale of the prefix of the pathname, or undefined, as pathLocale()
   * of @i18n-tiny/core/router does with this config
   */
  function pathLocale (pathname: string): Locale | undefined {
    return corePathLocale(pathname, urlConfig) as Locale | undefined
  }

  return {
    locales,
    defaultLocale: defaultLocale as Locale,
    prefixDefault,
    isLocale,
    getMessages,
    getTranslations,
    getStaticPaths,
    localizedPath,
    alternatePath,
    removeLocalePrefix,
    pathLocale
  }
}
