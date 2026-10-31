import type { Metadata } from 'next'
import { getMessages, Link } from '@/i18n'
import { getLocale } from '@/locale'

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages(await getLocale())

  return {
    title: messages.about.title
  }
}

export default async function AboutPage() {
  const messages = await getMessages(await getLocale())

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
