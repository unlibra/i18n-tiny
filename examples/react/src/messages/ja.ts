import type { Messages } from './en'

export default {
  common: {
    title: 'React サンプル',
    description: '@i18n-tiny/react を使用したシンプルな例です',
    currentLocale: '現在のロケール: {locale}'
  },
  home: {
    welcome: 'React へようこそ',
    greeting: 'こんにちは、{name}さん！',
    switch: '言語を切り替える',
  },
} satisfies Messages
