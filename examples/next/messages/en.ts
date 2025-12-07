const messages = {
  common: {
    title: 'Next.js Example',
    description: 'This is a simple example using @i18n-tiny/next',
    currentLocale: 'Current locale: {locale}'
  },
  nav: {
    home: 'Home',
    about: 'About'
  },
  home: {
    welcome: 'Welcome to Next.js',
    greeting: 'Hello, {name}!',
    increment: '+1',
    counter: 'You clicked {count} times',
    serverComponent: 'Server Component',
    clientComponent: 'Client Component'
  },
  about: {
    title: 'About',
    description: 'This is the about page.'
  }
}

export default messages

export type Messages = typeof messages
