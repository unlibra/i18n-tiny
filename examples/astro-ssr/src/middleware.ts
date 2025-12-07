import { defineMiddleware } from 'astro:middleware'
import { create } from '@i18n-tiny/astro/middleware'
import { locales, defaultLocale } from './i18n'

/**
 * SSR Middleware using @i18n-tiny/astro/middleware
 *
 * With routing: 'rewrite':
 * - /ja/about → rewrites to /about, stores 'ja' in Astro.locals.locale
 * - / → detects from Accept-Language, stores in Astro.locals.locale
 *
 * This allows serving all locales from clean URLs in SSR mode.
 */
export const onRequest = defineMiddleware(
  create({
    locales,
    defaultLocale,
    routing: 'rewrite'
  })
)
