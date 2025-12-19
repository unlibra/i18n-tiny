import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'i18n-tiny',
  tagline: 'Tiny i18n library for modern frameworks',
  favicon: 'img/logo.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://unlibra.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/i18n-tiny/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'unlibra', // Usually your GitHub org/user name.
  projectName: 'i18n-tiny', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/unlibra/i18n-tiny/tree/main/website/',
        },
        blog: false,
        sitemap: {
          lastmod: null,
          changefreq: null,
          priority: null,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 5,
    },
    // Replace with your project's social card
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'i18n-tiny',
      logo: {
        alt: 'i18n-tiny Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'nextSidebar',
          position: 'left',
          label: 'Next.js',
        },
        {
          type: 'docSidebar',
          sidebarId: 'astroSidebar',
          position: 'left',
          label: 'Astro',
        },
        {
          type: 'docSidebar',
          sidebarId: 'reactSidebar',
          position: 'left',
          label: 'React',
        },
        {
          type: 'dropdown',
          label: 'NPM',
          position: 'right',
          items: [
            {
              label: '@i18n-tiny/next',
              href: 'https://www.npmjs.com/package/@i18n-tiny/next',
            },
            {
              label: '@i18n-tiny/astro',
              href: 'https://www.npmjs.com/package/@i18n-tiny/astro',
            },
            {
              label: '@i18n-tiny/react',
              href: 'https://www.npmjs.com/package/@i18n-tiny/react',
            },
          ],
        },
        {
          href: 'https://github.com/unlibra/i18n-tiny',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Next.js',
              to: '/next/introduction',
            },
            {
              label: 'Astro',
              to: '/astro/introduction',
            },
            {
              label: 'React',
              to: '/react/introduction',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/unlibra/i18n-tiny',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} unlibra. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
