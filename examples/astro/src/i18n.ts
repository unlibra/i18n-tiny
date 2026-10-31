import { define } from '@i18n-tiny/astro'
import { config } from './i18n.config'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const i18n = define({
  ...config,
  messages: {
    ja: jaMessages,
    en: enMessages
  }
})

export type Locale = (typeof i18n.locales)[number]
