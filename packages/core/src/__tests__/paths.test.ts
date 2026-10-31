import { describe, expect, it } from 'vitest'
import { alternatePath, localizedPath, pathLocale, removeLocalePrefix } from '../router'
import type { I18nConfig } from '../router'

const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
const prefixed = { ...config, prefixDefault: true } as const

// Configs that only the runtime check can reject
const loose = (value: { locales: string[], defaultLocale: string, prefixDefault?: boolean }): I18nConfig => value

// Inputs that are not a pathname of this site
const invalidPaths: [string, string][] = [
  ['about', 'must be a pathname starting with "/"'],
  ['', 'must be a pathname starting with "/"'],
  ['https://example.com/about', 'must be a pathname starting with "/"'],
  ['//example.com', 'must not start with "//" or "/\\"'],
  ['/\\example.com', 'must not start with "//" or "/\\"'],
  ['/about?page=2', 'without "?" or "#"'],
  ['/about#team', 'without "?" or "#"'],
  ['/?', 'without "?" or "#"'],
  ['/#', 'without "?" or "#"']
]

describe('localizedPath()', () => {
  it.each([
    ['/about', 'ja', '/about'],
    ['/about', 'en', '/en/about'],
    ['/', 'ja', '/'],
    ['/', 'en', '/en'],
    ['/lab/tool', 'en', '/en/lab/tool']
  ] as const)('localizedPath("%s", "%s") → "%s"', (path, locale, expected) => {
    expect(localizedPath(path, locale, config)).toBe(expected)
  })

  it.each([
    ['/about', 'ja', '/ja/about'],
    ['/about', 'en', '/en/about'],
    ['/', 'ja', '/ja'],
    ['/', 'en', '/en']
  ] as const)('with prefixDefault, localizedPath("%s", "%s") → "%s"', (path, locale, expected) => {
    expect(localizedPath(path, locale, prefixed)).toBe(expected)
  })

  it('should treat a missing prefixDefault as false', () => {
    expect(localizedPath('/about', 'ja', { ...config, prefixDefault: false })).toBe('/about')
  })

  it.each([
    ['/about/', 'en', '/en/about'],
    ['/about//', 'en', '/en/about'],
    ['/about/', 'ja', '/about'],
    ['/en/', 'ja', '/en']
  ] as const)('should drop the trailing slash: localizedPath("%s", "%s") → "%s"', (path, locale, expected) => {
    expect(localizedPath(path, locale, config)).toBe(expected)
  })

  it('should add the prefix to a path that already has one', () => {
    expect(localizedPath('/en/about', 'en', config)).toBe('/en/en/about')
    expect(localizedPath('/en/about', 'ja', config)).toBe('/en/about')
  })

  it.each(invalidPaths)('should throw for the path %j', (path, message) => {
    expect(() => localizedPath(path, 'en', config)).toThrow(message)
  })

  it('should throw for a locale that is not one of locales', () => {
    expect(() => localizedPath('/about', 'fr' as 'en', config))
      .toThrow('Unknown locale "fr". Expected one of "ja", "en".')
    expect(() => localizedPath('/about', '' as 'en', config)).toThrow('Unknown locale ""')
  })

  it('should throw for an invalid config', () => {
    expect(() => localizedPath('/about', 'ja', loose({ locales: ['ja', 'en'], defaultLocale: 'fr' })))
      .toThrow('defaultLocale "fr" is not one of locales')
    expect(() => localizedPath('/about', 'ja', loose({ locales: ['ja', 'ja'], defaultLocale: 'ja' })))
      .toThrow('Locale "ja" is listed more than once')
    expect(() => localizedPath('/about', 'ja', loose({ locales: [], defaultLocale: 'ja' })))
      .toThrow('locales must be a non-empty array')
  })
})

describe('alternatePath()', () => {
  it.each([
    ['/en/donate', 'ja', '/donate'],
    ['/donate', 'en', '/en/donate'],
    ['/donate', 'ja', '/donate'],
    ['/en/donate', 'en', '/en/donate'],
    ['/en', 'ja', '/'],
    ['/', 'en', '/en'],
    ['/en/', 'ja', '/'],
    ['/en/donate/', 'en', '/en/donate'],
    // A default locale prefix is removed too, as with prefixDefault it is part of the URL
    ['/ja/donate', 'ja', '/donate'],
    ['/ja/donate', 'en', '/en/donate'],
    // Only whole path segments are a prefix
    ['/english', 'ja', '/english'],
    ['/english', 'en', '/en/english'],
    ['/ja-jp/about', 'en', '/en/ja-jp/about']
  ] as const)('alternatePath("%s", "%s") → "%s"', (pathname, locale, expected) => {
    expect(alternatePath(pathname, locale, config)).toBe(expected)
  })

  it.each([
    ['/ja/donate', 'en', '/en/donate'],
    ['/en/donate', 'ja', '/ja/donate'],
    ['/en', 'ja', '/ja'],
    ['/donate', 'ja', '/ja/donate']
  ] as const)('with prefixDefault, alternatePath("%s", "%s") → "%s"', (pathname, locale, expected) => {
    expect(alternatePath(pathname, locale, prefixed)).toBe(expected)
  })

  it.each(invalidPaths)('should throw for the pathname %j', (pathname, message) => {
    expect(() => alternatePath(pathname, 'en', config)).toThrow(message)
  })

  it('should throw for a locale that is not one of locales', () => {
    expect(() => alternatePath('/en/about', 'fr' as 'en', config)).toThrow('Unknown locale "fr"')
  })

  it('should throw for an invalid config', () => {
    expect(() => alternatePath('/about', 'ja', loose({ locales: ['ja', 'en'], defaultLocale: 'fr' })))
      .toThrow('defaultLocale "fr" is not one of locales')
  })
})

describe('removeLocalePrefix() with the config', () => {
  it.each([
    ['/en/about', '/about'],
    ['/ja/about', '/about'],
    ['/en', '/'],
    ['/en/', '/'],
    ['/about', '/about'],
    ['/about/', '/about'],
    ['/', '/'],
    ['/en/nested/path', '/nested/path'],
    ['/english', '/english'],
    ['/de/about', '/de/about']
  ])('removeLocalePrefix("%s", config) → "%s"', (pathname, expected) => {
    expect(removeLocalePrefix(pathname, config)).toBe(expected)
  })

  it.each(invalidPaths)('should throw for the pathname %j', (pathname, message) => {
    expect(() => removeLocalePrefix(pathname, config)).toThrow(message)
  })

  it('should throw for an invalid config', () => {
    expect(() => removeLocalePrefix('/en/about', loose({ locales: ['ja', 'en'], defaultLocale: 'fr' })))
      .toThrow('defaultLocale "fr" is not one of locales')
  })
})

describe('pathLocale()', () => {
  it.each([
    ['/en/about', 'en'],
    ['/en', 'en'],
    ['/en/', 'en'],
    ['/ja/about', 'ja'],
    ['/about', undefined],
    ['/', undefined],
    ['/english', undefined],
    ['/de/about', undefined]
  ])('pathLocale("%s", config) → %s', (pathname, expected) => {
    expect(pathLocale(pathname, config)).toBe(expected)
  })

  it.each(invalidPaths)('should throw for the pathname %j', (pathname, message) => {
    expect(() => pathLocale(pathname, config)).toThrow(message)
  })

  it('should throw for an invalid config', () => {
    expect(() => pathLocale('/en/about', loose({ locales: ['ja', 'en'], defaultLocale: 'fr' })))
      .toThrow('defaultLocale "fr" is not one of locales')
  })
})

describe('configs with more settings', () => {
  it('should accept the config of define(), which also has messages', () => {
    const defineConfig = { ...config, messages: { ja: {}, en: {} } }
    expect(localizedPath('/about', 'en', defineConfig)).toBe('/en/about')
  })

  it('should check the messages of the config too', () => {
    const defineConfig = { ...config, messages: { ja: {} } as Record<string, object> }
    expect(() => localizedPath('/about', 'en', defineConfig)).toThrow('messages is missing locales: "en"')
  })
})

describe('paths that browsers read as another host', () => {
  // A path left after removing the prefix must not start with "//" or "/\",
  // or a redirect to it would lead to another host
  it.each([
    ['/en//evil.com'],
    ['/en/\\evil.com'],
    ['/ja//evil.com'],
    ['/en///evil.com']
  ])('should throw for %j, whose rest after the prefix starts with another host', (pathname) => {
    expect(() => alternatePath(pathname, 'ja', config)).toThrow('must not start with "//" or "/\\"')
    expect(() => alternatePath(pathname, 'en', config)).toThrow('must not start with "//" or "/\\"')
    expect(() => removeLocalePrefix(pathname, config)).toThrow('must not start with "//" or "/\\"')
  })

  it('should never return a path that starts with "//" or "/\\"', () => {
    const inputs = ['/', '/en', '/en/', '/ja/', '/about', '/en/about', '/en/a//b', '/a/\\b', '/en/a/', '/x//']
    for (const input of inputs) {
      for (const output of [
        localizedPath(input, 'ja', config),
        localizedPath(input, 'en', config),
        alternatePath(input, 'ja', config),
        alternatePath(input, 'en', config),
        alternatePath(input, 'ja', prefixed),
        removeLocalePrefix(input, config)
      ]) {
        expect(output.startsWith('//') || output.startsWith('/\\')).toBe(false)
      }
    }
  })
})

describe('long inputs', () => {
  // Slashes that do not end the path must not make the time grow with the
  // square of the length
  it('should handle runs of slashes in linear time', () => {
    const time = (length: number) => {
      const path = '/a' + '/'.repeat(length) + 'b'
      const start = performance.now()
      localizedPath(path, 'en', config)
      alternatePath(path, 'en', config)
      removeLocalePrefix(path, config)
      return performance.now() - start
    }
    // The best of a few runs, so that a slow moment of the machine does not count
    const best = (length: number) => Math.min(time(length), time(length), time(length))
    time(1000)
    // 16 times the length takes well under 16 * 16 times the time
    const short = Math.max(best(4000), 1)
    const long = best(64000)
    expect(long).toBeLessThan(short * 64)
  })

  it('should still drop every trailing slash of a long run', () => {
    expect(localizedPath('/a' + '/'.repeat(64000), 'en', config)).toBe('/en/a')
  })
})

describe('the forms of 1.x, called from JavaScript', () => {
  it('removeLocalePrefix() throws for the locales in place of the config', () => {
    const untyped = removeLocalePrefix as (...args: unknown[]) => string
    expect(() => untyped('/en/about', ['ja', 'en'])).toThrow('[i18n] locales must be a non-empty array')
  })
})
