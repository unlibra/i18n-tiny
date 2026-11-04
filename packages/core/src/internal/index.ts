export { detectLocale } from '../detectLocale'
export { resolveMessage } from '../utils'
export { validateConfig } from '../config'
export type { ConfigCheck, ValidatableConfig } from '../config'
export type { NestedKeys, NamespaceKeys, TranslationKeys, LocaleMessages, Translate, VariableNames } from '../types'
// The URL functions without the check of the config, for a config that is
// checked once instead
export { localizedPathOf, alternatePathOf, findPrefixLocale } from '../router/paths'
// Whether browsers may read a path as another host
export { leadsToAnotherHost } from '../router/paths'
// The href of the Link components: getLinkHref() checks the config,
// linkHref() takes the check to run
export { getLinkHref, linkHref } from '../router/linkHref'
export type { LinkHrefOptions } from '../router/linkHref'
