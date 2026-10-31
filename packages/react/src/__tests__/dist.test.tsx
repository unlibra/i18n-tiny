// Uses the built package, as an app does: run `pnpm build` first. The two
// entry points, the main one and ./internal, are separate files, and must
// share one React context.
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { define } from '../../dist/index.js'
import { I18nProvider, useLocale, useTranslations } from '../../dist/components.js'

const messages = { en: { title: 'Hello' }, ja: { title: 'こんにちは' } }

describe('the built entry points', () => {
  const i18n = define({ locales: ['en', 'ja'], defaultLocale: 'en', messages })

  it('read the Provider of the main entry with the hooks of ./internal', () => {
    function Content () {
      const t = useTranslations()
      return <p>{useLocale()}: {t('title')}</p>
    }
    render(<i18n.Provider locale="ja" messages={messages.ja}><Content /></i18n.Provider>)
    expect(screen.getByText('ja: こんにちは')).toBeInTheDocument()
  })

  it('read the Provider of ./internal with the hooks of the main entry', () => {
    function Content () {
      const t = i18n.useTranslations()
      return <p>{i18n.useLocale()}: {t('title')}</p>
    }
    render(
      <I18nProvider locale="en" messages={messages.en} locales={['en', 'ja']} defaultLocale="en">
        <Content />
      </I18nProvider>
    )
    expect(screen.getByText('en: Hello')).toBeInTheDocument()
  })
})
