import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { define } from '../index'

const messages = {
  en: {
    common: {
      title: 'Hello',
      description: 'World'
    },
    nested: {
      deep: {
        value: 'Deep Value'
      }
    }
  },
  ja: {
    common: {
      title: 'こんにちは',
      description: '世界'
    },
    nested: {
      deep: {
        value: '深い値'
      }
    }
  }
} as const

const locales = ['en', 'ja'] as const

describe('define', () => {
  it('should create i18n instance with proper structure', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    expect(i18n).toHaveProperty('Provider')
    expect(i18n).toHaveProperty('useMessages')
    expect(i18n).toHaveProperty('useTranslations')
    expect(i18n).toHaveProperty('useLocale')
    expect(i18n).toHaveProperty('locales')
    expect(i18n).toHaveProperty('defaultLocale')
    // Note: messages is NOT included in return value - accessed via hooks only
    expect(i18n).not.toHaveProperty('messages')
  })

  it('should expose locales and defaultLocale', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    expect(i18n.locales).toEqual(['en', 'ja'])
    expect(i18n.defaultLocale).toBe('en')
  })

  it('should render with Provider and useMessages', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    function TestComponent () {
      const msgs = i18n.useMessages()
      return <div>{msgs.common.title}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages.en}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should work with useTranslations', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    function TestComponent () {
      const t = i18n.useTranslations()
      return <div>{t('common.title')}</div>
    }

    render(
      <i18n.Provider locale="ja" messages={messages.ja}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('こんにちは')).toBeInTheDocument()
  })

  it('should work with useLocale', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    function TestComponent () {
      const locale = i18n.useLocale()
      return <div>Locale: {locale}</div>
    }

    render(
      <i18n.Provider locale="ja" messages={messages.ja}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Locale: ja')).toBeInTheDocument()
  })

  it('should support nested translations', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    function TestComponent () {
      const t = i18n.useTranslations()
      return <div>{t('nested.deep.value')}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages.en}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Deep Value')).toBeInTheDocument()
  })

  it('should return supported locales via useLocales', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    function TestComponent () {
      const supportedLocales = i18n.useLocales()
      return <div data-testid="locales">{JSON.stringify(supportedLocales)}</div>
    }

    render(
      <i18n.Provider locale="en" messages={messages.en}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByTestId('locales')).toHaveTextContent('["en","ja"]')
  })

  it('should return default locale via useDefaultLocale', () => {
    const i18n = define({
      locales,
      defaultLocale: 'en',
      messages
    })

    function TestComponent () {
      const defaultLoc = i18n.useDefaultLocale()
      return <div>Default: {defaultLoc}</div>
    }

    render(
      <i18n.Provider locale="ja" messages={messages.ja}>
        <TestComponent />
      </i18n.Provider>
    )

    expect(screen.getByText('Default: en')).toBeInTheDocument()
  })
})
