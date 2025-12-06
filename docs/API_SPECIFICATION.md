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
@i18n-tiny/astro         - Astro (middleware)
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

### `getLinkHref(href, locale, currentPathname, locales, defaultLocale, prefixDefault?)`

```typescript
function getLinkHref(
  href: string,
  locale: string | undefined,
  currentPathname: string,
  locales: readonly string[],
  defaultLocale: string,
  prefixDefault?: boolean
): string
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

| Export        | Kind     | Description                       |
| ------------- | -------- | --------------------------------- |
| `create`      | function | Create proxy/middleware           |
| `ProxyConfig` | type     | Configuration type for `create()` |

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

| Export | Kind      | Description              |
| ------ | --------- | ------------------------ |
| `Link` | component | Localized Link component |

### `Link` Props

```typescript
interface LinkProps extends NextLinkProps {
  locale?: string | false  // Explicit locale, '' or false for raw path
  // ... NextLinkProps
}
```

**Note**: `getLocalizedPath`, `removeLocalePrefix` are not re-exported. Import directly from `@i18n-tiny/core/router` if needed.

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

## @i18n-tiny/astro/middleware

### Exports

| Export             | Kind     | Description                       |
| ------------------ | -------- | --------------------------------- |
| `create`           | function | Create middleware                 |
| `MiddlewareConfig` | type     | Configuration type for `create()` |

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

## @i18n-tiny/astro/router

### Exports

| Export       | Kind      | Description              |
| ------------ | --------- | ------------------------ |
| `Link.astro` | component | Localized Link component |

### `Link.astro` Props

```astro
---
interface Props {
  href: string
  locale?: string | false  // Explicit locale, '' or false for raw path
  [key: string]: any  // Other HTML attributes
}
---
```

---

## Design Decisions

### 1. `Link` is not returned from `define()`

- `Link` is an independent component that doesn't depend on context
- Auto-detects locale from URL
- `define()` settings (locales, defaultLocale) can be inferred from URL patterns

### 2. Router utilities are imported directly from core/router

- `getLocalizedPath`, `removeLocalePrefix` are for power users
- Not re-exported across packages; use directly from `@i18n-tiny/core/router`
- Keeps API surface minimal

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
- `MiddlewareConfig` - For Astro `create()`

### 6. core subpath structure

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
