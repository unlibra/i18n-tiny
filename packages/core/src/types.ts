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

// The characters of a variable name: letters, digits and "_", as \w in the
// grammar of resolveMessage() (../utils)
type NameChar =
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '_'

type IsName<S extends string> = S extends `${NameChar}${infer Rest}`
  ? Rest extends '' ? true : IsName<Rest>
  : false

/**
 * The variable names in a message, with the grammar of resolveMessage():
 * read from left to right, "{{" is "{", "}}" is "}", and "{name}", with a
 * name of letters, digits and "_", is a variable
 * Example: VariableNames<'{{count}} is {count}'> -> 'count'
 */
export type VariableNames<S extends string, Found extends string = never> =
  S extends `${string}{${infer Rest}`
    ? Rest extends `{${infer After}`
      ? VariableNames<After, Found>
      : Rest extends `${infer Name}}${infer After}`
        ? IsName<Name> extends true
          ? VariableNames<After, Found | Name>
          : VariableNames<Rest, Found>
        : Found
    : Found

// The variable names of each message of T, in the shape of T: `string` for a
// message typed as string, whose names are not known
type NamesTree<T> = {
  [K in keyof T]: T[K] extends string
    ? string extends T[K] ? string : VariableNames<T[K]>
    : NamesTree<T[K]>
}

// The vars for the variable names of a message, or of a union of messages
type VarsOf<Names> = [Names] extends [string]
  ? string extends Names
    ? [vars?: Record<string, string | number>]
    : [Names] extends [never]
        ? []
        : [vars: { [Name in Names]: string | number }]
  // A key that points to a nested object
  : [vars?: Record<string, string | number>]

/**
 * The vars of a translation function for a message of type V. A message with
 * a literal type, from `as const`, takes exactly its variables: none, or an
 * object with each of them. A message typed as `string` takes any vars. For
 * a union of messages, such as from a union of keys, the vars are those of
 * all of them.
 */
export type TranslationVars<V> = VarsOf<V extends string ? string extends V ? string : VariableNames<V> : V>

type Scope<T, N extends string | undefined> = N extends string ? ValueAt<T, N> : T

/**
 * The translation function for the messages T, relative to the namespace N
 * when one is given, with the vars of each key typed from its message, as
 * TranslationVars describes
 */
// The names are looked up in NamesTree rather than computed from the message
// of the key: TypeScript resolves the vars for every key of the constraint
// too, and a union of the messages of thousands of keys is slow to build.
export type Translate<T, N extends string | undefined = undefined> =
  <K extends TranslationKeys<T, N>>(key: K, ...vars: VarsOf<ValueAt<NamesTree<Scope<T, N>>, K>>) => string

/**
 * The messages of a locale in the shape of T, the messages of the default
 * locale: the same keys, with strings as values. For the messages of the
 * other locales, whose strings differ from those of T when T is `as const`.
 *
 * @example
 * ```typescript
 * import type { LocaleMessages } from '@i18n-tiny/core'
 * import type ja from './ja'
 *
 * const en: LocaleMessages<typeof ja> = { common: { title: 'Hello' } }
 * ```
 */
export type LocaleMessages<T> = {
  [K in keyof T]: T[K] extends string ? string : LocaleMessages<T[K]>
}
