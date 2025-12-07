/**
 * @i18n-tiny/astro/integration
 *
 * Astro Integration for automatic i18n static file generation
 */

import type { AstroIntegration } from 'astro'
import { cpSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Configuration for the i18n integration
 */
export interface I18nIntegrationConfig {
  /** Default locale - content from this locale will be copied to root */
  defaultLocale: string
  /**
   * Whether to prefix the default locale in URLs
   * - false (default): copies defaultLocale content to root (e.g., /ja/* → /*)
   * - true: no copying, all locales remain prefixed
   * @default false
   */
  prefixDefault?: boolean
}

/**
 * Creates an Astro integration for i18n static file generation
 *
 * When `prefixDefault` is false (default), this integration automatically
 * copies the default locale's content to the root after build.
 *
 * @example
 * ```typescript
 * // astro.config.mjs
 * import { defineConfig } from 'astro/config'
 * import { create } from '@i18n-tiny/astro/integration'
 *
 * export default defineConfig({
 *   integrations: [
 *     create({
 *       defaultLocale: 'ja',
 *       // prefixDefault: false (default) - copies /ja/* to /*
 *     })
 *   ]
 * })
 * ```
 *
 * This will generate:
 * - /index.html (copy of /ja/index.html)
 * - /en/index.html
 * - /ja/index.html
 */
export function create(config: I18nIntegrationConfig): AstroIntegration {
  const { defaultLocale, prefixDefault = false } = config

  return {
    name: '@i18n-tiny/astro',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        // Only process if prefixDefault is false
        if (prefixDefault) {
          logger.info('prefixDefault is true, skipping root content generation')
          return
        }

        const distPath = fileURLToPath(dir)
        const defaultLocalePath = join(distPath, defaultLocale)

        if (!existsSync(defaultLocalePath)) {
          logger.warn(`Default locale directory not found: ${defaultLocalePath}`)
          return
        }

        logger.info(`Copying /${defaultLocale}/* to root...`)

        // Copy all entries from defaultLocale directory to root using cpSync
        const entries = readdirSync(defaultLocalePath)
        for (const entry of entries) {
          const srcPath = join(defaultLocalePath, entry)
          const destPath = join(distPath, entry)
          cpSync(srcPath, destPath, { recursive: true, force: true })
        }

        logger.info(`Root content generated from /${defaultLocale}/`)
      }
    }
  }
}
