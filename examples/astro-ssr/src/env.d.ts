/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Set by the middleware on every page. The excluded paths (/api) have none */
    locale: import('./i18n').Locale
    /** The URL before the rewrite, set by the middleware */
    originalPathname?: string
  }
}
