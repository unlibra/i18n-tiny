/**
 * Resolves a nested key in a messages object.
 * Handles missing keys and object values gracefully.
 *
 * @param messages - The messages object to search
 * @param key - Dot-separated key path (e.g., "common.title")
 * @param namespace - Optional namespace prefix to prepend to the key
 * @param locale - Locale identifier for debug messages (used in development mode)
 * @returns The resolved message string, or the key itself if not found or if it points to an object
 *
 * @example
 * const messages = { common: { title: "Hello" } }
 * resolveMessage(messages, "title", "common") // "Hello"
 * resolveMessage(messages, "missing", "common") // "common.missing"
 * resolveMessage(messages, "common") // "common" (warns in dev mode)
 */
export function resolveMessage (
  messages: unknown,
  key: string,
  namespace?: string,
  locale?: string
): string {
  const fullKey = namespace ? `${String(namespace)}.${key}` : key
  const keys = fullKey.split('.')
  let obj: unknown = messages

  for (const k of keys) {
    if (obj && typeof obj === 'object' && k in obj) {
      obj = (obj as Record<string, unknown>)[k]
    } else {
      obj = undefined
      break
    }
  }

  if (obj === undefined) {
    if (process.env.NODE_ENV === 'development' && locale) {
      console.warn(`[i18n] Missing key: "${fullKey}" in locale "${locale}"`)
    }
    return fullKey
  }

  // Prevent returning "[object Object]" if the key points to a nested object
  if (typeof obj === 'object' && obj !== null) {
    if (process.env.NODE_ENV === 'development' && locale) {
      console.warn(`[i18n] Key "${fullKey}" points to an object in locale "${locale}". Returning key instead.`)
    }
    return fullKey
  }

  return String(obj)
}
