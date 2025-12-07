/**
 * Type definitions for Astro.locals used by @i18n-tiny/astro middleware
 *
 * These properties are set by the middleware when using routing: 'rewrite' mode
 * or standard routing mode.
 */
declare namespace App {
  interface Locals {
    /** Current locale detected or set by the middleware */
    locale?: string
    /** Array of supported locales (for Link component normalization) */
    locales?: readonly string[]
    /** Original pathname before rewrite (only in 'rewrite' routing mode) */
    originalPathname?: string
  }
}
