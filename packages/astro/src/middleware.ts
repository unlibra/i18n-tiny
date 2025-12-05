/**
 * @i18n-tiny/astro/middleware
 *
 * Middleware helpers for Astro i18n routing
 */

import { detectLocale } from '@i18n-tiny/core'
import type { MiddlewareHandler } from 'astro'

// Common static file extensions to skip in middleware
const STATIC_FILE_EXTENSIONS = /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|mjs|woff|woff2|ttf|eot|otf|mp3|mp4|webm|ogg|wav|pdf|zip|json|xml|txt|map)$/i

export interface MiddlewareConfig {
  /** Array of supported locales (e.g., ['en', 'ja']) */
  locales: readonly string[]
  /** Default locale to use when none is detected */
  defaultLocale: string
  /**
   * Strategy for handling routes without locale prefix
   * - 'redirect': Redirect to the detected/default locale (302)
   * - 'rewrite': Internally rewrite to the default locale (URL stays the same)
   * @default 'redirect'
   */
  strategy?: 'redirect' | 'rewrite'
  /**
   * Whether to detect user's preferred language from Accept-Language header
   * @default true
   */
  detectLanguage?: boolean
  /**
   * Paths to exclude from i18n handling (e.g., ['/api', '/_image'])
   * @default []
   */
  excludePaths?: string[]
}

/**
 * @deprecated Use MiddlewareConfig instead
 */
export type I18nMiddlewareConfig = MiddlewareConfig

/**
 * Creates an Astro middleware handler for i18n routing
 *
 * @example
 * ```typescript
 * // src/middleware.ts
 * import { defineMiddleware } from 'astro/middleware'
 * import { middleware } from '@i18n-tiny/astro/middleware'
 *
 * export const onRequest = defineMiddleware(
 *   middleware({
 *     locales: ['en', 'ja'],
 *     defaultLocale: 'en',
 *     strategy: 'redirect',
 *     detectLanguage: true
 *   })
 * )
 * ```
 */
export function middleware(
  config: MiddlewareConfig
): MiddlewareHandler {
  const {
    locales,
    defaultLocale,
    strategy = 'redirect',
    detectLanguage = true,
    excludePaths = []
  } = config

  return async (context, next) => {
    const { pathname } = context.url

    // Skip excluded paths
    for (const excludePath of excludePaths) {
      if (pathname.startsWith(excludePath)) {
        return next()
      }
    }

    // Skip static files (check for common extensions)
    if (STATIC_FILE_EXTENSIONS.test(pathname)) {
      return next()
    }

    // Check if pathname already has a locale prefix
    const hasLocale = locales.some(
      (locale) =>
        pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (hasLocale) {
      return next()
    }

    // Detect locale from Accept-Language header
    let targetLocale = defaultLocale
    if (detectLanguage) {
      const acceptLanguage = context.request.headers.get('accept-language')
      const detected = detectLocale(acceptLanguage, locales)
      if (detected) {
        targetLocale = detected
      }
    }

    // Build the new URL with locale prefix
    const newPathname =
      pathname === '/' ? `/${targetLocale}` : `/${targetLocale}${pathname}`
    const newUrl = new URL(newPathname, context.url)

    if (strategy === 'redirect') {
      return context.redirect(newUrl.pathname, 302)
    } else {
      // Rewrite strategy
      return context.rewrite(newUrl.pathname)
    }
  }
}

