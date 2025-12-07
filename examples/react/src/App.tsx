import { useState } from 'react'
import { defaultLocale, messages, Provider, useLocale, useMessages, useTranslations } from './i18n'
import type { Locale } from './i18n'

function App() {
  const [locale, setLocale] = useState(defaultLocale)

  // In a real app, you might load messages lazily
  const currentMessages = messages[locale]

  return (
    <Provider locale={locale} messages={currentMessages}>
      <PageContent onChangeLocale={setLocale} currentLocale={locale} />
    </Provider>
  )
}

function PageContent({ onChangeLocale, currentLocale }: { onChangeLocale: (locale: Locale) => void; currentLocale: Locale }) {
  const t = useTranslations()
  const locale = useLocale()
  const messages = useMessages()

  const buttonStyle = (isActive: boolean) => ({
    height: '2rem',
    padding: '0 1rem',
    fontSize: '1rem',
    lineHeight: '2rem',
    backgroundColor: isActive ? '#007bff' : '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    margin: '0.5rem',
  })

  return (
    <div style={{ padding: '2rem' }}>
      <h1>{messages.home.welcome}</h1>
      <p>{messages.common.description}</p>

      <hr style={{ margin: '2rem 0' }} />

      {/* Locale Display */}
      <p>{t('common.currentLocale', { locale })}</p>

      {/* Language Buttons */}
      <div>
        <button
          onClick={() => onChangeLocale('en')}
          style={buttonStyle(currentLocale === 'en')}
        >
          English
        </button>
        <button
          onClick={() => onChangeLocale('ja')}
          style={buttonStyle(currentLocale === 'ja')}
        >
          日本語
        </button>
      </div>

      {/* Interpolation Example */}
      <div style={{ marginTop: '1rem' }}>
        <h3>{t('home.greeting', { name: 'User' })}</h3>
      </div>
    </div>
  )
}

export default App
