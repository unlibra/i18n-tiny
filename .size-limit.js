// Keeps the browser bundle small: CI fails when the browser bundle of define()
// grows past the size the READMEs give, minified and gzipped: under 1KB for
// React, under 1.5KB for Next. Only the entry of define() is measured, not the
// Link of @i18n-tiny/next/router.
// Framework packages are left out, as apps already ship them.
export default [
  {
    name: '@i18n-tiny/react',
    path: 'packages/react/dist/index.js',
    import: '{ define }',
    ignore: ['react'],
    gzip: true,
    limit: '1 kB'
  },
  {
    name: '@i18n-tiny/next (client)',
    path: 'packages/next/dist/index.react-client.js',
    import: '{ define }',
    ignore: ['react', 'next'],
    gzip: true,
    limit: '1.5 kB'
  }
]
