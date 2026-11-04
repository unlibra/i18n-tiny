/**
 * @i18n-tiny/core/router
 *
 * Core routing utilities for i18n - framework agnostic
 */

import type { I18nConfig } from '../config'
import { stripLocalePrefix } from './paths'
import type { CheckedConfig, Path } from './paths'

export type { I18nConfig } from '../config'
export { localizedPath, alternatePath, pathLocale } from './paths'

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
