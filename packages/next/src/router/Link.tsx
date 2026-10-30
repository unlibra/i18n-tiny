'use client'

import NextLink from 'next/link.js'
import type { LinkProps as NextLinkProps } from 'next/link.js'
import { usePathname } from 'next/navigation.js'
import type { AnchorHTMLAttributes, ReactNode, RefAttributes } from 'react'

import { useLocale, useLocaleConfig } from '@i18n-tiny/react/internal'
import { getLinkHref } from '@i18n-tiny/core/router'
import type { LinkHrefOptions } from '@i18n-tiny/core/router'

// The props of next/link's Link, built from its named LinkProps type rather
// than from the type of its default export: next/link is CommonJS, so under
// moduleResolution nodenext the default import is typed as the whole module.
type NextLinkComponentProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> &
  NextLinkProps & { children?: ReactNode } & RefAttributes<HTMLAnchorElement>

// The empty string is not a locale: locale="" was the 1.x way to write
// locale={false}, and is a type error
type LocaleProp<T extends string> = (T extends '' ? never : T) | false

export interface LinkProps<T extends string = string> extends Omit<NextLinkComponentProps, 'locale'> {
  /**
   * The locale of the link
   * - undefined: keep the locale of the current URL (default)
   * - a locale such as 'en': the link for that locale. The default locale
   *   gets no prefix unless prefixDefault is true. Any other value throws
   * - false: the path without a locale
   */
  locale?: LocaleProp<T>
  /**
   * Remove a locale prefix from href first, such as when href comes from
   * usePathname()
   * @default false
   */
  normalize?: boolean
}

/**
 * Next.js Link component with automatic locale prefix
 *
 * The href is a path without a locale prefix and without the basePath, and
 * must start with "/". Hrefs that are not paths on this site, such as
 * 'https://…' or '#top', are left unchanged. The locale settings are read
 * from the Provider returned by define().
 *
 * Without `locale`, the link keeps the pattern of the current URL:
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
 * // A link for another locale: the default locale gets no prefix
 * <Link href="/" locale="ja">日本語</Link>
 *
 * // Raw path (no localization)
 * <Link href="/" locale={false}>English</Link>
 *
 * // The current page in another locale
 * const pathname = usePathname() // '/ja/about'
 * <Link href={pathname} locale="en" normalize>English</Link>  // → /en/about
 * ```
 */
export function Link<const T extends string = string>({ href, locale, normalize = false, ...props }: LinkProps<T>) {
  let currentLocale: string
  let config: LinkHrefOptions['config']
  let pathname: string | null

  try {
    currentLocale = useLocale()
    config = useLocaleConfig()
    pathname = usePathname()
  } catch {
    const error = new Error(
      'Link component must be used within i18n Provider. ' +
      'Wrap your component tree with the <Provider> returned from define().'
    )
    // Remove Link function from stack trace to show user's code
    if ('captureStackTrace' in Error) {
      ;(Error as { captureStackTrace: (e: object, fn?: unknown) => void }).captureStackTrace(error, Link)
    }
    throw error
  }

  const options = { locale, normalize, config } as LinkHrefOptions

  // Handle both string and UrlObject. A UrlObject without pathname, such as
  // { query: { page: 2 } }, points at the current page and is left as is.
  const localizedHref = typeof href === 'string'
    ? getLinkHref(href, pathname ?? '', currentLocale, options)
    : href.pathname == null
      ? href
      : { ...href, pathname: getLinkHref(href.pathname, pathname ?? '', currentLocale, options) }

  return <NextLink href={localizedHref} {...props} />
}
