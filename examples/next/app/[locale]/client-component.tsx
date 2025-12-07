'use client'

import { useState } from 'react'
import { useTranslations, Link, useLocale, useMessages } from '@/i18n'

export default function ClientComponent() {
  const t = useTranslations()
  const locale = useLocale()
  const messages = useMessages()
  const [count, setCount] = useState(0)

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
    textDecoration: 'none',
    display: 'inline-block'
  })

  return (
    <div>
      <h2>{messages.home.clientComponent}</h2>

      {/* Locale Display */}
      <p>{t('common.currentLocale', { locale })}</p>

      {/* Counter with Interpolation */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setCount(c => c + 1)} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem' }}>
          {messages.home.increment}
        </button>
        <span>{t('home.counter', { count })}</span>
      </div>

      {/* Navigation - auto-localized */}
      <div style={{ marginTop: '2rem' }}>
        <Link href="/about" style={{ color: '#007bff', marginRight: '1rem' }}>
          {messages.nav.about}
        </Link>
      </div>

      {/* Language Buttons */}
      <div style={{ marginTop: '2rem' }}>
        {/* Auto-detect: goes to / which redirects based on browser language */}
        <Link href="/" locale='' style={buttonStyle(false)}>
          Auto
        </Link>
        <Link href="/" locale="en" style={buttonStyle(locale === 'en')}>
          English
        </Link>
        <Link href="/" locale="ja" style={buttonStyle(locale === 'ja')}>
          日本語
        </Link>
      </div>
    </div>
  )
}
