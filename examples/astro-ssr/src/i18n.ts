import { define } from '@i18n-tiny/astro'
import { config } from './i18n.config'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const i18n = define({
  ...config,
  // In the rewrite mode, a URL without a locale prefix is the detected
  // locale, so the links for a locale always get its prefix: /en, /ja
  prefixDefault: true,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export type Locale = (typeof i18n.locales)[number]
