# Frontend Architecture (Nuxt 4)

## Table of Contents
- [Project Structure](#project-structure)
- [Nuxt 4 Conventions](#nuxt-4-conventions)
- [Auto-imports](#auto-imports)
- [Data Layer](#data-layer)
- [Client State (Pinia)](#client-state-pinia)
- [Routing & Middleware](#routing--middleware)
- [URL Naming Conventions (CRITICAL)](#url-naming-conventions-critical)
- [Layouts](#layouts)
- [Config Files](#config-files)

## Project Structure

This is a **Nuxt 4** app run as a **pure client-side SPA** (`ssr: false`). Nuxt 4 uses `app/` as the
source directory by default. There is **no `server/` directory** — there is no backend; the browser
calls the DigitalOcean API directly.

```
rethink-digitalocean-webui/
├── nuxt.config.ts                 # ssr:false, modules, runtimeConfig.public, persistedstate config
├── app/
│   ├── app.vue                    # Root: <UApp> + <NuxtLayout> + <NuxtPage>
│   ├── app.config.ts              # Nuxt UI theme (primary: 'ocean', neutral: 'slate')
│   ├── error.vue                  # Global error page
│   ├── assets/css/main.css        # Tailwind v4 imports + ocean palette + dark overrides
│   ├── plugins/
│   │   └── do-fetch.ts            # Registers $doFetch (DO API base URL + Bearer auth)
│   ├── layouts/
│   │   ├── default.vue            # Dashboard shell (sidebar + UDashboardGroup)
│   │   └── auth.vue               # Connect/token screen (no sidebar)
│   ├── middleware/
│   │   └── auth.global.ts         # Redirect to /connect when no token
│   ├── pages/                     # File-based routing (auto-registered)
│   ├── components/                # Auto-imported, organized by domain
│   ├── composables/               # useDoApi, etc. — auto-imported
│   ├── stores/                    # Pinia: useDoAuthStore, useUiStore — auto-imported
│   ├── api/                       # (optional) typed DO endpoint fns + raw types
│   ├── utils/                     # queryKeys, formatters — auto-imported
│   └── types/
│       └── digitalocean.ts        # Hand-written DO API types (verified vs docs)
├── .github/workflows/deploy.yml   # Build static (bun run generate) → deploy to GitHub Pages
├── public/                        # favicon, robots.txt
└── nuxt.config.ts
```

This is a **static SPA**: `bun run generate` emits `.output/public`, which the GitHub Actions workflow
(`.github/workflows/deploy.yml`) deploys to **GitHub Pages** (bun + `NUXT_APP_BASE_URL=/rethink-digitalocean-webui/`).

## Nuxt 4 Conventions

This is the real Nuxt framework — the Nuxt composables and conventions are available and expected
(even though it runs as a client-side SPA with `ssr: false`). Use them:

```ts
// Navigation
await navigateTo('/droplets')          // Nuxt helper (auto-imported)
const route = useRoute()
const router = useRouter()

// Route meta (Nuxt, in <script setup>)
definePageMeta({
  layout: 'default',
  middleware: 'some-page-guard',
})

// Document head / SEO (works in Nuxt — fine even for an app)
useHead({ title: 'Droplets · DigitalOcean Console' })

// Runtime config — public values only (e.g. digitalOceanApiBase). Never put the token here.
const config = useRuntimeConfig()
```

Data fetching is **Pinia Colada** (`useQuery`/`useMutation`), not Nuxt's `useFetch`/`useAsyncData`,
because all DigitalOcean data is token-gated and runs in the browser (this is a SPA — there is no
server render and no server routes). See [Data Layer](#data-layer).

## Auto-imports

Nuxt 4 auto-imports these — no `import` needed:

- **Vue**: `ref`, `reactive`, `computed`, `watch`, `watchEffect`, `onMounted`, `nextTick`, `toRefs`, …
- **Nuxt**: `useRoute`, `useRouter`, `navigateTo`, `useState`, `useFetch`, `useAsyncData`,
  `useRuntimeConfig`, `useNuxtApp`, `useCookie`, `useColorMode`, `definePageMeta`, `useHead`, `useSeoMeta`
- **VueUse** (`@vueuse/nuxt`): `useClipboard`, `useDebounceFn`, `useStorage`, `useIntervalFn`, …
- **Pinia** (`@pinia/nuxt`): `defineStore`, `storeToRefs`
- **Pinia Colada** (`@pinia/colada-nuxt`): `useQuery`, `useMutation`, `useQueryCache`, `defineQuery`, `defineMutation`
- **Nuxt UI** (`@nuxt/ui`): `useToast`, `useOverlay`, and all `U*` components
- **Project code**: everything in `app/composables/`, `app/stores/`, `app/utils/`, `app/components/`

What still needs explicit imports:

```ts
import type { DropdownMenuItem, TableColumn, TableRow } from '@nuxt/ui'   // types
import type { Droplet, DropletsResponse } from '~/types/digitalocean'      // local types
import { FetchError } from 'ofetch'                                        // error class (use instanceof)
import { z } from 'zod'                                                    // third-party
import { parseISO, formatDistanceToNow } from 'date-fns'
```

## Data Layer

The whole DigitalOcean data layer — client-held token, the `$doFetch` client (which calls the DO API
directly), typed API modules, and Pinia Colada queries/mutations — is documented in
**[digitalocean-api.md](digitalocean-api.md)**. Read it before any API work.

**One-line summary:** the token lives in a client Pinia store (persisted to `localStorage`) →
`$doFetch` attaches it as `Authorization: Bearer <token>` → the browser calls
`https://api.digitalocean.com/v2` directly (the DO API is CORS-enabled, so no proxy is needed).

## Client State (Pinia)

Pinia holds **client/UI state only** — server state belongs to Pinia Colada's cache.

- `useDoAuthStore` — the DigitalOcean token + connection status (persisted to `localStorage`).
- `useUiStore` (optional) — sidebar collapsed, table density, saved filters, theme.

```ts
export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const tableDensity = ref<'compact' | 'comfortable'>('comfortable')
  return { sidebarCollapsed, tableDensity }
}, { persist: true })
```

Do **not** cache fetched Droplets/Firewalls/etc. in Pinia — let Pinia Colada own that (caching,
dedup, invalidation). Mixing both leads to stale duplicates.

## Routing & Middleware

File-based routing under `app/pages/`. Pages are auto-registered; dynamic segments use brackets.

```
app/pages/droplets/index.vue        → /droplets
app/pages/droplet/[id].vue          → /droplet/:id
app/pages/networking/firewalls.vue  → /networking/firewalls
app/pages/connect.vue               → /connect   (public)
```

A global middleware gates everything behind a connected token:

```ts
// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useDoAuthStore()
  const publicRoutes = ['/connect']
  if (!auth.isConnected && !publicRoutes.includes(to.path)) {
    return navigateTo('/connect')
  }
})
```

## URL Naming Conventions (CRITICAL)

REST-inspired, predictable URLs matching the conventions of GitHub, Stripe, Linear, and Vercel — and
the resource model of DigitalOcean itself.

### Plural vs. Singular Rule

| Route Purpose | URL Pattern | File Path | Example |
|---|---|---|---|
| **Collection (list)** | `/{resources}` (plural) | `pages/{resources}/index.vue` | `/droplets` |
| **Single entity (detail)** | `/{resource}/{id}` (singular) | `pages/{resource}/[id].vue` | `/droplet/345` |
| **Nested collection** | `/{resource}/{id}/{children}` | `pages/{resource}/[id]/{children}.vue` | `/droplet/345/backups` |
| **Create form (standalone)** | `/{resources}/new` | `pages/{resources}/new.vue` | `/droplets/new` |
| **Section (settings-like)** | `/{section}/{tab}` | `pages/{section}/{tab}.vue` | `/networking/firewalls` |

The core rule:
- **Plural** = a **list/collection** (`/droplets`, `/firewalls`, `/databases`)
- **Singular** = **one specific** entity by id (`/droplet/345`, `/firewall/abc-123`)

```
/droplets                      → list of all Droplets (plural)
/droplet/345                   → view one Droplet (singular)
/droplet/345/backups           → backups for one Droplet
/droplet/345/graphs            → monitoring graphs for one Droplet
```

### Route Category Patterns

**Resource routes** (CRUD entities — most common):
```
/droplets            → list view (table)
/droplet/[id]        → detail view (page or slideover)
/droplets/new        → creation flow (standalone page; create is complex for Droplets)
```

**Section routes** (organizational groupings, not single entities):
```
/networking          → landing (firewalls / load balancers / VPCs / domains)
/networking/firewalls → sub-section (plural — a list within networking)
/account/billing     → sub-section (singular concept, not a collection)
```

**Action routes** (one-off flows):
```
/connect             → enter the DigitalOcean token (the "auth" flow here)
```

**Singleton routes** (single-instance pages):
```
/                    → dashboard overview (singular concept)
/account             → the current account (there is only one "you")
```

### URL Style Rules

| Rule | Standard | Example |
|---|---|---|
| **Case** | lowercase always | `/droplets` not `/Droplets` |
| **Separator** | kebab-case | `/reserved-ips` not `/reservedIps` |
| **No trailing slash** | omit it | `/droplets` not `/droplets/` |
| **IDs** | dynamic segment | `/droplet/[id]` not `/droplet?id=345` |
| **Nouns, not verbs** | for resource routes | `/droplets` not `/list-droplets` |
| **Consistent depth** | max 3-4 segments | `/droplet/:id/backups` |
| **No abbreviations** | spell it out | `/firewalls` not `/fw`, `/databases` not `/dbs` |

### Sidebar Navigation vs. URL

The sidebar label should match the plural form used in list URLs: **Droplets** → `/droplets`,
**Firewalls** → `/networking/firewalls`, **Databases** → `/databases`, **Billing** →
`/account/billing` (singular concept), **Dashboard** → `/` (singleton).

## Layouts

- `default.vue` — the dashboard shell: `<UDashboardGroup>` + collapsible `<UDashboardSidebar>`
  (nav + account menu) + `<slot/>` for the page. Used by every authenticated page.
- `auth.vue` — a clean, centered layout for `/connect` (no sidebar).

See [design-patterns.md](design-patterns.md) for the full app-shell and page-skeleton recipes.

## Config Files

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // Pure client-side SPA — no SSR, no server render, no server/ routes.
  ssr: false,
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@pinia-plugin-persistedstate/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  // Public runtime config — the DigitalOcean API base $doFetch targets. Never the token.
  runtimeConfig: {
    public: {
      digitalOceanApiBase: 'https://api.digitalocean.com/v2',
    },
  },
  // Persisted-state backend, configured once for all stores that opt in with `persist`.
  piniaPersistedstate: {
    storage: 'localStorage',
  },
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
})
```

For the Tailwind v4 + ocean palette setup (`app/assets/css/main.css`) and the Nuxt UI color config
(`app/app.config.ts`), see [design-patterns.md](design-patterns.md). For package dependencies, see
[SKILL.md](../SKILL.md).
