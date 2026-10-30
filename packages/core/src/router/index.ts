/**
 * @i18n-tiny/core/router
 *
 * Core routing utilities for i18n - framework agnostic
 */

import type { I18nConfig } from '../config'
import { stripLocalePrefix } from './paths'
import type { CheckedConfig, Path } from './paths'
import { linkHref, NON_PATH_HREF } from './linkHref'
import type { LinkHrefOptions } from './linkHref'

export type { I18nConfig } from '../config'
export { localizedPath, alternatePath, pathLocale } from './paths'
export type { LinkHrefOptions } from './linkHref'

/**
 * Generate a localized path with locale prefix
 *
 * @param path - The path to localize (e.g., '/about')
 * @param locale - The target locale (e.g., 'ja')
 * @param defaultLocale - The default locale (e.g., 'en')
 * @param prefixDefault - Whether to add prefix for default locale (default: false)
 * @returns The localized path (e.g., '/ja/about' or '/about' for default locale)
 *
 * @deprecated Use localizedPath(path, locale, config) with the config object.
 * This form is removed before the 2.0.0 release.
 *
 * @example
 * ```typescript
 * import { getLocalizedPath } from '@i18n-tiny/core/router'
 *
 * getLocalizedPath('/about', 'ja', 'en')  // '/ja/about'
 * getLocalizedPath('/about', 'en', 'en')  // '/about'
 * getLocalizedPath('/about', 'en', 'en', true)  // '/en/about' (for static builds)
 * ```
 */
export function getLocalizedPath(
  path: string,
  locale: string,
  defaultLocale: string,
  prefixDefault: boolean = false
): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  // Avoid double prefixing
  if (cleanPath.startsWith(`/${locale}/`) || cleanPath === `/${locale}`) {
    return cleanPath
  }

  // For default locale, no prefix needed (unless prefixDefault is true)
  if (locale === defaultLocale && !prefixDefault) {
    return cleanPath
  }

  // Add locale prefix
  return cleanPath === '/' ? `/${locale}` : `/${locale}${cleanPath}`
}

/**
 * Remove the locale prefix from a pathname
 *
 * The result has no trailing slash, except for the top page "/". Only whole
 * path segments match: '/english' keeps its path.
 *
 * Throws when the pathname does not start with "/", starts with "//" or "/\",
 * contains "?" or "#", or when the config is invalid.
 *
 * @example
 * ```typescript
 * import { removeLocalePrefix } from '@i18n-tiny/core/router'
 *
 * const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
 * removeLocalePrefix('/en/about', config) // '/about'
 * removeLocalePrefix('/en', config)       // '/'
 * removeLocalePrefix('/about', config)    // '/about'
 * ```
 */
export function removeLocalePrefix<const C extends I18nConfig>(
  pathname: string,
  config: CheckedConfig<C>
): Path
/**
 * Remove locale prefix from pathname
 *
 * @param pathname - The pathname to process (e.g., "/ja/about")
 * @param locales - Array of supported locales
 * @returns The pathname without locale prefix
 *
 * @example
 * ```typescript
 * import { removeLocalePrefix } from '@i18n-tiny/core/router'
 *
 * removeLocalePrefix('/ja/about', ['en', 'ja']) // '/about'
 * removeLocalePrefix('/ja', ['en', 'ja'])       // '/'
 * removeLocalePrefix('/about', ['en', 'ja'])    // '/about'
 * ```
 *
 * @deprecated Pass the config object instead of the locales:
 * removeLocalePrefix(pathname, config). This form is removed before the 2.0.0
 * release.
 */
export function removeLocalePrefix(
  pathname: string,
  locales: readonly string[]
): string
export function removeLocalePrefix(
  pathname: string,
  localesOrConfig: readonly string[] | I18nConfig
): string {
  if (!Array.isArray(localesOrConfig)) {
    return stripLocalePrefix(pathname, localesOrConfig as I18nConfig)
  }
  const locales: readonly string[] = localesOrConfig
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1)
    }
    if (pathname === `/${locale}`) {
      return '/'
    }
  }
  return pathname
}

/**
 * Check if pathname has a locale prefix
 *
 * @param pathname - The pathname to check (e.g., "/ja/about")
 * @param locale - The locale to check for
 * @returns Whether the pathname starts with the locale prefix
 *
 * @example
 * ```typescript
 * import { hasLocalePrefix } from '@i18n-tiny/core/router'
 *
 * hasLocalePrefix('/ja/about', 'ja')  // true
 * hasLocalePrefix('/ja', 'ja')        // true
 * hasLocalePrefix('/about', 'ja')     // false
 * ```
 *
 * @deprecated Use pathLocale(pathname, config), which returns the locale of
 * the prefix. This form is removed before the 2.0.0 release.
 */
export function hasLocalePrefix(pathname: string, locale: string): boolean {
  return pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
}

/**
 * Options for getLinkHref
 *
 * @deprecated Use LinkHrefOptions, with the config object instead of the
 * locales. This type is removed before the 2.0.0 release.
 */
export interface GetLinkHrefOptions {
  /**
   * Override the locale for this link
   * - undefined: auto-localize based on current URL (default)
   * - string (e.g., 'ja'): generate path with specified locale prefix
   * - '' (empty string) or false: use href as-is without any localization
   */
  locale?: string | false
  /**
   * Array of supported locales for href normalization.
   * When provided, removes any existing locale prefix from href before processing.
   * This allows `<Link href="/ja/about">` to work correctly for language switching.
   */
  locales?: readonly string[]
}

/**
 * Build the href of a Link component
 *
 * Hrefs that are not paths on this site, such as 'https://…', 'mailto:…',
 * '//cdn…', '#top' or '?page=2', are returned unchanged. For a path, the query
 * and the hash are kept as they are and the path is built as follows:
 *
 * - `normalize: true` first removes a locale prefix from the path
 * - `locale: 'en'` builds the path for that locale, as localizedPath() does:
 *   the default locale gets no prefix unless `prefixDefault` is true
 * - `locale: false` leaves the path without a locale
 * - without `locale`, the link keeps the pattern of the current URL: it gets
 *   the prefix of the current locale when the current pathname has one
 *
 * The path has no trailing slash, except for the top page "/".
 *
 * Throws when the path does not start with "/" or starts with "/\", when the
 * locale is not one of `locales`, when `config` is missing with a locale or
 * `normalize`, or when the config is invalid.
 *
 * @param href - The href of the link, such as '/about' or '/about#team'
 * @param currentPathname - The pathname of the current URL
 * @param currentLocale - The locale of the current page
 * @param options - The locale of the link, `normalize` and the config
 *
 * @example
 * ```typescript
 * import { getLinkHref } from '@i18n-tiny/core/router'
 *
 * const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
 *
 * // Keep the pattern of the current URL
 * getLinkHref('/about', '/en/page', 'en', {})  // '/en/about'
 * getLinkHref('/about', '/page', 'ja', {})     // '/about'
 *
 * // A link for another locale
 * getLinkHref('/about', '/page', 'ja', { locale: 'en', config })  // '/en/about'
 * getLinkHref('/about', '/en/page', 'en', { locale: 'ja', config })  // '/about'
 *
 * // The current page in another locale
 * getLinkHref('/en/about', '/en/about', 'en', { locale: 'ja', normalize: true, config })  // '/about'
 *
 * // Without a locale
 * getLinkHref('/about', '/en/page', 'en', { locale: false })  // '/about'
 * ```
 */
export function getLinkHref<const C extends I18nConfig>(
  href: string,
  currentPathname: string,
  currentLocale: string | undefined,
  options: LinkHrefOptions<C>
): string
/**
 * Generate a link href based on current URL pattern
 *
 * Used by Link components to auto-detect whether to add locale prefix.
 * If current URL has locale prefix → add prefix to link
 * If current URL has no prefix → no prefix on link
 * Hrefs that are not paths on this site, such as 'https://…', 'mailto:…',
 * '#top' or '?page=2', are returned unchanged.
 *
 * @param href - The target path (e.g., '/about')
 * @param currentPathname - The current URL pathname
 * @param currentLocale - The current locale (from params or context)
 * @param options - Options object or legacy overrideLocale parameter
 * @returns The resolved href
 *
 * @example
 * ```typescript
 * import { getLinkHref } from '@i18n-tiny/core/router'
 *
 * // Auto-detect from current URL
 * getLinkHref('/about', '/ja/page', 'ja')           // '/ja/about' (URL has prefix)
 * getLinkHref('/about', '/page', 'ja')              // '/about' (URL has no prefix)
 *
 * // Explicit locale override
 * getLinkHref('/about', '/page', 'en', { locale: 'ja' })  // '/ja/about'
 *
 * // Raw path (no localization)
 * getLinkHref('/about', '/ja/page', 'ja', { locale: '' })     // '/about'
 * getLinkHref('/about', '/ja/page', 'ja', { locale: false })  // '/about'
 *
 * // With normalization (removes existing locale prefix from href)
 * getLinkHref('/ja/about', '/en/page', 'en', { locale: 'en', locales: ['en', 'ja'] })  // '/en/about'
 * ```
 *
 * @deprecated Pass the options with the config object instead:
 * getLinkHref(href, currentPathname, currentLocale, { locale, normalize, config }).
 * This form is removed before the 2.0.0 release.
 */
export function getLinkHref(
  href: string,
  currentPathname: string,
  currentLocale: string | undefined,
  options?: string | false | (GetLinkHrefOptions & { locales: readonly string[] | undefined })
): string
export function getLinkHref(
  href: string,
  currentPathname: string,
  currentLocale: string | undefined,
  options?: string | false | GetLinkHrefOptions | LinkHrefOptions
): string {
  if (typeof options === 'object' && options !== null && !Object.hasOwn(options, 'locales')) {
    return linkHref(href, currentPathname, currentLocale, options as LinkHrefOptions)
  }

  // Handle legacy signature: getLinkHref(href, pathname, locale, 'ja')
  const opts: GetLinkHrefOptions = typeof options === 'object' && options !== null
    ? options as GetLinkHrefOptions
    : { locale: options as string | false | undefined }

  const { locale: overrideLocale, locales } = opts

  if (NON_PATH_HREF.test(href)) {
    return href
  }

  // Normalize href by removing locale prefix if locales provided
  let cleanPath = href.startsWith('/') ? href : `/${href}`
  if (locales) {
    cleanPath = removeLocalePrefix(cleanPath, locales)
  }

  // overrideLocale="" or false → raw path (no localization)
  if (overrideLocale === '' || overrideLocale === false) {
    return cleanPath
  }

  // overrideLocale="ja" → explicit locale prefix
  if (overrideLocale !== undefined) {
    return cleanPath === '/' ? `/${overrideLocale}` : `/${overrideLocale}${cleanPath}`
  }

  // Auto-detect: check if current URL has locale prefix
  if (currentLocale && hasLocalePrefix(currentPathname, currentLocale)) {
    return cleanPath === '/' ? `/${currentLocale}` : `/${currentLocale}${cleanPath}`
  }

  // No prefix in current URL → no prefix
  return cleanPath
}
