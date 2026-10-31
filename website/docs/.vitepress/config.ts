import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type PageData } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

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

// FAQPage structured data built from the page's own "## Question" sections,
// so it always matches the text that readers see.
function faqPage(markdown: string) {
  const sections = markdown.replace(/^---\n[\s\S]*?\n---\n/, '').split(/^## /m).slice(1)
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.map((section) => {
      const [question, ...answer] = section.split('\n')
      return {
        '@type': 'Question',
        name: toPlainText(question),
        acceptedAnswer: { '@type': 'Answer', text: toPlainText(answer.join('\n')) }
      }
    })
  }
}

const AUTHOR = { '@type': 'Person', name: 'unlibra', url: 'https://unlibra.com' }

function techArticle(pageData: PageData, url: string, title: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url,
    inLanguage: 'en',
    author: AUTHOR,
    isPartOf: { '@type': 'WebSite', name: 'i18n-tiny', url: SITE_URL },
    ...(pageData.lastUpdated ? { dateModified: new Date(pageData.lastUpdated).toISOString() } : {})
  }
}

function toPlainText(markdown: string) {
  return markdown
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1') // keep the code, drop the fences
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // keep the link text
    .replace(/^\|?[\s|:-]+\|?$/gm, '') // drop table separator rows
    .replace(/[`*]/g, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

  // Generates llms.txt, llms-full.txt and a Markdown copy of each page, for
  // coding agents and other LLM tools that read the docs.
  vite: {
    plugins: [
      llmstxt({
        domain: 'https://docs.unlibra.com',
        // The hint is hidden text on the home page, which search engines may
        // treat as cloaking. Pages still link to llms.txt in their <head>.
        injectLLMHint: false,
        // These index pages only list links to their child pages, which llms.txt
        // lists anyway. Their Markdown copies move up a level, which would break
        // their relative links.
        ignoreFiles: ['*/api-reference/index.md', '*/tips/index.md'],
        // The site has one sidebar per framework. Group llms.txt by framework
        // too, so the repeated "API Reference" and "TIPS" sections stay apart.
        // Keep every group one level deep: the plugin drops the base path from
        // links in nested groups.
        sidebar: (sidebar) =>
          sidebar && !Array.isArray(sidebar)
            ? Object.entries(sidebar).flatMap(([prefix, items]) => {
                const framework = FRAMEWORKS[prefix.replaceAll('/', '')]
                const pages = Array.isArray(items) ? items : items.items
                return [
                  { text: framework, items: pages.filter((page) => !page.items) },
                  ...pages
                    .filter((page) => page.items)
                    .map((group) => ({
                      text: `${framework} ${group.text}`,
                      items: group.items
                    }))
                ]
              })
            : sidebar
      })
    ]
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
          license: 'https://opensource.org/licenses/MIT',
          author: AUTHOR,
          sameAs: [
            'https://www.npmjs.com/package/@i18n-tiny/next',
            'https://www.npmjs.com/package/@i18n-tiny/astro',
            'https://www.npmjs.com/package/@i18n-tiny/react'
          ]
        })
      ])
    } else {
      // Tells search engines and AI answer engines who wrote each page, what
      // it belongs to and when it last changed (lastUpdated is the date of
      // the page's last commit).
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(techArticle(pageData, url, title, description))])
    }

    if (pageData.relativePath === 'faq.md') {
      const markdown = readFileSync(join(siteConfig.srcDir, pageData.relativePath), 'utf-8')
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(faqPage(markdown))])
    }
  },

  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'i18n-tiny' }],
    // The same OGP image as unlibra.com, for every site on docs.unlibra.com.
    ['meta', { property: 'og:image', content: 'https://unlibra.com/ogp.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    // The shared unlibra icons, served from the root of docs.unlibra.com.
    ['link', { rel: 'icon', href: 'https://docs.unlibra.com/favicon.ico', sizes: '32x32' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: 'https://docs.unlibra.com/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: 'https://docs.unlibra.com/apple-touch-icon.png' }],
  ],

  themeConfig: {
    // A full URL: a site path would get this site's base prepended.
    // alt: the brand, read before the site title in the link.
    logo: { src: 'https://docs.unlibra.com/brand/symbol.svg', alt: 'unlibra' },

    nav: [
      { text: 'Next.js', link: '/next/introduction', activeMatch: '^/next/' },
      { text: 'Astro', link: '/astro/introduction', activeMatch: '^/astro/' },
      { text: 'React', link: '/react/introduction', activeMatch: '^/react/' },
      { text: 'FAQ', link: '/faq' },
      { text: 'Migrate from 1.x', link: 'https://github.com/unlibra/i18n-tiny/blob/main/MIGRATION.md' },
      { text: 'Donate', link: 'https://unlibra.com/donate' },
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
