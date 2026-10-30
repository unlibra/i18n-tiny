import { describe, it, expect, vi } from 'vitest'
import type { APIContext, MiddlewareNext } from 'astro'
import { create } from '../middleware'
import type { MiddlewareConfig } from '../middleware'
import { createMiddleware } from '../routing'

const config = { locales: ['en', 'ja', 'fr'], defaultLocale: 'en' } as const

interface Outcome {
  /** What the middleware did */
  kind: 'next' | 'redirect' | 'rewrite'
  /** The redirect or rewrite target */
  target?: string
  status: number
  vary: string | null
  locals: Record<string, unknown>
}

// Runs the middleware for a request and reports what it did
async function run (
  middlewareConfig: MiddlewareConfig,
  url: string,
  { acceptLanguage, locals = {}, nextResponse, base }: {
    acceptLanguage?: string
    locals?: Record<string, unknown>
    nextResponse?: () => Response
    /** The base of the site: create() reads it from import.meta.env, which is '/' here */
    base?: string
  } = {}
): Promise<Outcome> {
  const middleware = base === undefined
    ? create(middlewareConfig as never)
    : createMiddleware(middlewareConfig, () => base)
  let kind: Outcome['kind'] | undefined
  let target: string | undefined
  const headers = new Headers(acceptLanguage === undefined ? {} : { 'Accept-Language': acceptLanguage })
  // Joined, not resolved: '//host' is a pathname of the request here
  const requestUrl = new URL(`http://localhost${url}`)
  const context = {
    url: requestUrl,
    request: new Request(requestUrl, { headers }),
    locals,
    redirect: (path: string, status = 302) => {
      kind = 'redirect'
      target = path
      return new Response(null, { status, headers: { Location: path } })
    },
    rewrite: (path: string) => {
      kind = 'rewrite'
      target = path
      return Promise.resolve(new Response('rewritten'))
    }
  } as unknown as APIContext
  const next = vi.fn(() => {
    kind = 'next'
    return Promise.resolve(nextResponse ? nextResponse() : new Response('page'))
  }) as unknown as MiddlewareNext

  const response = await middleware(context, next) as Response
  if (kind === undefined) throw new Error('the middleware did not respond')
  return { kind, target, status: response.status, vary: response.headers.get('Vary'), locals }
}

const passed = (outcome: Outcome) => outcome.kind === 'next'
const runWithBase = run

describe('create (middleware)', () => {
  describe('config', () => {
    it('throws for an invalid config', () => {
      expect(() => create({ locales: ['en', 'ja'], defaultLocale: 'fr' } as never)).toThrow('[i18n] defaultLocale "fr" is not one of locales ("en", "ja").')
      expect(() => create({ locales: [], defaultLocale: 'en' } as never)).toThrow('[i18n] locales must be a non-empty array')
      expect(() => create({ locales: ['en', 'en'], defaultLocale: 'en' } as never)).toThrow('[i18n] Locale "en" is listed more than once in locales.')
      expect(() => create({ ...config, fallbackLocale: 'de' } as never)).toThrow('[i18n] fallbackLocale "de" is not one of locales ("en", "ja", "fr").')
    })

    it('throws for an excludePaths entry that does not start with "/"', () => {
      expect(() => create({ ...config, excludePaths: ['/ok', 'api'] })).toThrow('[i18n] excludePaths must be paths starting with "/", got "api".')
      expect(() => create({ ...config, excludePaths: [''] })).toThrow('got "".')
    })

    it('does not store the locales in the locals', async () => {
      for (const middlewareConfig of [config, { ...config, routing: 'rewrite' } as const]) {
        const outcome = await run(middlewareConfig, '/ja/about')
        expect(outcome.locals).not.toHaveProperty('locales')
      }
    })
  })

  describe('prefixDefault: false, detectLanguage: true (default)', () => {
    it('serves URLs with a locale prefix as they are, without Vary', async () => {
      for (const url of ['/en', '/ja', '/ja/about', '/fr/a/b']) {
        const outcome = await run(config, url, { acceptLanguage: 'ja' })
        expect(passed(outcome)).toBe(true)
        expect(outcome.vary).toBeNull()
      }
    })

    it('redirects a URL without a prefix to the detected locale', async () => {
      const outcome = await run(config, '/about', { acceptLanguage: 'ja,en;q=0.5' })
      expect(outcome).toMatchObject({ kind: 'redirect', target: '/ja/about', status: 302, vary: 'Accept-Language' })
      expect((await run(config, '/', { acceptLanguage: 'fr' })).target).toBe('/fr')
    })

    it('serves the default locale without a prefix, with Vary', async () => {
      const outcome = await run(config, '/about', { acceptLanguage: 'en-US' })
      expect(outcome).toMatchObject({ kind: 'next', status: 200, vary: 'Accept-Language' })
      expect(outcome.locals).not.toHaveProperty('locale')
    })

    it('serves the fallback locale when nothing matches', async () => {
      expect(await run(config, '/about', { acceptLanguage: 'de' })).toMatchObject({ kind: 'next', vary: 'Accept-Language' })
      expect(await run(config, '/about')).toMatchObject({ kind: 'next', vary: 'Accept-Language' })
      expect(await run({ ...config, fallbackLocale: 'ja' }, '/about', { acceptLanguage: 'de' }))
        .toMatchObject({ kind: 'redirect', target: '/ja/about', vary: 'Accept-Language' })
    })

    it('never picks a language marked with q=0', async () => {
      expect(await run(config, '/about', { acceptLanguage: 'ja;q=0, en;q=0.1' })).toMatchObject({ kind: 'next' })
      expect(await run({ ...config, fallbackLocale: 'fr' }, '/about', { acceptLanguage: 'ja;q=0' }))
        .toMatchObject({ kind: 'redirect', target: '/fr/about' })
    })

    it('keeps the query string and the trailing slash', async () => {
      expect((await run(config, '/about/?x=1&y=2', { acceptLanguage: 'ja' })).target).toBe('/ja/about/?x=1&y=2')
      expect((await run(config, '/?q=a', { acceptLanguage: 'ja' })).target).toBe('/ja?q=a')
    })

    it('adds Accept-Language to the Vary of the page', async () => {
      const withVary = () => new Response('page', { headers: { Vary: 'Cookie' } })
      expect((await run(config, '/about', { acceptLanguage: 'en', nextResponse: withVary })).vary).toBe('Cookie, Accept-Language')
      const already = () => new Response('page', { headers: { Vary: 'accept-language' } })
      expect((await run(config, '/about', { acceptLanguage: 'en', nextResponse: already })).vary).toBe('accept-language')
      // Responses such as Response.redirect() have immutable headers
      const immutable = () => Response.redirect('http://localhost/elsewhere', 307)
      const outcome = await run(config, '/about', { acceptLanguage: 'en', nextResponse: immutable })
      expect(outcome).toMatchObject({ status: 307, vary: 'Accept-Language' })
    })
  })

  describe('prefixDefault: false, detectLanguage: false', () => {
    const noDetection = { ...config, detectLanguage: false }

    it('serves a URL without a prefix as the default locale, ignoring Accept-Language', async () => {
      for (const url of ['/', '/about']) {
        const outcome = await run(noDetection, url, { acceptLanguage: 'ja' })
        expect(outcome).toMatchObject({ kind: 'next', vary: null })
      }
      expect(await run({ ...noDetection, fallbackLocale: 'ja' }, '/about', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'next' })
    })
  })

  describe('prefixDefault: true, detectLanguage: true', () => {
    const prefixed = { ...config, prefixDefault: true }

    it('redirects to the detected locale, the default locale included', async () => {
      expect(await run(prefixed, '/about', { acceptLanguage: 'en' })).toMatchObject({ kind: 'redirect', target: '/en/about', vary: 'Accept-Language' })
      expect(await run(prefixed, '/about', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect', target: '/ja/about', vary: 'Accept-Language' })
      expect(await run(prefixed, '/', { acceptLanguage: 'de' })).toMatchObject({ kind: 'redirect', target: '/en' })
    })

    it('serves URLs with a prefix as they are', async () => {
      expect(await run(prefixed, '/en/about', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'next', vary: null })
    })
  })

  describe('prefixDefault: true, detectLanguage: false', () => {
    const prefixed = { ...config, prefixDefault: true, detectLanguage: false }

    it('redirects to the default locale, ignoring Accept-Language and fallbackLocale', async () => {
      expect(await run(prefixed, '/about', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect', target: '/en/about', vary: null })
      expect(await run({ ...prefixed, fallbackLocale: 'ja' }, '/', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect', target: '/en' })
    })
  })

  describe('routing: "rewrite"', () => {
    const rewrite = { ...config, routing: 'rewrite' } as const

    it('rewrites a URL with a prefix to the URL without it and stores the locale', async () => {
      const outcome = await run(rewrite, '/ja/about?x=1', { acceptLanguage: 'en' })
      expect(outcome).toMatchObject({ kind: 'rewrite', target: '/about?x=1', vary: null })
      expect(outcome.locals).toEqual({ locale: 'ja', originalPathname: '/ja/about' })
      expect((await run(rewrite, '/ja')).target).toBe('/')
      expect((await run(rewrite, '/en/a/b/')).target).toBe('/a/b/')
    })

    it('detects the locale of a URL without a prefix, with Vary', async () => {
      const outcome = await run(rewrite, '/about', { acceptLanguage: 'ja' })
      expect(outcome).toMatchObject({ kind: 'next', vary: 'Accept-Language' })
      expect(outcome.locals).toEqual({ locale: 'ja', originalPathname: '/about' })
      expect((await run(rewrite, '/about', { acceptLanguage: 'de' })).locals.locale).toBe('en')
      expect((await run({ ...rewrite, fallbackLocale: 'fr' }, '/about', { acceptLanguage: 'de' })).locals.locale).toBe('fr')
      expect((await run(rewrite, '/about', { acceptLanguage: 'ja;q=0' })).locals.locale).toBe('en')
    })

    it('takes a URL without a prefix as the default locale with detectLanguage: false', async () => {
      const outcome = await run({ ...rewrite, detectLanguage: false, fallbackLocale: 'fr' }, '/about', { acceptLanguage: 'ja' })
      expect(outcome).toMatchObject({ kind: 'next', vary: null })
      expect(outcome.locals.locale).toBe('en')
    })

    it('leaves a request it has already rewritten', async () => {
      const outcome = await run(rewrite, '/about', { locals: { locale: 'ja' } })
      expect(outcome).toMatchObject({ kind: 'next', vary: null })
      expect(outcome.locals).toEqual({ locale: 'ja' })
    })
  })

  describe('excluded paths and static files', () => {
    it('skips the excluded paths and the paths under them', async () => {
      const excluding = { ...config, excludePaths: ['/api', '/docs/'] }
      for (const url of ['/api', '/api/users', '/docs', '/docs/a', '/_astro/x', '/_image']) {
        expect(await run(excluding, url, { acceptLanguage: 'ja' })).toMatchObject({ kind: 'next', vary: null })
      }
    })

    it('should not skip paths that only start with the same letters as an excluded path', async () => {
      const excluding = { ...config, excludePaths: ['/api'] }
      for (const pathname of ['/apis', '/api-docs']) {
        expect(await run(excluding, pathname, { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect', target: `/ja${pathname}` })
      }
      expect(await run(config, '/_astro-like', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect' })
    })

    it('skips static files', async () => {
      for (const url of ['/favicon.ico', '/images/a.png', '/ja/style.css']) {
        expect(await run(config, url, { acceptLanguage: 'ja' })).toMatchObject({ kind: 'next', vary: null })
      }
    })
  })

  describe('pathnames that lead to another host', () => {
    it('are served without i18n handling', async () => {
      for (const middlewareConfig of [config, { ...config, prefixDefault: true }, { ...config, routing: 'rewrite' } as const]) {
        for (const url of ['//evil.example/x', '/\\evil.example', '/ja//evil.example', '/ja/\\evil.example', '/ja//']) {
          const outcome = await run(middlewareConfig, url, { acceptLanguage: 'ja' })
          expect(outcome).toMatchObject({ kind: 'next', vary: null })
          expect(outcome.locals).toEqual({})
        }
      }
    })
  })

  describe('with a base', () => {
    it('removes the base to route and adds it to the targets', async () => {
      const run = (middlewareConfig: MiddlewareConfig, url: string, options: Parameters<typeof runWithBase>[2] = {}) =>
        runWithBase(middlewareConfig, url, { ...options, base: '/docs/' })
      expect(await run(config, '/docs/about', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect', target: '/docs/ja/about' })
      expect(await run(config, '/docs', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect', target: '/docs/ja' })
      expect(await run(config, '/docs/ja/about', { acceptLanguage: 'en' })).toMatchObject({ kind: 'next', vary: null })
      expect(await run(config, '/docs/about', { acceptLanguage: 'en' })).toMatchObject({ kind: 'next', vary: 'Accept-Language' })
      expect(await run({ ...config, prefixDefault: true, detectLanguage: false }, '/docs/about?x=1'))
        .toMatchObject({ kind: 'redirect', target: '/docs/en/about?x=1' })

      const rewrite = await run({ ...config, routing: 'rewrite' }, '/docs/ja/about')
      expect(rewrite).toMatchObject({ kind: 'rewrite', target: '/docs/about' })
      expect(rewrite.locals).toEqual({ locale: 'ja', originalPathname: '/docs/ja/about' })
      expect(await run({ ...config, routing: 'rewrite' }, '/docs/ja')).toMatchObject({ kind: 'rewrite', target: '/docs' })
    })

    it('compares the excluded paths without the base', async () => {
      const run = (middlewareConfig: MiddlewareConfig, url: string, options: Parameters<typeof runWithBase>[2] = {}) =>
        runWithBase(middlewareConfig, url, { ...options, base: '/docs' })
      const excluding = { ...config, excludePaths: ['/api'] }
      expect(await run(excluding, '/docs/api/users', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'next', vary: null })
      expect(await run(excluding, '/docs/_astro/x', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'next', vary: null })
      expect(await run(excluding, '/docs/apis', { acceptLanguage: 'ja' })).toMatchObject({ kind: 'redirect', target: '/docs/ja/apis' })
    })
  })
})
