import { create } from '@i18n-tiny/next/proxy'
import { locales, defaultLocale } from './i18n'

export const proxy = create({
  locales,
  defaultLocale
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
