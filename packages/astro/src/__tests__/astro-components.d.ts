// tsc cannot read .astro files, which the tests render with the container API
declare module '*.astro' {
  import type { experimental_AstroContainer } from 'astro/container'

  const component: Parameters<experimental_AstroContainer['renderToString']>[0]
  export default component
}
