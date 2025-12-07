'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

import { useLocale, useLocales } from '@i18n-tiny/react/internal'
import { getLinkHref } from '@i18n-tiny/core/router'

export interface LinkProps extends Omit<ComponentProps<typeof NextLink>, 'locale'> {
  /**
   * Override the locale for this link
   * - undefined: auto-localize based on current locale (default)
   * - string (e.g., 'en', 'ja'): generate path for specified locale with prefix
   * - '' (empty string) or false: use href as-is without any localization (raw path)
   */
  locale?: string | false
  /**
   * Normalize href by removing any existing locale prefix before processing.
   * When true, locales are read from I18nProvider context.
   * Useful when href comes from usePathname() or similar.
   * @default false
   */
  normalize?: boolean
}

/**
 * Next.js Link component with automatic locale prefix
 *
 * Automatically detects whether locale prefix is needed based on current URL:
 * - If current URL has locale prefix → generated links have prefix
 * - If current URL has no prefix → generated links have no prefix
 *
 * @example
 * ```tsx
 * import { Link } from '@i18n-tiny/next/router'
 *
 * // Auto-localized link (uses current locale and URL pattern)
 * <Link href="/about">About</Link>
 *
 * // Language switch with explicit locale prefix
 * <Link href="/" locale="ja">日本語</Link>
 *
 * // Raw path (no localization)
 * <Link href="/" locale="">English</Link>
 * <Link href="/" locale={false}>English</Link>
 * <Link href="/" locale={condition && 'ja'}>Conditional</Link>
 *
 * // With href normalization (removes existing locale prefix before processing)
 * const pathname = usePathname() // '/ja/about'
 * <Link href={pathname} locale="en" normalize>English</Link>  // → /en/about
 * ```
 */
export function Link({ href, locale, normalize = false, ...props }: LinkProps) {
  let currentLocale: string
  let locales: readonly string[]
  let pathname: string | null

  try {
    currentLocale = useLocale()
    locales = useLocales()
    pathname = usePathname()
  } catch {
    const error = new Error(
      'Link component must be used within i18n Provider. ' +
      'Wrap your component tree with the <Provider> returned from define().'
    )
    // Remove Link function from stack trace to show user's code
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, Link)
    }
    throw error
  }

  // Get locales for normalization if enabled
  const normalizeLocales = normalize ? locales : undefined

  // Handle both string and UrlObject
  const localizedHref = typeof href === 'string'
    ? getLinkHref(href, pathname ?? '', currentLocale, { locale, locales: normalizeLocales })
    : { ...href, pathname: getLinkHref(href.pathname ?? '', pathname ?? '', currentLocale, { locale, locales: normalizeLocales }) }

  return <NextLink href={localizedHref} {...props} />
}
