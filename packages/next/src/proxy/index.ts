/**
 * @i18n-tiny/next/proxy
 *
 * Proxy for Next.js i18n routing
 *
 * @example
 * // proxy.ts (Next.js 16+)
 * import { create } from '@i18n-tiny/next/proxy'
 * import { i18n } from './i18n'
 *
 * export const proxy = create(i18n)
 * export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detectLocale } from '@i18n-tiny/core/middleware'

// Re-export middleware utilities from @i18n-tiny/core/middleware
export { detectLocale } from '@i18n-tiny/core/middleware'

/**
 * Base configuration for proxy
 */
interface BaseConfig {
  /** Array of supported locales (e.g., ['en', 'ja']) */
  locales: readonly string[]
  /** Default locale used for prefix routing redirect target */
  defaultLocale: string
  /**
   * Fallback locale when detection fails or for optional routing
   * @default defaultLocale
   */
  fallbackLocale?: string
}

/**
 * Standard routing configuration using prefixDefault and detectLanguage
 *
 * | prefixDefault | detectLanguage | Behavior |
 * |---------------|----------------|----------|
 * | false | false | / serves fallbackLocale, no detection |
 * | false | true | / detects, redirects non-default, rewrites default |
 * | true | false | / redirects to /[defaultLocale] |
 * | true | true | / detects and redirects to detected locale |
 */
interface StandardRoutingConfig extends BaseConfig {
  routing?: never
  /**
   * Whether to prefix the default locale in URLs
   * - true: / redirects to /[defaultLocale]
   * - false: / serves the default/detected locale without prefix
   * @default false
   */
  prefixDefault?: boolean
  /**
   * Whether to detect language from Accept-Language header
   * - true: Auto-detect and redirect/rewrite based on browser preference
   * - false: Use fallbackLocale without detection
   * @default true
   */
  detectLanguage?: boolean
}

/**
 * SSR rewrite routing configuration
 * Mutually exclusive with prefixDefault and detectLanguage
 */
interface RewriteRoutingConfig extends BaseConfig {
  /**
   * SSR rewrite mode: stores locale in x-locale header, rewrites to clean URLs
   * - /ja/about → stores 'ja' in x-locale header, rewrites to /about
   * - / → detects from Accept-Language, stores in x-locale header
   */
  routing: 'rewrite'
  prefixDefault?: never
  detectLanguage?: never
}

/**
 * Proxy configuration
 * Either use prefixDefault + detectLanguage OR routing: 'rewrite'
 */
export type ProxyConfig = StandardRoutingConfig | RewriteRoutingConfig

/**
 * Creates a Next.js proxy (middleware) handler for i18n routing
 *
 * @example
 * ```typescript
 * // Default: / detects language, redirects non-default, rewrites default
 * export const proxy = create({
 *   locales: ['en', 'ja'],
 *   defaultLocale: 'en'
 * })
 *
 * // No detection, / serves fallbackLocale
 * export const proxy = create({
 *   locales: ['en', 'ja'],
 *   defaultLocale: 'en',
 *   detectLanguage: false
 * })
 *
 * // Always prefix default locale
 * export const proxy = create({
 *   locales: ['en', 'ja'],
 *   defaultLocale: 'en',
 *   prefixDefault: true
 * })
 *
 * // SSR with rewrite (locale in x-locale header)
 * export const proxy = create({
 *   locales: ['en', 'ja'],
 *   defaultLocale: 'en',
 *   routing: 'rewrite'
 * })
 * ```
 */
export function create(config: ProxyConfig) {
  const {
    locales,
    defaultLocale,
    fallbackLocale = defaultLocale
  } = config

  // Determine routing mode
  const isRewriteMode = 'routing' in config && config.routing === 'rewrite'
  const prefixDefault = isRewriteMode ? false : (config.prefixDefault ?? false)
  const detectLanguage = isRewriteMode ? true : (config.detectLanguage ?? true)

  return function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Find locale prefix in URL
    const urlLocale = locales.find(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // SSR rewrite mode
    if (isRewriteMode) {
      if (urlLocale) {
        // /ja/about → store 'ja' in header, rewrite to /about
        const cleanPathname = pathname === `/${urlLocale}`
          ? '/'
          : pathname.slice(`/${urlLocale}`.length)
        const url = request.nextUrl.clone()
        url.pathname = cleanPathname
        const response = NextResponse.rewrite(url)
        response.headers.set('x-locale', urlLocale)
        return response
      } else {
        // / → detect locale, store in header, no redirect
        const acceptLanguage = request.headers.get('accept-language')
        const detectedLocale = detectLocale(acceptLanguage, locales) || fallbackLocale
        const response = NextResponse.next()
        response.headers.set('x-locale', detectedLocale)
        return response
      }
    }

    // Standard routing modes
    if (urlLocale) {
      // URL has locale prefix, serve as-is
      return NextResponse.next()
    }

    // URL has no locale prefix
    if (detectLanguage) {
      // Detect from Accept-Language
      const acceptLanguage = request.headers.get('accept-language')
      const detectedLocale = detectLocale(acceptLanguage, locales) || fallbackLocale

      const url = request.nextUrl.clone()
      url.pathname = pathname === '/'
        ? `/${detectedLocale}`
        : `/${detectedLocale}${pathname}`

      if (prefixDefault) {
        // Always redirect to prefixed URL
        return NextResponse.redirect(url)
      } else {
        // Redirect non-default, rewrite default
        if (detectedLocale !== defaultLocale) {
          return NextResponse.redirect(url)
        } else {
          return NextResponse.rewrite(url)
        }
      }
    } else {
      // No detection
      const url = request.nextUrl.clone()
      url.pathname = pathname === '/'
        ? `/${fallbackLocale}`
        : `/${fallbackLocale}${pathname}`

      if (prefixDefault) {
        // Redirect to default locale prefix
        return NextResponse.redirect(url)
      } else {
        // Rewrite to fallback locale
        return NextResponse.rewrite(url)
      }
    }
  }
}

