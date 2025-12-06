/**
 * Detects the best matching locale from Accept-Language header.
 *
 * Parses the Accept-Language header (e.g., "ja,en-US;q=0.9,en;q=0.8")
 * and returns the highest priority locale that matches the supported locales.
 * First tries exact match (en-US), then falls back to language code (en).
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

  // Parse and sort by quality (priority)
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q] = lang.trim().split(';q=')
      const quality = q ? parseFloat(q) : 1.0
      return { locale: locale.trim(), quality }
    })
    .sort((a, b) => b.quality - a.quality) // Higher quality first

  // Build lookup map for O(1) search (case-insensitive)
  const localeMap = new Map<string, string>()
  for (const locale of supportedLocales) {
    localeMap.set(locale.toLowerCase(), locale)
  }

  // Find first matching locale
  for (const { locale } of languages) {
    const lowerLocale = locale.toLowerCase()

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
