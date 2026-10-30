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
// protocol-relative URLs, and in-page '#' or '?' links
export const NON_PATH_HREF = /^(?:[a-zA-Z][a-zA-Z\d+.-]*:|\/\/|#|\?)/

function hasPrefix (pathname: string, locale: string): boolean {
  return pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
}

export function linkHref (
  href: string,
  currentPathname: string,
  currentLocale: string | undefined,
  options: { locale?: string | false, normalize?: boolean, config?: I18nConfig }
): string {
  if (NON_PATH_HREF.test(href)) {
    return href
  }

  const { locale, normalize = false, config } = options
  if (normalize && config === undefined) {
    throw new Error('[i18n] A link with normalize needs the config option.')
  }
  if (config !== undefined) {
    validateConfig(config)
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
