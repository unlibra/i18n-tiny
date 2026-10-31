import { describe, it, expect } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { define } from '../index'
import { addBase, linkHref, stripBase } from '../internal'
// The component imports the built internal entry, so the tests run after the build
import Link from '../router/Link.astro'

const messages = { ja: {}, en: {} }
const i18n = define({ locales: ['ja', 'en'], defaultLocale: 'ja', messages })
const prefixed = define({ locales: ['ja', 'en'], defaultLocale: 'ja', prefixDefault: true, messages })

describe('stripBase', () => {
  it('removes the base from a pathname that starts with it', () => {
    expect(stripBase('/docs/en/about', '/docs')).toBe('/en/about')
    expect(stripBase('/docs/en/about', '/docs/')).toBe('/en/about')
    expect(stripBase('/docs', '/docs')).toBe('/')
    expect(stripBase('/docs/', '/docs')).toBe('/')
    expect(stripBase('/docs/', '/docs/')).toBe('/')
    expect(stripBase('/docs?x=1', '/docs')).toBe('/?x=1')
    expect(stripBase('/docs/about#top', '/docs')).toBe('/about#top')
    expect(stripBase('/a/b/c', '/a/b')).toBe('/c')
  })

  it('matches whole path segments only', () => {
    expect(stripBase('/docsify', '/docs')).toBe('/docsify')
    expect(stripBase('/about', '/docs')).toBe('/about')
  })

  it('leaves the pathname without a base', () => {
    expect(stripBase('/en/about', '/')).toBe('/en/about')
    expect(stripBase('/en/about', '')).toBe('/en/about')
  })
})

describe('addBase', () => {
  it('adds the base, giving the top page the base only', () => {
    expect(addBase('/en/about', '/docs')).toBe('/docs/en/about')
    expect(addBase('/en/about', '/docs/')).toBe('/docs/en/about')
    expect(addBase('/', '/docs')).toBe('/docs')
    expect(addBase('/?x=1', '/docs')).toBe('/docs?x=1')
    expect(addBase('/#top', '/docs/')).toBe('/docs#top')
    expect(addBase('/about?x=1#top', '/docs')).toBe('/docs/about?x=1#top')
  })

  it('leaves the path without a base', () => {
    expect(addBase('/en/about', '/')).toBe('/en/about')
    expect(addBase('/', '/')).toBe('/')
  })
})

describe('linkHref', () => {
  const page = (currentPathname: string, currentLocale: string | undefined, base = '/') => ({ currentPathname, currentLocale, base })

  it('keeps the locale prefix of the current URL without locale, without i18n', () => {
    expect(linkHref({ href: '/about', ...page('/en/page', 'en') })).toBe('/en/about')
    expect(linkHref({ href: '/', ...page('/en', 'en') })).toBe('/en')
    expect(linkHref({ href: '/about', ...page('/page', undefined) })).toBe('/about')
    // A URL without a prefix keeps none, also in the rewrite mode where the locale is known
    expect(linkHref({ href: '/about', ...page('/page', 'ja') })).toBe('/about')
    expect(linkHref({ href: '/about', ...page('/ja/page', 'ja') })).toBe('/ja/about')
  })

  it('takes i18n without locale and still keeps the pattern of the current URL', () => {
    expect(linkHref({ href: '/about', i18n: prefixed, ...page('/page', 'ja') })).toBe('/about')
    expect(linkHref({ href: '/about', i18n, ...page('/en/page', 'en') })).toBe('/en/about')
  })

  it('gives the default locale no prefix with locale', () => {
    expect(linkHref({ href: '/about', locale: 'ja', i18n, ...page('/en/page', 'en') })).toBe('/about')
    expect(linkHref({ href: '/', locale: 'ja', i18n, ...page('/en', 'en') })).toBe('/')
    expect(linkHref({ href: '/about', locale: 'en', i18n, ...page('/page', undefined) })).toBe('/en/about')
  })

  it('gives the default locale its prefix with prefixDefault', () => {
    expect(linkHref({ href: '/about', locale: 'ja', i18n: prefixed, ...page('/en/page', 'en') })).toBe('/ja/about')
    expect(linkHref({ href: '/', locale: 'ja', i18n: prefixed, ...page('/en', 'en') })).toBe('/ja')
  })

  it('leaves the path without a locale with locale false, with or without i18n', () => {
    expect(linkHref({ href: '/about', locale: false, ...page('/en/page', 'en') })).toBe('/about')
    expect(linkHref({ href: '/about/', locale: false, i18n: prefixed, ...page('/en/page', 'en') })).toBe('/about')
  })

  it('keeps the query and the hash, and removes trailing slashes', () => {
    expect(linkHref({ href: '/about/?x=1#top', ...page('/en/page', 'en') })).toBe('/en/about?x=1#top')
    expect(linkHref({ href: '/about/?x=1#top', locale: 'en', i18n, ...page('/page', undefined) })).toBe('/en/about?x=1#top')
    expect(linkHref({ href: '/#top', locale: 'ja', i18n, ...page('/en', 'en') })).toBe('/#top')
  })

  it('removes the base from the current URL and adds it to the link', () => {
    const base = '/docs/'
    expect(linkHref({ href: '/about', ...page('/docs/en/page', 'en', base) })).toBe('/docs/en/about')
    expect(linkHref({ href: '/about', ...page('/docs/page', undefined, base) })).toBe('/docs/about')
    expect(linkHref({ href: '/', ...page('/docs', undefined, base) })).toBe('/docs')
    expect(linkHref({ href: '/', locale: 'en', i18n, ...page('/docs', undefined, base) })).toBe('/docs/en')
    expect(linkHref({ href: '/about', locale: 'ja', i18n, ...page('/docs/en/page', 'en', base) })).toBe('/docs/about')
    expect(linkHref({ href: '/about?x=1#top', locale: 'en', i18n, ...page('/docs', undefined, base) })).toBe('/docs/en/about?x=1#top')
    expect(linkHref({ href: '/about', locale: false, ...page('/docs/en/page', 'en', base) })).toBe('/docs/about')
    // href is a path of the site, without the base: /docs here is a page of the site
    expect(linkHref({ href: '/docs/intro', ...page('/docs/page', undefined, '/docs') })).toBe('/docs/docs/intro')
  })

  it('returns hrefs that are not paths on the site unchanged, without the base', () => {
    for (const href of ['https://example.com/about', 'mailto:a@example.com', '//cdn.example.com/x', '#top', '?page=2']) {
      expect(linkHref({ href, locale: 'en', i18n, ...page('/docs/page', undefined, '/docs') })).toBe(href)
      expect(linkHref({ href, ...page('/docs/en/page', 'en', '/docs') })).toBe(href)
    }
  })

  it('throws without i18n for a locale', () => {
    expect(() => linkHref({ href: '/about', locale: 'en', ...page('/page', undefined) }))
      .toThrow('[i18n] A Link with locale "en" needs the i18n prop, the result of define(): <Link i18n={i18n} ...>.')
  })

  it('throws for an unknown or empty locale', () => {
    expect(() => linkHref({ href: '/about', locale: 'fr', i18n, ...page('/page', undefined) })).toThrow('[i18n] Unknown locale "fr".')
    expect(() => linkHref({ href: '/about', locale: '', i18n, ...page('/page', undefined) })).toThrow('[i18n] Unknown locale "".')
  })

  // Browsers remove tabs and line breaks before reading a URL:
  // "/\t/evil.com" is read as "//evil.com"
  it('builds the link of an href whose query or hash has a tab or a line break', () => {
    // Only the path can lead to another host: the query and the hash are kept
    for (const suffix of ['?x=\t', '#a\nb', '?q=a\r#b']) {
      expect(linkHref({ href: `/about${suffix}`, locale: 'en', i18n, ...page('/docs/p', 'ja', '/docs') })).toBe(`/docs/en/about${suffix}`)
      expect(linkHref({ href: `/about${suffix}`, locale: 'ja', i18n, ...page('/docs/en/p', 'en', '/docs') })).toBe(`/docs/about${suffix}`)
      expect(linkHref({ href: `/about${suffix}`, ...page('/docs/en/p', 'en', '/docs') })).toBe(`/docs/en/about${suffix}`)
      expect(linkHref({ href: `/about${suffix}`, ...page('/docs/p', 'ja', '/docs') })).toBe(`/docs/about${suffix}`)
      expect(linkHref({ href: `/about${suffix}`, locale: false, ...page('/docs/p', 'ja', '/docs') })).toBe(`/docs/about${suffix}`)
      expect(linkHref({ href: `/${suffix}`, locale: 'en', i18n, ...page('/p', 'ja') })).toBe(`/en${suffix}`)
    }
  })

  it('throws for an href with a tab or a line break', () => {
    for (const href of ['/\t/evil.com', '/\n/evil.com', '/\r\\evil.com']) {
      for (const base of ['/', '/docs']) {
        expect(() => linkHref({ href, ...page('/page', undefined, base) })).toThrow('contain a tab or a line break')
        expect(() => linkHref({ href, ...page('/en/page', 'en', base) })).toThrow('contain a tab or a line break')
        expect(() => linkHref({ href, locale: false, ...page('/page', undefined, base) })).toThrow('contain a tab or a line break')
        expect(() => linkHref({ href, locale: 'ja', i18n, ...page('/page', undefined, base) })).toThrow('contain a tab or a line break')
        expect(() => linkHref({ href, locale: 'en', i18n: prefixed, ...page('/page', undefined, base) })).toThrow('contain a tab or a line break')
      }
    }
  })

  it('throws for a relative href', () => {
    expect(() => linkHref({ href: 'about', ...page('/page', undefined) })).toThrow('[i18n] href must be a pathname starting with "/"')
    expect(() => linkHref({ href: 'about', locale: 'en', i18n, ...page('/page', undefined) })).toThrow('[i18n] href must be a pathname starting with "/"')
  })
})

describe('Link component', () => {
  async function render (
    props: Record<string, unknown>,
    url: string,
    context: { params?: Record<string, string | undefined>, locals?: Record<string, unknown> } = {}
  ): Promise<string> {
    const container = await AstroContainer.create()
    const html = await container.renderToString(Link, {
      props,
      slots: { default: 'Text' },
      request: new Request(`http://localhost${url}`),
      params: context.params,
      locals: context.locals as App.Locals
    })
    return html.trim()
  }

  const href = (html: string) => /href="([^"]*)"/.exec(html)?.[1]

  it('renders a link that keeps the locale of the current page, without i18n', async () => {
    expect(href(await render({ href: '/about' }, '/en/page', { params: { locale: 'en' } }))).toBe('/en/about')
    expect(href(await render({ href: '/about' }, '/page', { params: { locale: undefined } }))).toBe('/about')
  })

  it('renders a link for a locale with i18n, without a prefix for the default locale', async () => {
    expect(href(await render({ href: '/about', locale: 'ja', i18n }, '/en/page', { params: { locale: 'en' } }))).toBe('/about')
    expect(href(await render({ href: '/about', locale: 'en', i18n }, '/page'))).toBe('/en/about')
    expect(href(await render({ href: '/about', locale: 'ja', i18n: prefixed }, '/en/page', { params: { locale: 'en' } }))).toBe('/ja/about')
  })

  it('reads the locale and the URL before the rewrite from the locals in the rewrite mode', async () => {
    expect(href(await render({ href: '/about' }, '/page', { locals: { locale: 'en', originalPathname: '/en/page' } }))).toBe('/en/about')
    expect(href(await render({ href: '/about' }, '/page', { locals: { locale: 'en', originalPathname: '/page' } }))).toBe('/about')
  })

  it('passes the other attributes and the slot to the a element', async () => {
    const html = await render({ href: '/about', locale: 'en', i18n, class: 'nav', 'aria-current': 'page' }, '/page')
    expect(html).toContain('class="nav"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('>Text')
    expect(html).not.toContain('i18n')
  })

  it('throws without i18n for a locale', async () => {
    await expect(render({ href: '/about', locale: 'en' }, '/page')).rejects.toThrow('[i18n] A Link with locale "en" needs the i18n prop')
    expect(href(await render({ href: '/about', locale: false }, '/en/page', { params: { locale: 'en' } }))).toBe('/about')
  })
})
