import type { Messages } from './en'

export default {
  common: {
    title: 'Astro サンプル',
    description: '@i18n-tiny/astro を使用したシンプルな例です',
    currentLocale: '現在のロケール: {locale}'
  },
  nav: {
    home: 'ホーム',
    about: 'このサイトについて'
  },
  home: {
    welcome: 'Astro へようこそ',
    greeting: 'こんにちは、{name}さん！'
  },
  about: {
    title: 'このサイトについて',
    description: 'これはアバウトページです。'
  }
} satisfies Messages
