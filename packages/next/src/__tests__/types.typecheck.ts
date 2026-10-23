// Type-level checks for define(), run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import { define as defineClient } from '../index.react-client'
import { define as defineServer } from '../index.react-server'

const config = {
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en' as const,
  messages: {
    en: { common: { title: 'Hello', nested: { deep: 'Deep' } }, top: 'Top' },
    ja: { common: { title: 'こんにちは', nested: { deep: '深い' } }, top: 'トップ' }
  }
}

for (const i18n of [defineClient(config), defineServer(config)]) {
  void (async () => {
    const t = await i18n.server.getTranslations('en')
    t('common.title')
    // @ts-expect-error unknown key
    t('common.missing')

    const common = await i18n.server.getTranslations('en', 'common')
    common('title')
    common('nested.deep')
    // @ts-expect-error with a namespace, keys are relative to it
    common('common.title')

    // @ts-expect-error a namespace must point to an object, not a string
    await i18n.server.getTranslations('en', 'top')
  })()
}

export function useClientTypeChecks () {
  const i18n = defineClient(config)
  const common = i18n.client.useTranslations('common')
  common('title')
  // @ts-expect-error with a namespace, keys are relative to it
  common('common.title')
  // @ts-expect-error unknown namespace
  i18n.client.useTranslations('missing')
}
