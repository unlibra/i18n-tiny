/**
 * @i18n-tiny/next/proxy
 *
 * Proxy for Next.js i18n routing
 *
 * @example
 * // proxy.ts (Next.js 16+)
 * import { create } from '@i18n-tiny/next/proxy'
 * import { config as i18nConfig } from './i18n.config'
 *
 * export const proxy = create({ ...i18nConfig })
 * export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] }
 */

import { NextResponse } from 'next/server.js'
import type { NextRequest } from 'next/server.js'
import { detectLocale } from '@i18n-tiny/core/middleware'
import { pathLocale } from '@i18n-tiny/core/router'
import { validateConfig } from '@i18n-tiny/core/internal'
import type { ConfigCheck } from '@i18n-tiny/core/internal'

// Re-export middleware utilities from @i18n-tiny/core/middleware
export { detectLocale } from '@i18n-tiny/core/middleware'

/**
 * Base configuration for proxy
 */
interface BaseConfig {
  /** Array of supported locales (e.g., ['en', 'ja']) */
  readonly locales: readonly string[]
  /** The locale of URLs without a locale prefix */
  readonly defaultLocale: string
  /**
   * Locale used when language detection finds no match
   * @default defaultLocale
   */
  readonly fallbackLocale?: string
  /**
   * Whether to detect the language of a URL without a locale prefix from the
   * Accept-Language header
   * - true: detect, and use fallbackLocale when nothing matches
   * - false: a URL without a locale prefix is the default locale
   * @default false
   */
  readonly detectLanguage?: boolean
}

/**
 * Standard routing: the pages are under app/[locale]/, and URLs of the
 * default locale have no prefix unless prefixDefault is true.
 *
 * | prefixDefault | detectLanguage | A URL without a locale prefix |
 * |---------------|----------------|-------------------------------|
 * | false | false | Rewritten to /[defaultLocale] |
 * | false | true | Detects: redirects to another locale, or is rewritten to /[defaultLocale] |
 * | true | false | Redirects to /[defaultLocale] |
 * | true | true | Detects and redirects to the detected locale |
 */
interface StandardRoutingConfig extends BaseConfig {
  readonly routing?: never
  /**
   * Whether URLs of the default locale also carry the locale prefix. Put it
   * in the config shared with define(): the links read it from there
   * @default false
   */
  readonly prefixDefault?: boolean
}

/**
 * SSR rewrite routing: the pages are not under a locale folder. The locale
 * is passed to the pages in the x-locale request header, and /ja/about is
 * rewritten to /about. A URL without a locale prefix is the default
 * locale, or with detectLanguage: true the detected locale.
 *
 * With the language detection, a URL without a locale prefix is not the
 * default locale, so the links of the default locale need its prefix:
 * prefixDefault must be true, in this config and in the one of define().
 */
interface RewriteRoutingConfig extends BaseConfig {
  readonly routing: 'rewrite'
  /**
   * Whether the links of the default locale carry the locale prefix. Must
   * be true with detectLanguage: true. A URL without a locale prefix
   * is served in the rewrite mode either way.
   * @default false
   */
  readonly prefixDefault?: boolean
}

/**
 * Proxy configuration
 * Either the standard routing with prefixDefault, or routing: 'rewrite'
 */
export type ProxyConfig = StandardRoutingConfig | RewriteRoutingConfig

// The language detection of the rewrite mode needs prefixDefault: true. The
// types stop a config only when they say that it throws: a routing that is
// 'rewrite' and a detectLanguage that is true, with a prefixDefault that
// cannot be true. Where they cannot tell, as for a value typed as boolean or
// a config typed as the type above, create() checks it at run time. A union
// is stopped when each of its members throws.
type PropertyType<C, K extends PropertyKey> = K extends keyof C ? C[K] : undefined
type Throws<C> = C extends unknown
  ? [PropertyType<C, 'routing'>, PropertyType<C, 'detectLanguage'>] extends ['rewrite', true]
      ? true extends PropertyType<C, 'prefixDefault'> ? false : true
      : false
  : never
type RewriteCheck<C> = [Throws<C>] extends [true]
  ? { 'invalid i18n config': 'the language detection of the rewrite mode needs prefixDefault: true; without it, detectLanguage must be false or left out' }
  : unknown

// The type checks of the proxy config: those of define(), then those of the routing
type ProxyConfigCheck<C extends ProxyConfig> = unknown extends ConfigCheck<C> ? RewriteCheck<C> : ConfigCheck<C>

const REWRITE_NEEDS_PREFIX_DEFAULT =
  '[i18n] The language detection of the rewrite mode needs prefixDefault: true. ' +
  'A URL without a locale prefix is the detected locale, so the links of the default locale need its prefix. ' +
  'Set prefixDefault: true in the config shared with define(), or leave out detectLanguage: true.'

/** The request header that passes the locale to the pages in the rewrite mode */
const LOCALE_HEADER = 'x-locale'

// "//host" and "/\host" lead to another host
function startsWithAnotherHost (path: string): boolean {
  return path.startsWith('//') || path.startsWith('/\\')
}

// The headers of the request, with the locale set, or removed when it is
// undefined: an x-locale header sent by the client is never passed on
function requestHeaders (request: NextRequest, locale: string | undefined): { request: { headers: Headers } } {
  const headers = new Headers(request.headers)
  if (locale === undefined) {
    headers.delete(LOCALE_HEADER)
  } else {
    headers.set(LOCALE_HEADER, locale)
  }
  return { request: { headers } }
}

// Adds Accept-Language to the Vary header of a response that depends on it
function varyOnAcceptLanguage (response: NextResponse): NextResponse {
  const vary = response.headers.get('Vary')
  if (vary !== null && vary.split(',').some(name => ['*', 'accept-language'].includes(name.trim().toLowerCase()))) {
    return response
  }
  response.headers.set('Vary', vary === null || vary.trim() === '' ? 'Accept-Language' : `${vary}, Accept-Language`)
  return response
}

/**
 * Creates a Next.js proxy (middleware) handler for i18n routing
 *
 * The config is checked as define() checks it, and the rewrite mode with the
 * language detection throws without prefixDefault: true. A pathname that
 * starts with "//" or "/\", also once its locale prefix is removed, gets no
 * i18n handling. Responses that depend on the language detection get
 * `Vary: Accept-Language`.
 *
 * @example
 * ```typescript
 * import { config as i18nConfig } from './i18n.config'
 *
 * // URLs without a locale prefix are the default locale
 * export const proxy = create({ ...i18nConfig })
 *
 * // Detects the language of URLs without a locale prefix: redirects to
 * // another locale, or serves the default locale
 * export const proxy = create({ ...i18nConfig, detectLanguage: true })
 *
 * // Always prefix the default locale: prefixDefault: true goes in the
 * // config shared with define(), whose Link and URL functions read it
 * // { locales: ['ja', 'en'], defaultLocale: 'ja', prefixDefault: true }
 * export const proxy = create({ ...i18nConfig })
 *
 * // SSR with rewrite (clean URLs, locale in the x-locale request header)
 * export const proxy = create({ ...i18nConfig, routing: 'rewrite' })
 *
 * // The rewrite mode with the language detection: the config has
 * // prefixDefault: true
 * // { locales: ['ja', 'en'], defaultLocale: 'ja', prefixDefault: true }
 * export const proxy = create({ ...i18nConfig, routing: 'rewrite', detectLanguage: true })
 * ```
 */
export function create<const C extends ProxyConfig> (config: C & ProxyConfigCheck<C>) {
  const { locales, defaultLocale, fallbackLocale = defaultLocale } = config as ProxyConfig
  validateConfig({ locales, defaultLocale, fallbackLocale })

  const isRewriteMode = config.routing === 'rewrite'
  const prefixDefault = config.prefixDefault ?? false
  const detectLanguage = config.detectLanguage ?? false
  if (isRewriteMode && detectLanguage && prefixDefault !== true) {
    throw new Error(REWRITE_NEEDS_PREFIX_DEFAULT)
  }
  const urlConfig = { locales, defaultLocale, prefixDefault }

  return function proxy (request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl

    // A pathname that leads to another host, also once its locale prefix is
    // removed, gets no i18n handling
    const urlLocale = startsWithAnotherHost(pathname) ? undefined : pathLocale(pathname, urlConfig)
    const rest = urlLocale === undefined ? pathname : (pathname.slice(urlLocale.length + 1) || '/')
    if (startsWithAnotherHost(rest)) {
      return isRewriteMode ? NextResponse.next(requestHeaders(request, undefined)) : NextResponse.next()
    }

    const detect = () => detectLocale(request.headers.get('accept-language'), locales) ?? fallbackLocale
    const withLocale = (locale: string) => {
      const url = request.nextUrl.clone()
      url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`
      return url
    }

    // SSR rewrite mode
    if (isRewriteMode) {
      if (urlLocale !== undefined) {
        // /ja/about → pass 'ja' in the x-locale header, rewrite to /about
        const url = request.nextUrl.clone()
        url.pathname = rest
        return NextResponse.rewrite(url, requestHeaders(request, urlLocale))
      }
      if (!detectLanguage) {
        return NextResponse.next(requestHeaders(request, defaultLocale))
      }
      // / → detect the locale and pass it in the x-locale header, no redirect
      return varyOnAcceptLanguage(NextResponse.next(requestHeaders(request, detect())))
    }

    // Standard routing: a URL with a locale prefix is served as it is
    if (urlLocale !== undefined) {
      return NextResponse.next()
    }

    if (!detectLanguage) {
      return prefixDefault
        ? NextResponse.redirect(withLocale(defaultLocale))
        : NextResponse.rewrite(withLocale(defaultLocale))
    }

    const detectedLocale = detect()
    if (prefixDefault || detectedLocale !== defaultLocale) {
      return varyOnAcceptLanguage(NextResponse.redirect(withLocale(detectedLocale)))
    }
    // The default locale is served without a prefix by app/[locale]
    return varyOnAcceptLanguage(NextResponse.rewrite(withLocale(defaultLocale)))
  }
}
