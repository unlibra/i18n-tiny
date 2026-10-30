/**
 * Detects the best matching locale from Accept-Language header.
 *
 * Parses the Accept-Language header (e.g., "ja,en-US;q=0.9,en;q=0.8")
 * and returns the highest priority locale that matches the supported locales.
 * First tries exact match (en-US), then falls back to language code (en).
 * Languages marked as not acceptable with q=0 are never returned.
 *
 * @param acceptLanguage - The Accept-Language header value from the request
 * @param supportedLocales - Array of locale codes supported by the application
 * @returns The best matching locale, or null if no match is found
 *
 * @example
 * ```typescript
 * // Accept-Language: "fr,ja;q=0.8,en;q=0.6"
 * // supportedLocales: ['ja', 'en']
 * detectLocale(acceptLanguage, supportedLocales) // Returns: 'ja'
 *
 * // Accept-Language: "en-US"
 * // supportedLocales: ['en-US', 'en-GB']
 * detectLocale(acceptLanguage, supportedLocales) // Returns: 'en-US'
 *
 * // Accept-Language: "en-AU"
 * // supportedLocales: ['en', 'ja']
 * detectLocale(acceptLanguage, supportedLocales) // Returns: 'en' (fallback)
 *
 * // Accept-Language: "fr,de;q=0.9"
 * // supportedLocales: ['ja', 'en']
 * detectLocale(acceptLanguage, supportedLocales) // Returns: null
 * ```
 */
export function detectLocale(
  acceptLanguage: string | null,
  supportedLocales: readonly string[]
): string | null {
  if (!acceptLanguage) return null

  // Parse each tag and its quality. A quality of 0 means "not acceptable":
  // such tags are never chosen, not even through the language code of
  // another tag (en-US does not reach en when en;q=0 is given). Tags whose
  // quality is not a number from 0 to 1 are ignored.
  const accepted: { locale: string, quality: number }[] = []
  const refused = new Set<string>()
  for (const entry of acceptLanguage.split(',')) {
    const [tag, ...params] = entry.split(';')
    const locale = tag.trim().toLowerCase()
    if (!locale) continue

    let quality = 1
    for (const param of params) {
      const match = /^\s*q\s*=\s*(.*?)\s*$/i.exec(param)
      if (match) quality = /^\d+(?:\.\d*)?$/.test(match[1]) ? Number(match[1]) : NaN
    }
    if (!(quality >= 0 && quality <= 1)) continue

    if (quality === 0) {
      refused.add(locale)
    } else {
      accepted.push({ locale, quality })
    }
  }
  // Higher quality first; the sort is stable, so equal qualities keep their order
  accepted.sort((a, b) => b.quality - a.quality)

  // Build lookup map for O(1) search (case-insensitive)
  const localeMap = new Map<string, string>()
  for (const locale of supportedLocales) {
    if (!refused.has(locale.toLowerCase())) {
      localeMap.set(locale.toLowerCase(), locale)
    }
  }

  // Find first matching locale
  for (const { locale: lowerLocale } of accepted) {
    // 1. Try exact match first (e.g., en-US matches en-US)
    const exactMatch = localeMap.get(lowerLocale)
    if (exactMatch) {
      return exactMatch
    }

    // 2. Fall back to language code (e.g., en-US falls back to en)
    const langCode = lowerLocale.split('-')[0]
    const langMatch = localeMap.get(langCode)
    if (langMatch) {
      return langMatch
    }
  }

  return null
}
