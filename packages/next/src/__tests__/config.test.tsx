import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as core from '@i18n-tiny/core/router'
import { define as defineClient } from '../index.react-client'
import { define as defineServer } from '../index.react-server'
import { Link } from '../router'
import * as router from '../router'
import { I18nProvider as BaseProvider } from '@i18n-tiny/react/internal'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/')
}))

const enMessages = { common: { title: 'Hello' } }
const jaMessages = { common: { title: 'こんにちは' } }
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

// Pathnames of each kind, valid and not, for comparing with the core
const pathnames = ['/', '/about', '/about/', '/en', '/en/', '/en/about', '/ja/about', '/english', 'about', '', '//evil.com', '/en//evil.com', '/about?x=1', '/about#top']

for (const [name, define] of [['client', defineClient], ['server', defineServer]] as const) {
  describe(`define (${name} version)`, () => {
    describe('config', () => {
      it('returns the locale settings', () => {
        const i18n = define({ ...config, messages })
        expect(i18n.locales).toEqual(['ja', 'en'])
        expect(i18n.defaultLocale).toBe('ja')
        expect(i18n.prefixDefault).toBe(false)
        expect(define({ ...config, prefixDefault: true, messages }).prefixDefault).toBe(true)
      })

      it('requires locales and defaultLocale', () => {
        expect(() => untyped(define)({ messages })).toThrow('[i18n] locales must be a non-empty array')
        expect(() => untyped(define)({ locales: ['ja', 'en'], messages })).toThrow('defaultLocale undefined is not one of locales')
      })

      it('throws when defaultLocale is not one of locales', () => {
        expect(() => untyped(define)({ locales: ['ja', 'en'], defaultLocale: 'fr', messages }))
          .toThrow('[i18n] defaultLocale "fr" is not one of locales ("ja", "en").')
      })

      it('throws when locales is empty, lists a locale twice or has an invalid locale', () => {
        expect(() => untyped(define)({ locales: [], defaultLocale: 'ja', messages: {} }))
          .toThrow('[i18n] locales must be a non-empty array')
        expect(() => untyped(define)({ locales: ['ja', 'en', 'ja'], defaultLocale: 'ja', messages }))
          .toThrow('[i18n] Locale "ja" is listed more than once in locales.')
        for (const locale of ['', '.', '..', 'en/us', 'en us']) {
          expect(() => untyped(define)({ locales: ['ja', locale], defaultLocale: 'ja', messages: { ja: jaMessages, [locale]: enMessages } }))
            .toThrow('cannot be used as a path segment')
        }
      })

      it('throws when messages is missing a locale or has one that is not in locales', () => {
        expect(() => untyped(define)({ ...config, messages: { ja: jaMessages } }))
          .toThrow('[i18n] messages is missing locales: "en".')
        expect(() => untyped(define)({ ...config, messages: { ...messages, fr: enMessages } }))
          .toThrow('[i18n] messages has locales that are not in locales: "fr".')
      })
    })

    describe('locales', () => {
      const i18n = define({ ...config, messages })

      it('isLocale() is true for a locale of the config only', () => {
        expect(i18n.isLocale('ja')).toBe(true)
        expect(i18n.isLocale('en')).toBe(true)
        for (const value of ['fr', 'EN', '', 'favicon.ico', undefined, null, 1, ['en']]) {
          expect(i18n.isLocale(value)).toBe(false)
        }
      })

      it('getMessages() and getTranslations() take a locale of the config', async () => {
        expect((await i18n.server.getMessages('en')).common.title).toBe('Hello')
        expect((await i18n.server.getTranslations('ja'))('common.title')).toBe('こんにちは')
        for (const locale of ['fr', 'favicon.ico', '', undefined]) {
          const error = `[i18n] Unknown locale ${JSON.stringify(locale)}. Expected one of "ja", "en".`
          await expect(untyped(i18n.server.getMessages)(locale)).rejects.toThrow(error)
          await expect(untyped(i18n.server.getTranslations)(locale)).rejects.toThrow(error)
        }
      })

      it('the Provider throws for a locale that is not one of locales', () => {
        const Provider = untyped(i18n.Provider)
        for (const locale of ['fr', '', undefined]) {
          expect(() => Provider({ locale, messages: enMessages, children: null }))
            .toThrow(`[i18n] Unknown locale ${JSON.stringify(locale)}. Expected one of "ja", "en".`)
        }
      })
    })

    describe('URL functions', () => {
      for (const prefixDefault of [false, true]) {
        it(`return what the core functions return with the same config (prefixDefault: ${prefixDefault})`, () => {
          const i18n = define({ ...config, prefixDefault, messages })
          const settings = { ...config, prefixDefault }
          for (const pathname of pathnames) {
            for (const locale of ['ja', 'en', 'fr']) {
              expect(outcome(() => untyped(i18n.localizedPath)(pathname, locale)))
                .toEqual(outcome(() => untyped(core.localizedPath)(pathname, locale, settings)))
              expect(outcome(() => untyped(i18n.alternatePath)(pathname, locale)))
                .toEqual(outcome(() => untyped(core.alternatePath)(pathname, locale, settings)))
            }
            expect(outcome(() => i18n.removeLocalePrefix(pathname)))
              .toEqual(outcome(() => core.removeLocalePrefix(pathname, settings)))
            expect(outcome(() => i18n.pathLocale(pathname)))
              .toEqual(outcome(() => core.pathLocale(pathname, settings)))
          }
        })
      }

      it('give the paths of the config', () => {
        const i18n = define({ ...config, messages })
        expect(i18n.localizedPath('/about', 'en')).toBe('/en/about')
        expect(i18n.localizedPath('/about', 'ja')).toBe('/about')
        expect(i18n.alternatePath('/en/about', 'ja')).toBe('/about')
        expect(i18n.removeLocalePrefix('/en')).toBe('/')
        expect(i18n.pathLocale('/en/about')).toBe('en')
        expect(i18n.pathLocale('/about')).toBe(undefined)
        const prefixed = define({ ...config, prefixDefault: true, messages })
        expect(prefixed.localizedPath('/about', 'ja')).toBe('/ja/about')
        expect(prefixed.alternatePath('/en/about', 'ja')).toBe('/ja/about')
      })
    })
  })
}

describe('@i18n-tiny/next/router', () => {
  it('has the URL functions of the core', () => {
    expect(router.localizedPath).toBe(core.localizedPath)
    expect(router.alternatePath).toBe(core.alternatePath)
    expect(router.removeLocalePrefix).toBe(core.removeLocalePrefix)
    expect(router.pathLocale).toBe(core.pathLocale)
    expect(router.localizedPath('/about', 'en', config)).toBe('/en/about')
  })
})

describe('client.usePaths()', () => {
  for (const prefixDefault of [false, true]) {
    it(`returns the URL functions with the config of the Provider (prefixDefault: ${prefixDefault})`, () => {
      const i18n = defineClient({ ...config, prefixDefault, messages })
      const settings = { ...config, prefixDefault }
      let paths: ReturnType<typeof i18n.client.usePaths> | undefined
      function Read () {
        paths = i18n.client.usePaths()
        return null
      }
      render(<i18n.Provider locale="en" messages={enMessages}><Read /></i18n.Provider>)
      if (paths === undefined) throw new Error('not rendered')
      const result = paths
      for (const pathname of pathnames) {
        for (const locale of ['ja', 'en', 'fr']) {
          expect(outcome(() => untyped(result.localizedPath)(pathname, locale)))
            .toEqual(outcome(() => untyped(core.localizedPath)(pathname, locale, settings)))
          expect(outcome(() => untyped(result.alternatePath)(pathname, locale)))
            .toEqual(outcome(() => untyped(core.alternatePath)(pathname, locale, settings)))
        }
        expect(outcome(() => result.removeLocalePrefix(pathname)))
          .toEqual(outcome(() => core.removeLocalePrefix(pathname, settings)))
        expect(outcome(() => result.pathLocale(pathname)))
          .toEqual(outcome(() => core.pathLocale(pathname, settings)))
      }
    })
  }

  // A Provider with other locale settings than define(), such as one from
  // another define() or the Provider of @i18n-tiny/react/internal: the
  // settings of the Provider are the ones that count
  for (const [defined, provided] of [[false, true], [true, false]]) {
    it(`reads prefixDefault from the Provider, not from define() (define: ${defined}, Provider: ${provided})`, () => {
      const i18n = defineClient({ ...config, prefixDefault: defined, messages })
      let paths: ReturnType<typeof i18n.client.usePaths> | undefined
      function Read () {
        paths = i18n.client.usePaths()
        return null
      }
      render(
        <BaseProvider locale="en" messages={enMessages} locales={config.locales} defaultLocale="ja" prefixDefault={provided}>
          <Read />
        </BaseProvider>
      )
      if (paths === undefined) throw new Error('not rendered')
      expect(paths.localizedPath('/about', 'ja')).toBe(provided ? '/ja/about' : '/about')
      expect(paths.alternatePath('/en/about', 'ja')).toBe(provided ? '/ja/about' : '/about')
      expect(paths.localizedPath('/about', 'en')).toBe('/en/about')
    })
  }

  it('reads the locales and the default locale from the Provider', () => {
    const i18n = defineClient({ ...config, messages })
    let paths: ReturnType<typeof i18n.client.usePaths> | undefined
    function Read () {
      paths = i18n.client.usePaths()
      return null
    }
    render(
      <BaseProvider locale="en" messages={enMessages} locales={['en', 'fr']} defaultLocale="en">
        <Read />
      </BaseProvider>
    )
    if (paths === undefined) throw new Error('not rendered')
    expect(untyped(paths.localizedPath)('/about', 'fr')).toBe('/fr/about')
    expect(paths.localizedPath('/about', 'en')).toBe('/about')
    expect(() => paths?.localizedPath('/about', 'ja')).toThrow('[i18n] Unknown locale "ja"')
  })

  it('needs the Provider', () => {
    const i18n = defineClient({ ...config, messages })
    function Read () {
      i18n.client.usePaths()
      return null
    }
    expect(() => render(<Read />)).toThrow('must be used within i18n Provider')
  })

  it('throws in Server Components', () => {
    const i18n = defineServer({ ...config, messages })
    expect(() => i18n.client.usePaths()).toThrow('usePaths is not available in Server Components')
  })
})

describe('Link with the config of the Provider', () => {
  async function renderLink (current: string, element: React.ReactElement, options: { prefixDefault?: boolean, locale?: 'ja' | 'en' } = {}) {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue(current)
    const i18n = defineClient({ ...config, prefixDefault: options.prefixDefault ?? false, messages })
    render(<i18n.Provider locale={options.locale ?? 'en'} messages={enMessages}>{element}</i18n.Provider>)
  }
  const href = (text: string) => screen.getByText(text).closest('a')?.getAttribute('href')

  it('gives the default locale no prefix', async () => {
    await renderLink('/en/about', <><Link href="/about" locale="ja">ja</Link><Link href="/about" locale="en">en</Link></>)
    expect(href('ja')).toBe('/about')
    expect(href('en')).toBe('/en/about')
  })

  it('gives the default locale its prefix with prefixDefault', async () => {
    await renderLink('/en/about', <Link href="/about" locale="ja">ja</Link>, { prefixDefault: true })
    expect(href('ja')).toBe('/ja/about')
  })

  it('switches the locale of the current page with normalize', async () => {
    await renderLink('/en/about', <><Link href="/en/about" locale="ja" normalize>ja</Link><Link href="/about" locale="en" normalize>en</Link></>)
    expect(href('ja')).toBe('/about')
    expect(href('en')).toBe('/en/about')
  })

  it('keeps the query and the hash', async () => {
    await renderLink('/en', <Link href="/about?tab=1#team" locale="ja">ja</Link>)
    expect(href('ja')).toBe('/about?tab=1#team')
  })

  it('leaves the path without a locale with locale={false}', async () => {
    await renderLink('/en/page', <Link href="/about" locale={false}>raw</Link>)
    expect(href('raw')).toBe('/about')
  })

  it('throws for locale="" and for a locale that is not one of locales', async () => {
    // locale="" is a type error too: written here as JavaScript would pass it
    const UntypedLink = untyped(Link)
    await expect(renderLink('/en', <UntypedLink href="/about" locale="">empty</UntypedLink>))
      .rejects.toThrow('[i18n] Unknown locale "". Expected one of "ja", "en".')
    await expect(renderLink('/en', <Link href="/about" locale="fr">fr</Link>))
      .rejects.toThrow('[i18n] Unknown locale "fr". Expected one of "ja", "en".')
  })
})
