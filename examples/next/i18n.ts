import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import { config } from './i18n.config'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const i18n = define({
  ...config,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export type Locale = (typeof i18n.locales)[number]

export const { client, server, Provider, isLocale, locales } = i18n
export const { useMessages, useTranslations, useLocale, usePaths } = client
export const { getMessages, getTranslations } = server
export { Link }
