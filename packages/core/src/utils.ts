// The grammar of messages, which the type of the variables (VariableNames in
// ./types) follows too: "{{" is "{", "}}" is "}", and "{name}", with a name of
// letters, digits and "_", is a variable. Read from left to right, so "{{name}}"
// is the text "{name}".
const TOKENS = /\{\{|\}\}|\{(\w+)\}/g

/**
 * Interpolates variables into a string.
 * Replaces {key} placeholders with the own properties of the vars object, and
 * "{{" and "}}" with "{" and "}". A name the vars do not have stays as {key}.
 *
 * @param str - The string containing {key} placeholders
 * @param vars - Object with key-value pairs to interpolate
 * @returns The interpolated string
 *
 * @example
 * interpolate("Hello, {name}!", { name: "John" }) // "Hello, John!"
 * interpolate("Missing {key}", {}) // "Missing {key}"
 * interpolate("{{name}} is {name}", { name: "John" }) // "{name} is John"
 */
function interpolate (str: string, vars?: Record<string, string | number>): string {
  return str.replace(TOKENS, (match, key: string | undefined) => {
    if (key === undefined) {
      // "{{" or "}}"
      return match[0]
    }
    // Only the own properties: "{constructor}" is not Object.prototype.constructor
    const value = vars && Object.hasOwn(vars, key) ? vars[key] : undefined
    return value !== undefined ? String(value) : match
  })
}

/**
 * Resolves a nested key in a messages object.
 * Handles missing keys and object values gracefully.
 * Supports variable interpolation with {key} syntax, and "{{" and "}}" for
 * "{" and "}".
 *
 * @param messages - The messages object to search
 * @param key - Dot-separated key path (e.g., "common.title")
 * @param namespace - Optional namespace prefix to prepend to the key
 * @param locale - Locale identifier for debug messages (used in development mode)
 * @param vars - Optional variables for interpolation
 * @returns The resolved message string, or the key itself if not found or if it points to an object
 *
 * @example
 * const messages = { common: { title: "Hello" } }
 * resolveMessage(messages, "title", "common") // "Hello"
 * resolveMessage(messages, "missing", "common") // "common.missing"
 * resolveMessage(messages, "common") // "common" (warns in dev mode)
 * resolveMessage(messages, "greeting", "common", "en", { name: "John" }) // "Hello, John!"
 */
export function resolveMessage (
  messages: unknown,
  key: string,
  namespace?: string,
  locale?: string,
  vars?: Record<string, string | number>
): string {
  let obj: unknown = messages

  // Helper to traverse path segments
  const traverse = (path: string) => {
    const keys = path.split('.')
    for (const k of keys) {
      if (obj && typeof obj === 'object' && Object.hasOwn(obj, k)) {
        obj = (obj as Record<string, unknown>)[k]
      } else {
        obj = undefined
        break
      }
    }
  }

  // Traverse namespace first if present
  if (namespace) {
    traverse(namespace)
  }

  // Traverse key if we haven't failed yet
  if (obj !== undefined) {
    traverse(key)
  }

  // A string, or another value that is not an object
  if (obj !== undefined && (typeof obj !== 'object' || obj === null)) {
    return interpolate(String(obj), vars)
  }

  // A missing key, or a key that points to a nested object, which would be
  // "[object Object]": the key instead
  const fullKey = namespace ? `${namespace}.${key}` : key
  // Many bundlers, such as Vite, webpack and esbuild, replace
  // process.env.NODE_ENV with a string at build time, and Vite does it in
  // development too, so the expression is kept as it is in the condition:
  // then the warning is dropped from production bundles. A guard such as
  // `typeof process` would hide the warning in the browser, which has no
  // process even where the expression is replaced. Where nothing replaces it
  // and there is no process, as in some edge runtimes, reading it throws:
  // that is not development.
  try {
    // eslint-disable-next-line no-restricted-globals -- replaced at build time, or caught, see above
    if (process.env.NODE_ENV === 'development' && locale) {
      console.warn(
        obj === undefined
          ? `[i18n] Missing key: "${fullKey}" in locale "${locale}"`
          : `[i18n] Key "${fullKey}" points to an object in locale "${locale}". Returning key instead.`
      )
    }
  } catch {
    // Not development
  }
  return fullKey
}
