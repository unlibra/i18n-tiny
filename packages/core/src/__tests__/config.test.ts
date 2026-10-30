import { describe, expect, it } from 'vitest'
import { validateConfig } from '../config'

describe('validateConfig()', () => {
  it('should accept a valid config', () => {
    expect(() => validateConfig({ locales: ['ja', 'en'], defaultLocale: 'ja' })).not.toThrow()
    expect(() => validateConfig({ locales: ['en'], defaultLocale: 'en' })).not.toThrow()
    expect(() => validateConfig({ locales: ['zh-hans', 'pt_BR', 'en-US'], defaultLocale: 'en-US' })).not.toThrow()
  })

  it('should throw when defaultLocale is not one of locales', () => {
    expect(() => validateConfig({ locales: ['ja', 'en'], defaultLocale: 'fr' }))
      .toThrow('defaultLocale "fr" is not one of locales ("ja", "en")')
  })

  it('should throw when locales is empty', () => {
    expect(() => validateConfig({ locales: [], defaultLocale: 'ja' })).toThrow('locales must be a non-empty array')
  })

  it('should throw when locales is not an array', () => {
    expect(() => validateConfig({ locales: 'ja' as unknown as string[], defaultLocale: 'ja' }))
      .toThrow('locales must be a non-empty array')
  })

  it('should throw when a locale is listed more than once', () => {
    expect(() => validateConfig({ locales: ['ja', 'en', 'ja'], defaultLocale: 'ja' }))
      .toThrow('Locale "ja" is listed more than once')
  })

  it.each([
    [''],
    ['.'],
    ['..'],
    ['/'],
    ['en/us'],
    ['en?'],
    ['en#x'],
    [' en'],
    ['en US'],
    ['en\t'],
    ['en\n'],
    ['en　']
  ])('should throw for the locale %j, which cannot be a path segment', (locale) => {
    expect(() => validateConfig({ locales: ['ja', locale], defaultLocale: 'ja' }))
      .toThrow(`Locale ${JSON.stringify(locale)} cannot be used as a path segment`)
  })

  it('should throw for a locale that is not a string', () => {
    expect(() => validateConfig({ locales: ['ja', 1 as unknown as string], defaultLocale: 'ja' }))
      .toThrow('Locale 1 cannot be used as a path segment')
  })

  it('should accept a fallbackLocale that is one of locales', () => {
    expect(() => validateConfig({ locales: ['ja', 'en'], defaultLocale: 'ja', fallbackLocale: 'en' })).not.toThrow()
  })

  it('should throw when fallbackLocale is not one of locales', () => {
    expect(() => validateConfig({ locales: ['ja', 'en'], defaultLocale: 'ja', fallbackLocale: 'fr' }))
      .toThrow('fallbackLocale "fr" is not one of locales ("ja", "en")')
  })

  it('should throw when fallbackLocale is an empty string', () => {
    expect(() => validateConfig({ locales: ['ja', 'en'], defaultLocale: 'ja', fallbackLocale: '' }))
      .toThrow('fallbackLocale "" is not one of locales')
  })

  it('should accept messages with exactly the locales', () => {
    expect(() => validateConfig({
      locales: ['ja', 'en'],
      defaultLocale: 'ja',
      messages: { en: {}, ja: {} }
    })).not.toThrow()
  })

  it('should throw when messages is missing a locale', () => {
    expect(() => validateConfig({ locales: ['ja', 'en'], defaultLocale: 'ja', messages: { ja: {} } }))
      .toThrow('messages is missing locales: "en"')
  })

  it('should throw when messages has a locale that is not in locales', () => {
    expect(() => validateConfig({ locales: ['ja'], defaultLocale: 'ja', messages: { ja: {}, en: {} } }))
      .toThrow('messages has locales that are not in locales: "en"')
  })

  it('should not count inherited properties of messages as locales', () => {
    const messages = Object.create({ en: {} }) as Record<string, unknown>
    messages.ja = {}
    expect(() => validateConfig({ locales: ['ja', 'en'], defaultLocale: 'ja', messages }))
      .toThrow('messages is missing locales: "en"')
  })
})
