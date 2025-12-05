'use client'

import NextLink from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { resolveMessage } from '@i18n-tiny/core'

interface I18nContextValue {
  locale: string
  messages: Record<string, unknown>
  defaultLocale: string
  locales: readonly string[]
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function useI18n () {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('i18n hooks must be used within I18nProvider')
  }
  return context
}

export interface I18nProviderProps {
  locale: string
  messages: Record<string, unknown>
  defaultLocale: string
  locales: readonly string[]
  children: ReactNode
}

export function I18nProvider ({
  locale,
  messages,
  defaultLocale,
  locales,
  children
}: I18nProviderProps) {
  const value = useMemo(
    () => ({
      locale,
      messages,
      defaultLocale,
      locales
    }),
    [locale, messages, defaultLocale, locales]
  )

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useMessages<T = Record<string, unknown>> (): T {
  return useI18n().messages as T
}

export function useTranslations<K extends string = string> (namespace?: string): (key: K) => string {
  const { locale, messages } = useI18n()

  return useCallback(
    (key: K): string => {
      return resolveMessage(messages, key, namespace, locale)
    },
    [namespace, messages, locale]
  )
}

export function useLocale (): string {
  return useI18n().locale
}

export function useLocalizedPath () {
  const { locale, defaultLocale } = useI18n()
  return useCallback(
    (path: string) => {
      if (locale === defaultLocale) {
        return path
      }

      const cleanPath = path.startsWith('/') ? path : `/${path}`

      // Avoid double prefixing
      if (cleanPath.startsWith(`/${locale}/`) || cleanPath === `/${locale}`) {
        return cleanPath
      }

      if (cleanPath === '/') {
        return `/${locale}`
      }

      return `/${locale}${cleanPath}`
    },
    [locale, defaultLocale]
  )
}

export function useLocales (): readonly string[] {
  return useI18n().locales
}

export function I18nLink ({ href, ...props }: ComponentProps<typeof NextLink>) {
  const getPath = useLocalizedPath()

  // Handle both string and UrlObject
  const localizedHref = typeof href === 'string'
    ? getPath(href)
    : { ...href, pathname: getPath(href.pathname ?? '') }

  return <NextLink href={localizedHref} {...props} />
}
