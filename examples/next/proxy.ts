import { create } from '@i18n-tiny/next/proxy'
import { config as i18nConfig } from './i18n.config'

// No language detection: the language buttons link to English, the default
// locale, without a prefix, and detection would redirect that link back for
// a browser that prefers Japanese
export const proxy = create({ ...i18nConfig, detectLanguage: false })

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
