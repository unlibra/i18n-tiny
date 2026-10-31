export { detectLocale } from '../detectLocale'
export { resolveMessage } from '../utils'
export { validateConfig } from '../config'
export type { ConfigCheck, ValidatableConfig } from '../config'
export type { NestedKeys, NamespaceKeys, TranslationKeys, LocaleMessages, Translate, TranslationVars, VariableNames } from '../types'
// The URL functions without the check of the config, for a config that is
// checked once instead
export { localizedPathOf, alternatePathOf, findPrefixLocale } from '../router/paths'
export { linkHref } from '../router/linkHref'
