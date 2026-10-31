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

  // The browser bundle leaves the check out: an invalid config with literal
  // types is a type error instead (types.typecheck.tsx)
  it('does not check the config at run time', () => {
    expect(() => untyped(define)({ locales: ['en', 'ja'], defaultLocale: 'fr', messages })).not.toThrow()
    expect(() => untyped(define)({ locales: ['en', 'ja', 'en'], defaultLocale: 'en', messages })).not.toThrow()
    expect(() => untyped(define)({ ...config, messages: { en: enMessages } })).not.toThrow()
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
