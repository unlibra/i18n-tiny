import { describe, it, expect } from 'vitest'
import { define } from '../index'

// Test messages
const enMessages = {
  common: {
    title: 'Hello',
    description: 'Welcome to our site'
  },
  nav: {
    home: 'Home',
    about: 'About'
  }
}

const jaMessages = {
  common: {
    title: 'こんにちは',
    description: 'サイトへようこそ'
  },
  nav: {
    home: 'ホーム',
    about: '概要'
  }
}

describe('define', () => {
  const i18n = define({
    locales: ['en', 'ja'] as const,
    defaultLocale: 'en',
    messages: { en: enMessages, ja: jaMessages }
  })

  describe('with optional locales/defaultLocale (for Astro official i18n)', () => {
    const i18nMinimal = define({
      messages: { en: enMessages, ja: jaMessages }
    })

    it('should infer locales from messages', () => {
      expect(i18nMinimal.locales).toEqual(['en', 'ja'])
    })

    it('should use first locale as default', () => {
      expect(i18nMinimal.defaultLocale).toBe('en')
    })

    it('should work with getMessages', () => {
      const messages = i18nMinimal.getMessages('ja') as typeof enMessages
      expect(messages.common.title).toBe('こんにちは')
    })

    it('should work with getTranslations', () => {
      const t = i18nMinimal.getTranslations('ja')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((t as any)('common.title')).toBe('こんにちは')
    })

    it('should use first locale when locale is undefined', () => {
      const messages = i18nMinimal.getMessages(undefined) as typeof enMessages
      expect(messages.common.title).toBe('Hello')
    })
  })

  describe('getMessages', () => {
    it('should return messages for specified locale', () => {
      const messages = i18n.getMessages('en')
      expect(messages.common.title).toBe('Hello')
    })

    it('should return messages for Japanese locale', () => {
      const messages = i18n.getMessages('ja')
      expect(messages.common.title).toBe('こんにちは')
    })

    it('should return default locale messages when locale is undefined', () => {
      const messages = i18n.getMessages(undefined)
      expect(messages.common.title).toBe('Hello')
    })
  })

  describe('getTranslations', () => {
    it('should return translation function', () => {
      const t = i18n.getTranslations('en')
      expect(t('common.title')).toBe('Hello')
    })

    it('should work with Japanese locale', () => {
      const t = i18n.getTranslations('ja')
      expect(t('common.title')).toBe('こんにちは')
    })

    it('should return default locale translations when locale is undefined', () => {
      const t = i18n.getTranslations(undefined)
      expect(t('common.title')).toBe('Hello')
    })

    it('should support namespace', () => {
      const t = i18n.getTranslations('en', 'common')
      // @ts-expect-error Testing namespace with partial key
      expect(t('title')).toBe('Hello')
    })

    it('should return key when translation is missing', () => {
      const t = i18n.getTranslations('en')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(t('missing.key' as any)).toBe('missing.key')
    })
  })

  describe('getLocalizedPath', () => {
    it('should not add prefix for default locale', () => {
      const path = i18n.getLocalizedPath('/about', 'en')
      expect(path).toBe('/about')
    })

    it('should add prefix for non-default locale', () => {
      const path = i18n.getLocalizedPath('/about', 'ja')
      expect(path).toBe('/ja/about')
    })

    it('should handle root path for non-default locale', () => {
      const path = i18n.getLocalizedPath('/', 'ja')
      expect(path).toBe('/ja')
    })

    it('should handle root path for default locale', () => {
      const path = i18n.getLocalizedPath('/', 'en')
      expect(path).toBe('/')
    })

    it('should avoid double prefixing', () => {
      const path = i18n.getLocalizedPath('/ja/about', 'ja')
      expect(path).toBe('/ja/about')
    })

    it('should use default locale when locale is undefined', () => {
      const path = i18n.getLocalizedPath('/about', undefined)
      expect(path).toBe('/about')
    })

    it('should handle paths without leading slash', () => {
      const path = i18n.getLocalizedPath('about', 'ja')
      expect(path).toBe('/ja/about')
    })
  })

  describe('returned config', () => {
    it('should expose locales', () => {
      expect(i18n.locales).toEqual(['en', 'ja'])
    })

    it('should expose defaultLocale', () => {
      expect(i18n.defaultLocale).toBe('en')
    })
  })
})
