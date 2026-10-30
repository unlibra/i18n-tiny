// The routing of the middleware. Bundled into the middleware entry, not an
// entry of its own.

import { detectLocale } from '@i18n-tiny/core/middleware'
import { pathLocale } from '@i18n-tiny/core/router'
import { validateConfig } from '@i18n-tiny/core/internal'
import type { MiddlewareHandler } from 'astro'
import { addBase, stripBase } from './internal'
import type { MiddlewareConfig } from './middleware'

// Common static file extensions to skip in middleware
const STATIC_FILE_EXTENSIONS = /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|mjs|woff|woff2|ttf|eot|otf|mp3|mp4|webm|ogg|wav|pdf|zip|json|xml|txt|map)$/i

// Astro internal paths to always exclude
const DEFAULT_EXCLUDE_PATHS = ['/_astro', '/_image']

// The path without trailing slashes: '' for '/'
function trimTrailingSlashes (path: string): string {
  let end = path.length
  while (end > 0 && path[end - 1] === '/') {
    end--
  }
  return path.slice(0, end)
}

// "//host" and "/\host" lead to another host
function startsWithAnotherHost (path: string): boolean {
  return path.startsWith('//') || path.startsWith('/\\')
}

// Adds Accept-Language to the Vary header of a response that depends on it
function varyOnAcceptLanguage (response: Response): Response {
  const vary = response.headers.get('Vary')
  if (vary !== null && vary.split(',').some(name => ['*', 'accept-language'].includes(name.trim().toLowerCase()))) {
    return response
  }
  const value = vary === null || vary.trim() === '' ? 'Accept-Language' : `${vary}, Accept-Language`
  try {
    response.headers.set('Vary', value)
    return response
  } catch {
    // Some responses have immutable headers: copy the response
    const copy = new Response(response.body, response)
    copy.headers.set('Vary', value)
    return copy
  }
}

/**
 * The middleware of create(), with the base read by `getBase` on each
 * request, so that the tests can give one
 */
export function createMiddleware (config: MiddlewareConfig, getBase: () => string): MiddlewareHandler {
  const { locales, defaultLocale, fallbackLocale = defaultLocale, excludePaths: userExcludePaths = [] } = config
  validateConfig({ locales, defaultLocale, fallbackLocale })
  for (const path of userExcludePaths) {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw new Error(`[i18n] excludePaths must be paths starting with "/", got ${JSON.stringify(path)}.`)
    }
  }

  // Compared without trailing slashes: '/api/' is the same as '/api'
  const excludePaths = [...DEFAULT_EXCLUDE_PATHS, ...userExcludePaths].map(trimTrailingSlashes)
  const isExcluded = (pathname: string) => excludePaths.some(path => pathname === path || pathname.startsWith(`${path}/`))

  const isRewriteMode = config.routing === 'rewrite'
  const prefixDefault = isRewriteMode ? false : (config.prefixDefault ?? false)
  const detectLanguage = config.detectLanguage ?? true
  const urlConfig = { locales, defaultLocale, prefixDefault }

  // The path for a locale, keeping the trailing slash of the input
  const withLocale = (pathname: string, locale: string) => pathname === '/' ? `/${locale}` : `/${locale}${pathname}`

  return async (context, next) => {
    const base = getBase()
    // The query string is carried over to every redirect and rewrite target
    const { search } = context.url
    // Routing works on the path without the base, which is added back to
    // the redirect and rewrite targets
    const pathname = stripBase(context.url.pathname, base)
    const locals = context.locals as Record<string, unknown>

    if (isExcluded(pathname) || STATIC_FILE_EXTENSIONS.test(pathname)) {
      return next()
    }

    // A pathname that leads to another host, also once its locale prefix is
    // removed, gets no i18n handling
    if (startsWithAnotherHost(pathname)) {
      return next()
    }
    const urlLocale = pathLocale(pathname, urlConfig)
    const rest = urlLocale === undefined ? pathname : (pathname.slice(urlLocale.length + 1) || '/')
    if (startsWithAnotherHost(rest)) {
      return next()
    }

    const detect = () => detectLocale(context.request.headers.get('accept-language'), locales) ?? fallbackLocale

    // SSR rewrite mode
    if (isRewriteMode) {
      // Skip if locale already set (from previous rewrite)
      if (locals.locale) {
        return next()
      }

      // The URL before the rewrite, for the Link component
      locals.originalPathname = context.url.pathname

      if (urlLocale !== undefined) {
        // /ja/about → store 'ja' in locals, rewrite to /about
        locals.locale = urlLocale
        return context.rewrite(addBase(rest, base) + search)
      }
      if (!detectLanguage) {
        locals.locale = defaultLocale
        return next()
      }
      // / → detect locale, store in locals, no redirect
      locals.locale = detect()
      return varyOnAcceptLanguage(await next())
    }

    // Standard routing: a URL with a locale prefix is served as it is
    if (urlLocale !== undefined) {
      return next()
    }

    if (!detectLanguage) {
      return prefixDefault
        ? context.redirect(addBase(withLocale(pathname, defaultLocale), base) + search, 302)
        : next()
    }

    const detectedLocale = detect()
    if (prefixDefault || detectedLocale !== defaultLocale) {
      return varyOnAcceptLanguage(context.redirect(addBase(withLocale(pathname, detectedLocale), base) + search, 302))
    }
    // The default locale is served without a prefix by [...locale]
    return varyOnAcceptLanguage(await next())
  }
}
