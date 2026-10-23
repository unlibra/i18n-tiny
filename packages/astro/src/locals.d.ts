/**
 * Type definitions for Astro.locals used by @i18n-tiny/astro middleware
 *
 * The middleware sets `locales` in every routing mode, and `locale` and
 * `originalPathname` only in routing: 'rewrite' mode.
 */
declare namespace App {
  interface Locals {
    /** Current locale (only in 'rewrite' routing mode) */
    locale?: string
    /** Array of supported locales, for Link normalization (every routing mode) */
    locales?: readonly string[]
    /** Original pathname before rewrite (only in 'rewrite' routing mode) */
    originalPathname?: string
  }
}
