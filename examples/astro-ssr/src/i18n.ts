import { define } from '@i18n-tiny/astro'
import { getLocalizedPath } from '@i18n-tiny/astro/router'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export type Locale = 'en' | 'ja'
export const locales: Locale[] = ['en', 'ja']
export const defaultLocale: Locale = 'en'
export const messages = {
  en: enMessages,
  ja: jaMessages
}

export const {
  getMessages,
  getTranslations
} = define({
  locales,
  defaultLocale,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export { getLocalizedPath }
