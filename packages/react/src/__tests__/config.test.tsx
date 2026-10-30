import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { define } from '../index'

const enMessages = { common: { title: 'Hello' } }
const jaMessages = { common: { title: 'こんにちは' } }
const messages = { en: enMessages, ja: jaMessages }
const config = { locales: ['en', 'ja'], defaultLocale: 'en' } as const

// Calls a function from JavaScript, without the type checks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const untyped = (fn: unknown) => fn as (...args: any[]) => any

describe('define config', () => {
  it('returns the locale settings', () => {
    const i18n = define({ ...config, messages })
    expect(i18n.locales).toEqual(['en', 'ja'])
    expect(i18n.defaultLocale).toBe('en')
  })

  it('requires locales and defaultLocale', () => {
    expect(() => untyped(define)({ messages })).toThrow('[i18n] locales must be a non-empty array')
    expect(() => untyped(define)({ locales: ['en', 'ja'], messages })).toThrow('defaultLocale undefined is not one of locales')
  })

  it('throws when defaultLocale is not one of locales', () => {
    expect(() => untyped(define)({ locales: ['en', 'ja'], defaultLocale: 'fr', messages }))
      .toThrow('[i18n] defaultLocale "fr" is not one of locales ("en", "ja").')
  })

  it('throws when locales is empty, lists a locale twice or has an invalid locale', () => {
    expect(() => untyped(define)({ locales: [], defaultLocale: 'en', messages: {} }))
      .toThrow('[i18n] locales must be a non-empty array')
    expect(() => untyped(define)({ locales: ['en', 'ja', 'en'], defaultLocale: 'en', messages }))
      .toThrow('[i18n] Locale "en" is listed more than once in locales.')
    for (const locale of ['', '.', '..', 'en/us', 'en us']) {
      expect(() => untyped(define)({ locales: ['en', locale], defaultLocale: 'en', messages: { en: enMessages, [locale]: jaMessages } }))
        .toThrow('cannot be used as a path segment')
    }
  })

  it('throws when messages is missing a locale or has one that is not in locales', () => {
    expect(() => untyped(define)({ ...config, messages: { en: enMessages } }))
      .toThrow('[i18n] messages is missing locales: "ja".')
    expect(() => untyped(define)({ ...config, messages: { ...messages, fr: enMessages } }))
      .toThrow('[i18n] messages has locales that are not in locales: "fr".')
  })
})

describe('isLocale', () => {
  const i18n = define({ ...config, messages })

  it('is true for a locale of the config only', () => {
    expect(i18n.isLocale('en')).toBe(true)
    expect(i18n.isLocale('ja')).toBe(true)
    for (const value of ['fr', 'EN', '', undefined, null, 1, ['en']]) {
      expect(i18n.isLocale(value)).toBe(false)
    }
  })
})

describe('Provider', () => {
  const i18n = define({ ...config, messages })

  function Locale () {
    return <p>{i18n.useLocale()}</p>
  }

  it('provides the locale', () => {
    render(<i18n.Provider locale="ja" messages={jaMessages}><Locale /></i18n.Provider>)
    expect(screen.getByText('ja')).toBeInTheDocument()
  })

  it('throws for a locale that is not one of locales', () => {
    const UntypedProvider = untyped(i18n.Provider)
    for (const locale of ['fr', '', undefined]) {
      expect(() => render(<UntypedProvider locale={locale} messages={enMessages}><Locale /></UntypedProvider>))
        .toThrow(`[i18n] Unknown locale ${JSON.stringify(locale)}. Expected one of "en", "ja".`)
    }
  })
})
