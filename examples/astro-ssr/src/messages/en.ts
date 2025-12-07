const messages = {
  common: {
    title: 'Astro Example',
    description: 'This is a simple example using @i18n-tiny/astro',
    currentLocale: 'Current locale: {locale}'
  },
  nav: {
    home: 'Home',
    about: 'About'
  },
  home: {
    welcome: 'Welcome to Astro',
    greeting: 'Hello, {name}!'
  },
  about: {
    title: 'About',
    description: 'This is the about page.'
  }
}

export default messages

export type Messages = typeof messages
