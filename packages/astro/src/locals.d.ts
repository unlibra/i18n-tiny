/**
 * Type definitions for Astro.locals used by @i18n-tiny/astro middleware
 *
 * The middleware sets `locale` and `originalPathname` only in routing:
 * 'rewrite' mode.
 */
declare namespace App {
  interface Locals {
    /** Current locale (only in 'rewrite' routing mode) */
    locale?: string
    /** Original pathname before rewrite (only in 'rewrite' routing mode) */
    originalPathname?: string
  }
}
