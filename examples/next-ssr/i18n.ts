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

export const { client, server, Provider, isLocale } = i18n
export const { useMessages, useTranslations, useLocale } = client
export const { getMessages, getTranslations } = server
export { Link }

