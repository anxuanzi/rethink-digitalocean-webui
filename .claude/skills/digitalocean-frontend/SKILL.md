---
name: digitalocean-frontend
description: >
  Frontend development and UX design skill for rethink-digitalocean-webui — a premium, hand-built
  management console over the DigitalOcean API v2 (Nuxt 4, Vue 3, TypeScript, Nuxt UI v4, Pinia Colada).
  Triggers: (1) Page/component/composable implementation in the console, (2) Nuxt UI v4 usage,
  (3) DigitalOcean API integration via the $doFetch (direct CORS calls) + Pinia Colada,
  (4) Optimistic UI for DigitalOcean async actions, (5) Form validation (Zod), (6) Nuxt 4 file-based routing,
  (7) Connect/token flow, (8) Resource management UI (Droplets, Firewalls, Databases, networking, etc.),
  (9) UX design — interaction patterns, cognitive load, information architecture, content design,
  (10) Accessibility — WCAG, keyboard nav, ARIA, screen readers,
  (11) Design consistency — icons, component selection, cross-page patterns, microcopy.
  Do NOT trigger for: backend services, marketing/content websites, or non-Vue code.
---

# DigitalOcean Console — Frontend Development

## Role

Expert Senior Frontend Architect and UX Designer specializing in Nuxt 4, Vue 3, TypeScript, and
Nuxt UI v4. Write clean, type-safe, heavily-commented code with polished SaaS aesthetics and rigorous
UX thinking. Every design decision is grounded in user psychology — not decoration.

**Design philosophy**: Think like a UX designer first, then implement as an engineer.
Before building any UI, ask: Who is this for? What's their goal? What do they expect to happen?

Prioritize: user clarity > visual beauty > code elegance. The product's reason to exist is to **beat
the official DigitalOcean console** at speed, clarity, and the power features it lacks (firewall rule
notes, batch/bulk editing, fast multi-resource search). Match Linear's clarity, Stripe's
accessibility, and Vercel's polish — while keeping DigitalOcean's familiar brand.

## Project Context

- **Project**: `rethink-digitalocean-webui` — a better client for managing real DigitalOcean infra.
- **Framework**: **Nuxt 4** as a **pure client-side SPA** (`ssr: false`) + Vue 3 — no backend, no `server/` dir
- **UI Library**: **Nuxt UI v4** (`@nuxt/ui`)
- **Styling**: **Tailwind CSS v4** (DigitalOcean-blue "ocean" primary, slate neutral, dark-mode native)
- **State**: **Pinia** (client/UI state) + **Pinia Colada** (`useQuery`/`useMutation` — server state)
- **HTTP**: our own typed **`$doFetch`** → the DigitalOcean API v2 **directly** (the DO API is CORS-enabled)
- **Validation**: Zod · **Dates**: date-fns (ISO-8601) · **Utils**: VueUse · **Icons**: Lucide
- **Language**: strict TypeScript · **Package manager**: `bun`
- **Deployment**: static build (`bun run generate` → `.output/public`) to **GitHub Pages**
- **Status**: tooling-ready; the app itself is bootstrapped in a later step.

## Critical Constraints

1. **Nuxt 4 as a client-side SPA**: This is real Nuxt (use `navigateTo`, `useRoute`, `definePageMeta`,
   layouts, `app/`-dir file routing) but configured as a **pure SPA** (`ssr: false`). There is **no
   backend and no `server/` directory** — everything runs in the browser.
2. **Data layer rule (LOCKED)**: The DigitalOcean Personal Access Token lives **client-side only**.
   There is **no proxy** — the DigitalOcean API is CORS-enabled, so the browser calls
   `https://api.digitalocean.com/v2/` **directly** via `$doFetch`, attaching `Authorization: Bearer
   <token>` per request. The app deploys as a static build to GitHub Pages.
   See [references/digitalocean-api.md](references/digitalocean-api.md).
3. **No third-party API client**: use our own `$doFetch` (ofetch) + **Pinia Colada**
   (`useQuery`/`useMutation`) for all DigitalOcean data.
4. **Optimistic UI (MANDATORY)**: DigitalOcean operations are async (actions settle eventually). Every
   mutation reflects intended state immediately and reconciles on settle, via Pinia Colada
   `onMutate`/`onError`/`onSettled`. See [references/patterns.md](references/patterns.md).
5. **Nuxt UI v4**: Always verify components via the `nuxt-ui-remote` MCP before using. v4 ≠ v3. See
   [references/pitfalls.md](references/pitfalls.md).
6. **Tailwind CSS v4**: Use semantic tokens + `dark:` variants. Never hard-code hex; the primary is
   the custom `ocean` (DigitalOcean-blue) scale.
7. **Timestamps are ISO-8601 strings** (not unix ms). Format with date-fns via `app/utils/datetime.ts`.
8. **Verify API contracts against DigitalOcean docs**: DO ships no official TS types and the API
   evolves — confirm shapes at `https://docs.digitalocean.com/reference/api/` (WebFetch) before
   trusting a hand-written type.
9. **Heavy comments**: Explain the "why" behind non-obvious logic.
10. **Auto-imports**: Vue, Nuxt, VueUse, Pinia, Pinia Colada, Nuxt UI, and project
    composables/stores/utils/components are auto-imported. Types and third-party libs need explicit
    imports. See [references/architecture.md](references/architecture.md).

## Architecture

For Nuxt 4 project structure, conventions, auto-imports, client state, routing/middleware, and
layouts, see [references/architecture.md](references/architecture.md).

**Quick reference (Nuxt 4 `app/` dir — SPA, no `server/`):**
- **Pages**: `app/pages/` — file-based routing
- **Components**: `app/components/` — auto-imported, organized by domain
- **Composables**: `app/composables/` — `useDoApi`, per-resource composables (auto-imported)
- **Stores**: `app/stores/` — Pinia: `useDoAuthStore` (the token), `useUiStore` (auto-imported)
- **Plugins**: `app/plugins/do-fetch.ts` — registers `$doFetch` (DO API base + Bearer auth)
- **Types**: `app/types/digitalocean.ts` — hand-written DO API types

## URL Naming Conventions (CRITICAL)

For the full routing rules and file-system mapping, see the "URL Naming Conventions" section in
[references/architecture.md](references/architecture.md).

**Core rule — plural vs. singular:**
- **Plural** = collection/list: `/droplets`, `/databases`, `/networking/firewalls`
- **Singular** = single entity by id: `/droplet/:id`, `/droplet/:id/backups`
- **Singleton** = single-instance page: `/`, `/account`
- **Action** = one-off flow: `/connect`

**Style:** lowercase, kebab-case, no trailing slash, no abbreviations, max 3-4 segments.

## Data Layer & DigitalOcean API

The client-only token, direct-to-DO `$doFetch` (CORS-enabled, Bearer auth), typed API modules, Pinia
Colada queries/mutations, pagination, async actions, rate limits, and error handling are all in
[references/digitalocean-api.md](references/digitalocean-api.md). **Read it before any API work.**

## Deployment

The app is a **static SPA** — `bun run generate` emits `.output/public`, deployed to **GitHub Pages**
via `.github/workflows/deploy.yml` (bun + `NUXT_APP_BASE_URL=/rethink-digitalocean-webui/`). There is
no server to deploy. See [references/architecture.md](references/architecture.md).

## Code Patterns

For optimistic UI, composable structure, Zod + UForm validation, toasts, ISO date handling, and
component patterns (dropdown `onSelect`, selectable tables, overlay modals/slideovers), see
[references/patterns.md](references/patterns.md).

## UX Design (CRITICAL — Read Before Building Any UI)

For UX principles, cognitive-load management, interaction laws, form UX, content design, and
responsive strategy, see [references/ux-principles.md](references/ux-principles.md).

**UX-first mindset — before writing any UI code:**
1. **Who** is using this? (A developer managing their own infra, daily, under time pressure.)
2. **What** is their real goal? (Not "view Droplets" — "find idle Droplets in nyc1 to resize down".)
3. **What do they expect?** Match conventions from Linear, Stripe Dashboard, Vercel — and improve on
   the official DigitalOcean console.

## UI Quality

For the full UI checklist, semantic color tokens, empty/error/loading states, and dark-mode rules,
see [references/ui-quality.md](references/ui-quality.md).

## Accessibility (MANDATORY)

For WCAG compliance, ARIA patterns, keyboard navigation, focus management, and screen-reader support,
see [references/accessibility.md](references/accessibility.md).

## Design Quality (CRITICAL)

For the DigitalOcean brand/theme setup, layout recipes, visual hierarchy, the resource-icon map,
component-selection guide, consistency checklist, and anti-patterns, see
[references/design-patterns.md](references/design-patterns.md).

**Must-use patterns**: `UDashboardPanel` (navbar → toolbar → body); stat cards with tinted icon
containers (`bg-primary/10`); `variant="subtle"` status badges; the bulk-action bar on table
selection (batch editing); em-dash for empty cells; skeletons mirroring content.

## Known Pitfalls

For Nuxt 4, Nuxt UI v4, Pinia Colada, and DigitalOcean API gotchas, see
[references/pitfalls.md](references/pitfalls.md).

## Workflow

1. **UX design thinking**: Identify the user's real goal, expected patterns, and page type. Read
   [references/ux-principles.md](references/ux-principles.md).
2. **Verify the API contract**: Confirm request/response shapes against the DigitalOcean API docs
   (WebFetch `https://docs.digitalocean.com/reference/api/`) before trusting types.
3. **Verify UI components**: Use the `nuxt-ui-remote` MCP to check component existence and API before
   using ANY Nuxt UI component.
4. **Check third-party APIs**: Use Context7 for Pinia Colada, Zod, date-fns, VueUse, or any dependency.
5. **Implement** in order: types (`app/types`) → typed API fn (`useDoApi`) → query keys → composable
   (`useQuery`/`useMutation`) → component/page.
6. **Apply optimistic UI** for every mutation (Pinia Colada `onMutate`/`onError`/`onSettled`).
7. **Apply UX quality**: cognitive load (chunking, progressive disclosure), content design, feedback.
8. **Apply design consistency**: run the cross-page checklist in
   [references/design-patterns.md](references/design-patterns.md).
9. **Apply a11y checklist**: keyboard nav, focus, ARIA, contrast — see
   [references/accessibility.md](references/accessibility.md).
10. **Apply UI checklist**: every item in [references/ui-quality.md](references/ui-quality.md).
11. **Comment heavily**; **lint & typecheck**: `bun lint && bun typecheck` before committing.

## Tech Stack & Dependencies

Planned `package.json` dependencies (installed at bootstrap):

```jsonc
{
  "dependencies": {
    "nuxt": "^4",
    "vue": "latest",
    "@nuxt/ui": "^4",
    "@vueuse/nuxt": "latest",
    "@pinia/nuxt": "latest",
    "pinia": "latest",
    "@pinia/colada": "latest",
    "@pinia/colada-nuxt": "latest",
    "@pinia-plugin-persistedstate/nuxt": "latest",
    "@iconify-json/lucide": "latest",
    "@iconify-json/simple-icons": "latest",
    "tailwindcss": "latest",
    "zod": "latest",
    "date-fns": "latest"
  },
  "devDependencies": {
    "@nuxt/eslint": "latest",
    "eslint": "latest",
    "typescript": "latest",
    "vue-tsc": "latest"
  }
}
```

## Tool Usage (MANDATORY)

For the full tool rules, decision matrix, and workflow examples, see
[references/tool-workflow.md](references/tool-workflow.md).

- **Nuxt UI Remote (`nuxt-ui-remote` MCP)** — MANDATORY before using ANY Nuxt UI component
  (`search-components` → `get-component` → `get-component-metadata`; `list-examples`/`get-example`).
  The local `nuxt-ui` skill is a complementary resource; the MCP stays authoritative.
- **Context7** — ALWAYS before writing code against a third-party lib (Pinia Colada, Pinia, Zod,
  date-fns, VueUse). Skip for Vue 3 core and Nuxt auto-imports.
- **Nuxt framework docs** — no `nuxt-remote` MCP here; use Context7 (`nuxt`) or WebFetch nuxt.com.
- **DigitalOcean API docs** — WebFetch `https://docs.digitalocean.com/reference/api/` to verify contracts.
- **Serena** — code navigation, symbol-level editing, and memory.
