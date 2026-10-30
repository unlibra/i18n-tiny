// Keeps the browser bundle small: CI fails when the browser bundle of a
// package grows past 2KB, minified and gzipped. The aim is to stay under 1KB,
// as the README and the docs say; if a bundle passes 1KB, update them to the
// measured size. Framework packages are left out, as apps already ship them.
export default [
  {
    name: '@i18n-tiny/react',
    path: 'packages/react/dist/index.js',
    import: '{ define }',
    ignore: ['react'],
    gzip: true,
    limit: '2 kB'
  },
  {
    name: '@i18n-tiny/next (client)',
    path: 'packages/next/dist/index.react-client.js',
    import: '{ define }',
    ignore: ['react', 'next'],
    gzip: true,
    limit: '2 kB'
  }
]
