import { defineMiddleware } from 'astro:middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { config } from './i18n.config'

/**
 * SSR Middleware using @i18n-tiny/astro/middleware
 *
 * With routing: 'rewrite' and detectLanguage: true:
 * - /ja/about → rewrites to /about, stores 'ja' in Astro.locals.locale
 * - / → detects from Accept-Language, stores in Astro.locals.locale, and
 *   adds Vary: Accept-Language to the response
 * - /api/... → excluded, no locale
 *
 * This allows serving all locales from clean URLs in SSR mode.
 */
export const onRequest = defineMiddleware(
  create({
    ...config,
    routing: 'rewrite',
    detectLanguage: true,
    excludePaths: ['/api']
  })
)
