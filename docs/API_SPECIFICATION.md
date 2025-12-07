# API Specification

API specification for developers. Complete export list and detailed specifications for all packages.

## Package Overview

```text
@i18n-tiny/core          - Core functionality (DefineConfig type)
@i18n-tiny/core/middleware - Middleware utilities (detectLocale)
@i18n-tiny/core/router   - Routing utilities (getLocalizedPath, etc.)
@i18n-tiny/core/internal - Internal use only (resolveMessage, NestedKeys) *not public*
@i18n-tiny/react         - React (Provider, hooks)
@i18n-tiny/next          - Next.js (RSC support, proxy)
@i18n-tiny/astro         - Astro (define, translations)
@i18n-tiny/astro/middleware - Astro middleware (SSR only)
@i18n-tiny/astro/integration - Astro integration (SSG only)
```

---

## @i18n-tiny/core

### Exports

| Export         | Kind | Description                       |
| -------------- | ---- | --------------------------------- |
| `DefineConfig` | type | Configuration type for `define()` |

### `DefineConfig<L, M>`

```typescript
interface DefineConfig<L extends string, M extends Record<string, any>> {
  locales: readonly L[]
  defaultLocale: L
  messages: Record<L, M>
}
```

---

## @i18n-tiny/core/middleware

### Exports

| Export         | Kind     | Description                               |
| -------------- | -------- | ----------------------------------------- |
| `detectLocale` | function | Detect locale from Accept-Language header |

### `detectLocale(acceptLanguage, supportedLocales)`

```typescript
function detectLocale(
  acceptLanguage: string | null,
  supportedLocales: readonly string[]
): string | null
```

---

## @i18n-tiny/core/router

### Exports

| Export               | Kind     | Description                            |
| -------------------- | -------- | -------------------------------------- |
| `getLocalizedPath`   | function | Generate path with locale prefix       |
| `removeLocalePrefix` | function | Remove locale prefix from path         |
| `hasLocalePrefix`    | function | Check if path has locale prefix        |
| `getLinkHref`        | function | Calculate href for Link (internal use) |

### `getLocalizedPath(path, locale, defaultLocale, prefixDefault?)`

```typescript
function getLocalizedPath(
  path: string,
  locale: string,
  defaultLocale: string,
  prefixDefault?: boolean
): string
```

### `removeLocalePrefix(pathname, locales)`

```typescript
function removeLocalePrefix(
  pathname: string,
  locales: readonly string[]
): string
```

### `hasLocalePrefix(pathname, locales)`

```typescript
function hasLocalePrefix(
  pathname: string,
  locales: readonly string[]
): boolean
```

### `getLinkHref(href, currentPathname, currentLocale, options?)`

```typescript
interface GetLinkHrefOptions {
  locale?: string | false  // Override locale ('' or false for raw path)
  locales?: readonly string[]  // For href normalization (removes existing prefix)
}

function getLinkHref(
  href: string,
  currentPathname: string,
  currentLocale: string | undefined,
  options?: string | false | GetLinkHrefOptions
): string
```

**Examples:**

```typescript
// Auto-detect from current URL
getLinkHref('/about', '/ja/page', 'ja')  // '/ja/about'

// Explicit locale override
getLinkHref('/about', '/page', 'en', { locale: 'ja' })  // '/ja/about'

// Raw path (no localization)
getLinkHref('/about', '/ja/page', 'ja', { locale: false })  // '/about'

// With normalization (removes existing locale prefix from href)
getLinkHref('/ja/about', '/en/page', 'en', { locale: 'en', locales: ['en', 'ja'] })  // '/en/about'
```

---

## @i18n-tiny/core/internal

**Note**: This subpath is for internal use only. Not exposed to users.

### Exports (Internal Only)

| Export           | Kind     | Description                  |
| ---------------- | -------- | ---------------------------- |
| `resolveMessage` | function | Message resolution           |
| `NestedKeys`     | type     | Type utility for nested keys |

---

## @i18n-tiny/react

### Exports

| Export          | Kind     | Description             |
| --------------- | -------- | ----------------------- |
| `define`        | function | Create i18n instance    |
| `DefineConfig`  | type     | Re-export from core     |
| `ProviderProps` | type     | Props type for Provider |

### `define(config)` Returns

```typescript
{
  Provider: React.FC<{
    locale: string
    messages: MessageType
    children: ReactNode
  }>
  useMessages: () => MessageType
  useTranslations: (namespace?: string) => TranslationFunction
  useLocale: () => string
  locales: readonly string[]
  defaultLocale: string
}
```

**Note**: `messages` is not included in the return value. Access only via `useMessages()` or `useTranslations()`. Users manage passing messages to Provider themselves.

---

## @i18n-tiny/next

### Exports

| Export         | Kind     | Description                        |
| -------------- | -------- | ---------------------------------- |
| `define`       | function | Create i18n instance (RSC support) |
| `DefineConfig` | type     | Re-export from core                |

### `define(config)` Returns

```typescript
{
  Provider: React.FC<{
    locale: string
    messages: MessageType
    children: ReactNode
  }>
  locales: readonly string[]
  defaultLocale: string
  server: {
    getMessages: (locale: string) => Promise<MessageType>
    getTranslations: (locale: string, namespace?: string) => Promise<TranslationFunction>
  }
  client: {
    useMessages: () => MessageType
    useTranslations: (namespace?: string) => TranslationFunction
    useLocale: () => string
  }
}
```

**Note**: `Link` is not returned from `define()`. Import separately from `@i18n-tiny/next/router`.

---

## @i18n-tiny/next/proxy

### Exports

| Export         | Kind     | Description                                    |
| -------------- | -------- | ---------------------------------------------- |
| `create`       | function | Create proxy/middleware                        |
| `ProxyConfig`  | type     | Configuration type for `create()`              |
| `detectLocale` | function | Re-export from `@i18n-tiny/core/middleware`    |

### `create(config)`

```typescript
function create(config: ProxyConfig): (request: NextRequest) => NextResponse
```

### `ProxyConfig`

```typescript
// Standard routing
interface StandardRoutingConfig {
  locales: readonly string[]
  defaultLocale: string
  fallbackLocale?: string      // default: defaultLocale
  prefixDefault?: boolean      // default: false
  detectLanguage?: boolean     // default: true
  routing?: never
}

// SSR rewrite routing
interface RewriteRoutingConfig {
  locales: readonly string[]
  defaultLocale: string
  fallbackLocale?: string      // default: defaultLocale
  routing: 'rewrite'
  prefixDefault?: never
  detectLanguage?: never
}

type ProxyConfig = StandardRoutingConfig | RewriteRoutingConfig
```

### Routing Behavior Matrix

| prefixDefault | detectLanguage | `/` behavior                                      |
| ------------- | -------------- | ------------------------------------------------- |
| `false`       | `false`        | Serves fallbackLocale, no detection               |
| `false`       | `true`         | Detects → redirects non-default, rewrites default |
| `true`        | `false`        | Redirects to `/[defaultLocale]`                   |
| `true`        | `true`         | Detects → redirects to detected locale            |

---

## @i18n-tiny/next/router

### Exports

| Export               | Kind      | Description                                 |
| -------------------- | --------- | ------------------------------------------- |
| `Link`               | component | Localized Link component                    |
| `getLocalizedPath`   | function  | Re-export from `@i18n-tiny/core/router`     |
| `removeLocalePrefix` | function  | Re-export from `@i18n-tiny/core/router`     |
| `hasLocalePrefix`    | function  | Re-export from `@i18n-tiny/core/router`     |

### `Link` Props

```typescript
interface LinkProps extends NextLinkProps {
  locale?: string | false  // Explicit locale, '' or false for raw path
  normalize?: boolean      // Normalize href by removing existing locale prefix (default: false)
  // ... NextLinkProps
}
```

**Examples:**

```tsx
// Auto-localized (uses current locale)
<Link href="/about">About</Link>

// Language switch with explicit locale
<Link href="/" locale="ja">日本語</Link>

// Raw path (no localization)
<Link href="/" locale={false}>Home</Link>

// With normalization (useful when href comes from usePathname())
const pathname = usePathname() // '/ja/about'
<Link href={pathname} locale="en" normalize>English</Link>  // → /en/about
```

---

## @i18n-tiny/astro

### Exports

| Export         | Kind     | Description          |
| -------------- | -------- | -------------------- |
| `define`       | function | Create i18n instance |
| `DefineConfig` | type     | Re-export from core  |

### `define(config)` Returns

```typescript
{
  locales: readonly string[]
  defaultLocale: string
  getMessages: (locale: string | undefined) => MessageType
  getTranslations: (locale: string | undefined, namespace?: string) => TranslationFunction
}
```

**Note**: Astro's `define()` does not return `Provider` (Astro is server-first).

---

## @i18n-tiny/astro/middleware (SSR only)

> **Note**: Middleware only works in SSR mode. For SSG, use the integration instead.

### Exports

| Export             | Kind     | Description                                    |
| ------------------ | -------- | ---------------------------------------------- |
| `create`           | function | Create middleware                              |
| `MiddlewareConfig` | type     | Configuration type for `create()`              |
| `detectLocale`     | function | Re-export from `@i18n-tiny/core/middleware`    |

### `create(config)`

```typescript
function create(config: MiddlewareConfig): MiddlewareHandler
```

### `MiddlewareConfig`

```typescript
// Standard routing
interface StandardRoutingConfig {
  locales: readonly string[]
  defaultLocale: string
  fallbackLocale?: string      // default: defaultLocale
  excludePaths?: string[]      // default: []
  prefixDefault?: boolean      // default: false
  detectLanguage?: boolean     // default: true
  routing?: never
}

// SSR rewrite routing
interface RewriteRoutingConfig {
  locales: readonly string[]
  defaultLocale: string
  fallbackLocale?: string      // default: defaultLocale
  excludePaths?: string[]      // default: []
  routing: 'rewrite'
  prefixDefault?: never
  detectLanguage?: never
}

type MiddlewareConfig = StandardRoutingConfig | RewriteRoutingConfig
```

**Astro-specific option**: `excludePaths` - Paths to skip processing (e.g., `['/api', '/_image']`)

---

## @i18n-tiny/astro/integration (SSG only)

> **Note**: This integration is for SSG mode only. It copies the default locale's content to the root directory after build.

### Exports

| Export              | Kind     | Description                                 |
| ------------------- | -------- | ------------------------------------------- |
| `create`            | function | Create integration                          |
| `IntegrationConfig` | type     | Configuration type for `create()`           |

### `create(config)`

```typescript
function create(config: IntegrationConfig): AstroIntegration
```

### `IntegrationConfig`

```typescript
interface IntegrationConfig {
  defaultLocale: string       // Content from this locale is copied to root
  prefixDefault?: boolean     // default: false - if true, skips copying
}
```

### Usage

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import { create } from '@i18n-tiny/astro/integration'

export default defineConfig({
  integrations: [
    create({ defaultLocale: 'en' })
  ]
})
```

### Build Output

```
dist/
├── index.html        ← copied from /en/index.html
├── about/index.html  ← copied from /en/about/index.html
├── en/
│   ├── index.html
│   └── about/index.html
└── ja/
    ├── index.html
    └── about/index.html
```

> **Important**: In SSG mode, automatic language detection (`detectLanguage`) does not work because there is no server to read the `Accept-Language` header. Users will always see the default locale first when visiting `/`.

---

## @i18n-tiny/astro/router

### Exports

| Export               | Kind      | Description                                 |
| -------------------- | --------- | ------------------------------------------- |
| `Link.astro`         | component | Localized Link component                    |
| `getLocalizedPath`   | function  | Re-export from `@i18n-tiny/core/router`     |
| `removeLocalePrefix` | function  | Re-export from `@i18n-tiny/core/router`     |
| `hasLocalePrefix`    | function  | Re-export from `@i18n-tiny/core/router`     |

### `Link.astro` Props

```astro
---
interface Props {
  href: string
  locale?: string | false  // Explicit locale, '' or false for raw path
  normalize?: boolean      // Normalize href by removing existing locale prefix (default: false)
  [key: string]: any  // Other HTML attributes
}
---
```

**Examples:**

```astro
<!-- Auto-localized (uses current locale) -->
<Link href="/about">About</Link>

<!-- Language switch with explicit locale -->
<Link href="/" locale="ja">日本語</Link>

<!-- Raw path (no localization) -->
<Link href="/" locale={false}>Home</Link>

<!-- With normalization (removes existing locale prefix from href) -->
<Link href="/ja/about" locale="en" normalize>English</Link>  <!-- → /en/about -->
```

**Note**: `normalize` requires middleware to set `Astro.locals.locales`.

---

## Design Decisions

### 1. `Link` is not returned from `define()`

- `Link` is an independent component that doesn't depend on context
- Auto-detects locale from URL
- `define()` settings (locales, defaultLocale) can be inferred from URL patterns

### 2. Core utilities are re-exported from framework packages

- Router utilities (`getLocalizedPath`, `removeLocalePrefix`, `hasLocalePrefix`) are re-exported from `/router` subpath
- Middleware utilities (`detectLocale`) are re-exported from `/proxy` (Next.js) or `/middleware` (Astro) subpath
- Users can import from their framework package without depending on `@i18n-tiny/core` directly
- Direct import from `@i18n-tiny/core/*` is also supported

### 3. Astro does not return `Provider`

- Astro has a server-first architecture
- Client context is not needed
- Use `getMessages`, `getTranslations` directly

### 4. Next.js `server` and `client` separation

- In RSC environment, `client` API throws error
- Explicit separation prevents misuse
- `server` returns Promises (async/await compatible)

### 5. Config type naming

- `DefineConfig` - For `define()` function
- `ProxyConfig` - For Next.js `create()`
- `MiddlewareConfig` - For Astro middleware `create()`
- `IntegrationConfig` - For Astro integration `create()`

### 6. Astro SSR vs SSG

- **SSR**: Use `@i18n-tiny/astro/middleware` - middleware runs on every request, supports language detection and rewriting
- **SSG**: Use `@i18n-tiny/astro/integration` - copies default locale content to root at build time
- In SSG mode, middleware does not run (no server at runtime)
- Language detection (`detectLanguage`) only works in SSR mode

### 7. core subpath structure

- `/` - `DefineConfig` only (type for define)
- `/middleware` - `detectLocale` (middleware layer logic)
- `/router` - Path manipulation functions
- `/internal` - Not public (`resolveMessage`, `NestedKeys`)

---

## Internal Types (Not Exported Publicly)

The following are for internal use only. Documented but not exposed to users.

| Type                  | Package       | Purpose                          |
| --------------------- | ------------- | -------------------------------- |
| `NestedKeys<T>`       | core/internal | Type inference for message keys  |
| `TranslationFunction` | all           | Type for `t()` function          |
| `resolveMessage`      | core/internal | Key resolution and interpolation |
