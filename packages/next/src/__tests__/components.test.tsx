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
    title: 'Title',
    greeting: 'Hello World'
  },
  nav: {
    home: 'Home',
    about: 'About'
  }
}

const jaMessages = {
  common: {
    title: 'タイトル',
    greeting: 'こんにちは世界'
  },
  nav: {
    home: 'ホーム',
    about: '概要'
  }
}

const i18n = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: { en: enMessages, ja: jaMessages }
})

describe('Provider', () => {
  it('should provide i18n context to children', async () => {
    const messages = await i18n.server.getMessages('en')

    function TestComponent() {
      const msgs = i18n.client.useMessages()
      return <div>{msgs.common.title}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('should work with Japanese locale', async () => {
    const messages = await i18n.server.getMessages('ja')

    function TestComponent() {
      const msgs = i18n.client.useMessages()
      return <div>{msgs.common.title}</div>
    }

    render(
      <i18n.Provider locale="ja" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('タイトル')).toBeInTheDocument()
  })
})

describe('useMessages', () => {
  it('should return messages from context', async () => {
    const messages = await i18n.server.getMessages('en')

    function TestComponent() {
      const msgs = i18n.client.useMessages()
      return (
        <div>
          <div data-testid="title">{msgs.common.title}</div>
          <div data-testid="greeting">{msgs.common.greeting}</div>
        </div>
      )
    }

    render(
      <i18n.Provider locale="en" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByTestId('title')).toHaveTextContent('Title')
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello World')
  })
})

describe('useTranslations', () => {
  it('should return translation function', async () => {
    const messages = await i18n.server.getMessages('en')

    function TestComponent() {
      const t = i18n.client.useTranslations()
      return <div>{t('common.title')}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('should handle nested keys', async () => {
    const messages = await i18n.server.getMessages('en')

    function TestComponent() {
      const t = i18n.client.useTranslations()
      return <div>{t('nav.home')}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('should return key when translation is missing', async () => {
    const messages = await i18n.server.getMessages('en')

    function TestComponent() {
      const t = i18n.client.useTranslations()
      // @ts-expect-error Testing non-existent key
      return <div>{t('nonexistent.key')}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('nonexistent.key')).toBeInTheDocument()
  })

  it('should support namespace', async () => {
    const messages = await i18n.server.getMessages('en')

    function TestComponent() {
      const t = i18n.client.useTranslations('nav')
      // @ts-expect-error Testing namespace with partial key
      return <div>{t('home')}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})

describe('useLocale', () => {
  it('should return current locale', async () => {
    const messages = await i18n.server.getMessages('en')

    function TestComponent() {
      const locale = i18n.client.useLocale()
      return <div>{locale}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('en')).toBeInTheDocument()
  })
})

describe('Link', () => {
  it('should add locale prefix when current URL has prefix', async () => {
    // Mock pathname with locale prefix
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/ja/home')

    const messages = await i18n.server.getMessages('ja')

    render(
      <i18n.Provider locale="ja" messages={messages}>
        <Link href="/about">About</Link>
      </i18n.Provider>
    )

    const link = screen.getByText('About')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/ja/about')
  })

  it('should not add prefix when current URL has no prefix', async () => {
    // Mock pathname without locale prefix
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/home')

    const messages = await i18n.server.getMessages('en')

    render(
      <i18n.Provider locale="en" messages={messages}>
        <Link href="/about">About</Link>
      </i18n.Provider>
    )

    const link = screen.getByText('About')
    expect(link.closest('a')).toHaveAttribute('href', '/about')
  })

  it('should not add prefix for non-default locale when URL has no prefix', async () => {
    // Mock pathname without locale prefix (Accept-Language detected locale)
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/home')

    const messages = await i18n.server.getMessages('ja')

    render(
      <i18n.Provider locale="ja" messages={messages}>
        <Link href="/about">About</Link>
      </i18n.Provider>
    )

    // Even with ja locale, URL has no prefix → links have no prefix
    const link = screen.getByText('About')
    expect(link.closest('a')).toHaveAttribute('href', '/about')
  })
})
