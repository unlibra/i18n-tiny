// Keeps the "under 1KB" claim in the README and the docs true: CI fails when
// the browser bundle of a package grows past 1KB, minified and gzipped.
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
    limit: '1 kB'
  }
]
