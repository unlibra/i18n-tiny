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
 * Configuration for define() function
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
