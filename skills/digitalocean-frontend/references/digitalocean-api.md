# DigitalOcean API Integration

How this console talks to DigitalOcean. The golden rule: **the token lives client-side and the
browser calls the DigitalOcean API directly.** This is a pure client-side SPA — there is no backend.
The DigitalOcean API is **CORS-enabled** (`access-control-allow-origin: *`, and it allows the
`Authorization` header), so the browser can call `https://api.digitalocean.com/v2` itself; no proxy
is required.

## Table of Contents
- [Data Flow](#data-flow)
- [Token Handling (client-owned)](#token-handling-client-owned)
- [`$doFetch` — Our Own Typed Client](#dofetch--our-own-typed-client)
- [Typed API Modules](#typed-api-modules)
- [Reads with Pinia Colada (`useQuery`)](#reads-with-pinia-colada-usequery)
- [Writes with Pinia Colada (`useMutation`)](#writes-with-pinia-colada-usemutation)
- [Pagination](#pagination)
- [Async Actions (Eventual Consistency)](#async-actions-eventual-consistency)
- [Rate Limits](#rate-limits)
- [Error Handling](#error-handling)
- [Verifying API Contracts](#verifying-api-contracts)

## Data Flow

The browser talks to DigitalOcean **directly** — no server hop. `$doFetch` attaches the client-held
token as a Bearer header on every request.

```
Browser                                                       DigitalOcean
┌──────────────────────────────────────────┐                ┌──────────────────────┐
│ useDoAuthStore.token (localStorage)       │                │ api.digitalocean.com │
│ $doFetch('/droplets')                     │  Authorization │ /v2/droplets         │
│  (Pinia Colada useQuery)                  ├───────────────▶│                      │
│  baseURL = https://api.digitalocean.com/v2│  Bearer <token>│  { droplets, ... }   │
│                                           │◀───────────────┤                      │
└──────────────────────────────────────────┘   CORS-enabled └──────────────────────┘
```

- **Base URL**: `https://api.digitalocean.com/v2` (from `runtimeConfig.public.digitalOceanApiBase`)
- **Auth**: `Authorization: Bearer <Personal Access Token>`, attached per request in `$doFetch`'s `onRequest`
- **CORS**: the DigitalOcean API returns `access-control-allow-origin: *` and allows the
  `Authorization` header, so the browser can call it directly — **no proxy needed**.
- This is a SPA (`ssr: false`): there is no server render. The token (client-only) is always
  available in the browser, and all DigitalOcean data is fetched client-side.

## Token Handling (client-owned)

The user pastes their DigitalOcean Personal Access Token (PAT) on a **Connect** screen. We keep it
in a Pinia store persisted to `localStorage`, and send it — per request, as a Bearer header — only to
the DigitalOcean API itself. There is no server in between.

```ts
// app/stores/doAuth.ts — client-held DigitalOcean token (auto-imported)
export const useDoAuthStore = defineStore('do-auth', () => {
  // The raw PAT. Persisted to localStorage so the user stays "connected" across reloads.
  const token = ref('')

  const isConnected = computed(() => token.value.length > 0)

  function connect(pat: string) {
    token.value = pat.trim()
  }

  function disconnect() {
    token.value = ''
  }

  return { token, isConnected, connect, disconnect }
}, {
  // Persist only the token. The persistence backend (localStorage) is configured globally on the
  // @pinia-plugin-persistedstate/nuxt module in nuxt.config.ts (piniaPersistedstate.storage).
  persist: { pick: ['token'] },
})
```

> Security note: a PAT in `localStorage` is readable by any script on the origin — acceptable for a
> personal/self-hosted tool, which is the explicit use case here. Keep the origin clean of
> third-party scripts. Never log the token; never send it to any host but the DigitalOcean API.

## `$doFetch` — Our Own Typed Client

A thin [`ofetch`](https://github.com/unjs/ofetch) instance (no external API-client dependency).
Registered as a Nuxt plugin so it is available everywhere as `useNuxtApp().$doFetch`. Its `baseURL`
is the DigitalOcean API base, and it injects the client token as a Bearer header at request time.

```ts
// app/plugins/do-fetch.ts
export default defineNuxtPlugin(() => {
  const auth = useDoAuthStore()        // captured once, in valid Nuxt context
  const config = useRuntimeConfig()

  const doFetch = $fetch.create({
    // → straight to https://api.digitalocean.com/v2 (the DO API is CORS-enabled)
    baseURL: config.public.digitalOceanApiBase,
    onRequest({ options }) {
      // Read the token reactively at request time and attach it as a Bearer header.
      if (auth.token) {
        options.headers = new Headers(options.headers)
        options.headers.set('Authorization', `Bearer ${auth.token}`)
      }
    },
  })

  return { provide: { doFetch } }
})
```

`digitalOceanApiBase` is a public runtime value set in `nuxt.config.ts`:

```ts
// nuxt.config.ts
runtimeConfig: {
  public: {
    digitalOceanApiBase: 'https://api.digitalocean.com/v2',
  },
},
```

## Typed API Modules

Wrap raw endpoints in typed functions via a composable. This keeps query/mutation call sites tidy and
gives one place to verify shapes against the DigitalOcean docs.

```ts
// app/composables/useDoApi.ts (auto-imported)
import type { Droplet, DropletsResponse, ActionResponse } from '~/types/digitalocean'

export function useDoApi() {
  const { $doFetch } = useNuxtApp()

  return {
    droplets: {
      // GET /v2/droplets?page=&per_page=
      list: (page = 1, perPage = 50) =>
        $doFetch<DropletsResponse>('/droplets', { query: { page, per_page: perPage } }),

      // GET /v2/droplets/{id}
      get: (id: number) =>
        $doFetch<{ droplet: Droplet }>(`/droplets/${id}`),

      // POST /v2/droplets
      create: (body: Record<string, unknown>) =>
        $doFetch<{ droplet: Droplet }>('/droplets', { method: 'POST', body }),

      // DELETE /v2/droplets/{id}
      remove: (id: number) =>
        $doFetch<void>(`/droplets/${id}`, { method: 'DELETE' }),

      // POST /v2/droplets/{id}/actions  → returns an async action
      action: (id: number, body: { type: string, [k: string]: unknown }) =>
        $doFetch<ActionResponse>(`/droplets/${id}/actions`, { method: 'POST', body }),
    },

    // Mirror this shape for firewalls, volumes, databases, kubernetes, domains, etc.
  }
}
```

Types live in `app/types/digitalocean.ts`. DigitalOcean does not ship official TS types — hand-write
the slices you use, verified against the docs (see [Verifying API Contracts](#verifying-api-contracts)).

## Reads with Pinia Colada (`useQuery`)

`useQuery` gives caching, request dedup, and background refetch out of the box. Because every request
needs the token, gate queries **client-side** with `enabled: () => auth.isConnected` so they don't
fire before the user has connected. (This is a SPA — there is no SSR, so no `import.meta.server` checks.)

```vue
<script setup lang="ts">
const api = useDoApi()
const auth = useDoAuthStore()
const route = useRoute()
const page = computed(() => Number(route.query.page) || 1)

const {
  state,            // { data, error, status }
  data: droplets,   // shortcut to the resolved data
  asyncStatus,      // 'idle' | 'loading'
  refresh,
} = useQuery({
  // Reactive key → re-runs when `page` changes (see Pagination).
  key: () => ['droplets', page.value],
  query: () => api.droplets.list(page.value),
  // Don't fetch until a token is present.
  enabled: () => auth.isConnected,
})
</script>
```

Use **query-key factories** so reads and the mutations that invalidate them stay in sync:

```ts
// app/utils/queryKeys.ts (auto-imported)
export const dropletKeys = {
  root: ['droplets'] as const,
  list: (page: number) => [...dropletKeys.root, page] as const,
  byId: (id: number) => [...dropletKeys.root, id] as const,
}
```

## Writes with Pinia Colada (`useMutation`)

`useMutation` is where **optimistic UI** lives. The pattern: snapshot → optimistic patch
(`onMutate`) → rollback on failure (`onError`) → reconcile (`onSettled` invalidates the affected
queries).

```ts
const queryCache = useQueryCache()
const api = useDoApi()
const toast = useToast()

const { mutate: renameDroplet, isLoading } = useMutation({
  mutation: ({ id, name }: { id: number, name: string }) =>
    api.droplets.action(id, { type: 'rename', name }),

  // Runs before the request. Patch the cache so the UI updates instantly.
  onMutate({ id, name }) {
    const key = dropletKeys.root
    const previous = queryCache.getQueryData<DropletsResponse>(key)
    if (previous) {
      queryCache.setQueryData(key, {
        ...previous,
        droplets: previous.droplets.map(d => (d.id === id ? { ...d, name } : d)),
      })
    }
    // Returned value becomes the context passed to onError / onSettled.
    return { previous, key }
  },

  // Roll back to the snapshot if the request fails.
  onError(_error, _vars, { previous, key }) {
    if (previous) queryCache.setQueryData(key, previous)
    toast.add({ title: 'Rename failed', color: 'error', icon: 'i-lucide-alert-circle' })
  },

  // Always re-fetch the source of truth once the dust settles.
  onSettled() {
    queryCache.invalidateQueries({ key: dropletKeys.root })
  },
})
```

Global mutation errors can be funneled to a toast once, in the plugin config:

```ts
// nuxt.config.ts → modules: ['@pinia/nuxt', '@pinia/colada-nuxt']
// app/app.config or a plugin can set PiniaColada mutationOptions.onError globally.
```

## Pagination

DigitalOcean uses `?page=&per_page=` (default `20`, **max `200`**). Responses carry
`links.pages.{first,prev,next,last}` and `meta.total`.

```jsonc
{
  "droplets": [ /* ... */ ],
  "links": { "pages": { "next": "https://api.digitalocean.com/v2/droplets?page=2", "last": "..." } },
  "meta": { "total": 42 }
}
```

Drive pagination from the URL so it is shareable and back-button friendly. The page count is
`Math.ceil(meta.total / per_page)`. Pass a **reactive key** to `useQuery` so changing the page
re-runs the query (Pinia Colada caches each page separately).

```ts
const { state } = useQuery({
  key: () => dropletKeys.list(page.value),
  query: () => api.droplets.list(page.value, 50),
})
const total = computed(() => state.value.data?.meta.total ?? 0)
```

## Async Actions (Eventual Consistency)

Many DigitalOcean operations (power on/off, reboot, resize, snapshot, rebuild) are **asynchronous**.
They return an `action` object whose `status` is `in-progress` → `completed` | `errored`. This is the
true reason the official console feels laggy — and the justification for our optimistic UI: reflect
the *intended* state immediately, then reconcile when the action settles.

```ts
// Poll an action until it leaves the "in-progress" state.
async function waitForAction(actionId: number, { timeoutMs = 120_000 } = {}) {
  const { $doFetch } = useNuxtApp()
  const start = performance.now()
  while (performance.now() - start < timeoutMs) {
    const { action } = await $doFetch<{ action: { status: string } }>(`/actions/${actionId}`)
    if (action.status === 'completed') return action
    if (action.status === 'errored') throw new Error('DigitalOcean action failed')
    await new Promise(r => setTimeout(r, 2000)) // poll every 2s
  }
  throw new Error('Timed out waiting for DigitalOcean action')
}
```

Typical flow for a resize:
1. `onMutate` optimistically marks the Droplet "Resizing…" (badge + disabled controls).
2. Fire the action; capture `action.id`.
3. `waitForAction(action.id)` in the background; on success `invalidateQueries` to pull real state.
4. On error, roll back and toast.

## Rate Limits

- **5,000 requests/hour** and **250 requests/minute** per token.
- DigitalOcean returns `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset` headers on each
  response (read them via the `onResponse` hook when present).
- Lean on Pinia Colada caching + dedup to stay well under the cap. Avoid tight polling loops; the
  2s action-poll above is fine for one-off actions. For list auto-refresh, prefer `staleTime` +
  manual `refresh()` over aggressive intervals.

## Error Handling

`$doFetch` (ofetch) throws a `FetchError` on a non-2xx response. Because we call DigitalOcean
directly, the errors are **DigitalOcean's own** — there is no server wrapping. `err.data` is the raw
DO error body `{ id, message, request_id }`, so read `err.data?.message`.

```ts
import { FetchError } from 'ofetch'

try {
  await api.droplets.remove(id)
} catch (err) {
  // ofetch errors are FetchError instances. err.data is DigitalOcean's error body directly
  // ({ id, message, request_id }) — read the message off err.data.message.
  if (err instanceof FetchError) {
    const message = err.data?.message ?? err.statusMessage ?? 'Request failed'
    toast.add({ title: 'Could not delete Droplet', description: message, color: 'error', icon: 'i-lucide-alert-circle' })
  }
}
```

- `401` → token missing/invalid → route to the Connect screen and clear the token.
- `429` → rate limited → back off; show a calm "slow down" toast, retry after `ratelimit-reset`.
- `404` → resource gone → invalidate the list and surface an empty/“no longer exists” state.

## Verifying API Contracts

DigitalOcean does not ship official TypeScript types, and the API evolves. **Always verify
request/response shapes against the official docs before trusting a hand-written type.**

- Fetch the relevant resource page from `https://docs.digitalocean.com/reference/api/` with WebFetch
  (e.g. the Droplets, Firewalls, or Databases reference) to confirm field names, enums, and the
  action `type` strings.
- The DigitalOcean docs are the contract — there is no self-managed backend to cross-check.
- See [tool-workflow.md](tool-workflow.md) for the tool decision matrix.
