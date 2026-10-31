/**
 * @i18n-tiny/astro/internal
 *
 * Shared by the components and the middleware of @i18n-tiny/astro. Not a
 * public API: it may change in any release.
 */

import type { HTMLAttributes } from 'astro/types'
import { getLinkHref } from '@i18n-tiny/core/router'
import { leadsToAnotherHost } from '@i18n-tiny/core/internal'

/** What a Link with `locale` reads from the define() result */
export interface LinkI18n {
  // A method, so that the define() result, whose function takes its own
  // locales only, can be given
  localizedPath (path: string, locale: string): string
}

type LinkAttributes = Omit<HTMLAttributes<'a'>, 'href'> & {
  /** The path to link to, without the base and without a locale prefix, such as '/about' */
  href: string
}

/** Props of the Link component: a locale needs `i18n` */
export type LinkProps = LinkAttributes & (
  | {
      /**
       * - undefined: keep the locale prefix of the current URL (default)
       * - false: the path without a locale
       */
      locale?: false
      /** The define() result, needed for a locale */
      i18n?: LinkI18n
    }
  | {
      /**
       * A locale such as 'en': the link for that locale, as localizedPath()
       * builds it. The default locale gets no prefix unless prefixDefault is
       * true
       */
      locale: string
      /** The define() result, whose config builds the link */
      i18n: LinkI18n
    }
)

// The base without a trailing slash: '' for '/'
function trimBase (base: string): string {
  let end = base.length
  while (end > 0 && base[end - 1] === '/') {
    end--
  }
  return base.slice(0, end)
}

// The start of the query or the hash, or the length when there is none
function suffixStart (value: string): number {
  const index = value.search(/[?#]/)
  return index === -1 ? value.length : index
}

/**
 * Removes the base, such as import.meta.env.BASE_URL, from a pathname of
 * the site. Only a whole path segment matches: with the base '/docs',
 * '/docs/about' is '/about' and '/docs' is '/', but '/docsify' is unchanged.
 * A pathname that does not start with the base is returned unchanged.
 */
export function stripBase (pathname: string, base: string): string {
  const trimmed = trimBase(base)
  if (trimmed === '') {
    return pathname
  }
  const end = suffixStart(pathname)
  const path = pathname.slice(0, end)
  if (path === trimmed || path === `${trimmed}/`) {
    return '/' + pathname.slice(end)
  }
  if (path.startsWith(`${trimmed}/`)) {
    return pathname.slice(trimmed.length)
  }
  return pathname
}

/**
 * Adds the base, such as import.meta.env.BASE_URL, to a path of the site
 * that starts with "/". The top page gets the base only: '/' is '/docs'.
 */
export function addBase (path: string, base: string): string {
  const trimmed = trimBase(base)
  if (trimmed === '') {
    return path
  }
  const end = suffixStart(path)
  return path.slice(0, end) === '/' ? trimmed + path.slice(end) : trimmed + path
}

// A path on this site, which gets the base: not one that leads to another
// host. Only the path is read: the query and the hash cannot lead there.
function isSitePath (href: string): boolean {
  return href.startsWith('/') && !leadsToAnotherHost(href.slice(0, suffixStart(href)))
}

/** What the Link component reads from its props and the current request */
export interface LinkHrefInput {
  href: string
  /** The pathname of the current URL, with the base */
  currentPathname: string
  /** The locale of the current page, from its params or locals */
  currentLocale: string | undefined
  locale?: string | false
  i18n?: LinkI18n
  /** import.meta.env.BASE_URL */
  base: string
}

/**
 * The href of the Link component, with the base added:
 * - without `locale`, the link keeps the pattern of the current URL, as
 *   getLinkHref() of @i18n-tiny/core/router does: the prefix of the current
 *   locale only when the current pathname, without the base, has it
 * - with a locale, localizedPath() of the define() result builds it
 * - `locale={false}` leaves the path without a locale
 *
 * Hrefs that are not paths on this site, such as 'https://…' or '#top', are
 * returned unchanged. The query and the hash of href are kept.
 */
export function linkHref (input: LinkHrefInput): string {
  const { href, currentLocale, locale, i18n, base } = input
  let result: string
  if (locale === undefined || locale === false) {
    result = getLinkHref(href, stripBase(input.currentPathname, base), currentLocale, { locale })
  } else {
    if (i18n === undefined) {
      throw new Error(
        `[i18n] A Link with locale ${JSON.stringify(locale)} needs the i18n prop, ` +
        'the result of define(): <Link i18n={i18n} ...>.'
      )
    }
    // Checks href and removes its trailing slashes, as getLinkHref() does
    const plain = getLinkHref(href, '', undefined, { locale: false })
    if (!isSitePath(plain)) {
      return plain
    }
    const end = suffixStart(plain)
    result = i18n.localizedPath(plain.slice(0, end), locale) + plain.slice(end)
  }
  return isSitePath(result) ? addBase(result, base) : result
}
