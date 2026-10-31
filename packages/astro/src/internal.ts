/**
 * @i18n-tiny/astro/internal
 *
 * Shared by the components and the middleware of @i18n-tiny/astro. Not a
 * public API: it may change in any release.
 */

import type { HTMLAttributes } from 'astro/types'
import type { I18nConfig } from '@i18n-tiny/core'
import { getLinkHref } from '@i18n-tiny/core/router'
import type { LinkHrefOptions } from '@i18n-tiny/core/router'

/** The locale settings a Link reads from the define() result */
export interface LinkI18n {
  readonly locales: readonly string[]
  readonly defaultLocale: string
  readonly prefixDefault?: boolean
}

type LinkAttributes = Omit<HTMLAttributes<'a'>, 'href'> & {
  /** The path to link to, without the base and without a locale prefix, such as '/about' */
  href: string
}

/** Props of the Link component: `locale` and `normalize` need `i18n` */
export type LinkProps = LinkAttributes & (
  | {
      /** false: the path without a locale */
      locale?: false
      normalize?: false
      /** The define() result, for `locale` and `normalize` */
      i18n?: LinkI18n
    }
  | {
      /**
       * - undefined: keep the locale of the current URL (default)
       * - a locale such as 'en': the link for that locale. The default
       *   locale gets no prefix unless prefixDefault is true
       * - false: the path without a locale
       */
      locale?: string | false
      /**
       * Remove the base and a locale prefix from href first, such as when
       * href is Astro.url.pathname
       */
      normalize?: boolean
      /** The define() result, for `locale` and `normalize` */
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

// A path on this site, which gets the base: not "//host" or "/\host"
function isSitePath (href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\')
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
 * The href of the Link component: removes the base from the current
 * pathname (and from href with `normalize`), builds the path as
 * getLinkHref() of @i18n-tiny/core/router does, and adds the base.
 * Hrefs that are not paths on this site, such as 'https://…' or '#top', are
 * returned unchanged.
 */
export function linkHref (input: LinkHrefInput): string {
  const { href, currentLocale, locale, normalize = false, i18n, base } = input
  if (i18n === undefined && (normalize || (locale !== undefined && locale !== false))) {
    throw new Error(
      `[i18n] A Link with ${normalize ? 'normalize' : `locale ${JSON.stringify(locale)}`} needs the i18n prop, ` +
      'the result of define(): <Link i18n={i18n} ...>.'
    )
  }
  const config: I18nConfig | undefined = i18n === undefined
    ? undefined
    : { locales: i18n.locales, defaultLocale: i18n.defaultLocale, prefixDefault: i18n.prefixDefault ?? false }

  const target = normalize ? stripBase(href, base) : href
  const options = { locale, normalize, config } as LinkHrefOptions
  const result = getLinkHref(target, stripBase(input.currentPathname, base), currentLocale, options)
  return isSitePath(result) ? addBase(result, base) : result
}
