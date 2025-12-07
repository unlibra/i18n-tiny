import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { define } from '../index.react-client'
import { Link } from '../router'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/')
}))

const enMessages = {
  common: {
    title: 'Title'
  },
  nested: {
    child: 'Child'
  }
}

const jaMessages = {
  common: {
    title: 'タイトル'
  },
  nested: {
    child: '子'
  }
}

const i18n = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})

describe('Edge Cases & Bug Fixes', () => {
  describe('getTranslations (Object Access Safety)', () => {
    it('should NOT return [object Object] when accessing an object key', async () => {
      const t = await i18n.server.getTranslations('en')
      const result = t('nested')
      
      // We expect it to return the key itself or empty string, but definitely NOT [object Object]
      // Current implementation returns [object Object], so this test captures the desired behavior
      expect(result).not.toBe('[object Object]')
      expect(result).toBe('nested') // Or whatever fallback strategy we decide (key name is a good fallback)
    })
  })

  describe('Link (Path Handling)', () => {
    it('should use explicit locale prop to generate path with prefix', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/home')

      const messages = await i18n.server.getMessages('ja')
      render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="/about" locale="ja">About</Link>
        </i18n.Provider>
      )
      const link = screen.getByText('About')
      expect(link.closest('a')).toHaveAttribute('href', '/ja/about')
    })

    it('should handle relative paths correctly by adding a leading slash', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/ja/home')

      const messages = await i18n.server.getMessages('ja')
      render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="about">About</Link>
        </i18n.Provider>
      )
      const link = screen.getByText('About')
      expect(link.closest('a')).toHaveAttribute('href', '/ja/about')
    })

    it('should handle root path correctly when URL has prefix', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/ja/home')

      const messages = await i18n.server.getMessages('ja')
      render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="/">Home</Link>
        </i18n.Provider>
      )
      const link = screen.getByText('Home')
      expect(link.closest('a')).toHaveAttribute('href', '/ja')
    })

    it('should not add prefix when URL has no prefix', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/home')

      const messages = await i18n.server.getMessages('ja')
      render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="/">Home</Link>
        </i18n.Provider>
      )
      const link = screen.getByText('Home')
      expect(link.closest('a')).toHaveAttribute('href', '/')
    })
  })
})
