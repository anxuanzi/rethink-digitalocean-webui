# Tool Workflow Rules

## Table of Contents
- [Nuxt UI Remote: Mandatory for All Components](#nuxt-ui-remote-mandatory-for-all-components)
- [Nuxt Framework Features & Config](#nuxt-framework-features--config)
- [API Contract Source: DigitalOcean API v2 Docs](#api-contract-source-digitalocean-api-v2-docs)
- [Context7: Mandatory for Third-Party Libraries](#context7-mandatory-for-third-party-libraries)
- [Serena: Code Navigation & Memory](#serena-code-navigation--memory)
- [Tool Decision Matrix](#tool-decision-matrix)
- [Workflow Examples](#workflow-examples)

## Nuxt UI Remote: Mandatory for All Components

### When to Use (MANDATORY)

**ALWAYS** verify before using ANY Nuxt UI component. Nuxt UI v4 has different APIs from v3 — never guess props, slots, or variants from memory.

```
# Step 1: Find the component (search by name or concept)
mcp__nuxt-ui-remote__search-components(query="table")

# Step 2: Get component docs (props, events, usage)
mcp__nuxt-ui-remote__get-component(name="Table")

# Step 3: Get metadata (slots, variants, detailed props)
mcp__nuxt-ui-remote__get-component-metadata(name="Table")
```

### Additional Resources

```
# Search documentation pages
mcp__nuxt-ui-remote__search-documentation(query="data table pagination")

# Get a specific docs page
mcp__nuxt-ui-remote__get-documentation-page(path="components/table")

# Browse and pull examples
mcp__nuxt-ui-remote__list-examples
mcp__nuxt-ui-remote__get-example(name="dashboard")

# Find an icon (Iconify — Lucide for UI, simple-icons for brand logos)
mcp__nuxt-ui-remote__search-icons(query="server")
```

### Complementary: the local `nuxt-ui` skill

A local **`nuxt-ui` skill** ships with this project and covers the same Nuxt UI v4 system (theming, component composition, layout recipes). Use it as a complementary, offline-friendly reference for orientation and theming patterns — but the **`nuxt-ui-remote` MCP remains the authoritative source** for exact props, slots, events, and variants of any specific component before you write it. When the two disagree, trust the MCP (it tracks the installed version).

### Required Triggers

Use Nuxt UI Remote when working with ANY of these:
- `UButton`, `UInput`, `UTextarea`, `USelect`, `USelectMenu`
- `UTable`, `UPagination`, `UBadge`, `UAvatar`
- `UCard`, `UModal`, `UDrawer`, `USlideover`
- `UDropdownMenu`, `UTabs`, `UBreadcrumb`
- `UForm`, `UFormField`, `USwitch`, `UCheckbox`
- `UAlert`, `UProgress`, `USkeleton`
- `UDashboardPanel`, `UDashboardNavbar`, `UDashboardToolbar`, `UDashboardSidebar`
- `useToast()`, `useOverlay()`
- Any component prefixed with `U`

## Nuxt Framework Features & Config

Nuxt UI components are covered by `nuxt-ui-remote` above. **Nuxt itself** — framework features, the `app/` directory, config keys, composables, and module setup — is **not** served by a dedicated MCP in this project. Do not assume a `nuxt-remote` MCP exists.

### When to Verify Nuxt Behavior (MANDATORY before guessing)

- Configuring `nuxt.config.ts` / `app.config.ts` (modules, `runtimeConfig.public`, `ssr: false`, static generation)
- Nuxt plugins (e.g. registering our `$doFetch` instance in `app/plugins/do-fetch.ts`)
- Routing: file-based routes in `app/pages/`, `definePageMeta`, `useSeoMeta` / `useHead`, `navigateTo`, middleware
- Static deployment (`nuxt generate` → `.output/public`, `app.baseURL` / `NUXT_APP_BASE_URL` for GitHub Pages)

### How to Verify

```
# Preferred — Context7 for current Nuxt docs
mcp__context7__resolve-library-id(libraryName="nuxt")
mcp__context7__query-docs(libraryId="<resolved-id>", topic="ssr false static generation nuxt plugins")

# Fallback — fetch the official docs page directly
WebFetch(url="https://nuxt.com/docs/...", prompt="how does <feature> work in Nuxt 4")
```

Skip this for things that are unambiguous Nuxt auto-imports you already know are correct (`useState`, `useRuntimeConfig`, `useCookie`, `useColorMode`) and for plain Vue 3 core APIs — see the Context7 exclusions below.

## API Contract Source: DigitalOcean API v2 Docs

There is no in-repo backend to read — this is a pure client-side SPA. The data layer is **our own thin client**: `$doFetch` calls `https://api.digitalocean.com/v2` **directly** from the browser (the DO API is CORS-enabled), attaching a **client-held DigitalOcean Personal Access Token (PAT)** as `Authorization: Bearer <token>`. (Full details in [digitalocean-api.md](digitalocean-api.md).)

So the **contract source of truth for every request/response shape is the official DigitalOcean API v2 documentation** — not generated types, not assumptions.

### When to Verify (MANDATORY)

- Implementing a new page or feature that calls a DO endpoint
- A response shape doesn't match what you expected
- Pagination, nested objects, or embedded data in responses
- Async actions (droplet power/resize/snapshot, etc.) where you need the `action` status contract
- Recently added or unfamiliar resources (Databases, DOKS, Load Balancers, VPCs, Spaces keys)

### How to Verify

```
# Fetch the relevant resource page and confirm the exact shapes
WebFetch(
  url="https://docs.digitalocean.com/reference/api/",
  prompt="List Droplets: exact request query params and the JSON response body shape"
)

# Resource-specific pages live under the API reference, e.g.
WebFetch(url="https://docs.digitalocean.com/reference/api/digitalocean/#tag/Droplets", prompt="...")
```

### What to Verify

| Aspect | Where to Check |
|--------|---------------|
| Endpoint path & method | DO API v2 reference (the resource's section) |
| Request body / query params | Resource page request schema (`?page=`, `?per_page=`, body fields) |
| Response shape & fields | Resource page response schema — collection keyed by plural name, e.g. `{ "droplets": [...] }` |
| Pagination format | `links.pages.{first,prev,next,last}` + `meta.total`; `per_page` default 20, **max 200** |
| Async action contract | Returned `action` object `status` = `in-progress` \| `completed` \| `errored`; poll `GET /v2/actions/{id}` |
| Rate limits | `5,000`/hour, `250`/minute per token; headers `ratelimit-limit` / `ratelimit-remaining` / `ratelimit-reset` |
| Timestamps | ISO-8601 strings (parse with **date-fns**, never assume unix ms) |
| Error shape | DO error body (`{ "id", "message" }`); surfaced as an `ofetch` `FetchError` (check via `instanceof`, `error.statusCode`) |

> Reflect verified shapes in your **Zod schemas** and TypeScript types. See [patterns.md](patterns.md) for the data-fetching + optimistic-UI patterns (Pinia Colada) and [digitalocean-api.md](digitalocean-api.md) for the `$doFetch` (direct DO API) / token mechanics.

## Context7: Mandatory for Third-Party Libraries

### When to Use (MANDATORY)

**ALWAYS** use Context7 before writing code that calls any third-party library API:

```
# Step 1: Resolve the library ID
mcp__context7__resolve-library-id(libraryName="@pinia/colada")

# Step 2: Query specific docs
mcp__context7__query-docs(libraryId="<resolved-id>", topic="useMutation optimistic update")
```

### Required Triggers

Use Context7 when working with ANY of these:
- `@pinia/colada` (**Pinia Colada**) — `useQuery`, `useMutation`, `useQueryCache`, optimistic updates, invalidation
- `pinia` — store definition, `storeToRefs`, persistence
- `zod` — schema validation, type inference
- `date-fns` — `parseISO`, `formatDistanceToNow`, `format` (DO timestamps are ISO-8601)
- `@vueuse/core` / `@vueuse/nuxt` — composables (`useStorage`, `useDebounceFn`, etc.)
- `nuxt` itself — see [Nuxt Framework Features & Config](#nuxt-framework-features--config)
- Any other external dependency in `package.json`

### What NOT to Use Context7 For

- Vue 3 core APIs (`ref`, `computed`, `watch`, etc.)
- Nuxt auto-imports you already know are correct (`useState`, `useRuntimeConfig`, `useCookie`, `useColorMode`, `navigateTo`)
- Project-internal code (composables, stores, utils under `app/`)
- Nuxt UI components (use **Nuxt UI Remote** instead)

## Serena: Code Navigation & Memory

### Code Navigation

Use Serena symbolic tools for exploring TypeScript/Vue code and for symbol-level edits:

```
# Explore a domain — get a symbol overview
mcp__serena__get_symbols_overview(relative_path="app/composables/")

# Find a specific composable or function
mcp__serena__find_symbol(name_path="useDroplets", include_body=false, depth=1)

# Find all references to a symbol
mcp__serena__find_referencing_symbols(name_path="useDroplets")

# Search for text patterns
mcp__serena__search_for_pattern(pattern="optimistic", relative_path="app/")

# Symbol-level edit (preferred over raw text edits for functions/composables)
mcp__serena__replace_symbol_body(name_path="useDroplets", body="...")
```

**Note**: For `.vue` files, use the `Read` tool when you need template context (Serena works best with the `<script setup>` section).

### Memory Management (MANDATORY)

```
# At session start — check existing memories
mcp__serena__list_memories()
mcp__serena__read_memory(name="frontend_architecture_patterns")

# After discovering important patterns or decisions
mcp__serena__write_memory(name="domain_<name>", text="...")

# Update existing memories with new findings
mcp__serena__edit_memory(name="known_gotchas", text="...")
```

**What to track:**
- New page/component implementations and their patterns
- Discovered Nuxt UI v4 gotchas (append to `known_gotchas`)
- DO API integration notes for new resources (shapes, async-action quirks, pagination)
- State / data-layer decisions (Pinia store shape, Pinia Colada query keys & invalidation)

## Tool Decision Matrix

| Task | Primary Tool | Fallback |
|------|-------------|----------|
| Verify DO API contract | **WebFetch** DO API v2 docs (`docs.digitalocean.com/reference/api/`) | — |
| Verify Nuxt feature / config / plugin | **Context7** `resolve-library-id("nuxt")` → `query-docs` | **WebFetch** `nuxt.com/docs` |
| Verify UI component | **Nuxt UI Remote** `get-component` | `search-components` / local `nuxt-ui` skill |
| UI component props/events/slots | **Nuxt UI Remote** `get-component-metadata` | `get-documentation-page` |
| Find a UI component / example / icon | **Nuxt UI Remote** `search-components` / `list-examples` / `search-icons` | `search-documentation` |
| Third-party lib API | **Context7** `resolve-library-id` → `query-docs` | — |
| Explore TS/Vue code | **Serena** `get_symbols_overview` / `find_symbol` | `Read` tool |
| Find references | **Serena** `find_referencing_symbols` | `search_for_pattern` |
| Edit function/composable | **Serena** `replace_symbol_body` | `Edit` tool |
| Read .vue template | `Read` tool | — |
| Track decisions | **Serena** `write_memory` | — |
| Run commands | `Bash` tool (**bun**) | — |

## Workflow Examples

### Building a New List Page (e.g. Droplets)

```
1. mcp__serena__read_memory(name="frontend_architecture_patterns")
2. WebFetch DO API docs → confirm "List Droplets" query params + response shape
   (https://docs.digitalocean.com/reference/api/)
3. Read a canonical reference page in-repo (e.g. app/pages/droplets/index.vue if one exists)
4. mcp__nuxt-ui-remote__get-component(name="Table")  → learn UTable API
5. mcp__nuxt-ui-remote__get-component(name="Pagination")  → learn UPagination API
6. mcp__context7__resolve-library-id("@pinia/colada") → query-docs(topic="useQuery pagination")
7. Implement: Zod types → Pinia Colada query composable → page component
   (data layer mechanics: references/digitalocean-api.md)
8. Verify UI checklist (references/ui-quality.md)
9. Run: bun lint && bun typecheck
10. mcp__serena__write_memory(name="domain_droplets", text="...")
```

### Adding a Form with Validation (e.g. Firewall rule + note)

```
1. mcp__nuxt-ui-remote__get-component(name="Form")  → UForm API
2. mcp__nuxt-ui-remote__get-component(name="FormField")  → UFormField API
3. WebFetch DO API docs → confirm the Firewall create/update request body fields
4. mcp__context7__resolve-library-id("zod") → query-docs(topic="object schema + inference")
5. Define a Zod schema mirroring the verified DO request shape
6. Build the form with UForm + the schema; submit via a Pinia Colada useMutation
   with optimistic update + rollback (references/patterns.md)
7. Test dark mode, loading states, error states (FetchError → useToast)
```

### Debugging a UI Issue

```
1. mcp__serena__read_memory(name="known_gotchas")
2. mcp__serena__read_memory(name="frontend_ui_quality_patterns")
3. Read the affected component with the Read tool (need full template context)
4. Check the Nuxt UI component API: mcp__nuxt-ui-remote__get-component-metadata
5. If it's framework behavior (client-side routing, plugins, static generation): Context7 "nuxt" or WebFetch nuxt.com
6. Fix the issue, update known_gotchas if a new pitfall is discovered
```
