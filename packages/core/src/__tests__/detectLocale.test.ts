import { describe, expect, it } from 'vitest'
import { detectLocale } from '../detectLocale'

describe('detectLocale()', () => {
  const supportedLocales = ['ja', 'en', 'fr'] as const

  it('should return the highest priority matching locale', () => {
    const result = detectLocale('ja,en-US;q=0.9,en;q=0.8', supportedLocales)
    expect(result).toBe('ja')
  })

  it('should return the first matching locale when quality is specified', () => {
    const result = detectLocale('fr;q=0.9,ja;q=0.8,en;q=0.7', supportedLocales)
    expect(result).toBe('fr')
  })

  it('should fall back to language code when exact match not found (en-US → en)', () => {
    const result = detectLocale('en-US,ja;q=0.8', supportedLocales)
    expect(result).toBe('en')
  })

  it('should prefer exact match over language code fallback', () => {
    const localesWithRegion = ['en-US', 'en-GB', 'ja'] as const
    const result = detectLocale('en-GB,en-US;q=0.8', localesWithRegion)
    expect(result).toBe('en-GB')
  })

  it('should return exact match when available', () => {
    const localesWithRegion = ['en-US', 'en-GB', 'en'] as const
    const result = detectLocale('en-US', localesWithRegion)
    expect(result).toBe('en-US')
  })

  it('should skip unsupported locales and return next match', () => {
    const result = detectLocale('de,zh;q=0.9,ja;q=0.8', supportedLocales)
    expect(result).toBe('ja')
  })

  it('should return null when no locales match', () => {
    const result = detectLocale('de,zh;q=0.9,ko;q=0.8', supportedLocales)
    expect(result).toBe(null)
  })

  it('should return null when acceptLanguage is null', () => {
    const result = detectLocale(null, supportedLocales)
    expect(result).toBe(null)
  })

  it('should return null when acceptLanguage is empty string', () => {
    const result = detectLocale('', supportedLocales)
    expect(result).toBe(null)
  })

  it('should handle single locale without quality', () => {
    const result = detectLocale('fr', supportedLocales)
    expect(result).toBe('fr')
  })

  it('should handle mixed case locale codes', () => {
    const result = detectLocale('EN-us,JA;q=0.8', supportedLocales)
    expect(result).toBe('en')
  })

  it('should respect quality ordering', () => {
    const result = detectLocale('en;q=0.5,ja;q=0.9,fr;q=0.3', supportedLocales)
    expect(result).toBe('ja')
  })

  it('should handle complex Accept-Language header', () => {
    const result = detectLocale(
      'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6',
      supportedLocales
    )
    expect(result).toBe('en')
  })

  describe('q=0 (not acceptable)', () => {
    it('should not return a locale whose quality is 0', () => {
      expect(detectLocale('ja;q=0', supportedLocales)).toBe(null)
    })

    it('should skip a locale whose quality is 0 and return the next match', () => {
      expect(detectLocale('ja;q=0,en;q=0.5', supportedLocales)).toBe('en')
    })

    it('should treat q=0.0 and q=0.000 as 0', () => {
      expect(detectLocale('ja;q=0.0,en;q=0.1', supportedLocales)).toBe('en')
      expect(detectLocale('ja;q=0.000,en;q=0.1', supportedLocales)).toBe('en')
    })

    it('should not reach a refused locale through the language code of another tag', () => {
      // en-US is acceptable, but en itself is refused
      expect(detectLocale('en-US,en;q=0', supportedLocales)).toBe(null)
      expect(detectLocale('en-US,en;q=0,ja;q=0.5', supportedLocales)).toBe('ja')
    })

    it('should read q with whitespace around the separators', () => {
      expect(detectLocale('ja ; q=0, en', supportedLocales)).toBe('en')
      expect(detectLocale('en; q=0.5, ja; q=0.9', supportedLocales)).toBe('ja')
    })

    it('should skip a tag whose quality is not a number from 0 to 1', () => {
      expect(detectLocale('ja;q=abc,en;q=0.5', supportedLocales)).toBe('en')
      expect(detectLocale('ja;q=2,en;q=0.5', supportedLocales)).toBe('en')
    })
  })
})
