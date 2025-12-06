import { define } from '@i18n-tiny/next'
import { Link } from '@i18n-tiny/next/router'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const messages = {
  en: enMessages,
  ja: jaMessages
}

const {
  client,
  server,
  Provider,
} = define({
  locales,
  defaultLocale,
  messages: {
    en: enMessages,
    ja: jaMessages
  }
})

export const { useMessages, useTranslations, useLocale } = client
export const { getMessages, getTranslations } = server
export { Link, Provider }
