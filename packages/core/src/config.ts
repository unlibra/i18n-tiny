/**
 * The locale settings shared by define(), the middleware and the URL functions
 *
 * @example
 * ```typescript
 * export const config = { locales: ['ja', 'en'], defaultLocale: 'ja' } as const
 * ```
 */
export interface I18nConfig<L extends string = string> {
  /** Supported locales. Each one is used as a path segment, such as /en */
  readonly locales: readonly L[]
  /** The locale of URLs without a locale prefix */
  readonly defaultLocale: L
  /**
   * Whether URLs of the default locale also carry the locale prefix
   * @default false
   */
  readonly prefixDefault?: boolean
}

/**
 * The settings checked by validateConfig(): the locale settings, plus the
 * fallback locale and the messages where a function takes them
 */
export interface ValidatableConfig {
  readonly locales: readonly string[]
  readonly defaultLocale: string
  readonly fallbackLocale?: string
  readonly messages?: Readonly<Record<string, unknown>>
}

// The common whitespace characters. The runtime check rejects every character
// that \s matches; the type check knows only these.
type Whitespace = ' ' | '\t' | '\n' | '\r' | '\f' | '\v' | '\u00a0' | '\u3000'

// A locale that cannot be a path segment of its own
type InvalidLocale<S extends string> = string extends S
  ? never
  : S extends '' | '.' | '..'
    ? S
    : S extends `${string}${'/' | '\\' | '?' | '#' | Whitespace}${string}`
      ? S
      : never

type FirstDuplicate<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? H extends R[number] ? H : FirstDuplicate<R>
  : never

type LocalesError<T extends readonly string[]> = T extends readonly []
  ? 'locales must not be empty'
  : [FirstDuplicate<T>] extends [never]
      ? [InvalidLocale<T[number]>] extends [never]
          ? never
          : `locale "${InvalidLocale<T[number]>}" cannot be used as a path segment`
      : `locale "${FirstDuplicate<T> & string}" is listed more than once`

// A fallbackLocale typed as string is left to the runtime check
type FallbackLocaleError<C> = C extends { readonly fallbackLocale: infer F extends string }
  ? C extends { readonly locales: readonly (infer L extends string)[] }
    ? string extends F
      ? never
      : F extends L ? never : `fallbackLocale "${F}" is not one of locales`
    : never
  : never

// Messages whose locales are typed as string are left to the runtime check
type MessagesError<C> = C extends { readonly messages: infer M }
  ? C extends { readonly locales: readonly (infer L extends string)[] }
    ? string extends L | keyof M
      ? never
      : [Exclude<L, keyof M>] extends [never]
          ? [Exclude<keyof M & string, L>] extends [never]
              ? never
              : `messages has locale "${Exclude<keyof M & string, L>}" that is not one of locales`
          : `messages is missing locale "${Exclude<L, keyof M>}"`
    : never
  : never

// The keys that the messages O of a locale miss or add, compared with the
// messages B of the default locale, one level at a time
type ShapeDiff<B, O, P extends string> = string extends keyof O
  // Messages typed with string keys are left alone
  ? never
  :
    | `is missing key "${P}${Exclude<keyof B & string, keyof O>}"`
    | `has key "${P}${Exclude<keyof O & string, keyof B>}" that the default locale does not have`
    | {
        [K in keyof B & keyof O & string]: B[K] extends string
          ? O[K] extends object ? `has an object at key "${P}${K}", where the default locale has a string` : never
          : B[K] extends object
            ? O[K] extends string ? `has a string at key "${P}${K}", where the default locale has an object` : ShapeDiff<B[K], O[K], `${P}${K}.`>
            : never
      }[keyof B & keyof O & string]

// Compared with each default locale, when defaultLocale is typed as a union
type ShapeErrorOf<L extends string, B, O> = B extends unknown ? `messages of locale "${L}" ${ShapeDiff<B, O, ''>}` : never

type ShapeError<C> = C extends { readonly messages: infer M, readonly defaultLocale: infer D extends string }
  ? string extends D
    ? never
    : { [L in keyof M & string]: ShapeErrorOf<L, M[D & keyof M], M[L]> }[keyof M & string]
  : never

type ConfigError<C extends ValidatableConfig> = [LocalesError<C['locales']>] extends [never]
  ? C['defaultLocale'] extends C['locales'][number]
    ? [FallbackLocaleError<C>] extends [never]
        ? [MessagesError<C>] extends [never]
            ? ShapeError<C>
            : MessagesError<C>
        : FallbackLocaleError<C>
    : `defaultLocale "${C['defaultLocale']}" is not one of locales`
  : LocalesError<C['locales']>

/**
 * Type-level check of a config whose locales are literal types (`as const` or
 * an inline object). Intersect it with the parameter type, as in
 * `config: C & ConfigCheck<C>`: a valid config is unchanged, an invalid one
 * fails with the reason in the error. Configs typed as plain `string[]`
 * cannot be checked here and are left to validateConfig() at runtime.
 *
 * With messages, the messages of each locale must have the keys of those of
 * the default locale, no more and no fewer. This is checked by type only.
 */
export type ConfigCheck<C extends ValidatableConfig> = [ConfigError<C>] extends [never]
  ? unknown
  : { 'invalid i18n config': ConfigError<C> }

// "\" is rejected too, as URLs with http(s) read it as "/"
const INVALID_LOCALE = /[/\\?#\s]/

function quote (values: readonly string[]): string {
  return values.map(value => JSON.stringify(value)).join(', ')
}

/**
 * Checks the locale settings and throws an Error describing the first problem:
 * - locales is empty, lists a locale twice, or has a locale that cannot be a
 *   path segment (empty, ".", "..", or containing "/", "\", "?", "#" or
 *   whitespace)
 * - defaultLocale or fallbackLocale is not one of locales
 * - messages is missing a locale of locales, or has one that is not in it
 */
export function validateConfig (config: ValidatableConfig): void {
  const { locales, defaultLocale, fallbackLocale, messages } = config

  if (!Array.isArray(locales) || locales.length === 0) {
    throw new Error('[i18n] locales must be a non-empty array of locales.')
  }

  const seen = new Set<string>()
  for (const locale of locales) {
    if (typeof locale !== 'string' || locale === '' || locale === '.' || locale === '..' || INVALID_LOCALE.test(locale)) {
      throw new Error(
        `[i18n] Locale ${JSON.stringify(locale)} cannot be used as a path segment. ` +
        'A locale must not be empty, "." or "..", and must not contain "/", "\\", "?", "#" or whitespace.'
      )
    }
    if (seen.has(locale)) {
      throw new Error(`[i18n] Locale ${JSON.stringify(locale)} is listed more than once in locales.`)
    }
    seen.add(locale)
  }

  if (!seen.has(defaultLocale)) {
    throw new Error(
      `[i18n] defaultLocale ${JSON.stringify(defaultLocale)} is not one of locales (${quote(locales)}).`
    )
  }

  if (fallbackLocale !== undefined && !seen.has(fallbackLocale)) {
    throw new Error(
      `[i18n] fallbackLocale ${JSON.stringify(fallbackLocale)} is not one of locales (${quote(locales)}).`
    )
  }

  if (messages !== undefined) {
    if (typeof messages !== 'object' || messages === null || Array.isArray(messages)) {
      throw new Error('[i18n] messages must be an object with the messages of each locale.')
    }
    const missing = locales.filter(locale => !Object.hasOwn(messages, locale))
    if (missing.length > 0) {
      throw new Error(`[i18n] messages is missing locales: ${quote(missing)}.`)
    }
    const extra = Object.keys(messages).filter(locale => !seen.has(locale))
    if (extra.length > 0) {
      throw new Error(`[i18n] messages has locales that are not in locales: ${quote(extra)}.`)
    }
  }
}
