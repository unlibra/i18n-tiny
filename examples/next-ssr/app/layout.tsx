import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Link, Provider, getMessages } from '@/i18n'
import { getLocale } from '@/locale'

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages(await getLocale())

  return {
    title: {
      template: `%s | ${messages.common.title}`,
      default: messages.common.title
    },
    description: messages.common.description
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} messages={messages}>
          <div style={{ padding: '2rem' }}>
            <nav style={{ marginBottom: '2rem' }}>
              <Link href="/" style={{ marginRight: '1rem' }}>{messages.nav.home}</Link>
              <Link href="/about">{messages.nav.about}</Link>
            </nav>
            {children}
          </div>
        </Provider>
      </body>
    </html>
  )
}
