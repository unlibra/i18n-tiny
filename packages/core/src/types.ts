/**
 * Recursively extract nested keys from an object type
 * Example: { common: { copy: 'Copy' } } -> 'common.copy'
 */
export type NestedKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends object
      ? `${Prefix}${K}` | NestedKeys<T[K], `${Prefix}${K}.`>
      : never
}[keyof T & string]

/**
 * Recursively extract the keys that point to nested objects, which can be
 * passed as a namespace
 * Example: { common: { copy: 'Copy' }, title: 'Title' } -> 'common'
 */
export type NamespaceKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends object
      ? `${Prefix}${K}` | NamespaceKeys<T[K], `${Prefix}${K}.`>
      : never
}[keyof T & string]

/**
 * The value at a dot-separated key path
 * Example: ValueAt<{ common: { copy: 'Copy' } }, 'common'> -> { copy: 'Copy' }
 */
export type ValueAt<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T ? ValueAt<T[K], Rest> : never
  : P extends keyof T ? T[P] : never

/**
 * Keys accepted by a translation function: relative to the namespace when one
 * is given, otherwise full key paths
 * Example: TranslationKeys<{ common: { copy: 'Copy' } }, 'common'> -> 'copy'
 */
export type TranslationKeys<T, N extends string | undefined = undefined> = N extends string
  ? NestedKeys<ValueAt<T, N>>
  : NestedKeys<T>

/**
 * Configuration for define() function
 *
 * @deprecated Use I18nConfig for the locale settings. This type is removed
 * before the 2.0.0 release.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DefineConfig<L extends string, M extends Record<string, any>> {
  // NOTE: `any` is required here for automatic type inference from user's messages object.
  // Using `unknown` would break type inference as it doesn't allow indexing.
  // This is a safe use of `any` because:
  // 1. It's only used as a constraint for generic type parameter M
  // 2. The actual type is inferred from the messages object passed by users
  // 3. TypeScript automatically narrows M to the exact structure of user's messages
  locales: readonly L[]
  defaultLocale: L
  messages: Record<L, M>
}
