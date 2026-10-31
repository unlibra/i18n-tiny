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
  const page = (currentLocale: string | undefined, base = '/') => ({ currentLocale, base })

  it('builds the link for the locale of the current page from the config without locale', () => {
    expect(linkHref({ href: '/about', i18n, ...page('en') })).toBe('/en/about')
    expect(linkHref({ href: '/', i18n, ...page('en') })).toBe('/en')
    expect(linkHref({ href: '/about', i18n, ...page('ja') })).toBe('/about')
    expect(linkHref({ href: '/about', i18n: prefixed, ...page('ja') })).toBe('/ja/about')
    expect(linkHref({ href: '/about', i18n: prefixed, ...page('en') })).toBe('/en/about')
  })

  it('takes a page without a locale for the default locale', () => {
    expect(linkHref({ href: '/about', i18n, ...page(undefined) })).toBe('/about')
    expect(linkHref({ href: '/about', i18n: prefixed, ...page(undefined) })).toBe('/ja/about')
  })

  it('gives the default locale no prefix with locale', () => {
    expect(linkHref({ href: '/about', locale: 'ja', i18n, ...page('en') })).toBe('/about')
    expect(linkHref({ href: '/', locale: 'ja', i18n, ...page('en') })).toBe('/')
    expect(linkHref({ href: '/about', locale: 'en', i18n, ...page(undefined) })).toBe('/en/about')
  })

  it('gives the default locale its prefix with prefixDefault', () => {
    expect(linkHref({ href: '/about', locale: 'ja', i18n: prefixed, ...page('en') })).toBe('/ja/about')
    expect(linkHref({ href: '/', locale: 'ja', i18n: prefixed, ...page('en') })).toBe('/ja')
  })

  it('leaves the path without a locale with locale false, with or without i18n', () => {
    expect(linkHref({ href: '/about', locale: false, ...page('en') })).toBe('/about')
    expect(linkHref({ href: '/about/', locale: false, i18n: prefixed, ...page('en') })).toBe('/about')
  })

  it('keeps the query and the hash, and removes trailing slashes', () => {
    expect(linkHref({ href: '/about/?x=1#top', i18n, ...page('en') })).toBe('/en/about?x=1#top')
    expect(linkHref({ href: '/#top', locale: 'ja', i18n, ...page('en') })).toBe('/#top')
  })

  it('adds the base to the link', () => {
    const base = '/docs/'
    expect(linkHref({ href: '/about', i18n, ...page('en', base) })).toBe('/docs/en/about')
    expect(linkHref({ href: '/about', i18n, ...page(undefined, base) })).toBe('/docs/about')
    expect(linkHref({ href: '/', i18n, ...page(undefined, base) })).toBe('/docs')
    expect(linkHref({ href: '/', locale: 'en', i18n, ...page(undefined, base) })).toBe('/docs/en')
    expect(linkHref({ href: '/about', locale: 'ja', i18n, ...page('en', base) })).toBe('/docs/about')
    expect(linkHref({ href: '/about?x=1#top', locale: 'en', i18n, ...page(undefined, base) })).toBe('/docs/en/about?x=1#top')
    expect(linkHref({ href: '/about', locale: false, ...page('en', base) })).toBe('/docs/about')
    // href is a path of the site, without the base: /docs here is a page of the site
    expect(linkHref({ href: '/docs/intro', i18n, ...page(undefined, '/docs') })).toBe('/docs/docs/intro')
  })

  it('returns hrefs that are not paths on the site unchanged, without the base', () => {
    for (const href of ['https://example.com/about', 'mailto:a@example.com', '//cdn.example.com/x', '#top', '?page=2']) {
      expect(linkHref({ href, locale: 'en', i18n, ...page(undefined, '/docs') })).toBe(href)
      expect(linkHref({ href, i18n, ...page('en', '/docs') })).toBe(href)
    }
  })

  it('throws without i18n, unless locale is false', () => {
    const error = '[i18n] A Link needs the i18n prop, the result of define(): <Link i18n={i18n} ...>.'
    expect(() => linkHref({ href: '/about', locale: 'en', ...page(undefined) })).toThrow(error)
    expect(() => linkHref({ href: '/about', ...page('en') })).toThrow(error)
  })

  it('throws for an unknown or empty locale, also of the current page', () => {
    expect(() => linkHref({ href: '/about', locale: 'fr', i18n, ...page(undefined) })).toThrow('[i18n] Unknown locale "fr".')
    expect(() => linkHref({ href: '/about', locale: '', i18n, ...page(undefined) })).toThrow('[i18n] Unknown locale "".')
    expect(() => linkHref({ href: '/about', i18n, ...page('fr') })).toThrow('[i18n] Unknown locale "fr".')
  })

  it('throws for a relative href', () => {
    expect(() => linkHref({ href: 'about', i18n, ...page(undefined) })).toThrow('[i18n] href must be a pathname starting with "/"')
    expect(() => linkHref({ href: 'about', locale: false, ...page(undefined) })).toThrow('[i18n] href must be a pathname starting with "/"')
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

  it('renders the link for the locale of the current page from its params', async () => {
    expect(href(await render({ href: '/about', i18n }, '/en/page', { params: { locale: 'en' } }))).toBe('/en/about')
    expect(href(await render({ href: '/about', i18n }, '/page', { params: { locale: undefined } }))).toBe('/about')
    expect(href(await render({ href: '/about', i18n: prefixed }, '/ja/page', { params: { locale: 'ja' } }))).toBe('/ja/about')
  })

  it('builds the link from the config, not from the form of the current URL', async () => {
    // The rewrite mode: the locale is in the locals, whatever the URL is
    expect(href(await render({ href: '/about', i18n: prefixed }, '/page', { locals: { locale: 'ja', originalPathname: '/page' } }))).toBe('/ja/about')
    expect(href(await render({ href: '/about', i18n }, '/page', { locals: { locale: 'ja', originalPathname: '/ja/page' } }))).toBe('/about')
    expect(href(await render({ href: '/about', i18n }, '/page', { locals: { locale: 'en', originalPathname: '/page' } }))).toBe('/en/about')
  })

  it('renders a link for a locale, without a prefix for the default locale', async () => {
    expect(href(await render({ href: '/about', locale: 'ja', i18n }, '/en/page', { params: { locale: 'en' } }))).toBe('/about')
    expect(href(await render({ href: '/about', locale: 'en', i18n }, '/page'))).toBe('/en/about')
  })

  it('passes the other attributes and the slot to the a element', async () => {
    const html = await render({ href: '/about', class: 'nav', 'aria-current': 'page', i18n }, '/page')
    expect(html).toContain('class="nav"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('>Text')
    expect(html).not.toContain('i18n')
  })

  it('throws without i18n, unless locale is false', async () => {
    await expect(render({ href: '/about', locale: 'en' }, '/page')).rejects.toThrow('[i18n] A Link needs the i18n prop')
    await expect(render({ href: '/about' }, '/page')).rejects.toThrow('[i18n] A Link needs the i18n prop')
    expect(href(await render({ href: '/about', locale: false }, '/en/page', { params: { locale: 'en' } }))).toBe('/about')
  })
})
