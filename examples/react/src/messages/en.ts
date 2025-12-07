const messages = {
  common: {
    title: 'React Example',
    description: 'This is a simple example using @i18n-tiny/react',
    currentLocale: 'Current locale: {locale}'
  },
  home: {
    welcome: 'Welcome to React',
    greeting: 'Hello, {name}!',
    switch: 'Switch Language',
  },
}

export default messages

export type Messages = typeof messages
