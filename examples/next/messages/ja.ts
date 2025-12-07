import type { Messages } from './en'

export default {
  common: {
    title: 'Next.js サンプル',
    description: '@i18n-tiny/next を使用したシンプルな例です',
    currentLocale: '現在のロケール: {locale}'
  },
  nav: {
    home: 'ホーム',
    about: 'このサイトについて'
  },
  home: {
    welcome: 'Next.js へようこそ',
    greeting: 'こんにちは、{name}さん！',
    increment: '+1',
    counter: '{count}回クリックしました',
    serverComponent: 'サーバーコンポーネント',
    clientComponent: 'クライアントコンポーネント'
  },
  about: {
    title: 'このサイトについて',
    description: 'これはアバウトページです。'
  }
} satisfies Messages
