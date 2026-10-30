/**
 * @i18n-tiny/next/router
 *
 * Routing utilities for Next.js i18n. The URL functions work in Server and
 * Client Components; the Link is a Client Component.
 */

// Components: a module of its own with "use client", kept apart in the build
export { Link } from './Link.js'

// The URL functions of @i18n-tiny/core/router, which take the config object
export { localizedPath, alternatePath, removeLocalePrefix, pathLocale } from '@i18n-tiny/core/router'
export type { I18nConfig } from '@i18n-tiny/core'
