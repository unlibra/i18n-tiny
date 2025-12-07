import type { Metadata } from 'next'
import { getMessages, Link } from '@/i18n'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const messages = await getMessages(locale)

  return {
    title: messages.about.title
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
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
