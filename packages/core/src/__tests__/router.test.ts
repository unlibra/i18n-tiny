import { describe, expect, it } from 'vitest'
import { getLocalizedPath, removeLocalePrefix, hasLocalePrefix, getLinkHref } from '../router'
import { detectLocale } from '../detectLocale'

/**
 * Comprehensive matrix tests for routing functions
 *
 * Test configuration:
 * - locales: ['ja', 'en']
 * - defaultLocale: 'en'
 *
 * Variables:
 * - URL pattern: '/' (no prefix) or '/en' (with prefix for default)
 * - Browser language: 'en', 'ja', or other (e.g., 'de')
 * - Detection: enabled or disabled
 * - Fallback: defaultLocale or other locale
 */

const LOCALES = ['ja', 'en'] as const
const DEFAULT_LOCALE = 'en'

describe('Router Matrix Tests', () => {
  describe('getLocalizedPath', () => {
    describe('prefixDefault=false (default locale without prefix)', () => {
      const prefixDefault = false

      it.each([
        // [path, locale, expected]
        ['/about', 'en', '/about'],
        ['/about', 'ja', '/ja/about'],
        ['/', 'en', '/'],
        ['/', 'ja', '/ja'],
        ['/contact', 'en', '/contact'],
        ['/contact', 'ja', '/ja/contact'],
      ])('getLocalizedPath("%s", "%s", "en", false) → "%s"', (path, locale, expected) => {
        expect(getLocalizedPath(path, locale, DEFAULT_LOCALE, prefixDefault)).toBe(expected)
      })

      it('should not double prefix when path already has locale', () => {
        expect(getLocalizedPath('/ja/about', 'ja', DEFAULT_LOCALE, prefixDefault)).toBe('/ja/about')
        expect(getLocalizedPath('/en/about', 'en', DEFAULT_LOCALE, prefixDefault)).toBe('/en/about')
      })
    })

    describe('prefixDefault=true (all locales with prefix)', () => {
      const prefixDefault = true

      it.each([
        // [path, locale, expected]
        ['/about', 'en', '/en/about'],
        ['/about', 'ja', '/ja/about'],
        ['/', 'en', '/en'],
        ['/', 'ja', '/ja'],
        ['/contact', 'en', '/en/contact'],
        ['/contact', 'ja', '/ja/contact'],
      ])('getLocalizedPath("%s", "%s", "en", true) → "%s"', (path, locale, expected) => {
        expect(getLocalizedPath(path, locale, DEFAULT_LOCALE, prefixDefault)).toBe(expected)
      })
    })

    describe('path normalization', () => {
      it('should add leading slash to relative paths', () => {
        expect(getLocalizedPath('about', 'ja', DEFAULT_LOCALE)).toBe('/ja/about')
        expect(getLocalizedPath('about', 'en', DEFAULT_LOCALE)).toBe('/about')
      })
    })
  })

  describe('removeLocalePrefix', () => {
    it.each([
      // [pathname, expected]
      ['/ja/about', '/about'],
      ['/en/about', '/about'],
      ['/ja', '/'],
      ['/en', '/'],
      ['/about', '/about'],
      ['/', '/'],
      ['/ja/nested/path', '/nested/path'],
      ['/en/nested/path', '/nested/path'],
    ])('removeLocalePrefix("%s", locales) → "%s"', (pathname, expected) => {
      expect(removeLocalePrefix(pathname, LOCALES)).toBe(expected)
    })

    it('should not remove prefix for unsupported locales', () => {
      expect(removeLocalePrefix('/de/about', LOCALES)).toBe('/de/about')
      expect(removeLocalePrefix('/fr/about', LOCALES)).toBe('/fr/about')
    })
  })

  describe('hasLocalePrefix', () => {
    it.each([
      // [pathname, locale, expected]
      ['/ja/about', 'ja', true],
      ['/ja', 'ja', true],
      ['/en/about', 'en', true],
      ['/en', 'en', true],
      ['/about', 'ja', false],
      ['/about', 'en', false],
      ['/', 'ja', false],
      ['/', 'en', false],
      ['/japanese/page', 'ja', false], // 'ja' is not a prefix here
      ['/january', 'ja', false], // 'ja' is not a prefix here
    ])('hasLocalePrefix("%s", "%s") → %s', (pathname, locale, expected) => {
      expect(hasLocalePrefix(pathname, locale)).toBe(expected)
    })
  })

  describe('Integration: detectLocale + getLocalizedPath', () => {
    /**
     * Full matrix test combining:
     * - URL pattern: prefixDefault (true/false)
     * - Browser language: 'en', 'ja', 'de' (unsupported)
     * - Detection: enabled/disabled
     * - Fallback when detection fails
     */

    type TestCase = {
      description: string
      prefixDefault: boolean
      acceptLanguage: string | null
      detectEnabled: boolean
      expectedLocale: string
      expectedPath: string // for '/about' path
    }

    const testCases: TestCase[] = [
      // === prefixDefault=false (default locale at /) ===
      // Browser: English
      {
        description: 'prefixDefault=false, browser=en, detect=true → en, /about',
        prefixDefault: false,
        acceptLanguage: 'en',
        detectEnabled: true,
        expectedLocale: 'en',
        expectedPath: '/about',
      },
      {
        description: 'prefixDefault=false, browser=en, detect=false → fallback en, /about',
        prefixDefault: false,
        acceptLanguage: 'en',
        detectEnabled: false,
        expectedLocale: 'en',
        expectedPath: '/about',
      },
      // Browser: Japanese
      {
        description: 'prefixDefault=false, browser=ja, detect=true → ja, /ja/about',
        prefixDefault: false,
        acceptLanguage: 'ja',
        detectEnabled: true,
        expectedLocale: 'ja',
        expectedPath: '/ja/about',
      },
      {
        description: 'prefixDefault=false, browser=ja, detect=false → fallback en, /about',
        prefixDefault: false,
        acceptLanguage: 'ja',
        detectEnabled: false,
        expectedLocale: 'en',
        expectedPath: '/about',
      },
      // Browser: German (unsupported)
      {
        description: 'prefixDefault=false, browser=de, detect=true → fallback en, /about',
        prefixDefault: false,
        acceptLanguage: 'de',
        detectEnabled: true,
        expectedLocale: 'en',
        expectedPath: '/about',
      },
      {
        description: 'prefixDefault=false, browser=de, detect=false → fallback en, /about',
        prefixDefault: false,
        acceptLanguage: 'de',
        detectEnabled: false,
        expectedLocale: 'en',
        expectedPath: '/about',
      },
      // Browser: null (no Accept-Language header)
      {
        description: 'prefixDefault=false, browser=null, detect=true → fallback en, /about',
        prefixDefault: false,
        acceptLanguage: null,
        detectEnabled: true,
        expectedLocale: 'en',
        expectedPath: '/about',
      },

      // === prefixDefault=true (all locales with prefix) ===
      // Browser: English
      {
        description: 'prefixDefault=true, browser=en, detect=true → en, /en/about',
        prefixDefault: true,
        acceptLanguage: 'en',
        detectEnabled: true,
        expectedLocale: 'en',
        expectedPath: '/en/about',
      },
      {
        description: 'prefixDefault=true, browser=en, detect=false → fallback en, /en/about',
        prefixDefault: true,
        acceptLanguage: 'en',
        detectEnabled: false,
        expectedLocale: 'en',
        expectedPath: '/en/about',
      },
      // Browser: Japanese
      {
        description: 'prefixDefault=true, browser=ja, detect=true → ja, /ja/about',
        prefixDefault: true,
        acceptLanguage: 'ja',
        detectEnabled: true,
        expectedLocale: 'ja',
        expectedPath: '/ja/about',
      },
      {
        description: 'prefixDefault=true, browser=ja, detect=false → fallback en, /en/about',
        prefixDefault: true,
        acceptLanguage: 'ja',
        detectEnabled: false,
        expectedLocale: 'en',
        expectedPath: '/en/about',
      },
      // Browser: German (unsupported)
      {
        description: 'prefixDefault=true, browser=de, detect=true → fallback en, /en/about',
        prefixDefault: true,
        acceptLanguage: 'de',
        detectEnabled: true,
        expectedLocale: 'en',
        expectedPath: '/en/about',
      },
      {
        description: 'prefixDefault=true, browser=de, detect=false → fallback en, /en/about',
        prefixDefault: true,
        acceptLanguage: 'de',
        detectEnabled: false,
        expectedLocale: 'en',
        expectedPath: '/en/about',
      },
    ]

    it.each(testCases)('$description', (testCase) => {
      const { prefixDefault, acceptLanguage, detectEnabled, expectedLocale, expectedPath } = testCase

      // Determine locale
      let locale: string
      if (detectEnabled) {
        const detected = detectLocale(acceptLanguage, LOCALES)
        locale = detected ?? DEFAULT_LOCALE
      } else {
        locale = DEFAULT_LOCALE
      }

      expect(locale).toBe(expectedLocale)

      // Generate path
      const path = getLocalizedPath('/about', locale, DEFAULT_LOCALE, prefixDefault)
      expect(path).toBe(expectedPath)
    })
  })

  describe('Integration: Fallback to non-default locale', () => {
    /**
     * Test cases where fallback is NOT the default locale
     * Example: fallbackLocale = 'ja' instead of 'en'
     */

    const FALLBACK_LOCALE = 'ja'

    it.each([
      // [acceptLanguage, detectEnabled, expectedLocale, expectedPath]
      ['de', true, 'ja', '/ja/about'], // unsupported → fallback to ja
      ['fr', true, 'ja', '/ja/about'], // unsupported → fallback to ja
      [null, true, 'ja', '/ja/about'], // no header → fallback to ja
      ['en', true, 'en', '/about'], // supported → use en
      ['ja', true, 'ja', '/ja/about'], // supported → use ja
    ] as const)(
      'fallback=ja: acceptLanguage=%s, detect=%s → locale=%s, path=%s',
      (acceptLanguage, detectEnabled, expectedLocale, expectedPath) => {
        let locale: string
        if (detectEnabled) {
          const detected = detectLocale(acceptLanguage, LOCALES)
          locale = detected ?? FALLBACK_LOCALE
        } else {
          locale = FALLBACK_LOCALE
        }

        expect(locale).toBe(expectedLocale)

        const path = getLocalizedPath('/about', locale, DEFAULT_LOCALE, false)
        expect(path).toBe(expectedPath)
      }
    )
  })

  describe('Edge cases', () => {
    it('should handle empty path', () => {
      expect(getLocalizedPath('', 'ja', DEFAULT_LOCALE)).toBe('/ja')
      expect(getLocalizedPath('', 'en', DEFAULT_LOCALE)).toBe('/')
    })

    it('should handle trailing slashes consistently', () => {
      // Current behavior: trailing slashes are preserved in path
      expect(getLocalizedPath('/about/', 'ja', DEFAULT_LOCALE)).toBe('/ja/about/')
      expect(removeLocalePrefix('/ja/about/', LOCALES)).toBe('/about/')
    })

    it('should handle query strings', () => {
      // Note: getLocalizedPath doesn't parse query strings, they're part of the path
      expect(getLocalizedPath('/about?foo=bar', 'ja', DEFAULT_LOCALE)).toBe('/ja/about?foo=bar')
      expect(removeLocalePrefix('/ja/about?foo=bar', LOCALES)).toBe('/about?foo=bar')
    })

    it('should handle hash fragments', () => {
      expect(getLocalizedPath('/about#section', 'ja', DEFAULT_LOCALE)).toBe('/ja/about#section')
      expect(removeLocalePrefix('/ja/about#section', LOCALES)).toBe('/about#section')
    })

    it('should not confuse similar locale prefixes', () => {
      // 'jan' should not match 'ja'
      expect(hasLocalePrefix('/january', 'ja')).toBe(false)
      expect(removeLocalePrefix('/january', LOCALES)).toBe('/january')

      // 'english' should not match 'en'
      expect(hasLocalePrefix('/english', 'en')).toBe(false)
      expect(removeLocalePrefix('/english', LOCALES)).toBe('/english')
    })
  })

  describe('Language switching scenarios', () => {
    /**
     * Test language switching from one locale to another
     * Important: when switching languages, the path should be correctly transformed
     */

    it.each([
      // [currentPath, currentLocale, targetLocale, prefixDefault, expectedPath]
      // From English (no prefix) to Japanese
      ['/about', 'en', 'ja', false, '/ja/about'],
      ['/', 'en', 'ja', false, '/ja'],
      // From Japanese to English (no prefix)
      ['/ja/about', 'ja', 'en', false, '/about'],
      ['/ja', 'ja', 'en', false, '/'],
      // With prefixDefault=true
      ['/en/about', 'en', 'ja', true, '/ja/about'],
      ['/ja/about', 'ja', 'en', true, '/en/about'],
    ] as const)(
      'switch from %s (locale=%s) to locale=%s (prefixDefault=%s) → %s',
      (currentPath, _currentLocale, targetLocale, prefixDefault, expectedPath) => {
        // First remove current locale prefix, then add new one
        const cleanPath = removeLocalePrefix(currentPath, LOCALES)
        const newPath = getLocalizedPath(cleanPath, targetLocale, DEFAULT_LOCALE, prefixDefault)
        expect(newPath).toBe(expectedPath)
      }
    )
  })

  describe('Complex Accept-Language headers', () => {
    /**
     * Real-world Accept-Language header patterns
     */

    it.each([
      // [acceptLanguage, expectedLocale, description]
      ['ja,en-US;q=0.9,en;q=0.8', 'ja', 'Japanese browser with English fallback'],
      ['en-US,en;q=0.9,ja;q=0.8', 'en', 'US English with Japanese fallback'],
      ['en-GB,en;q=0.9', 'en', 'British English'],
      ['zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7', 'en', 'Chinese browser, falls back to en'],
      ['ko-KR,ko;q=0.9,ja;q=0.8,en;q=0.7', 'ja', 'Korean browser, falls back to ja'],
      ['de-DE,de;q=0.9,fr;q=0.8', null, 'German/French, no match'],
      ['*', null, 'Wildcard (not supported)'],
      ['ja-JP', 'ja', 'Japanese (Japan) matches ja'],
      ['en-AU,en;q=0.9', 'en', 'Australian English matches en'],
    ] as const)(
      'detectLocale("%s") → %s (%s)',
      (acceptLanguage, expectedLocale) => {
        const result = detectLocale(acceptLanguage, LOCALES)
        expect(result).toBe(expectedLocale)
      }
    )
  })

  describe('URL structure combinations', () => {
    /**
     * Different URL structures that might appear in real applications
     */

    it.each([
      // [path, locale, prefixDefault, expected]
      // API routes (typically not localized, but test behavior)
      ['/api/users', 'ja', false, '/ja/api/users'],
      ['/api/users', 'en', false, '/api/users'],
      // Static assets (typically not localized)
      ['/_next/static/chunk.js', 'ja', false, '/ja/_next/static/chunk.js'],
      // Deeply nested paths
      ['/docs/guide/getting-started/installation', 'ja', false, '/ja/docs/guide/getting-started/installation'],
      // Paths with special characters (URL encoded)
      ['/search?q=%E6%97%A5%E6%9C%AC%E8%AA%9E', 'ja', false, '/ja/search?q=%E6%97%A5%E6%9C%AC%E8%AA%9E'],
    ] as const)(
      'getLocalizedPath("%s", "%s", "en", %s) → "%s"',
      (path, locale, prefixDefault, expected) => {
        expect(getLocalizedPath(path, locale, DEFAULT_LOCALE, prefixDefault)).toBe(expected)
      }
    )
  })

  describe('Three or more locales', () => {
    /**
     * Test with more than 2 locales to ensure logic generalizes
     */

    const MULTI_LOCALES = ['en', 'ja', 'zh', 'ko'] as const
    const MULTI_DEFAULT = 'en'

    it.each([
      ['/about', 'en', false, '/about'],
      ['/about', 'ja', false, '/ja/about'],
      ['/about', 'zh', false, '/zh/about'],
      ['/about', 'ko', false, '/ko/about'],
      ['/about', 'en', true, '/en/about'],
      ['/about', 'ja', true, '/ja/about'],
    ] as const)(
      'multi-locale: getLocalizedPath("%s", "%s", "en", %s) → "%s"',
      (path, locale, prefixDefault, expected) => {
        expect(getLocalizedPath(path, locale, MULTI_DEFAULT, prefixDefault)).toBe(expected)
      }
    )

    it('should remove any locale prefix from multi-locale setup', () => {
      expect(removeLocalePrefix('/ja/about', MULTI_LOCALES)).toBe('/about')
      expect(removeLocalePrefix('/zh/about', MULTI_LOCALES)).toBe('/about')
      expect(removeLocalePrefix('/ko/about', MULTI_LOCALES)).toBe('/about')
      expect(removeLocalePrefix('/en/about', MULTI_LOCALES)).toBe('/about')
    })

    it('should detect correct locale with multiple options', () => {
      expect(detectLocale('zh-CN,zh;q=0.9,ja;q=0.8', MULTI_LOCALES)).toBe('zh')
      expect(detectLocale('ko-KR,ko;q=0.9,en;q=0.8', MULTI_LOCALES)).toBe('ko')
    })
  })

  describe('Default locale is NOT first in array', () => {
    /**
     * Ensure logic works regardless of array order
     */

    const REVERSED_LOCALES = ['ja', 'en'] as const // ja is first, but en is default
    const REVERSED_DEFAULT = 'en'

    it('should still work when default locale is second in array', () => {
      expect(getLocalizedPath('/about', 'en', REVERSED_DEFAULT, false)).toBe('/about')
      expect(getLocalizedPath('/about', 'ja', REVERSED_DEFAULT, false)).toBe('/ja/about')
    })

    it('should remove prefixes correctly regardless of array order', () => {
      expect(removeLocalePrefix('/ja/about', REVERSED_LOCALES)).toBe('/about')
      expect(removeLocalePrefix('/en/about', REVERSED_LOCALES)).toBe('/about')
    })
  })

  describe('getLinkHref', () => {
    /**
     * Link href generation for Link components
     * Auto-detects whether to add locale prefix based on current URL pattern
     */

    describe('auto-detect mode (overrideLocale = undefined)', () => {
      it.each([
        // [href, currentPathname, currentLocale, expected, description]
        // Current URL has locale prefix → add prefix to link
        ['/about', '/ja/page', 'ja', '/ja/about', 'URL has /ja prefix'],
        ['/about', '/ja', 'ja', '/ja/about', 'URL is /ja root'],
        ['/contact', '/ja/page', 'ja', '/ja/contact', 'different path with /ja prefix'],
        ['/', '/ja/page', 'ja', '/ja', 'root link when on /ja prefix'],
        // Current URL has no prefix → no prefix on link
        ['/about', '/page', 'en', '/about', 'URL has no prefix'],
        ['/about', '/', 'en', '/about', 'URL is root'],
        ['/contact', '/page', 'en', '/contact', 'different path with no prefix'],
        ['/', '/page', 'en', '/', 'root link when no prefix'],
        // No currentLocale → no prefix
        ['/about', '/page', undefined, '/about', 'no current locale'],
        ['/about', '/', undefined, '/about', 'no locale at root'],
      ] as const)(
        'getLinkHref("%s", "%s", %s) → "%s" (%s)',
        (href, currentPathname, currentLocale, expected) => {
          expect(getLinkHref(href, currentPathname, currentLocale)).toBe(expected)
        }
      )
    })

    describe('explicit locale override (overrideLocale = "locale")', () => {
      it.each([
        // [href, currentPathname, currentLocale, overrideLocale, expected]
        // Always add explicit locale prefix regardless of current URL pattern
        ['/about', '/page', 'en', 'ja', '/ja/about'],
        ['/about', '/ja/page', 'ja', 'en', '/en/about'],
        ['/', '/page', 'en', 'ja', '/ja'],
        ['/', '/ja/page', 'ja', 'en', '/en'],
        ['/contact', '/', undefined, 'fr', '/fr/contact'],
      ] as const)(
        'getLinkHref("%s", "%s", %s, "%s") → "%s"',
        (href, currentPathname, currentLocale, overrideLocale, expected) => {
          expect(getLinkHref(href, currentPathname, currentLocale, overrideLocale)).toBe(expected)
        }
      )
    })

    describe('raw path mode (overrideLocale = "" or false)', () => {
      it.each([
        // [href, currentPathname, currentLocale, expected]
        // Empty string override means no localization at all
        ['/about', '/ja/page', 'ja', '/about'],
        ['/about', '/page', 'en', '/about'],
        ['/', '/ja/page', 'ja', '/'],
        ['/', '/page', 'en', '/'],
        ['/contact', '/ja/about', 'ja', '/contact'],
      ] as const)(
        'getLinkHref("%s", "%s", %s, "") → "%s"',
        (href, currentPathname, currentLocale, expected) => {
          expect(getLinkHref(href, currentPathname, currentLocale, '')).toBe(expected)
        }
      )

      it.each([
        // [href, currentPathname, currentLocale, expected]
        // false override also means no localization (for conditional rendering)
        ['/about', '/ja/page', 'ja', '/about'],
        ['/about', '/page', 'en', '/about'],
        ['/', '/ja/page', 'ja', '/'],
        ['/', '/page', 'en', '/'],
        ['/contact', '/ja/about', 'ja', '/contact'],
      ] as const)(
        'getLinkHref("%s", "%s", %s, false) → "%s"',
        (href, currentPathname, currentLocale, expected) => {
          expect(getLinkHref(href, currentPathname, currentLocale, false)).toBe(expected)
        }
      )
    })

    describe('path normalization', () => {
      it('should add leading slash to relative paths', () => {
        expect(getLinkHref('about', '/ja/page', 'ja')).toBe('/ja/about')
        expect(getLinkHref('about', '/page', 'en')).toBe('/about')
      })
    })

    describe('language switching use case', () => {
      /**
       * Common use case: language switcher links
       */

      it('should generate correct language switch links', () => {
        // On English page (no prefix), switch to Japanese
        expect(getLinkHref('/', '/about', 'en', 'ja')).toBe('/ja')

        // On Japanese page (with prefix), switch to English
        expect(getLinkHref('/', '/ja/about', 'ja', 'en')).toBe('/en')

        // On Japanese page, link to raw English root (no prefix)
        expect(getLinkHref('/', '/ja/about', 'ja', '')).toBe('/')
      })
    })
  })
})
