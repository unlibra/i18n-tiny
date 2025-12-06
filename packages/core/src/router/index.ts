/**
 * @i18n-tiny/core/router
 *
 * Core routing utilities for i18n - framework agnostic
 */

/**
 * Generate a localized path with locale prefix
 *
 * @param path - The path to localize (e.g., '/about')
 * @param locale - The target locale (e.g., 'ja')
 * @param defaultLocale - The default locale (e.g., 'en')
 * @param prefixDefault - Whether to add prefix for default locale (default: false)
 * @returns The localized path (e.g., '/ja/about' or '/about' for default locale)
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
 */
export function removeLocalePrefix(
  pathname: string,
  locales: readonly string[]
): string {
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
 */
export function hasLocalePrefix(pathname: string, locale: string): boolean {
  return pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
}

/**
 * Generate a link href based on current URL pattern
 *
 * Used by Link components to auto-detect whether to add locale prefix.
 * If current URL has locale prefix → add prefix to link
 * If current URL has no prefix → no prefix on link
 *
 * @param href - The target path (e.g., '/about')
 * @param currentPathname - The current URL pathname
 * @param currentLocale - The current locale (from params or context)
 * @param overrideLocale - Optional locale override (undefined = auto, '' | false = raw, 'ja' = explicit)
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
 * getLinkHref('/about', '/page', 'en', 'ja')        // '/ja/about'
 *
 * // Raw path (no localization)
 * getLinkHref('/about', '/ja/page', 'ja', '')       // '/about'
 * getLinkHref('/about', '/ja/page', 'ja', false)    // '/about'
 * ```
 */
export function getLinkHref(
  href: string,
  currentPathname: string,
  currentLocale: string | undefined,
  overrideLocale?: string | false
): string {
  const cleanPath = href.startsWith('/') ? href : `/${href}`

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
