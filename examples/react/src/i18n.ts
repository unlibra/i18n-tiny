import { define } from '@i18n-tiny/react'
import enMessages from './messages/en'
import jaMessages from './messages/ja'

export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const messages = {
  en: enMessages,
  ja: jaMessages
}

export const { Provider, useLocale, useMessages, useTranslations } = define({
  locales,
  defaultLocale,
  messages
})
