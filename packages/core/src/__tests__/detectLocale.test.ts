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

  it('should detect the right locale among more than two locales', () => {
    const multiLocales = ['en', 'ja', 'zh', 'ko'] as const
    expect(detectLocale('zh-CN,zh;q=0.9,ja;q=0.8', multiLocales)).toBe('zh')
    expect(detectLocale('ko-KR,ko;q=0.9,en;q=0.8', multiLocales)).toBe('ko')
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

  describe('long headers', () => {
    // The header comes from the client: its length must not make the time
    // grow with the square of the length
    it('should read a long run of whitespace in a parameter in linear time', () => {
      const time = (length: number) => {
        const header = 'ja;q=0' + ' '.repeat(length) + 'x,en'
        const start = performance.now()
        detectLocale(header, supportedLocales)
        return performance.now() - start
      }
      // The best of a few runs, so that a slow moment of the machine does not count
      const best = (length: number) => Math.min(time(length), time(length), time(length))
      time(1000)
      const short = Math.max(best(4000), 1)
      const long = best(64000)
      expect(long).toBeLessThan(short * 64)
    })

    it('should still read q with whitespace around its value', () => {
      expect(detectLocale('ja;q=  0  ,en;q=0.5', supportedLocales)).toBe('en')
      expect(detectLocale('ja; Q = 0.9 ,en;q=0.5', supportedLocales)).toBe('ja')
    })
  })

  describe('Complex Accept-Language headers', () => {
    // Real-world Accept-Language header patterns, with the locales ja and en
    const locales = ['ja', 'en'] as const

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
      ['en-AU,en;q=0.9', 'en', 'Australian English matches en']
    ])(
      'detectLocale("%s") → %s (%s)',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (acceptLanguage, expectedLocale, _description) => {
        expect(detectLocale(acceptLanguage, locales)).toBe(expectedLocale)
      }
    )
  })
})

