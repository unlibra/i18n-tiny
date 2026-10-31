import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMessages, i18n, isLocale, Link } from '@/i18n'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const messages = await getMessages(locale)

  return {
    title: messages.about.title,
    // Relative URLs: Next.js joins them to metadataBase, which carries the
    // basePath when there is one
    metadataBase: new URL('https://example.com'),
    alternates: {
      languages: Object.fromEntries(i18n.locales.map((l) => [l, i18n.localizedPath('/about', l)]))
    }
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const messages = await getMessages(locale)

  return (
    <main style={{ padding: '2rem' }}>
      <h1>{messages.about.title}</h1>
      <p>{messages.about.description}</p>

      <div style={{ marginTop: '2rem' }}>
        <Link href="/" style={{ color: '#007bff' }}>
          {messages.nav.home}
        </Link>
      </div>
    </main>
  )
}
