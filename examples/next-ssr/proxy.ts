import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from './i18n.config'

// The rewrite mode: /ja/about is served by app/about/page.tsx with the
// locale 'ja' in the x-locale request header. A URL without a locale prefix
// gets the locale detected from Accept-Language.
export const proxy = create({ ...i18nConfig, routing: 'rewrite' })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
