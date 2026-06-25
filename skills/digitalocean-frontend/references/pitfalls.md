# Known Pitfalls

## Table of Contents
- [Nuxt UI v4 API Gotchas](#nuxt-ui-v4-api-gotchas)
- [Nuxt 4 Framework Gotchas](#nuxt-4-framework-gotchas)
- [Pinia Colada Gotchas](#pinia-colada-gotchas)
- [DigitalOcean API Gotchas](#digitalocean-api-gotchas)
- [Client-Only Token (SPA)](#client-only-token-spa)
- [Auto-import Confusion](#auto-import-confusion)

## Nuxt UI v4 API Gotchas

### UDropdownMenu / UContextMenu — `onSelect`, NOT `click`

**Severity: CRITICAL** — silent failure (nothing happens).

```ts
// WRONG — `click` is ignored on menu items
{ label: 'Power off', icon: 'i-lucide-power', click: () => powerOff(id) }
// CORRECT
{ label: 'Power off', icon: 'i-lucide-power', onSelect: () => powerOff(id) }
```

### UTable @select — two arguments

```ts
// WRONG — missing the Event arg
@select="(row) => openDetail(row)"
// CORRECT — (Event, TableRow<T>)
@select="(e: Event, row: TableRow<Droplet>) => navigateTo(`/droplet/${row.original.id}`)"
```

For batch editing, bind selection with `v-model:row-selection` and read the selected rows for the
bulk-action bar.

### UFormField `name` must match the Zod key

The `name` prop must exactly equal the schema field name or the error won't render on that field.

### Component verification is MANDATORY

Nuxt UI v4 differs from v3. Before using ANY `U*` component, verify it via the `nuxt-ui-remote` MCP
(`search-components` → `get-component` → `get-component-metadata`). Never guess prop/slot names. See
[tool-workflow.md](tool-workflow.md).

## Nuxt 4 Framework Gotchas

This **is** the Nuxt framework, so Nuxt composables are available and expected — but it runs as a
**pure client-side SPA** (`ssr: false`), with no backend and no `server/` directory.

- **`app/` is the source dir.** Pages live in `app/pages/`, the `~`/`@` alias points at `app/`.
  There is **no `server/` directory** — the app is client-only.
- **Routing helpers**: prefer `navigateTo('/droplets')` and `useRoute()`/`useRouter()`. Use
  `definePageMeta({ layout, middleware })` for page meta (this is real Nuxt — it works).
- **Data fetching**: use **Pinia Colada** (`useQuery`/`useMutation`) for all DigitalOcean data.
  Don't reach for `$fetch('https://api.digitalocean.com/...')` directly — always go through
  `$doFetch` (which sets the DO API base URL and attaches the Bearer token).
- **Don't double-import auto-imports** (see below) — it causes duplicate-declaration lint errors.

## Pinia Colada Gotchas

- **Reactive keys for parametrized queries.** If the query depends on a ref (page, id, filters),
  pass a **function** key so it refetches when inputs change:
  ```ts
  useQuery({ key: () => dropletKeys.list(page.value), query: () => api.droplets.list(page.value) })
  ```
  A static array key (`key: ['droplets', page.value]`) is evaluated once and won't react.
- **Optimistic context flows through the callbacks.** Whatever `onMutate` returns is the 3rd arg of
  `onError`/`onSettled`. Snapshot in `onMutate`, roll back in `onError`, `invalidateQueries` in
  `onSettled` — invalidate **after** settle, not before, or you refetch the un-mutated state.
- **Server state belongs to the cache, not Pinia.** Don't copy fetched resources into a Pinia store;
  let Pinia Colada own them. Pinia is for the token and UI prefs only.
- **`mutate` vs `mutateAsync`.** `mutate` is fire-and-forget (errors handled in `onError`);
  `mutateAsync` returns a promise you can `await`/`try-catch` (use it when chaining, e.g. wait for an
  action after the mutation).

## DigitalOcean API Gotchas

- **The DigitalOcean API is CORS-enabled — call it directly.** It returns
  `access-control-allow-origin: *` and allows the `Authorization` header, so the browser calls
  `https://api.digitalocean.com/v2` itself through `$doFetch`. There is no proxy. See
  [digitalocean-api.md](digitalocean-api.md).
- **Async actions = eventual consistency.** Power/resize/snapshot/rebuild return an `action` with
  `status` `in-progress` → `completed`/`errored`. The resource won't reflect the change until the
  action settles — this is the real source of the official console's lag, and why optimistic UI +
  action polling is mandatory (`waitForAction`).
- **Pagination**: `per_page` default `20`, **max `200`**. Page count = `Math.ceil(meta.total / per_page)`.
  The collection is keyed by the **plural resource name** (`{ droplets: [...] }`, `{ firewalls: [...] }`).
- **Timestamps are ISO-8601 strings**, not unix ms. Use date-fns (`parseISO`). Never feed them to
  unix-ms helpers.
- **Rate limits**: 5,000/hour and 250/minute. Don't tight-poll lists; rely on cache + `staleTime`.
  Handle `429` with a calm back-off toast and retry after `ratelimit-reset`.
- **No official TS types.** Hand-write the type slices you use and verify them against
  `https://docs.digitalocean.com/reference/api/` (WebFetch) — field names and action `type` strings
  especially.
- **`401`** means the token is missing/invalid → clear it and route to `/connect`.

## Client-Only Token (SPA)

- This is a SPA (`ssr: false`) — there is no server render, so the token (in `localStorage`, via the
  `useDoAuthStore` Pinia store) is **always available** in the browser. No `import.meta.server`/SSR
  token-gating is needed; gate queries client-side with `enabled: () => auth.isConnected` instead.
- The `auth.global.ts` middleware reads the persisted store; the `@pinia-plugin-persistedstate/nuxt`
  module restores it from `localStorage` on the client (configured globally with
  `piniaPersistedstate: { storage: 'localStorage' }`; the store opts in with `persist: { pick: ['token'] }`).
- **Never log or expose the token.** A PAT in `localStorage` is acceptable for this personal/self-hosted
  tool, but keep the origin free of third-party scripts and never write the token anywhere but the
  store. It is sent only to the DigitalOcean API, as a Bearer header.

## Auto-import Confusion

### Auto-imported (no `import` needed)

Vue APIs (`ref`, `computed`, `watch`, …); Nuxt (`useRoute`, `navigateTo`, `useState`, `useNuxtApp`,
`useCookie`, `definePageMeta`, …); VueUse; Pinia (`defineStore`, `storeToRefs`); Pinia Colada
(`useQuery`, `useMutation`, `useQueryCache`); Nuxt UI (`useToast`, `useOverlay`, all `U*`
components); and everything in `app/composables/`, `app/stores/`, `app/utils/`, `app/components/`.

### Needs explicit import

```ts
import type { DropdownMenuItem, TableColumn, TableRow } from '@nuxt/ui'
import type { Droplet, DropletsResponse } from '~/types/digitalocean'
import { FetchError } from 'ofetch'
import { z } from 'zod'
import { parseISO, format } from 'date-fns'
```

**Common mistake**: importing an auto-imported symbol → duplicate declaration / lint error.
