/**
 * @i18n-tiny/astro/internal
 *
 * Shared by the components and the middleware of @i18n-tiny/astro. Not a
 * public API: it may change in any release.
 */

import type { HTMLAttributes } from 'astro/types'
import { leadsToAnotherHost, linkHref as coreLinkHref } from '@i18n-tiny/core/internal'

/** What a Link with `locale` or `normalize` reads from the define() result */
export interface LinkI18n {
  readonly locales: readonly string[]
  readonly defaultLocale: string
  // A method, so that the define() result, whose function takes its own
  // locales only, can be given
  localizedPath (path: string, locale: string): string
}

type LinkAttributes = Omit<HTMLAttributes<'a'>, 'href'> & {
  /** The path to link to, without the base and without a locale prefix, such as '/about' */
  href: string
}

/** Props of the Link component: a locale and `normalize` need `i18n` */
export type LinkProps = LinkAttributes & (
  | {
      /**
       * - undefined: keep the locale prefix of the current URL (default)
       * - false: the path without a locale
       */
      locale?: false
      normalize?: false
      /** The define() result, needed for a locale and `normalize` */
      i18n?: LinkI18n
    }
  | {
      /**
       * - undefined: keep the locale prefix of the current URL (default)
       * - a locale such as 'en': the link for that locale, as localizedPath()
       *   builds it. The default locale gets no prefix unless prefixDefault
       *   is true
       * - false: the path without a locale
       */
      locale?: string | false
      /**
       * Remove the base and a locale prefix from href first, such as when
       * href is Astro.url.pathname
       */
      normalize?: boolean
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

function missingI18n (prop: string): Error {
  return new Error(`[i18n] A Link with ${prop} needs the i18n prop, the result of define(): <Link i18n={i18n} ...>.`)
}

/** What the Link component reads from its props and the current request */
export interface LinkHrefInput {
  href: string
  /** The pathname of the current URL, with the base */
  currentPathname: string
  /** The locale of the current page, from its params or locals */
  currentLocale: string | undefined
  locale?: string | false
  normalize?: boolean
  i18n?: LinkI18n
  /** import.meta.env.BASE_URL */
  base: string
}

/**
 * The href of the Link component, with the base added:
 * - without `locale`, the link keeps the pattern of the current URL, as
 *   getLinkHref() of @i18n-tiny/core does: the prefix of the current locale
 *   only when the current pathname, without the base, has it
 * - with a locale, localizedPath() of the define() result builds it
 * - `locale={false}` leaves the path without a locale
 * - `normalize` first removes the base and a locale prefix from href, such
 *   as when href is Astro.url.pathname
 *
 * Hrefs that are not paths on this site, such as 'https://…' or '#top', are
 * returned unchanged. The query and the hash of href are kept.
 */
export function linkHref (input: LinkHrefInput): string {
  const { href, currentLocale, locale, normalize = false, i18n, base } = input
  if (normalize && i18n === undefined) {
    throw missingI18n('normalize')
  }
  // The locales of define(), for removing a locale prefix from href. The
  // config of define() is checked once there, and not again here.
  const config = normalize && i18n !== undefined
    ? { locales: i18n.locales, defaultLocale: i18n.defaultLocale }
    : undefined
  const target = normalize ? stripBase(href, base) : href

  let result: string
  if (locale === undefined || locale === false) {
    result = coreLinkHref(target, stripBase(input.currentPathname, base), currentLocale, { locale, normalize, config })
  } else {
    if (i18n === undefined) {
      throw missingI18n(`locale ${JSON.stringify(locale)}`)
    }
    // Checks href and removes its trailing slashes, and with normalize its
    // locale prefix, as getLinkHref() does
    const plain = coreLinkHref(target, '', undefined, { locale: false, normalize, config })
    if (!isSitePath(plain)) {
      return plain
    }
    const end = suffixStart(plain)
    result = i18n.localizedPath(plain.slice(0, end), locale) + plain.slice(end)
  }
  return isSitePath(result) ? addBase(result, base) : result
}
