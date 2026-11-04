import { validateConfig } from '../config'
import type { I18nConfig } from '../config'
import { addPrefix, assertLocale, assertPathname, removePrefix, withoutTrailingSlash } from './paths'
import type { CheckedConfig, ConfigLocale } from './paths'

/**
 * Options of getLinkHref()
 *
 * - `locale`: undefined keeps the locale of the current URL, a locale builds
 *   the link for that locale, and false leaves the path without a locale
 * - `normalize`: removes a locale prefix from the href first, such as when
 *   the href is the current pathname
 * - `config`: the locale settings, required with a locale or `normalize`
 */
export type LinkHrefOptions<C extends I18nConfig = I18nConfig> =
  | {
      readonly locale?: false
      readonly normalize?: false
      readonly config?: CheckedConfig<C>
    }
  | {
      readonly locale?: NoInfer<ConfigLocale<C>> | false
      readonly normalize?: boolean
      readonly config: CheckedConfig<C>
    }

// Hrefs that are not paths on this site: absolute URLs (https:, mailto:, ...),
// protocol-relative URLs, and in-page '#' or '?' links. Only "//" written as
// such is a link to another host: other paths that browsers may read as
// another host, such as "/\host" or "/\t/host", throw in assertPathname().
const NON_PATH_HREF = /^(?:[a-zA-Z][a-zA-Z\d+.-]*:|\/\/|#|\?)/

function hasPrefix (pathname: string, locale: string): boolean {
  return pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
}

// getLinkHref() with the check of the config given: validateConfig() for
// getLinkHref(), none for a config that is checked once instead, such as the
// one of the Provider of define(). The config is checked only for a path.
export function linkHref (
  href: string,
  currentPathname: string,
  currentLocale: string | undefined,
  options: { locale?: string | false, normalize?: boolean, config?: I18nConfig },
  checkConfig?: (config: I18nConfig) => void
): string {
  // Refuses the fourth argument of 1.x, a locale string, from JavaScript
  if (typeof options !== 'object' || options === null) {
    throw new Error('[i18n] getLinkHref() takes the options object { locale, normalize, config } as its fourth argument.')
  }
  if (NON_PATH_HREF.test(href)) {
    return href
  }

  const { locale, normalize = false, config } = options
  if (normalize && config === undefined) {
    throw new Error('[i18n] A link with normalize needs the config option.')
  }
  if (config !== undefined) {
    checkConfig?.(config)
  }

  // Keep the query and the hash aside and build the path only
  const suffixStart = href.search(/[?#]/)
  const path = suffixStart === -1 ? href : href.slice(0, suffixStart)
  const suffix = suffixStart === -1 ? '' : href.slice(suffixStart)
  assertPathname(path, 'href')

  const cleanPath = normalize && config ? removePrefix(path, config) : withoutTrailingSlash(path)

  if (locale === false) {
    return cleanPath + suffix
  }

  if (locale !== undefined) {
    if (config === undefined) {
      throw new Error(`[i18n] A link with locale ${JSON.stringify(locale)} needs the config option.`)
    }
    assertLocale(locale, config)
    return addPrefix(cleanPath, locale, config) + suffix
  }

  // Keep the pattern of the current URL: a prefix when it has one
  if (currentLocale && hasPrefix(currentPathname, currentLocale)) {
    return (cleanPath === '/' ? `/${currentLocale}` : `/${currentLocale}${cleanPath}`) + suffix
  }
  return cleanPath + suffix
}

/**
 * Build the href of a Link component
 *
 * Not a public API. The Link components of @i18n-tiny/astro and
 * @i18n-tiny/next use linkHref(), the same without the check of the config.
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
 * a tab or a line break, when the locale is not one of `locales`, when
 * `config` is missing with a locale or `normalize`, or when the config is
 * invalid.
 *
 * @param href - The href of the link, such as '/about' or '/about#team'
 * @param currentPathname - The pathname of the current URL
 * @param currentLocale - The locale of the current page
 * @param options - The locale of the link, `normalize` and the config
 *
 * @example
 * ```typescript
 * import { getLinkHref } from '@i18n-tiny/core/internal'
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
