---
sidebar_position: 3
---

# Integration

SSG integration for static file generation.

## `create(config)`

Creates an Astro Integration for i18n static file generation.

**Parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | :---: | --- | --- |
| `defaultLocale` | `string` | Required | - | Default locale - content from this locale is copied to root |

**Returns:**
- `AstroIntegration`: Astro integration object.

**Build Output Example:**

```
dist/
├── index.html        ← Copied from /en/index.html
├── about/index.html  ← Copied from /en/about/index.html
├── en/
│   ├── index.html
│   └── about/index.html
└── ja/
    ├── index.html
    └── about/index.html
```

> **Important**: In SSG mode, since there is no server, automatic language detection (redirects based on browser settings) does not work by default. If you use the Integration to copy the default locale to the root, accessing `/` will always display that default locale.
