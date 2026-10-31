// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import { create } from '../proxy'

// Calls a function from JavaScript, without the type checks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untyped = (fn: unknown) => fn as (...args: any[]) => any

function request (path: string, headers: Record<string, string> = {}): NextRequest {
  // Joined as a string: a path such as //evil.com is a pathname here, as in a
  // request, not the host of a protocol-relative URL
  return new NextRequest(new URL(`http://localhost${path}`), { headers })
}

// What Next.js does with the response of the proxy: the redirect, the
// rewrite target or "next", read from the headers Next.js reads
function routing (response: NextResponse): string {
  const location = response.headers.get('location')
  if (location !== null) {
    const url = new URL(location)
    return `redirect ${response.status} ${url.pathname}${url.search}`
  }
  const rewrite = response.headers.get('x-middleware-rewrite')
  if (rewrite !== null) {
    const url = new URL(rewrite)
    return `rewrite ${url.pathname}${url.search}`
  }
  return response.headers.get('x-middleware-next') === '1' ? 'next' : 'unknown'
}

// The request headers the pages get, or undefined when the proxy leaves
// them as the client sent them
function forwardedHeaders (response: NextResponse): Record<string, string> | undefined {
  const names = response.headers.get('x-middleware-override-headers')
  if (names === null) return undefined
  return Object.fromEntries(names.split(',').filter(Boolean).map(name => [name, response.headers.get(`x-middleware-request-${name}`) ?? '']))
}

const vary = (response: NextResponse) => response.headers.get('vary')

const config = { locales: ['en', 'ja', 'fr'], defaultLocale: 'en' } as const

describe('create (proxy)', () => {
  describe('config', () => {
    it('throws for an invalid config', () => {
      expect(() => untyped(create)({ locales: ['en', 'ja'] })).toThrow('defaultLocale undefined is not one of locales')
      expect(() => untyped(create)({ locales: ['en', 'ja'], defaultLocale: 'fr' }))
        .toThrow('[i18n] defaultLocale "fr" is not one of locales ("en", "ja").')
      expect(() => untyped(create)({ locales: [], defaultLocale: 'en' })).toThrow('[i18n] locales must be a non-empty array')
      expect(() => untyped(create)({ locales: ['en', 'en'], defaultLocale: 'en' }))
        .toThrow('[i18n] Locale "en" is listed more than once in locales.')
      expect(() => untyped(create)({ locales: ['en', 'en/us'], defaultLocale: 'en' })).toThrow('cannot be used as a path segment')
      expect(() => untyped(create)({ ...config, fallbackLocale: 'de' }))
        .toThrow('[i18n] fallbackLocale "de" is not one of locales ("en", "ja", "fr").')
      expect(() => untyped(create)({ ...config, routing: 'rewrite', fallbackLocale: 'de' }))
        .toThrow('[i18n] fallbackLocale "de" is not one of locales')
    })

    it('throws for the language detection of the rewrite mode without prefixDefault: true', () => {
      for (const options of [{ detectLanguage: true }, { detectLanguage: true, prefixDefault: false }]) {
        expect(() => untyped(create)({ ...config, routing: 'rewrite', ...options }))
          .toThrow('[i18n] The language detection of the rewrite mode needs prefixDefault: true.')
      }
    })

    it('takes the config of define() in the rewrite mode', () => {
      for (const options of [{}, { prefixDefault: false }, { prefixDefault: true }, { prefixDefault: true, detectLanguage: true }, { detectLanguage: false }, { detectLanguage: false, prefixDefault: false }, { detectLanguage: false, prefixDefault: true }]) {
        expect(() => untyped(create)({ ...config, routing: 'rewrite', ...options })).not.toThrow()
      }
    })
  })

  describe('without detectLanguage: no detection', () => {
    it('rewrites a URL without a locale prefix to the default locale, ignoring Accept-Language', () => {
      for (const proxy of [create({ ...config }), create({ ...config, fallbackLocale: 'ja' })]) {
        const response = proxy(request('/about?page=2', { 'accept-language': 'ja' }))
        expect(routing(response)).toBe('rewrite /en/about?page=2')
        expect(vary(response)).toBe(null)
        expect(routing(proxy(request('/', { 'accept-language': 'ja' })))).toBe('rewrite /en')
      }
    })

    it('redirects a URL without a locale prefix to the default locale with prefixDefault', () => {
      const response = create({ ...config, prefixDefault: true })(request('/about', { 'accept-language': 'ja' }))
      expect(routing(response)).toBe('redirect 307 /en/about')
      expect(vary(response)).toBe(null)
    })

    it('takes a URL without a locale prefix as the default locale in the rewrite mode, without prefixDefault', () => {
      for (const prefixDefault of [false, true]) {
        const response = create({ ...config, routing: 'rewrite', prefixDefault })(request('/about', { 'accept-language': 'ja' }))
        expect(routing(response)).toBe('next')
        expect(forwardedHeaders(response)?.['x-locale']).toBe('en')
        expect(vary(response)).toBe(null)
      }
    })
  })

  describe('prefixDefault: false, detectLanguage: true', () => {
    const proxy = create({ ...config, detectLanguage: true })

    it('passes a URL with a locale prefix through', () => {
      for (const path of ['/en', '/en/about', '/ja', '/ja/about/team']) {
        const response = proxy(request(path, { 'accept-language': 'fr' }))
        expect(routing(response)).toBe('next')
        expect(vary(response)).toBe(null)
      }
    })

    it('rewrites to the default locale when the detected locale is the default one or nothing matches', () => {
      expect(routing(proxy(request('/about')))).toBe('rewrite /en/about')
      expect(routing(proxy(request('/', { 'accept-language': 'en-US,en;q=0.9' })))).toBe('rewrite /en')
      expect(routing(proxy(request('/about', { 'accept-language': 'de' })))).toBe('rewrite /en/about')
    })

    it('redirects to the detected locale when it is not the default one', () => {
      expect(routing(proxy(request('/about', { 'accept-language': 'ja,en;q=0.8' })))).toBe('redirect 307 /ja/about')
      expect(routing(proxy(request('/', { 'accept-language': 'ja' })))).toBe('redirect 307 /ja')
    })

    it('keeps the query string', () => {
      expect(routing(proxy(request('/about?page=2', { 'accept-language': 'ja' })))).toBe('redirect 307 /ja/about?page=2')
      expect(routing(proxy(request('/about?page=2')))).toBe('rewrite /en/about?page=2')
    })

    it('only matches whole path segments as a locale prefix', () => {
      expect(routing(proxy(request('/english', { 'accept-language': 'ja' })))).toBe('redirect 307 /ja/english')
    })

    it('does not pick a language that Accept-Language marks with q=0', () => {
      expect(routing(proxy(request('/about', { 'accept-language': 'ja;q=0, fr;q=0.5' })))).toBe('redirect 307 /fr/about')
      expect(routing(proxy(request('/about', { 'accept-language': 'ja;q=0' })))).toBe('rewrite /en/about')
    })

    it('adds Vary: Accept-Language to the responses that depend on the detection', () => {
      expect(vary(proxy(request('/about', { 'accept-language': 'ja' })))).toBe('Accept-Language')
      expect(vary(proxy(request('/about', { 'accept-language': 'en' })))).toBe('Accept-Language')
      expect(vary(proxy(request('/about')))).toBe('Accept-Language')
    })

    it('uses fallbackLocale when the detection finds no match', () => {
      const withFallback = create({ ...config, detectLanguage: true, fallbackLocale: 'ja' })
      expect(routing(withFallback(request('/about', { 'accept-language': 'de' })))).toBe('redirect 307 /ja/about')
      expect(routing(withFallback(request('/about')))).toBe('redirect 307 /ja/about')
      expect(routing(withFallback(request('/about', { 'accept-language': 'en' })))).toBe('rewrite /en/about')
    })
  })

  describe('prefixDefault: true, detectLanguage: true', () => {
    const proxy = create({ ...config, prefixDefault: true, detectLanguage: true })

    it('redirects to the detected locale, the default one included', () => {
      expect(routing(proxy(request('/')))).toBe('redirect 307 /en')
      expect(routing(proxy(request('/about', { 'accept-language': 'en' })))).toBe('redirect 307 /en/about')
      expect(routing(proxy(request('/about', { 'accept-language': 'ja' })))).toBe('redirect 307 /ja/about')
      expect(vary(proxy(request('/about', { 'accept-language': 'ja' })))).toBe('Accept-Language')
    })

    it('passes a URL with a locale prefix through', () => {
      expect(routing(proxy(request('/en/about', { 'accept-language': 'ja' })))).toBe('next')
    })
  })

  describe('prefixDefault: false, detectLanguage: false', () => {
    it('rewrites to the default locale, ignoring Accept-Language and fallbackLocale', () => {
      const proxy = create({ ...config, detectLanguage: false, fallbackLocale: 'ja' })
      const response = proxy(request('/about', { 'accept-language': 'ja' }))
      expect(routing(response)).toBe('rewrite /en/about')
      expect(vary(response)).toBe(null)
      expect(routing(proxy(request('/')))).toBe('rewrite /en')
    })
  })

  describe('prefixDefault: true, detectLanguage: false', () => {
    it('redirects to the default locale, ignoring Accept-Language and fallbackLocale', () => {
      const proxy = create({ ...config, prefixDefault: true, detectLanguage: false, fallbackLocale: 'ja' })
      const response = proxy(request('/about', { 'accept-language': 'ja' }))
      expect(routing(response)).toBe('redirect 307 /en/about')
      expect(vary(response)).toBe(null)
      expect(routing(proxy(request('/')))).toBe('redirect 307 /en')
    })
  })

  describe('routing: "rewrite" (SSR mode)', () => {
    const proxy = create({ ...config, prefixDefault: true, detectLanguage: true, routing: 'rewrite' })

    it('rewrites a URL with a locale prefix to the URL without it, with the locale in the x-locale request header', () => {
      const response = proxy(request('/ja/about?page=2', { 'accept-language': 'fr' }))
      expect(routing(response)).toBe('rewrite /about?page=2')
      expect(forwardedHeaders(response)?.['x-locale']).toBe('ja')
      expect(vary(response)).toBe(null)
      expect(routing(proxy(request('/ja')))).toBe('rewrite /')
      expect(forwardedHeaders(proxy(request('/en/about')))?.['x-locale']).toBe('en')
    })

    it('detects the locale of a URL without a locale prefix, with Vary: Accept-Language', () => {
      const response = proxy(request('/about', { 'accept-language': 'ja,en;q=0.8' }))
      expect(routing(response)).toBe('next')
      expect(forwardedHeaders(response)?.['x-locale']).toBe('ja')
      expect(vary(response)).toBe('Accept-Language')
      expect(forwardedHeaders(proxy(request('/', { 'accept-language': 'de' })))?.['x-locale']).toBe('en')
      expect(forwardedHeaders(proxy(request('/', { 'accept-language': 'ja;q=0' })))?.['x-locale']).toBe('en')
    })

    it('uses fallbackLocale when the detection finds no match', () => {
      const withFallback = create({ ...config, prefixDefault: true, detectLanguage: true, routing: 'rewrite', fallbackLocale: 'fr' })
      expect(forwardedHeaders(withFallback(request('/about', { 'accept-language': 'de' })))?.['x-locale']).toBe('fr')
      expect(forwardedHeaders(withFallback(request('/about')))?.['x-locale']).toBe('fr')
    })

    it('uses the default locale with detectLanguage: false', () => {
      // prefixDefault changes the links only: a URL without a locale prefix
      // is served as the default locale, not redirected
      for (const prefixDefault of [false, true]) {
        const noDetection = create({ ...config, routing: 'rewrite', detectLanguage: false, prefixDefault, fallbackLocale: 'fr' })
        const response = noDetection(request('/about', { 'accept-language': 'ja' }))
        expect(routing(response)).toBe('next')
        expect(forwardedHeaders(response)?.['x-locale']).toBe('en')
        expect(vary(response)).toBe(null)
        expect(forwardedHeaders(noDetection(request('/ja/about')))?.['x-locale']).toBe('ja')
        expect(routing(noDetection(request('/en/about')))).toBe('rewrite /about')
        expect(forwardedHeaders(noDetection(request('/en/about')))?.['x-locale']).toBe('en')
      }
    })

    it('passes the other request headers on and replaces an x-locale header sent by the client', () => {
      const headers = { cookie: 'session=1', authorization: 'Bearer t', 'x-locale': 'fr' }
      for (const path of ['/ja/about', '/about']) {
        const forwarded = forwardedHeaders(proxy(request(path, { ...headers, 'accept-language': 'ja' })))
        expect(forwarded).toMatchObject({ cookie: 'session=1', authorization: 'Bearer t', 'x-locale': 'ja', 'accept-language': 'ja' })
      }
    })
  })

  describe('pathnames that lead to another host', () => {
    for (const path of ['//evil.com', '/\\evil.com', '/ja//evil.com', '/ja/\\evil.com']) {
      it(`passes ${path} through without i18n handling`, () => {
        for (const options of [{}, { prefixDefault: true }, { detectLanguage: false }]) {
          const response = create({ ...config, ...options })(request(path, { 'accept-language': 'ja' }))
          expect(routing(response)).toBe('next')
          expect(vary(response)).toBe(null)
        }
        // The rewrite mode passes no x-locale, not even one the client sent
        const response = create({ ...config, prefixDefault: true, routing: 'rewrite' })(request(path, { 'accept-language': 'ja', 'x-locale': 'fr', cookie: 'a=1' }))
        expect(routing(response)).toBe('next')
        expect(forwardedHeaders(response)?.['x-locale']).toBe(undefined)
        expect(forwardedHeaders(response)?.cookie).toBe('a=1')
      })
    }
  })
})
