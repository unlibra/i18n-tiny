// Type-level checks for define(), run by `pnpm type-check` and never executed.
// Each @ts-expect-error fails the type check if its line stops being an error.
import { define } from '../index'

const messages = {
  en: { common: { title: 'Hello', nested: { deep: 'Deep' } }, top: 'Top' },
  ja: { common: { title: 'こんにちは', nested: { deep: '深い' } }, top: 'トップ' }
}

// Without locales, the types still come from the messages
const inferred = define({ messages })
const title: string = inferred.getMessages('en').common.title
inferred.getTranslations('en')('common.title')
// @ts-expect-error unknown key
inferred.getTranslations('en')('common.missing')

// With locales, also without `as const`
const withLocales = define({ locales: ['en', 'ja'], defaultLocale: 'en', messages })
withLocales.getTranslations('ja')('top')

const common = inferred.getTranslations('en', 'common')
common('title')
common('nested.deep')
// @ts-expect-error with a namespace, keys are relative to it
common('common.title')
// @ts-expect-error a namespace must point to an object, not a string
inferred.getTranslations('en', 'top')

export { title }
