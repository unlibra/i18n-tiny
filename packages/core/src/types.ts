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
 * Configuration for i18n system
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface I18nConfig<L extends string, M extends Record<string, any>> {
  locales: readonly L[]
  defaultLocale: L
  messages: Record<L, M>
}
