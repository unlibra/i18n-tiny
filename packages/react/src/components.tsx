'use client'

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { resolveMessage } from '@i18n-tiny/core/internal'

interface I18nContextValue {
  locale: string
  messages: Record<string, unknown>
  defaultLocale: string
  locales: readonly string[]
  prefixDefault: boolean
}

// The only context of the package: both entry points, the main one and
// ./internal, use this module, so a Provider from one is seen by the hooks of
// the other.
const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function useI18n (hookName: string = 'useI18n') {
  const context = useContext(I18nContext)
  if (!context) {
    const error = new Error(
      `${hookName}() must be used within i18n Provider. ` +
      `Wrap your component tree with the <Provider> returned from define().`
    )
    // Remove useI18n function from stack trace to show user's code
    if ('captureStackTrace' in Error) {
      ;(Error as { captureStackTrace: (e: object, fn?: unknown) => void }).captureStackTrace(error, useI18n)
    }
    throw error
  }
  return context
}

export interface ProviderProps {
  locale: string
  messages: Record<string, unknown>
  defaultLocale: string
  locales: readonly string[]
  /**
   * Whether URLs of the default locale also carry the locale prefix, for
   * the URL functions of @i18n-tiny/next
   * @default false
   */
  prefixDefault?: boolean
  children: ReactNode
}

export function I18nProvider ({
  locale,
  messages,
  defaultLocale,
  locales,
  prefixDefault = false,
  children
}: ProviderProps) {
  const value = useMemo(
    () => ({
      locale,
      messages,
      defaultLocale,
      locales,
      prefixDefault
    }),
    [locale, messages, defaultLocale, locales, prefixDefault]
  )

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useMessages<T = Record<string, unknown>> (): T {
  return useI18n('useMessages').messages as T
}

export function useTranslations<K extends string = string> (namespace?: string): (key: K, vars?: Record<string, string | number>) => string {
  const { locale, messages } = useI18n('useTranslations')

  return useCallback(
    (key: K, vars?: Record<string, string | number>): string => {
      return resolveMessage(messages, key, namespace, locale, vars)
    },
    [namespace, messages, locale]
  )
}

export function useLocale (): string {
  return useI18n('useLocale').locale
}

export function useLocales (): readonly string[] {
  return useI18n('useLocales').locales
}

export function useDefaultLocale (): string {
  return useI18n('useDefaultLocale').defaultLocale
}

/** The locale settings of the Provider, for the URL functions of @i18n-tiny/next */
export function useLocaleConfig (): { locales: readonly string[], defaultLocale: string, prefixDefault: boolean } {
  const { locales, defaultLocale, prefixDefault } = useI18n('useLocaleConfig')
  return useMemo(() => ({ locales, defaultLocale, prefixDefault }), [locales, defaultLocale, prefixDefault])
}
