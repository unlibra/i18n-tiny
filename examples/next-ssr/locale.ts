import { headers } from 'next/headers'
import { i18n } from './i18n'

// The locale of the request, which the proxy passes in the x-locale header.
// For Server Components only: Client Components read it with useLocale().
export async function getLocale () {
  const locale = (await headers()).get('x-locale')
  return i18n.isLocale(locale) ? locale : i18n.defaultLocale
}
