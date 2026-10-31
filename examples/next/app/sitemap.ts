import type { MetadataRoute } from 'next'
import { localizedPath } from '@i18n-tiny/next/router'
import { config } from '@/i18n.config'

// The site and the basePath, if any
const site = 'https://example.com'

// The URL functions of the router take the locale settings only, so the
// sitemap does not load the messages
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/about'].flatMap((path) => config.locales.map((locale) => ({
    url: site + localizedPath(path, locale, config)
  })))
}
