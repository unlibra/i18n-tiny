/**
 * @i18n-tiny/astro/router
 *
 * The URL functions of @i18n-tiny/core/router, for places where the messages
 * are not loaded. They take the config object `{ locales, defaultLocale,
 * prefixDefault? }`. The define() result has the same functions with its
 * config.
 */

import type { I18nConfig } from '@i18n-tiny/core'
import type { ConfigCheck } from '@i18n-tiny/core/internal'
import { validateConfig } from '@i18n-tiny/core/internal'
import { removeLocalePrefix as coreRemoveLocalePrefix } from '@i18n-tiny/core/router'

export type { I18nConfig } from '@i18n-tiny/core'
export { localizedPath, alternatePath, pathLocale } from '@i18n-tiny/core/router'

/**
 * Removes the locale prefix from a pathname. The result has no trailing
 * slash, except for the top page "/".
 *
 * Throws when the pathname does not start with "/", starts with "//" or "/\",
 * contains a tab, a line break, "?" or "#", or when the config is invalid.
 *
 * @example
 * ```typescript
 * import { removeLocalePrefix } from '@i18n-tiny/astro/router'
 *
 * const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
 * removeLocalePrefix('/en/about', config) // '/about'
 * removeLocalePrefix('/en', config)       // '/'
 * ```
 */
export function removeLocalePrefix<const C extends I18nConfig> (
  pathname: string,
  config: C & ConfigCheck<C>
): `/${string}` {
  // Checked here too, so that a locales array is refused as an invalid config
  validateConfig(config)
  return coreRemoveLocalePrefix(pathname, config as I18nConfig)
}
