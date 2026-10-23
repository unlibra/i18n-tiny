// Type-level checks for define(), run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import { define } from '../index'

const i18n = define({
  locales: ['en', 'ja'] as const,
  defaultLocale: 'en',
  messages: {
    en: { common: { title: 'Hello', nested: { deep: 'Deep' } }, top: 'Top' },
    ja: { common: { title: 'こんにちは', nested: { deep: '深い' } }, top: 'トップ' }
  }
})

export function useTypeChecks () {
  const t = i18n.useTranslations()
  t('common.title')
  t('common.nested.deep')
  t('top')
  // @ts-expect-error unknown key
  t('common.missing')

  const common = i18n.useTranslations('common')
  common('title')
  common('nested.deep')
  // @ts-expect-error with a namespace, keys are relative to it
  common('common.title')

  const nested = i18n.useTranslations('common.nested')
  nested('deep')

  // @ts-expect-error a namespace must point to an object, not a string
  i18n.useTranslations('top')
  // @ts-expect-error unknown namespace
  i18n.useTranslations('missing')
}
