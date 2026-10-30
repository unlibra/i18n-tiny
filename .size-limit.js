// Keeps the browser bundle small: CI fails when the browser bundle of define()
// grows past 2KB, minified and gzipped, the size the READMEs give. Only the
// entry of define() is measured, not the Link of @i18n-tiny/next/router.
// Framework packages are left out, as apps already ship them.
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
