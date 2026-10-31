/**
 * @i18n-tiny/astro/middleware
 *
 * Middleware helpers for Astro i18n routing
 */

import type { ConfigCheck } from '@i18n-tiny/core/internal'
import type { MiddlewareHandler } from 'astro'
import { createMiddleware } from './routing'

// Re-export middleware utilities from @i18n-tiny/core/middleware
export { detectLocale } from '@i18n-tiny/core/middleware'

/**
 * Base configuration for middleware
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
   * Additional paths to exclude from i18n handling (e.g., ['/api']), without
   * the base. A path matches itself and the paths under it: '/api' matches
   * '/api' and '/api/users', but not '/apis'.
   *
   * Note: '/_astro' and '/_image' are always excluded by default
   * @default []
   */
  readonly excludePaths?: readonly string[]
  /**
   * Whether to detect the language of a URL without a locale prefix from the
   * Accept-Language header
   * - true: detect, and use fallbackLocale when nothing matches
   * - false: a URL without a locale prefix is the default locale
   * @default true
   */
  readonly detectLanguage?: boolean
}

/**
 * Standard routing: the pages are under src/pages/[...locale]/, and URLs of
 * the default locale have no prefix unless prefixDefault is true.
 *
 * | prefixDefault | detectLanguage | A URL without a locale prefix |
 * |---------------|----------------|-------------------------------|
 * | false | false | Served as the default locale |
 * | false | true | Detects: redirects to another locale, or is served as the default locale |
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
 * is stored in Astro.locals.locale, and /ja/about is rewritten to /about.
 * A URL without a locale prefix is the detected locale, or the default
 * locale with detectLanguage: false.
 *
 * With the language detection, a URL without a locale prefix is not the
 * default locale, so the links of the default locale need its prefix:
 * prefixDefault must be true, in this config and in the one of define().
 */
interface RewriteRoutingConfig extends BaseConfig {
  readonly routing: 'rewrite'
  /**
   * Whether the links of the default locale carry the locale prefix. Must
   * be true unless detectLanguage is false. A URL without a locale prefix
   * is served in the rewrite mode either way.
   * @default false
   */
  readonly prefixDefault?: boolean
}

/**
 * Middleware configuration
 * Either the standard routing with prefixDefault, or routing: 'rewrite'
 */
export type MiddlewareConfig = StandardRoutingConfig | RewriteRoutingConfig

// The language detection of the rewrite mode needs prefixDefault: true. A
// detectLanguage or a prefixDefault typed as boolean may break it, and fails.
type RewriteCheck<C> = C extends { readonly routing: 'rewrite' }
  ? C extends { readonly detectLanguage: false }
    ? unknown
    : C extends { readonly prefixDefault: true }
      ? unknown
      : { 'invalid i18n config': 'the language detection of the rewrite mode needs prefixDefault: true' }
  : unknown

/** The type checks of the middleware config: those of define(), then those of the routing */
type MiddlewareConfigCheck<C extends MiddlewareConfig> = unknown extends ConfigCheck<C> ? RewriteCheck<C> : ConfigCheck<C>

// import.meta.env is set where Vite builds the middleware, as Astro does.
// Typed here, as declaring it globally would clash with the types of Vite.
function currentBase (): string {
  return (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
}

/**
 * Creates an Astro middleware handler for i18n routing
 *
 * The config is checked as define() checks it. An excludePaths entry that
 * does not start with "/" throws, and so does the rewrite mode with the
 * language detection without prefixDefault: true.
 *
 * @example
 * ```typescript
 * // src/middleware.ts
 * import { defineMiddleware } from 'astro/middleware'
 * import { create } from '@i18n-tiny/astro/middleware'
 * import { config } from './i18n.config'
 *
 * // Detects the language of URLs without a locale prefix: redirects to
 * // another locale, or serves the default locale
 * export const onRequest = defineMiddleware(create({ ...config }))
 *
 * // No detection: URLs without a locale prefix are the default locale
 * export const onRequest = defineMiddleware(create({ ...config, detectLanguage: false }))
 *
 * // Always prefix the default locale: prefixDefault: true goes in the
 * // config shared with define(), whose Link and URL functions read it
 * // { locales: ['ja', 'en'], defaultLocale: 'ja', prefixDefault: true }
 * export const onRequest = defineMiddleware(create({ ...config }))
 *
 * // SSR with rewrite (clean URLs, locale in Astro.locals). With the
 * // language detection, the config has prefixDefault: true:
 * // { locales: ['ja', 'en'], defaultLocale: 'ja', prefixDefault: true }
 * export const onRequest = defineMiddleware(create({ ...config, routing: 'rewrite' }))
 * ```
 */
export function create<const C extends MiddlewareConfig> (config: C & MiddlewareConfigCheck<C>): MiddlewareHandler {
  return createMiddleware(config, currentBase)
}
