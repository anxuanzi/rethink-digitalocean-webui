# CLAUDE.md

Guidance for Claude Code when working in **rethink-digitalocean-webui** — a hand-built, premium
alternative to the official DigitalOcean Cloud console. It manages real DigitalOcean infrastructure
(Droplets, firewalls, databases, networking, …) via the DigitalOcean API v2, and exists to be
**faster, clearer, and more capable** than the official console (firewall rule notes, batch editing,
fast search).

## ⚠️ Critical Constraints (Read First)

1. **Stack:** Nuxt 4 as a **client-side SPA** (`ssr: false`) + Nuxt UI v4 + Vue 3 + TypeScript
   (strict), `bun`. Real Nuxt framework — use `navigateTo`, `useRoute`, `definePageMeta`, layouts,
   and `app/`-dir file-based routing.
2. **Data-layer rule (LOCKED):** There is **no backend**. The DigitalOcean API supports CORS, so the
   browser calls `https://api.digitalocean.com/v2` **directly** via `$doFetch`, attaching the user's
   token as `Authorization: Bearer`. The token lives **only in the browser** (Pinia → `localStorage`)
   and never touches any server we run — there isn't one. The app builds to **static files** and
   deploys to **GitHub Pages**.
3. **No third-party API client.** Use our own typed **`$doFetch`** (ofetch) + **Pinia Colada**
   (`useQuery`/`useMutation`). Pinia holds the token + UI state; Pinia Colada owns server state.
4. **Optimistic UI is mandatory.** DigitalOcean operations are async (actions settle eventually) —
   reflect intended state immediately, reconcile on settle (`onMutate`/`onError`/`onSettled`).
5. **Verify before you build.** Nuxt UI v4 components via the `nuxt-ui-remote` MCP; DigitalOcean API
   shapes via the official docs (`https://docs.digitalocean.com/reference/api/`).
6. **Dark-mode native, semantic tokens only.** Primary = the custom DigitalOcean-blue `ocean` scale;
   never hard-code hex. **Timestamps are ISO-8601** (date-fns), not unix ms.

## The `digitalocean-frontend` Skill

A detailed frontend/UX skill lives at `.claude/skills/digitalocean-frontend/`. **Use it for all
frontend work.** It covers architecture, the DigitalOcean API data layer, code patterns, UX
principles, accessibility, UI quality, design patterns, pitfalls, and tool workflow. The
`SKILL.md` there is the entry point; its `references/` hold the depth.

The existing `.claude/skills/nuxt-ui/` skill (official Nuxt UI reference) is complementary — keep it.

> Skills live in two places: `.claude/skills/` (what Claude Code loads) and `./skills/` (a tracked
> project-folder backup). Keep both copies in sync when editing a skill.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Nuxt 4 — **client-side SPA** (`ssr: false`), Vue 3 |
| UI | Nuxt UI v4 (`@nuxt/ui`), Tailwind CSS v4 |
| State | Pinia (client/UI), Pinia Colada (server state) |
| HTTP | `$doFetch` (ofetch) → DigitalOcean API v2 **directly** (CORS) |
| Validation / Dates / Utils | Zod · date-fns (ISO-8601) · VueUse |
| Icons | Lucide (`i-lucide-*`), Simple Icons for brand logos |
| Tooling | TypeScript (strict), ESLint, `bun` |
| Hosting | Static build (`bun run generate`) → GitHub Pages (GitHub Actions) |

## Architecture (high level)

```
app/
├── pages/                    # file-based routing (/, /connect; resource pages added per slice)
├── components/               # auto-imported (AppLogo, AccountMenu, …)
├── composables/              # useDoApi + per-resource composables (useQuery/useMutation)
├── stores/                   # Pinia: useDoAuthStore (token)
├── plugins/do-fetch.ts       # $doFetch → api.digitalocean.com/v2 with Bearer auth
├── utils/                    # queryKeys, datetime (date-fns)
├── types/digitalocean.ts     # hand-written DO API types (verified vs docs)
├── layouts/                  # default (dashboard shell) + auth (connect screen)
├── middleware/auth.global.ts # redirect to /connect when no token
└── assets/css/main.css       # Tailwind v4 + ocean palette + dark overrides
.github/workflows/deploy.yml  # build (bun run generate) + deploy to GitHub Pages
```

- **No `server/` directory** — there is no backend; the browser calls the DO API directly.
- **URL conventions**: plural for lists (`/droplets`), singular for detail (`/droplet/:id`). Full
  rules in the skill's `references/architecture.md`.
- **Resource model**: Droplets, Firewalls, Volumes, Snapshots, Images, Databases, Kubernetes, Load
  Balancers, VPCs, Domains/DNS, Reserved IPs, Spaces, Projects, Tags, SSH Keys, Billing, Monitoring.

## Development Commands

```bash
bun install          # install dependencies
bun dev              # Nuxt dev server (http://localhost:3000)
bun run generate     # static build → .output/public (what CI deploys)
bun run preview      # preview a build locally
bun lint             # ESLint
bun run typecheck    # nuxt typecheck (vue-tsc)
```

Run `bun lint && bun run typecheck` before committing.

## Tool Guidelines

- **Nuxt UI components** → `nuxt-ui-remote` MCP (mandatory): `search-components` → `get-component` →
  `get-component-metadata`; `list-examples` / `get-example`. Local `nuxt-ui` skill complements it.
- **Third-party libs** → Context7 (`resolve-library-id` → `query-docs`): Pinia Colada, Pinia, Zod,
  date-fns, VueUse. Skip for Vue 3 core APIs and Nuxt auto-imports.
- **Nuxt framework docs** → Context7 (`nuxt`) or WebFetch nuxt.com (no `nuxt-remote` MCP here).
- **DigitalOcean API** → WebFetch `https://docs.digitalocean.com/reference/api/` to verify contracts.
- **Code navigation / memory** → Serena.

## Important Notes

- **Token security**: the PAT lives in `localStorage` and is sent **only** to `api.digitalocean.com`
  (directly, over HTTPS) — never to any server we run. Never log it; "Disconnect" wipes it. The
  deployed static site contains no secrets; each user supplies their own token at runtime.
- **DigitalOcean API limits**: 5,000 requests/hour and 250/minute — rely on Pinia Colada caching;
  avoid tight polling; handle `429` with back-off.
- **Async actions**: power/resize/snapshot/rebuild return an `action` that settles later — poll it and
  invalidate queries on completion (see the skill's `references/digitalocean-api.md`).
- **Deployment**: pushing `main` triggers `.github/workflows/deploy.yml` (build + deploy to Pages).
  One-time: repo **Settings → Pages → Source: GitHub Actions**. `NUXT_APP_BASE_URL` is
  `/rethink-digitalocean-webui/` (change to `/` for a custom domain).
```
