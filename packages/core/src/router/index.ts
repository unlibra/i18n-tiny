/**
 * @i18n-tiny/core/router
 *
 * Core routing utilities for i18n - framework agnostic
 */

import { validateConfig } from '../config'
import type { I18nConfig } from '../config'
import { stripLocalePrefix } from './paths'
import type { CheckedConfig, Path } from './paths'
import { linkHref } from './linkHref'
import type { LinkHrefOptions } from './linkHref'

export type { I18nConfig } from '../config'
export { localizedPath, alternatePath, pathLocale } from './paths'
export type { LinkHrefOptions } from './linkHref'

/**
 * Remove the locale prefix from a pathname
 *
 * The result has no trailing slash, except for the top page "/". Only whole
 * path segments match: '/english' keeps its path.
 *
 * Throws when the pathname does not start with "/", starts with "//" or "/\",
 * contains a tab, a line break, "?" or "#", or when the config is invalid.
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
): Path {
  return stripLocalePrefix(pathname, config)
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
 * Throws when the path does not start with "/", starts with "/\" or contains
 * a tab or a line break, when the locale is not one of `locales`, when `config` is missing with a locale or
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
): string {
  return linkHref(href, currentPathname, currentLocale, options, validateConfig)
}
