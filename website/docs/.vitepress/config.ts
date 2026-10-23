import { defineConfig } from 'vitepress'

// Published under https://docs.unlibra.com/i18n-tiny/ as the GitHub Pages
// site of this repository (see .github/workflows/deploy-website.yml).
const SITE_URL = 'https://docs.unlibra.com/i18n-tiny/'

// Pages under each top-level directory document one framework package.
// The framework goes into the title, since the pages share their names.
const FRAMEWORKS: Record<string, string> = {
  next: 'Next.js',
  astro: 'Astro',
  react: 'React'
}

export default defineConfig({
  lang: 'en',
  title: 'i18n-tiny',
  description: 'Tiny, type-safe, zero-dependency i18n library for Next.js, Astro and React.',
  base: '/i18n-tiny/',
  cleanUrls: true,
  // Also feeds <lastmod> in the sitemap; the deploy workflow fetches the full
  // git history for it.
  lastUpdated: true,

  sitemap: {
    hostname: SITE_URL
  },

  transformPageData(pageData, { siteConfig }) {
    const framework = FRAMEWORKS[pageData.relativePath.split('/')[0]]
    // Titles phrased as a problem already name the framework.
    const frameworkSuffix =
      framework && !pageData.title.includes(framework) ? ` - ${framework}` : ''
    if (framework) {
      pageData.titleTemplate = `:title${frameworkSuffix} | i18n-tiny`
    }

    // Matches the URLs cleanUrls serves: "foo/index.md" -> "foo/", "foo.md" -> "foo".
    const url = SITE_URL + pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const title = pageData.title + frameworkSuffix
    const description = pageData.frontmatter.description ?? siteConfig.site.description
    const head = (pageData.frontmatter.head ??= [])
    head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }]
    )

    if (pageData.relativePath === 'index.md') {
      head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: 'i18n-tiny',
          description,
          url: SITE_URL,
          codeRepository: 'https://github.com/unlibra/i18n-tiny',
          programmingLanguage: 'TypeScript',
          runtimePlatform: ['Next.js', 'Astro', 'React'],
          license: 'https://opensource.org/licenses/MIT'
        })
      ])
    }
  },

  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'i18n-tiny' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    // The shared unlibra symbol, served from the root of docs.unlibra.com.
    ['link', { rel: 'icon', type: 'image/svg+xml', href: 'https://docs.unlibra.com/brand/symbol.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..700&family=Noto+Sans+JP:wght@400..700&display=swap'
      }
    ]
  ],

  themeConfig: {
    // A full URL: a site path would get this site's base prepended.
    logo: 'https://docs.unlibra.com/brand/symbol.svg',

    nav: [
      { text: 'Next.js', link: '/next/introduction', activeMatch: '^/next/' },
      { text: 'Astro', link: '/astro/introduction', activeMatch: '^/astro/' },
      { text: 'React', link: '/react/introduction', activeMatch: '^/react/' },
      {
        text: 'NPM',
        items: [
          { text: '@i18n-tiny/next', link: 'https://www.npmjs.com/package/@i18n-tiny/next' },
          { text: '@i18n-tiny/astro', link: 'https://www.npmjs.com/package/@i18n-tiny/astro' },
          { text: '@i18n-tiny/react', link: 'https://www.npmjs.com/package/@i18n-tiny/react' }
        ]
      }
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/unlibra/i18n-tiny' }],

    sidebar: {
      '/next/': [
        { text: 'Introduction', link: '/next/introduction' },
        { text: 'Installation', link: '/next/installation' },
        { text: 'Usage', link: '/next/usage' },
        {
          text: 'API Reference',
          link: '/next/api-reference/',
          collapsed: false,
          items: [
            { text: 'Core', link: '/next/api-reference/core' },
            { text: 'Proxy', link: '/next/api-reference/proxy' },
            { text: 'Router', link: '/next/api-reference/router' }
          ]
        },
        {
          text: 'TIPS',
          link: '/next/tips/',
          collapsed: false,
          items: [
            { text: 'Static Site Generation (SSG)', link: '/next/tips/ssg' },
            { text: 'Language Switcher', link: '/next/tips/language-switcher' }
          ]
        }
      ],
      '/astro/': [
        { text: 'Introduction', link: '/astro/introduction' },
        { text: 'Installation', link: '/astro/installation' },
        { text: 'Usage', link: '/astro/usage' },
        {
          text: 'API Reference',
          link: '/astro/api-reference/',
          collapsed: false,
          items: [
            { text: 'Core', link: '/astro/api-reference/core' },
            { text: 'Middleware', link: '/astro/api-reference/middleware' },
            { text: 'Integration', link: '/astro/api-reference/integration' },
            { text: 'Router', link: '/astro/api-reference/router' }
          ]
        },
        {
          text: 'TIPS',
          link: '/astro/tips/',
          collapsed: false,
          items: [
            { text: 'TypeScript Support', link: '/astro/tips/typescript' },
            { text: 'Language Switcher', link: '/astro/tips/language-switcher' },
            { text: "Using with Astro's Built-in i18n", link: '/astro/tips/built-in-i18n' }
          ]
        }
      ],
      '/react/': [
        { text: 'Introduction', link: '/react/introduction' },
        { text: 'Installation', link: '/react/installation' },
        { text: 'Usage', link: '/react/usage' },
        { text: 'API Reference', link: '/react/api-reference' }
      ]
    },

    search: {
      provider: 'local'
    },

    outline: [2, 5],

    editLink: {
      pattern: 'https://github.com/unlibra/i18n-tiny/edit/main/website/docs/:path'
    }
  }
})
