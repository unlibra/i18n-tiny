import { describe, it, expect } from 'vitest'
import * as core from '@i18n-tiny/core/router'
import { define } from '../index'
import * as router from '../router'

// Test messages
const enMessages = {
  common: {
    title: 'Hello',
    description: 'Welcome to our site'
  },
  nav: {
    home: 'Home',
    about: 'About'
  }
}

const jaMessages = {
  common: {
    title: 'こんにちは',
    description: 'サイトへようこそ'
  },
  nav: {
    home: 'ホーム',
    about: '概要'
  }
}

const messages = { en: enMessages, ja: jaMessages }
const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const

// Calls a function from JavaScript, without the type checks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untyped = (fn: unknown) => fn as (...args: any[]) => any

// The result of a call, or the message of the error it throws
function outcome (fn: () => unknown): unknown {
  try {
    return { value: fn() }
  } catch (error) {
    return { error: (error as Error).message }
  }
}

describe('define', () => {
  const i18n = define({ ...config, messages })

  describe('config', () => {
    it('returns the locale settings', () => {
      expect(i18n.locales).toEqual(['ja', 'en'])
      expect(i18n.defaultLocale).toBe('ja')
    })

    it('returns localizedPath and alternatePath as its only URL functions', () => {
      const expected = ['alternatePath', 'defaultLocale', 'getMessages', 'getStaticPaths', 'getTranslations', 'isLocale', 'locales', 'localizedPath']
      expect(Object.keys(i18n).sort()).toEqual(expected)
      expect(Object.keys(define({ ...config, prefixDefault: true, messages })).sort()).toEqual(expected)
    })

    it('requires locales and defaultLocale', () => {
      expect(() => untyped(define)({ messages })).toThrow('[i18n] locales must be a non-empty array')
      expect(() => untyped(define)({ locales: ['ja', 'en'], messages })).toThrow('defaultLocale undefined is not one of locales')
    })

    it('throws when defaultLocale is not one of locales', () => {
      expect(() => untyped(define)({ locales: ['ja', 'en'], defaultLocale: 'fr', messages }))
        .toThrow('[i18n] defaultLocale "fr" is not one of locales ("ja", "en").')
    })

    it('throws when locales is empty or lists a locale twice', () => {
      expect(() => untyped(define)({ locales: [], defaultLocale: 'ja', messages: {} }))
        .toThrow('[i18n] locales must be a non-empty array')
      expect(() => untyped(define)({ locales: ['ja', 'en', 'ja'], defaultLocale: 'ja', messages }))
        .toThrow('[i18n] Locale "ja" is listed more than once in locales.')
    })

    it('throws for a locale that cannot be a path segment', () => {
      for (const locale of ['', '.', '..', 'en/us', 'en us']) {
        expect(() => untyped(define)({ locales: ['ja', locale], defaultLocale: 'ja', messages: { ja: jaMessages, [locale]: enMessages } }))
          .toThrow('cannot be used as a path segment')
      }
    })

    it('throws when messages is missing a locale or has one that is not in locales', () => {
      expect(() => untyped(define)({ locales: ['ja', 'en'], defaultLocale: 'ja', messages: { ja: jaMessages } }))
        .toThrow('[i18n] messages is missing locales: "en".')
      expect(() => untyped(define)({ locales: ['ja'], defaultLocale: 'ja', messages }))
        .toThrow('[i18n] messages has locales that are not in locales: "en".')
    })
  })

  describe('isLocale', () => {
    it('is true only for the locales of the config', () => {
      expect(i18n.isLocale('ja')).toBe(true)
      expect(i18n.isLocale('en')).toBe(true)
      expect(i18n.isLocale('fr')).toBe(false)
      expect(i18n.isLocale('EN')).toBe(false)
      expect(i18n.isLocale('')).toBe(false)
      expect(i18n.isLocale(undefined)).toBe(false)
      expect(i18n.isLocale('favicon.ico')).toBe(false)
    })
  })

  describe('getMessages', () => {
    it('returns the messages of the locale', () => {
      expect(i18n.getMessages('en').common.title).toBe('Hello')
      expect(i18n.getMessages('ja').common.title).toBe('こんにちは')
    })

    it('throws for an unknown locale instead of falling back', () => {
      expect(() => untyped(i18n.getMessages)('fr')).toThrow('[i18n] Unknown locale "fr". Expected one of "ja", "en".')
      expect(() => untyped(i18n.getMessages)(undefined)).toThrow('[i18n] Unknown locale undefined.')
      expect(() => untyped(i18n.getMessages)('favicon.ico')).toThrow('[i18n] Unknown locale "favicon.ico".')
    })
  })

  describe('getTranslations', () => {
    it('translates in the locale', () => {
      expect(i18n.getTranslations('en')('common.title')).toBe('Hello')
      expect(i18n.getTranslations('ja')('common.title')).toBe('こんにちは')
    })

    it('supports a namespace', () => {
      expect(i18n.getTranslations('en', 'common')('title')).toBe('Hello')
    })

    it('returns the key when a translation is missing', () => {
      const t = i18n.getTranslations('en')
      expect(untyped(t)('missing.key')).toBe('missing.key')
    })

    it('throws for an unknown locale instead of falling back', () => {
      expect(() => untyped(i18n.getTranslations)('fr')).toThrow('[i18n] Unknown locale "fr".')
      expect(() => untyped(i18n.getTranslations)(undefined)).toThrow('[i18n] Unknown locale undefined.')
    })
  })

  describe('URL functions', () => {
    const pathnames = [
      '/', '/about', '/about/', '/en', '/en/', '/en/about', '/ja', '/ja/about', '/english', '/a/b/c',
      // Invalid inputs throw the same errors
      'about', '', '//evil.com', '/\\evil.com', '/en//evil.com', '/about?x=1', '/about#top'
    ]

    for (const prefixDefault of [false, true]) {
      const settings = { ...config, prefixDefault }
      const bound = define({ ...settings, messages })

      it(`return what the core functions return with the same config (prefixDefault: ${prefixDefault})`, () => {
        for (const pathname of pathnames) {
          for (const locale of ['ja', 'en', 'fr']) {
            expect(outcome(() => untyped(bound.localizedPath)(pathname, locale)))
              .toEqual(outcome(() => untyped(core.localizedPath)(pathname, locale, settings)))
            expect(outcome(() => untyped(bound.alternatePath)(pathname, locale)))
              .toEqual(outcome(() => untyped(core.alternatePath)(pathname, locale, settings)))
          }
        }
      })
    }

    it('build the paths of the config', () => {
      expect(i18n.localizedPath('/about', 'en')).toBe('/en/about')
      expect(i18n.localizedPath('/about', 'ja')).toBe('/about')
      expect(i18n.localizedPath('/', 'en')).toBe('/en')
      expect(i18n.alternatePath('/en/about', 'ja')).toBe('/about')
      expect(i18n.alternatePath('/about', 'en')).toBe('/en/about')

      const prefixed = define({ ...config, prefixDefault: true, messages })
      expect(prefixed.localizedPath('/about', 'ja')).toBe('/ja/about')
      expect(prefixed.alternatePath('/en', 'ja')).toBe('/ja')
    })

    it('throw for an unknown locale', () => {
      expect(() => untyped(i18n.localizedPath)('/about', 'fr')).toThrow('[i18n] Unknown locale "fr".')
      expect(() => untyped(i18n.alternatePath)('/about', 'fr')).toThrow('[i18n] Unknown locale "fr".')
    })
  })

  describe('getStaticPaths', () => {
    it('builds each locale, without a locale param for the default locale', () => {
      expect(i18n.getStaticPaths()).toEqual([
        { params: { locale: undefined }, props: { locale: 'ja' } },
        { params: { locale: 'en' }, props: { locale: 'en' } }
      ])
    })

    it('sets the locale param of the default locale with prefixDefault', () => {
      const prefixed = define({ ...config, prefixDefault: true, messages })
      expect(prefixed.getStaticPaths()).toEqual([
        { params: { locale: 'ja' }, props: { locale: 'ja' } },
        { params: { locale: 'en' }, props: { locale: 'en' } }
      ])
    })

    it('builds only the locales of the page', () => {
      expect(i18n.getStaticPaths({ locales: ['ja'] })).toEqual([
        { params: { locale: undefined }, props: { locale: 'ja' } }
      ])
      expect(i18n.getStaticPaths({ locales: ['en'] })).toEqual([
        { params: { locale: 'en' }, props: { locale: 'en' } }
      ])
    })

    it('combines with the other dynamic parameters of the route', () => {
      const tools = ['color', 'hex']
      const paths = tools.flatMap((tool) => i18n.getStaticPaths().map(({ params, props }) => ({ params: { ...params, tool }, props: { ...props, tool } })))
      expect(paths).toEqual([
        { params: { locale: undefined, tool: 'color' }, props: { locale: 'ja', tool: 'color' } },
        { params: { locale: 'en', tool: 'color' }, props: { locale: 'en', tool: 'color' } },
        { params: { locale: undefined, tool: 'hex' }, props: { locale: 'ja', tool: 'hex' } },
        { params: { locale: 'en', tool: 'hex' }, props: { locale: 'en', tool: 'hex' } }
      ])
    })

    it('throws for invalid locales of the page', () => {
      expect(() => untyped(i18n.getStaticPaths)({ locales: ['fr'] })).toThrow('[i18n] Unknown locale "fr". Expected one of "ja", "en".')
      expect(() => i18n.getStaticPaths({ locales: [] })).toThrow('[i18n] The locales of getStaticPaths() must be a non-empty array')
      expect(() => i18n.getStaticPaths({ locales: ['en', 'en'] })).toThrow('[i18n] Locale "en" is listed more than once in the locales of getStaticPaths().')
    })

    it('returns paths that the caller can change without changing define()', () => {
      const first = i18n.getStaticPaths()
      first[0].props.locale = 'en'
      expect(i18n.getStaticPaths()[0].props.locale).toBe('ja')
      expect(i18n.locales).toEqual(['ja', 'en'])
    })
  })
})

describe('@i18n-tiny/astro/router', () => {
  it('builds paths from the config object, as the core does', () => {
    expect(router.localizedPath('/about', 'en', config)).toBe('/en/about')
    expect(router.localizedPath('/about', 'ja', config)).toBe('/about')
    expect(router.alternatePath('/en/about', 'ja', config)).toBe('/about')
    expect(router.pathLocale('/en/about', config)).toBe('en')
    expect(router.removeLocalePrefix('/en/about', config)).toBe('/about')
    expect(router.removeLocalePrefix('/en', config)).toBe('/')
    expect(router.removeLocalePrefix('/about/', config)).toBe('/about')
  })

  it('has no positional forms', () => {
    expect(Object.keys(router).sort()).toEqual(['alternatePath', 'localizedPath', 'pathLocale', 'removeLocalePrefix'])
    expect(() => untyped(router.removeLocalePrefix)('/en/about', ['ja', 'en'])).toThrow('[i18n] locales must be a non-empty array')
  })
})
