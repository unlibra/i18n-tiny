import { describe, it, expect, vi, beforeEach } from 'vitest'
import { create } from '../middleware'

// Track method calls
let redirectCalls: Array<{ pathname: string; status: number }> = []
let rewriteCalls: Array<string> = []
let nextCalls = 0

const createMockContext = (
  pathname: string,
  acceptLanguage?: string,
  initialLocals: Record<string, unknown> = {}
) => {
  const locals = { ...initialLocals }

  return {
    url: new URL(`http://localhost${pathname}`),
    request: {
      headers: {
        get: (name: string) => name === 'accept-language' ? acceptLanguage ?? null : null
      }
    },
    locals,
    redirect: (path: string, status = 302) => {
      redirectCalls.push({ pathname: path, status })
      return { type: 'redirect', pathname: path, status }
    },
    rewrite: (path: string) => {
      rewriteCalls.push(path)
      return { type: 'rewrite', pathname: path }
    }
  }
}

const createMockNext = () => {
  return vi.fn(() => {
    nextCalls++
    return Promise.resolve({ type: 'next' })
  })
}

describe('create (middleware)', () => {
  const baseConfig = {
    locales: ['en', 'ja', 'fr'] as const,
    defaultLocale: 'en'
  }

  beforeEach(() => {
    redirectCalls = []
    rewriteCalls = []
    nextCalls = 0
  })

  describe('default behavior (prefixDefault: false, detectLanguage: true)', () => {
    it('should pass through for /en path', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/en') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(next).toHaveBeenCalled()
      expect(redirectCalls).toHaveLength(0)
      expect(rewriteCalls).toHaveLength(0)
    })

    it('should pass through for /ja/about path', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/ja/about') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(next).toHaveBeenCalled()
    })

    it('should rewrite to default locale when no Accept-Language', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/about') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/en/about')
    })

    it('should rewrite root to default locale', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/en')
    })

    it('should redirect to detected locale when not default', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/about', 'ja,en;q=0.8') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(redirectCalls).toHaveLength(1)
      expect(redirectCalls[0].pathname).toBe('/ja/about')
    })

    it('should redirect root to detected locale', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', 'fr') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(redirectCalls).toHaveLength(1)
      expect(redirectCalls[0].pathname).toBe('/fr')
    })

    it('should rewrite when Accept-Language matches default', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/about', 'en-US,en;q=0.9') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/en/about')
      expect(redirectCalls).toHaveLength(0)
    })

    it('should skip static files', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/image.png') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(next).toHaveBeenCalled()
      expect(redirectCalls).toHaveLength(0)
      expect(rewriteCalls).toHaveLength(0)
    })

    it('should skip excluded paths', async () => {
      const middleware = create({
        ...baseConfig,
        excludePaths: ['/api', '/_image']
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/api/users') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(next).toHaveBeenCalled()
      expect(redirectCalls).toHaveLength(0)
      expect(rewriteCalls).toHaveLength(0)
    })
  })

  describe('prefixDefault: true, detectLanguage: true', () => {
    const config = {
      ...baseConfig,
      prefixDefault: true,
      detectLanguage: true
    }

    it('should redirect to /en when locale is default', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', 'en-US') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(redirectCalls).toHaveLength(1)
      expect(redirectCalls[0].pathname).toBe('/en')
    })

    it('should redirect to /ja when detected locale is ja', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', 'ja') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(redirectCalls).toHaveLength(1)
      expect(redirectCalls[0].pathname).toBe('/ja')
    })
  })

  describe('prefixDefault: false, detectLanguage: false', () => {
    const config = {
      ...baseConfig,
      prefixDefault: false,
      detectLanguage: false
    }

    it('should ignore Accept-Language and rewrite to fallback', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/about', 'ja,en;q=0.8') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/en/about')
      expect(redirectCalls).toHaveLength(0)
    })

    it('should use custom fallbackLocale', async () => {
      const middleware = create({
        ...config,
        fallbackLocale: 'fr'
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/fr')
    })
  })

  describe('prefixDefault: true, detectLanguage: false', () => {
    const config = {
      ...baseConfig,
      prefixDefault: true,
      detectLanguage: false
    }

    it('should redirect to /[defaultLocale] ignoring Accept-Language', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', 'ja') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(redirectCalls).toHaveLength(1)
      expect(redirectCalls[0].pathname).toBe('/en')
    })

    it('should use fallbackLocale when specified', async () => {
      const middleware = create({
        ...config,
        fallbackLocale: 'ja'
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(redirectCalls).toHaveLength(1)
      expect(redirectCalls[0].pathname).toBe('/ja')
    })
  })

  describe('routing: "rewrite" (SSR mode)', () => {
    const config = {
      ...baseConfig,
      routing: 'rewrite' as const
    }

    it('should rewrite /ja/about to /about and set locale in locals', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/ja/about') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/about')
      expect(context.locals.locale).toBe('ja')
    })

    it('should rewrite /ja to / and set locale in locals', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/ja') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/')
      expect(context.locals.locale).toBe('ja')
    })

    it('should detect locale from Accept-Language for root', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', 'ja,en;q=0.8') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(next).toHaveBeenCalled()
      expect(redirectCalls).toHaveLength(0)
      expect(context.locals.locale).toBe('ja')
    })

    it('should use fallbackLocale when no Accept-Language match', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', 'de,ko') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(next).toHaveBeenCalled()
      expect(context.locals.locale).toBe('en')
    })

    it('should skip if locale already set in locals', async () => {
      const middleware = create(config)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', undefined, { locale: 'fr' }) as any
      const next = createMockNext()

      await middleware(context, next)

      expect(next).toHaveBeenCalled()
      expect(context.locals.locale).toBe('fr')
    })

    it('should use custom fallbackLocale in rewrite mode', async () => {
      const middleware = create({
        ...baseConfig,
        routing: 'rewrite' as const,
        fallbackLocale: 'fr'
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/', 'de') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(context.locals.locale).toBe('fr')
    })
  })

  describe('fallbackLocale option', () => {
    it('should use fallbackLocale when no match found', async () => {
      const middleware = create({
        ...baseConfig,
        fallbackLocale: 'ja'
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/about', 'de,ko;q=0.8') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(redirectCalls).toHaveLength(1)
      expect(redirectCalls[0].pathname).toBe('/ja/about')
    })

    it('should default to defaultLocale when fallbackLocale not specified', async () => {
      const middleware = create(baseConfig)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const context = createMockContext('/about', 'de,ko;q=0.8') as any
      const next = createMockNext()

      await middleware(context, next)

      expect(rewriteCalls).toContain('/en/about')
    })
  })
})
