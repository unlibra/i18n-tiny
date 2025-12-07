import { getTranslations, getMessages } from '@/i18n'
import ClientComponent from './client-component'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations(locale)
  const messages = await getMessages(locale)

  return (
    <main>
      <div>
        <h2>{messages.home.serverComponent}</h2>
        <h1>{messages.home.welcome}</h1>
        <p>{messages.common.description}</p>
        <div style={{ marginTop: '1rem' }}>
          <h3>{t('home.greeting', { name: 'User' })}</h3>
        </div>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      <ClientComponent />
    </main>
  )
}
