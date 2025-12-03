import { describe, expect, it } from 'vitest'
import { define } from '../index'

const enMessages = {
  common: {
    hello: 'Hello',
    world: 'World'
  },
  nested: {
    deep: {
      value: 'Deep Value'
    }
  }
}

const jaMessages = {
  common: {
    hello: 'こんにちは',
    world: '世界'
  },
  nested: {
    deep: {
      value: '深い値'
    }
  }
}

describe('define()', () => {
  it('should create i18n instance with correct configuration', () => {
    const i18n = define({
      locales: ['en', 'ja'] as const,
      defaultLocale: 'en',
      messages: { en: enMessages, ja: jaMessages }
    })

    expect(i18n.Provider).toBeDefined()
    expect(i18n.Link).toBeDefined()
    expect(i18n.server).toBeDefined()
    expect(i18n.client).toBeDefined()
  })

  describe('server.getMessages()', () => {
    it('should return messages for specified locale', async () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      const messages = await i18n.server.getMessages('en')
      expect(messages.common.hello).toBe('Hello')
      expect(messages.common.world).toBe('World')
    })

    it('should return Japanese messages', async () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      const messages = await i18n.server.getMessages('ja')
      expect(messages.common.hello).toBe('こんにちは')
      expect(messages.common.world).toBe('世界')
    })
  })

  describe('server.getTranslations()', () => {
    it('should return translation function', async () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      const t = await i18n.server.getTranslations('en')
      expect(t('common.hello')).toBe('Hello')
      expect(t('common.world')).toBe('World')
    })

    it('should handle nested keys', async () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      const t = await i18n.server.getTranslations('en')
      expect(t('nested.deep.value')).toBe('Deep Value')
    })

    it('should return key when translation is missing', async () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      const t = await i18n.server.getTranslations('en')
      // @ts-expect-error Testing non-existent key
      expect(t('nonexistent.key')).toBe('nonexistent.key')
    })

    it('should support namespace', async () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      const t = await i18n.server.getTranslations('en', 'common')
      // @ts-expect-error Testing namespace with partial key
      expect(t('hello')).toBe('Hello')
      // @ts-expect-error Testing namespace with partial key
      expect(t('world')).toBe('World')
    })
  })
})
