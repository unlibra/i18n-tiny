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

  it('keeps the locale of the current URL without locale', () => {
    expect(linkHref({ href: '/about', ...page('/en/page', 'en') })).toBe('/en/about')
    expect(linkHref({ href: '/about', ...page('/page', undefined) })).toBe('/about')
    expect(linkHref({ href: '/', ...page('/en', 'en') })).toBe('/en')
  })

  it('gives the default locale no prefix with locale', () => {
    expect(linkHref({ href: '/about', locale: 'ja', i18n, ...page('/en/page', 'en') })).toBe('/about')
    expect(linkHref({ href: '/', locale: 'ja', i18n, ...page('/en', 'en') })).toBe('/')
    expect(linkHref({ href: '/about', locale: 'en', i18n, ...page('/page', undefined) })).toBe('/en/about')
  })

  it('gives the default locale its prefix with prefixDefault', () => {
    expect(linkHref({ href: '/about', locale: 'ja', i18n: prefixed, ...page('/en/page', 'en') })).toBe('/ja/about')
  })

  it('builds the current page in another locale with normalize', () => {
    expect(linkHref({ href: '/en/about', locale: 'ja', normalize: true, i18n, ...page('/en/about', 'en') })).toBe('/about')
    expect(linkHref({ href: '/about', locale: 'en', normalize: true, i18n, ...page('/about', undefined) })).toBe('/en/about')
    expect(linkHref({ href: '/about/', locale: 'en', normalize: true, i18n, ...page('/about/', undefined) })).toBe('/en/about')
  })

  it('leaves the path without a locale with locale false', () => {
    expect(linkHref({ href: '/about', locale: false, ...page('/en/page', 'en') })).toBe('/about')
  })

  it('removes the base from the current URL and adds it to the link', () => {
    const base = '/docs/'
    expect(linkHref({ href: '/about', ...page('/docs/en/page', 'en', base) })).toBe('/docs/en/about')
    expect(linkHref({ href: '/about', ...page('/docs/page', undefined, base) })).toBe('/docs/about')
    expect(linkHref({ href: '/', ...page('/docs', undefined, base) })).toBe('/docs')
    expect(linkHref({ href: '/', locale: 'en', i18n, ...page('/docs', undefined, base) })).toBe('/docs/en')
    expect(linkHref({ href: '/about', locale: 'ja', i18n, ...page('/docs/en/page', 'en', base) })).toBe('/docs/about')
    expect(linkHref({ href: '/about?x=1#top', locale: 'en', i18n, ...page('/docs', undefined, base) })).toBe('/docs/en/about?x=1#top')
  })

  it('removes the base from href too with normalize', () => {
    const base = '/docs'
    expect(linkHref({ href: '/docs/en/about', locale: 'ja', normalize: true, i18n, ...page('/docs/en/about', 'en', base) })).toBe('/docs/about')
    expect(linkHref({ href: '/docs/about', locale: 'en', normalize: true, i18n, ...page('/docs/about', undefined, base) })).toBe('/docs/en/about')
    expect(linkHref({ href: '/docs', locale: 'en', normalize: true, i18n, ...page('/docs', undefined, base) })).toBe('/docs/en')
  })

  it('does not take a page under the base for the base without normalize', () => {
    // href is a path of the site, without the base: /docs here is a page of the site
    expect(linkHref({ href: '/docs/intro', ...page('/docs/page', undefined, '/docs') })).toBe('/docs/docs/intro')
  })

  it('returns hrefs that are not paths on the site unchanged, without the base', () => {
    for (const href of ['https://example.com/about', 'mailto:a@example.com', '//cdn.example.com/x', '#top', '?page=2']) {
      expect(linkHref({ href, locale: 'en', i18n, ...page('/docs/page', undefined, '/docs') })).toBe(href)
    }
  })

  it('throws without i18n for locale and normalize', () => {
    expect(() => linkHref({ href: '/about', locale: 'en', ...page('/page', undefined) }))
      .toThrow('[i18n] A Link with locale "en" needs the i18n prop, the result of define(): <Link i18n={i18n} ...>.')
    expect(() => linkHref({ href: '/about', normalize: true, ...page('/page', undefined) }))
      .toThrow('[i18n] A Link with normalize needs the i18n prop')
  })

  it('throws for an unknown or empty locale', () => {
    expect(() => linkHref({ href: '/about', locale: 'fr', i18n, ...page('/page', undefined) })).toThrow('[i18n] Unknown locale "fr".')
    expect(() => linkHref({ href: '/about', locale: '', i18n, ...page('/page', undefined) })).toThrow('[i18n] Unknown locale "".')
  })

  it('throws for a relative href', () => {
    expect(() => linkHref({ href: 'about', ...page('/page', undefined) })).toThrow('[i18n] href must be a pathname starting with "/"')
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

  it('renders a link that keeps the locale of the current page', async () => {
    expect(href(await render({ href: '/about' }, '/en/page', { params: { locale: 'en' } }))).toBe('/en/about')
    expect(href(await render({ href: '/about' }, '/page', { params: { locale: undefined } }))).toBe('/about')
  })

  it('renders a link for a locale with i18n, without a prefix for the default locale', async () => {
    expect(href(await render({ href: '/about', locale: 'ja', i18n }, '/en/page', { params: { locale: 'en' } }))).toBe('/about')
    expect(href(await render({ href: '/about', locale: 'en', i18n }, '/page'))).toBe('/en/about')
  })

  it('renders the current page in another locale with normalize', async () => {
    expect(href(await render({ href: '/en/about', locale: 'ja', normalize: true, i18n }, '/en/about', { params: { locale: 'en' } }))).toBe('/about')
  })

  it('reads the locale and the URL before the rewrite from the locals in the rewrite mode', async () => {
    const locals = { locale: 'en', originalPathname: '/en/page' }
    expect(href(await render({ href: '/about' }, '/page', { locals }))).toBe('/en/about')
  })

  it('passes the other attributes and the slot to the a element', async () => {
    const html = await render({ href: '/about', class: 'nav', 'aria-current': 'page' }, '/page')
    expect(html).toContain('class="nav"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('>Text')
    expect(html).not.toContain('i18n')
    expect(html).not.toContain('normalize')
  })

  it('throws without i18n for a locale', async () => {
    await expect(render({ href: '/about', locale: 'en' }, '/page')).rejects.toThrow('[i18n] A Link with locale "en" needs the i18n prop')
  })
})
