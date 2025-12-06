import { describe, it, expect, vi, beforeEach } from 'vitest'
import { create } from '../proxy'

// Mock NextResponse with headers support
const createMockResponse = (type: string, url?: { pathname: string }) => {
  const headers = new Map<string, string>()
  return {
    type,
    url,
    headers: {
      set: (key: string, value: string) => headers.set(key, value),
      get: (key: string) => headers.get(key)
    }
  }
}

vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => createMockResponse('next')),
    redirect: vi.fn((url) => createMockResponse('redirect', url)),
    rewrite: vi.fn((url) => createMockResponse('rewrite', url))
  }
}))

import { NextResponse } from 'next/server'

const createMockRequest = (pathname: string, acceptLanguage?: string) => ({
  nextUrl: {
    pathname,
    clone: () => ({
      pathname
    })
  },
  headers: {
    get: (name: string) => name === 'accept-language' ? acceptLanguage ?? null : null
  }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

describe('create (proxy)', () => {
  const baseConfig = {
    locales: ['en', 'ja', 'fr'] as const,
    defaultLocale: 'en'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('default behavior (prefixDefault: false, detectLanguage: true)', () => {
    it('should pass through for /en path', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/en')

      proxy(request)

      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
      expect(NextResponse.rewrite).not.toHaveBeenCalled()
    })

    it('should pass through for /ja/about path', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/ja/about')

      proxy(request)

      expect(NextResponse.next).toHaveBeenCalled()
    })

    it('should rewrite to default locale when no Accept-Language', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/about')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en/about')
    })

    it('should rewrite root to default locale', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en')
    })

    it('should redirect to detected locale when not default', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/about', 'ja,en;q=0.8')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/ja/about')
    })

    it('should redirect root to detected locale', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/', 'fr')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/fr')
    })

    it('should rewrite to default locale when Accept-Language matches default', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/about', 'en-US,en;q=0.9')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    it('should rewrite to default locale when Accept-Language has no match', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/about', 'de,ko;q=0.8')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en/about')
    })
  })

  describe('prefixDefault: true, detectLanguage: true', () => {
    const config = {
      ...baseConfig,
      prefixDefault: true,
      detectLanguage: true
    }

    it('should redirect to /en when locale is default', () => {
      const proxy = create(config)
      const request = createMockRequest('/', 'en-US')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en')
    })

    it('should redirect to /en/about when locale is default', () => {
      const proxy = create(config)
      const request = createMockRequest('/about', 'en')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en/about')
    })

    it('should redirect to /ja when detected locale is ja', () => {
      const proxy = create(config)
      const request = createMockRequest('/', 'ja')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/ja')
    })
  })

  describe('prefixDefault: false, detectLanguage: false', () => {
    const config = {
      ...baseConfig,
      prefixDefault: false,
      detectLanguage: false
    }

    it('should ignore Accept-Language and rewrite to fallback', () => {
      const proxy = create(config)
      const request = createMockRequest('/about', 'ja,en;q=0.8')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en/about')
    })

    it('should rewrite root to fallback locale', () => {
      const proxy = create(config)
      const request = createMockRequest('/', 'ja')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en')
    })

    it('should use custom fallbackLocale when specified', () => {
      const proxy = create({
        ...config,
        fallbackLocale: 'fr'
      })
      const request = createMockRequest('/', 'ja')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/fr')
    })
  })

  describe('prefixDefault: true, detectLanguage: false', () => {
    const config = {
      ...baseConfig,
      prefixDefault: true,
      detectLanguage: false
    }

    it('should redirect to /[defaultLocale] ignoring Accept-Language', () => {
      const proxy = create(config)
      const request = createMockRequest('/', 'ja')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en')
    })

    it('should redirect /about to /[defaultLocale]/about', () => {
      const proxy = create(config)
      const request = createMockRequest('/about', 'fr')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en/about')
    })

    it('should use fallbackLocale when specified', () => {
      const proxy = create({
        ...config,
        fallbackLocale: 'ja'
      })
      const request = createMockRequest('/')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/ja')
    })
  })

  describe('routing: "rewrite" (SSR mode)', () => {
    const config = {
      ...baseConfig,
      routing: 'rewrite' as const
    }

    it('should rewrite /ja/about to /about with x-locale header', () => {
      const proxy = create(config)
      const request = createMockRequest('/ja/about')

      const response = proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/about')
      expect(response.headers.get('x-locale')).toBe('ja')
    })

    it('should rewrite /ja to / with x-locale header', () => {
      const proxy = create(config)
      const request = createMockRequest('/ja')

      const response = proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/')
      expect(response.headers.get('x-locale')).toBe('ja')
    })

    it('should detect locale from Accept-Language for root and set x-locale header', () => {
      const proxy = create(config)
      const request = createMockRequest('/', 'ja,en;q=0.8')

      const response = proxy(request)

      expect(NextResponse.next).toHaveBeenCalled()
      expect(NextResponse.redirect).not.toHaveBeenCalled()
      expect(response.headers.get('x-locale')).toBe('ja')
    })

    it('should use fallbackLocale when no Accept-Language match', () => {
      const proxy = create(config)
      const request = createMockRequest('/', 'de,ko')

      const response = proxy(request)

      expect(NextResponse.next).toHaveBeenCalled()
      expect(response.headers.get('x-locale')).toBe('en')
    })

    it('should use custom fallbackLocale in rewrite mode', () => {
      const proxy = create({
        ...baseConfig,
        routing: 'rewrite' as const,
        fallbackLocale: 'fr'
      })
      const request = createMockRequest('/', 'de')

      const response = proxy(request)

      expect(response.headers.get('x-locale')).toBe('fr')
    })
  })

  describe('fallbackLocale option', () => {
    it('should use fallbackLocale when no match found', () => {
      const proxy = create({
        ...baseConfig,
        fallbackLocale: 'ja'
      })
      const request = createMockRequest('/about', 'de,ko;q=0.8')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/ja/about')
    })

    it('should use fallbackLocale when no Accept-Language header', () => {
      const proxy = create({
        ...baseConfig,
        fallbackLocale: 'fr'
      })
      const request = createMockRequest('/')

      proxy(request)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.redirect).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/fr')
    })

    it('should default to defaultLocale when fallbackLocale not specified', () => {
      const proxy = create(baseConfig)
      const request = createMockRequest('/about', 'de,ko;q=0.8')

      proxy(request)

      expect(NextResponse.rewrite).toHaveBeenCalled()
      const call = vi.mocked(NextResponse.rewrite).mock.calls[0][0] as { pathname: string }
      expect(call.pathname).toBe('/en/about')
    })
  })
})
