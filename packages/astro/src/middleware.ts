/**
 * @i18n-tiny/astro/middleware
 *
 * Middleware helpers for Astro i18n routing
 */

import { detectLocale } from '@i18n-tiny/core/middleware'
import type { MiddlewareHandler } from 'astro'

// Re-export middleware utilities from @i18n-tiny/core/middleware
export { detectLocale } from '@i18n-tiny/core/middleware'

// Common static file extensions to skip in middleware
const STATIC_FILE_EXTENSIONS = /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|mjs|woff|woff2|ttf|eot|otf|mp3|mp4|webm|ogg|wav|pdf|zip|json|xml|txt|map)$/i

// Astro internal paths to always exclude
const DEFAULT_EXCLUDE_PATHS = ['/_astro', '/_image']

/**
 * Base configuration for middleware
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
  /**
   * Additional paths to exclude from i18n handling (e.g., ['/api'])
   *
   * Note: '/_astro' and '/_image' are always excluded by default
   * @default []
   */
  excludePaths?: string[]
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
   * SSR rewrite mode: stores locale in Astro.locals, rewrites to clean URLs
   * - /ja/about → stores 'ja' in locals, rewrites to /about
   * - / → detects from Accept-Language, stores in locals
   */
  routing: 'rewrite'
  prefixDefault?: never
  detectLanguage?: never
}

/**
 * Middleware configuration
 * Either use prefixDefault + detectLanguage OR routing: 'rewrite'
 */
export type MiddlewareConfig = StandardRoutingConfig | RewriteRoutingConfig

/**
 * Creates an Astro middleware handler for i18n routing
 *
 * @example
 * ```typescript
 * // src/middleware.ts
 * import { defineMiddleware } from 'astro/middleware'
 * import { create } from '@i18n-tiny/astro/middleware'
 *
 * // Default: / detects language, redirects non-default, rewrites default
 * export const onRequest = defineMiddleware(
 *   create({
 *     locales: ['en', 'ja'],
 *     defaultLocale: 'en'
 *   })
 * )
 *
 * // No detection, / serves fallbackLocale
 * export const onRequest = defineMiddleware(
 *   create({
 *     locales: ['en', 'ja'],
 *     defaultLocale: 'en',
 *     detectLanguage: false
 *   })
 * )
 *
 * // Always prefix default locale
 * export const onRequest = defineMiddleware(
 *   create({
 *     locales: ['en', 'ja'],
 *     defaultLocale: 'en',
 *     prefixDefault: true
 *   })
 * )
 *
 * // SSR with rewrite (clean URLs, locale in Astro.locals)
 * export const onRequest = defineMiddleware(
 *   create({
 *     locales: ['en', 'ja'],
 *     defaultLocale: 'en',
 *     routing: 'rewrite'
 *   })
 * )
 * ```
 */
export function create(config: MiddlewareConfig): MiddlewareHandler {
  const {
    locales,
    defaultLocale,
    fallbackLocale = defaultLocale,
    excludePaths: userExcludePaths = []
  } = config

  // Merge default exclude paths with user-provided paths
  const excludePaths = [...DEFAULT_EXCLUDE_PATHS, ...userExcludePaths]

  // Determine routing mode
  const isRewriteMode = 'routing' in config && config.routing === 'rewrite'
  const prefixDefault = isRewriteMode ? false : (config.prefixDefault ?? false)
  const detectLanguage = isRewriteMode ? true : (config.detectLanguage ?? true)

  return async (context, next) => {
    const { pathname } = context.url
    const locals = context.locals as Record<string, unknown>

    // Always store locales for Link component normalization
    locals.locales = locales

    // Skip excluded paths
    for (const excludePath of excludePaths) {
      if (pathname.startsWith(excludePath)) {
        return next()
      }
    }

    // Skip static files
    if (STATIC_FILE_EXTENSIONS.test(pathname)) {
      return next()
    }

    // Find locale prefix in URL
    const urlLocale = locales.find(
      (locale) =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    // SSR rewrite mode
    if (isRewriteMode) {
      // Skip if locale already set (from previous rewrite)
      if (locals.locale) {
        return next()
      }

      // Store original pathname for Link component to use
      locals.originalPathname = pathname

      if (urlLocale) {
        // /ja/about → store 'ja' in locals, rewrite to /about
        locals.locale = urlLocale
        const cleanPathname = pathname === `/${urlLocale}`
          ? '/'
          : pathname.slice(`/${urlLocale}`.length)
        return context.rewrite(cleanPathname)
      } else {
        // / → detect locale, store in locals, no redirect
        const acceptLanguage = context.request.headers.get('accept-language')
        const detectedLocale = detectLocale(acceptLanguage, locales) || fallbackLocale
        locals.locale = detectedLocale
        return next()
      }
    }

    // Standard routing modes
    if (urlLocale) {
      // URL has locale prefix, serve as-is
      return next()
    }

    // URL has no locale prefix
    if (detectLanguage) {
      // Detect from Accept-Language
      const acceptLanguage = context.request.headers.get('accept-language')
      const detectedLocale = detectLocale(acceptLanguage, locales) || fallbackLocale

      const newPathname = pathname === '/'
        ? `/${detectedLocale}`
        : `/${detectedLocale}${pathname}`

      if (prefixDefault) {
        // Always redirect to prefixed URL
        return context.redirect(newPathname, 302)
      } else {
        // Redirect non-default, rewrite default
        if (detectedLocale !== defaultLocale) {
          return context.redirect(newPathname, 302)
        } else {
          return context.rewrite(newPathname)
        }
      }
    } else {
      // No detection
      const newPathname = pathname === '/'
        ? `/${fallbackLocale}`
        : `/${fallbackLocale}${pathname}`

      if (prefixDefault) {
        // Redirect to default locale prefix
        return context.redirect(newPathname, 302)
      } else {
        // Rewrite to fallback locale
        return context.rewrite(newPathname)
      }
    }
  }
}
