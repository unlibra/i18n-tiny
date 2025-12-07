import type { Metadata } from 'next'
import { Link, Provider, getMessages, locales } from '@/i18n'
import { ReactNode } from 'react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages(locale)

  return {
    title: {
      template: `%s | ${messages.common.title}`,
      default: messages.common.title
    },
    description: messages.common.description
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function Layout({
  children,
  params
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages(locale)

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} messages={messages}>
          <div style={{ padding: '2rem' }}>
            <nav style={{ marginBottom: "2rem" }}>
              <Link href="/" style={{ marginRight: "1rem" }}>{messages.nav.home}</Link>
              <Link href="/about">{messages.nav.about}</Link>
            </nav>
            {children}
          </div>
        </Provider>
      </body>
    </html>
  )
}
