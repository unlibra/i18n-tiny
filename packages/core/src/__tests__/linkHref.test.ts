import { describe, expect, it } from 'vitest'
import { getLinkHref } from '../router'
import type { I18nConfig, LinkHrefOptions } from '../router'

const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
const prefixed = { ...config, prefixDefault: true } as const

// Options that only the runtime check can reject
const loose = (value: Record<string, unknown>) => value as LinkHrefOptions

describe('getLinkHref() with the options of the config', () => {
  describe('hrefs that are not site paths', () => {
    it.each([
      ['https://github.com/x'],
      ['mailto:hello@example.com'],
      ['//cdn.example.com/a.js'],
      ['#top'],
      ['?page=2']
    ])('leaves %s unchanged', (href) => {
      expect(getLinkHref(href, '/en/page', 'en', {})).toBe(href)
      expect(getLinkHref(href, '/en/page', 'en', { locale: 'ja', normalize: true, config })).toBe(href)
      expect(getLinkHref(href, '/en/page', 'en', { locale: false })).toBe(href)
    })
  })

  describe('without locale: keeps the pattern of the current URL', () => {
    it.each([
      ['/about', '/en/page', 'en', '/en/about'],
      ['/about', '/en', 'en', '/en/about'],
      ['/', '/en/page', 'en', '/en'],
      ['/about', '/page', 'ja', '/about'],
      ['/', '/', 'ja', '/'],
      ['/about', '/page', undefined, '/about'],
      // The current pathname of another locale's prefix does not count
      ['/about', '/english', 'en', '/about'],
      // With prefixDefault, the current URL of the default locale has a prefix
      ['/about', '/ja/page', 'ja', '/ja/about']
    ] as const)('getLinkHref("%s", "%s", %s, {}) → "%s"', (href, currentPathname, currentLocale, expected) => {
      expect(getLinkHref(href, currentPathname, currentLocale, {})).toBe(expected)
      expect(getLinkHref(href, currentPathname, currentLocale, { config })).toBe(expected)
    })
  })

  describe('with a locale: builds the link for that locale', () => {
    it.each([
      // The default locale gets no prefix
      ['/about', '/en/page', 'en', 'ja', '/about'],
      ['/', '/en/page', 'en', 'ja', '/'],
      ['/about', '/page', 'ja', 'en', '/en/about'],
      ['/', '/page', 'ja', 'en', '/en'],
      ['/about', '/page', undefined, 'en', '/en/about']
    ] as const)('getLinkHref("%s", "%s", %s, { locale: "%s" }) → "%s"', (href, currentPathname, currentLocale, locale, expected) => {
      expect(getLinkHref(href, currentPathname, currentLocale, { locale, config })).toBe(expected)
    })

    it.each([
      ['/about', 'ja', '/ja/about'],
      ['/', 'ja', '/ja'],
      ['/about', 'en', '/en/about']
    ] as const)('with prefixDefault, getLinkHref("%s", …, { locale: "%s" }) → "%s"', (href, locale, expected) => {
      expect(getLinkHref(href, '/page', undefined, { locale, config: prefixed })).toBe(expected)
    })

    it('should add the prefix to an href that already has one, unless normalize is set', () => {
      expect(getLinkHref('/en/about', '/page', 'ja', { locale: 'en', config })).toBe('/en/en/about')
      expect(getLinkHref('/en/about', '/page', 'ja', { locale: 'en', normalize: true, config })).toBe('/en/about')
    })
  })

  describe('with normalize: removes the locale prefix of the href first', () => {
    it.each([
      ['/en/about', 'ja', '/about'],
      ['/en/about', 'en', '/en/about'],
      ['/about', 'en', '/en/about'],
      ['/en', 'ja', '/'],
      ['/ja/about', 'en', '/en/about']
    ] as const)('getLinkHref("%s", …, { locale: "%s", normalize: true }) → "%s"', (href, locale, expected) => {
      expect(getLinkHref(href, '/en/about', 'en', { locale, normalize: true, config })).toBe(expected)
    })

    it('should keep the pattern of the current URL without a locale', () => {
      expect(getLinkHref('/en/about', '/en/about', 'en', { normalize: true, config })).toBe('/en/about')
      expect(getLinkHref('/en/about', '/about', 'ja', { normalize: true, config })).toBe('/about')
    })

    it('should leave the path without a locale with locale false', () => {
      expect(getLinkHref('/en/about', '/en/about', 'en', { locale: false, normalize: true, config })).toBe('/about')
    })
  })

  describe('with locale false: leaves the path without a locale', () => {
    it.each([
      ['/about', '/en/page', 'en', '/about'],
      ['/about', '/page', 'ja', '/about'],
      ['/', '/en/page', 'en', '/'],
      ['/en/about', '/page', 'ja', '/en/about']
    ] as const)('getLinkHref("%s", "%s", %s, { locale: false }) → "%s"', (href, currentPathname, currentLocale, expected) => {
      expect(getLinkHref(href, currentPathname, currentLocale, { locale: false })).toBe(expected)
      expect(getLinkHref(href, currentPathname, currentLocale, { locale: false, config })).toBe(expected)
    })
  })

  describe('the query and the hash', () => {
    it.each([
      ['/about#team', 'en', '/en/about#team'],
      ['/search?q=1', 'en', '/en/search?q=1'],
      ['/search?q=1#results', 'en', '/en/search?q=1#results'],
      ['/about/#team', 'en', '/en/about#team'],
      ['/#top', 'en', '/en#top'],
      ['/?page=2', 'en', '/en?page=2'],
      ['/about#team', 'ja', '/about#team'],
      // A "?" in the hash is part of the hash
      ['/about#a?b', 'en', '/en/about#a?b']
    ] as const)('getLinkHref("%s", …, { locale: "%s" }) → "%s"', (href, locale, expected) => {
      expect(getLinkHref(href, '/page', 'ja', { locale, config })).toBe(expected)
    })

    it('should keep them without a locale and with normalize', () => {
      expect(getLinkHref('/about#team', '/en/page', 'en', {})).toBe('/en/about#team')
      expect(getLinkHref('/en/about?x=1', '/en/about', 'en', { locale: 'ja', normalize: true, config })).toBe('/about?x=1')
      expect(getLinkHref('/about/?x=1', '/page', 'ja', { locale: false })).toBe('/about?x=1')
    })
  })

  describe('the trailing slash', () => {
    it('should drop it from the path', () => {
      expect(getLinkHref('/about/', '/en/page', 'en', {})).toBe('/en/about')
      expect(getLinkHref('/about/', '/page', 'ja', {})).toBe('/about')
      expect(getLinkHref('/about/', '/page', 'ja', { locale: 'en', config })).toBe('/en/about')
      expect(getLinkHref('/about/', '/page', 'ja', { locale: false })).toBe('/about')
    })
  })

  describe('errors', () => {
    it('should throw for a locale without the config', () => {
      expect(() => getLinkHref('/about', '/page', 'ja', loose({ locale: 'en' })))
        .toThrow('A link with locale "en" needs the config option.')
    })

    it('should throw for normalize without the config', () => {
      expect(() => getLinkHref('/en/about', '/page', 'ja', loose({ normalize: true })))
        .toThrow('A link with normalize needs the config option.')
    })

    it('should throw for a locale that is not one of locales', () => {
      expect(() => getLinkHref('/about', '/page', 'ja', loose({ locale: 'fr', config })))
        .toThrow('Unknown locale "fr"')
    })

    it('should throw for the empty locale, which is not a way to leave the path without a locale', () => {
      expect(() => getLinkHref('/about', '/page', 'ja', loose({ locale: '', config })))
        .toThrow('Unknown locale ""')
      expect(() => getLinkHref('/about', '/page', 'ja', loose({ locale: '' })))
        .toThrow('A link with locale "" needs the config option.')
    })

    it.each([
      ['about', 'must be a pathname starting with "/"'],
      ['./about', 'must be a pathname starting with "/"'],
      ['/\\example.com', 'must not start with "//" or "/\\"']
    ])('should throw for the href %j', (href, message) => {
      expect(() => getLinkHref(href, '/page', 'ja', {})).toThrow(message)
      expect(() => getLinkHref(href, '/page', 'ja', { locale: 'en', config })).toThrow(message)
    })

    it('should throw when normalize leaves a path that leads to another host', () => {
      expect(() => getLinkHref('/en//evil.com', '/page', 'ja', { locale: 'ja', normalize: true, config }))
        .toThrow('must not start with "//" or "/\\" after its locale prefix')
      expect(() => getLinkHref('/en/\\evil.com', '/page', 'ja', { locale: false, normalize: true, config }))
        .toThrow('must not start with "//" or "/\\" after its locale prefix')
    })

    it('should throw for the options of 1.x, called from JavaScript', () => {
      const untyped = getLinkHref as (...args: unknown[]) => string
      for (const options of ['ja', '', false, undefined, null]) {
        expect(() => untyped('/about', '/page', 'ja', options))
          .toThrow('[i18n] getLinkHref() takes the options object { locale, normalize, config } as its fourth argument')
      }
      expect(() => untyped('/about', '/page', 'en', { locale: 'ja', locales: ['ja', 'en'] }))
        .toThrow('A link with locale "ja" needs the config option.')
    })

    it('should throw for an invalid config', () => {
      const invalid: I18nConfig = { locales: ['ja', 'en'], defaultLocale: 'fr' }
      expect(() => getLinkHref('/about', '/page', 'ja', { config: invalid }))
        .toThrow('defaultLocale "fr" is not one of locales')
      expect(() => getLinkHref('/about', '/page', 'ja', { locale: 'en', config: invalid }))
        .toThrow('defaultLocale "fr" is not one of locales')
    })
  })
})
