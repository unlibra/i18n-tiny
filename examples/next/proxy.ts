import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from './i18n.config'

// A URL without a locale prefix is English, the default locale
export const proxy = create({ ...i18nConfig })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
