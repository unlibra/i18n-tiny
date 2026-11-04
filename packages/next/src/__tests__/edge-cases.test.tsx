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

    it('should leave hrefs that are not site paths unchanged', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/ja/home')

      const messages = await i18n.server.getMessages('ja')
      render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="https://github.com/x">External</Link>
          <Link href="#top">Top</Link>
          <Link href={{ query: { page: '2' } }}>Next page</Link>
        </i18n.Provider>
      )
      expect(screen.getByText('External').closest('a')).toHaveAttribute('href', 'https://github.com/x')
      expect(screen.getByText('Top').closest('a')).toHaveAttribute('href', '#top')
      expect(screen.getByText('Next page').closest('a')?.getAttribute('href')).not.toMatch(/^\/ja/)
    })

    it('should throw for a relative path', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/ja/home')

      const messages = await i18n.server.getMessages('ja')
      expect(() => render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="about">About</Link>
        </i18n.Provider>
      )).toThrow('[i18n] href must be a pathname starting with "/", got "about".')
    })

    // Browsers remove tabs and line breaks before reading a URL:
    // "/\t/evil.com" is read as "//evil.com"
    it('should throw for an href with a tab or a line break', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/ja/home')

      const messages = await i18n.server.getMessages('ja')
      for (const href of ['/\t/evil.com', '/\n/evil.com', '/\r\\evil.com']) {
        for (const locale of [undefined, false, 'en', 'ja'] as const) {
          expect(() => render(
            <i18n.Provider locale="ja" messages={messages}>
              <Link href={href} locale={locale}>Link</Link>
            </i18n.Provider>
          )).toThrow('contain a tab or a line break')
          expect(() => render(
            <i18n.Provider locale="ja" messages={messages}>
              <Link href={{ pathname: href }} locale={locale}>Link</Link>
            </i18n.Provider>
          )).toThrow('contain a tab or a line break')
        }
        expect(() => render(
          <i18n.Provider locale="ja" messages={messages}>
            <Link href={`/en${href}`} locale="ja" normalize>Link</Link>
          </i18n.Provider>
        )).toThrow('contain a tab or a line break')
      }
    })

    // With normalize, href is the current pathname, such as one that a request
    // for "//evil.com" gives: it must not become a link to that host
    it('should throw for an href that starts with "//" with normalize', async () => {
      const messages = await i18n.server.getMessages('ja')
      for (const href of ['//evil.com', '//evil.com/about']) {
        for (const locale of [undefined, false, 'en', 'ja'] as const) {
          expect(() => render(
            <i18n.Provider locale="ja" messages={messages}>
              <Link href={href} locale={locale} normalize>Link</Link>
            </i18n.Provider>
          )).toThrow('must not start with "//"')
          expect(() => render(
            <i18n.Provider locale="ja" messages={messages}>
              <Link href={{ pathname: href }} locale={locale} normalize>Link</Link>
            </i18n.Provider>
          )).toThrow('must not start with "//"')
        }
      }
    })

    it('should leave an href that starts with "//" as it is without normalize', async () => {
      const messages = await i18n.server.getMessages('ja')
      render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="//cdn.example.com/a" locale="en">CDN</Link>
        </i18n.Provider>
      )
      expect(screen.getByText('CDN').closest('a')).toHaveAttribute('href', '//cdn.example.com/a')
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

    it('should add the prefix of a non-default locale to the root path when URL has no prefix', async () => {
      const { usePathname } = await import('next/navigation')
      vi.mocked(usePathname).mockReturnValue('/home')

      const messages = await i18n.server.getMessages('ja')
      render(
        <i18n.Provider locale="ja" messages={messages}>
          <Link href="/">Home</Link>
        </i18n.Provider>
      )
      const link = screen.getByText('Home')
      expect(link.closest('a')).toHaveAttribute('href', '/ja')
    })
  })
})
