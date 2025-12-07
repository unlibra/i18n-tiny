import { describe, expect, it } from 'vitest'
import { define } from '../index.react-server'

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

describe('Server version - define()', () => {
  it('should create i18n instance with correct configuration', () => {
    const i18n = define({
      locales: ['en', 'ja'] as const,
      defaultLocale: 'en',
      messages: { en: enMessages, ja: jaMessages }
    })

    expect(i18n.Provider).toBeDefined()
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
  })

  describe('client APIs should throw errors', () => {
    it('useMessages should throw', () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      expect(() => i18n.client.useMessages()).toThrow('useMessages is not available in Server Components')
    })

    it('useTranslations should throw', () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      expect(() => i18n.client.useTranslations()).toThrow('useTranslations is not available in Server Components')
    })

    it('useLocale should throw', () => {
      const i18n = define({
        locales: ['en', 'ja'] as const,
        defaultLocale: 'en',
        messages: { en: enMessages, ja: jaMessages }
      })

      expect(() => i18n.client.useLocale()).toThrow('useLocale is not available in Server Components')
    })
  })
})
