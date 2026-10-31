'use client'

import NextLink from 'next/link.js'
import type { LinkProps as NextLinkProps } from 'next/link.js'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode, RefAttributes } from 'react'

import { useLocale, useLocaleConfig } from '@i18n-tiny/react/internal'
import { findPrefixLocale, leadsToAnotherHost, linkHref } from '@i18n-tiny/core/internal'
import type { I18nConfig } from '@i18n-tiny/core/router'

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
   * - undefined: the link for the locale of the current page (default)
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

// Whether the page of a link is shown in another locale than the current
// one, or in a locale that only the server knows. Links that are not paths
// on this site, such as '#top' or 'https://…', are not.
function leadsToAnotherLocale (href: string | null | undefined, currentLocale: string, config: I18nConfig): boolean {
  if (typeof href !== 'string') {
    return false
  }
  // Only the path is read: the query and the hash cannot lead to another host
  const suffixStart = href.search(/[?#]/)
  const path = suffixStart === -1 ? href : href.slice(0, suffixStart)
  if (!path.startsWith('/') || leadsToAnotherHost(path)) {
    return false
  }
  const locale = findPrefixLocale(path as `/${string}`, config) ?? (config.prefixDefault ? undefined : config.defaultLocale)
  return locale !== currentLocale
}

// A click that the browser handles itself: a new tab or window, a download
function isBrowserClick (event: MouseEvent<HTMLAnchorElement>): boolean {
  const target = event.currentTarget.getAttribute('target')
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
    (target !== null && target !== '_self') || event.currentTarget.hasAttribute('download')
}

/**
 * Next.js Link component with automatic locale prefix
 *
 * The href is a path without a locale prefix and without the basePath, and
 * must start with "/". Hrefs that are not paths on this site, such as
 * 'https://…' or '#top', are left unchanged. The locale settings are read
 * from the Provider returned by define().
 *
 * Without `locale`, the link is for the locale of the current page, as
 * localizedPath() builds it: the default locale gets no prefix unless
 * prefixDefault is true.
 *
 * A link to a page of another locale is loaded in full by the browser, not
 * by the router of Next.js, and is not prefetched: in the rewrite mode the
 * pages of all locales are the same route, and the router would show the
 * page of the current locale from its cache. The locale of the page is read
 * from the path, as the proxy reads it: the locale of its prefix, or for a
 * path without a prefix, the default locale. With prefixDefault, a path
 * without a prefix is the detected locale, which only the server knows, and
 * is loaded in full too. Clicks that the browser handles, such as with a
 * modifier key or with target="_blank", are left to it.
 *
 * @example
 * ```tsx
 * import { Link } from '@i18n-tiny/next/router'
 *
 * // The link for the current locale
 * <Link href="/about">About</Link>
 *
 * // A link for another locale: the default locale gets no prefix
 * <Link href="/" locale="ja">日本語</Link>
 *
 * // Raw path (no localization)
 * <Link href="/" locale={false}>English</Link>
 *
 * // The current page in another locale
 * const pathname = usePathname() // '/ja/about', from next/navigation
 * <Link href={pathname} locale="en" normalize>English</Link>  // → /en/about
 * ```
 */
export function Link<const T extends string = string>({ href, locale, normalize = false, ...props }: LinkProps<T>) {
  let currentLocale: string
  let config: I18nConfig

  try {
    currentLocale = useLocale()
    config = useLocaleConfig()
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

  // Without a locale, the link is for the locale of the current page. The
  // config of the Provider comes from define() and is not checked again.
  const linkLocale = locale ?? currentLocale
  const options = { locale: linkLocale, normalize, config }

  // Handle both string and UrlObject. A UrlObject without pathname, such as
  // { query: { page: 2 } }, points at the current page and is left as is.
  const localizedHref = typeof href === 'string'
    ? linkHref(href, '', currentLocale, options)
    : href.pathname == null
      ? href
      : { ...href, pathname: linkHref(href.pathname, '', currentLocale, options) }

  const path = typeof localizedHref === 'string' ? localizedHref : localizedHref.pathname
  if (!leadsToAnotherLocale(path, currentLocale, config)) {
    return <NextLink href={localizedHref} {...props} />
  }

  // Another locale: the browser loads the page. The href of the anchor has
  // the basePath that NextLink adds.
  const { onClick, replace } = props
  return (
    <NextLink
      href={localizedHref}
      {...props}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || isBrowserClick(event)) {
          return
        }
        event.preventDefault()
        if (replace) {
          window.location.replace(event.currentTarget.href)
        } else {
          window.location.assign(event.currentTarget.href)
        }
      }}
    />
  )
}
