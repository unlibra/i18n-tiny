import { validateConfig } from '../config'
import type { ConfigCheck, I18nConfig } from '../config'

/** A locale of the config */
export type ConfigLocale<C extends I18nConfig> = C['locales'][number]

/** The config parameter of the URL functions, checked by type where it can be */
export type CheckedConfig<C extends I18nConfig> = C & ConfigCheck<C>

/** A path on the site, such as '/about' */
export type Path = `/${string}`

// Throws unless the input is a pathname of this site: it must start with a
// single "/" and carry no query or hash. "//" and "/\" are refused, since
// browsers read them as the start of another host.
function assertPathname (pathname: string, name: string): asserts pathname is Path {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) {
    throw new Error(`[i18n] ${name} must be a pathname starting with "/", got ${JSON.stringify(pathname)}.`)
  }
  if (startsWithAnotherHost(pathname)) {
    throw new Error(
      `[i18n] ${name} must not start with "//" or "/\\", which browsers read as another host, ` +
      `got ${JSON.stringify(pathname)}.`
    )
  }
  if (pathname.includes('?') || pathname.includes('#')) {
    throw new Error(
      `[i18n] ${name} must be a pathname without "?" or "#", got ${JSON.stringify(pathname)}. ` +
      'Add the query and the hash after building the path.'
    )
  }
}

function assertLocale (locale: string, config: I18nConfig): void {
  if (!config.locales.includes(locale)) {
    throw new Error(
      `[i18n] Unknown locale ${JSON.stringify(locale)}. ` +
      `Expected one of ${config.locales.map(l => JSON.stringify(l)).join(', ')}.`
    )
  }
}

// Removes trailing slashes, keeping the top page as "/". Counts them from the
// end instead of using a regular expression, whose time would grow with the
// square of the length on long runs of slashes that do not end the path.
function withoutTrailingSlash (path: Path): Path {
  let end = path.length
  while (end > 1 && path[end - 1] === '/') {
    end--
  }
  return end === path.length ? path : path.slice(0, end) as Path
}

function startsWithAnotherHost (path: string): boolean {
  return path.startsWith('//') || path.startsWith('/\\')
}

// The locale whose prefix the pathname starts with, if any
function findPrefixLocale (pathname: Path, config: I18nConfig): string | undefined {
  return config.locales.find(locale => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))
}

function addPrefix (path: Path, locale: string, config: I18nConfig): Path {
  const clean = withoutTrailingSlash(path)
  if (locale === config.defaultLocale && !config.prefixDefault) {
    return clean
  }
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`
}

// Throws when the rest after the prefix starts with "//" or "/\", as
// "/en//example.com" would: the result would lead to another host.
function removePrefix (pathname: Path, config: I18nConfig): Path {
  const locale = findPrefixLocale(pathname, config)
  const rest = locale === undefined ? pathname : pathname.slice(locale.length + 1)
  const result = withoutTrailingSlash((rest === '' ? '/' : rest) as Path)
  if (startsWithAnotherHost(result)) {
    throw new Error(
      `[i18n] pathname must not start with "//" or "/\\" after its locale prefix, ` +
      `which browsers read as another host, got ${JSON.stringify(pathname)}.`
    )
  }
  return result
}

/**
 * Builds the URL path of a page in a locale
 *
 * The path is the page's path without a locale prefix. The default locale gets
 * no prefix unless `prefixDefault` is true. The result has no trailing slash,
 * except for the top page "/". A path that already has a locale prefix gets
 * another one: use alternatePath() for the path of the current page.
 *
 * Throws when the path does not start with "/", starts with "//" or "/\",
 * contains "?" or "#", when the locale is not one of `locales`, or when the
 * config is invalid.
 *
 * @example
 * ```typescript
 * import { localizedPath } from '@i18n-tiny/core/router'
 *
 * const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
 * localizedPath('/donate', 'en', config) // '/en/donate'
 * localizedPath('/donate', 'ja', config) // '/donate'
 * localizedPath('/', 'en', config)       // '/en'
 * ```
 */
export function localizedPath<const C extends I18nConfig> (
  path: string,
  locale: NoInfer<ConfigLocale<C>>,
  config: CheckedConfig<C>
): Path {
  validateConfig(config)
  assertPathname(path, 'path')
  assertLocale(locale, config)
  return addPrefix(path, locale, config)
}

/**
 * Builds the URL path of the current page in another locale
 *
 * Removes the locale prefix of the pathname, if it has one, and adds the
 * prefix of the given locale, as localizedPath() does.
 *
 * Throws in the same cases as localizedPath().
 *
 * @example
 * ```typescript
 * import { alternatePath } from '@i18n-tiny/core/router'
 *
 * const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
 * alternatePath('/en/donate', 'ja', config) // '/donate'
 * alternatePath('/donate', 'en', config)    // '/en/donate'
 * ```
 */
export function alternatePath<const C extends I18nConfig> (
  pathname: string,
  locale: NoInfer<ConfigLocale<C>>,
  config: CheckedConfig<C>
): Path {
  validateConfig(config)
  assertPathname(pathname, 'pathname')
  assertLocale(locale, config)
  return addPrefix(removePrefix(pathname, config), locale, config)
}

/**
 * Removes the locale prefix from a pathname. The result has no trailing
 * slash, except for the top page "/".
 *
 * Throws in the same cases as localizedPath(), except that it takes no locale.
 */
export function stripLocalePrefix<const C extends I18nConfig> (
  pathname: string,
  config: CheckedConfig<C>
): Path {
  validateConfig(config)
  assertPathname(pathname, 'pathname')
  return removePrefix(pathname, config)
}

/**
 * The locale whose prefix the pathname starts with, or undefined when it has
 * no locale prefix. Only whole path segments match: '/english' has none.
 *
 * Throws in the same cases as localizedPath(), except that it takes no locale.
 *
 * @example
 * ```typescript
 * import { pathLocale } from '@i18n-tiny/core/router'
 *
 * const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
 * pathLocale('/en/donate', config) // 'en'
 * pathLocale('/donate', config)    // undefined
 * ```
 */
export function pathLocale<const C extends I18nConfig> (
  pathname: string,
  config: CheckedConfig<C>
): ConfigLocale<C> | undefined {
  validateConfig(config)
  assertPathname(pathname, 'pathname')
  return findPrefixLocale(pathname, config)
}
