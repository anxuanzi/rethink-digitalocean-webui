# rethink-digitalocean-webui

> A faster, cleaner, power-user alternative to the DigitalOcean Cloud console — that runs **entirely in your browser**.

[![Deploy to GitHub Pages](https://github.com/anxuanzi/rethink-digitalocean-webui/actions/workflows/deploy.yml/badge.svg)](https://github.com/anxuanzi/rethink-digitalocean-webui/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxtdotjs&logoColor=white)](https://nuxt.com)

## Why

All of my startups run on DigitalOcean, and I'm in its web console every single day — and honestly, I'm tired of it. The UX gets in the way, it feels slow, and it's missing the management features I actually need (firewall **rule notes**, **batch editing**, fast search). So I'm building my own.

This is that: a focused, keyboard-friendly console for managing real DigitalOcean infrastructure, with the polish of tools like Linear, Stripe, and Vercel.

## 🔒 Everything stays in your browser

This is the core design principle — there is **no backend at all**:

- **No server, no database, nothing we run.** The app is 100% static files.
- Your **DigitalOcean Personal Access Token** is stored only in your **browser's `localStorage`**.
- API requests go **directly from your browser to `api.digitalocean.com`** over HTTPS (DigitalOcean's API sends CORS headers, so no proxy is needed).
- Your token and your data **never pass through any server we control** — there isn't one.
- **Nothing is tracked, logged, or collected.** The hosted page is just HTML/JS/CSS.
- Click **Disconnect** to wipe the token from your browser at any time.

Because there's no backend, there's nothing to breach and no shared secrets — the deployed site contains no credentials of any kind.

## ✨ Features

**Available now (project skeleton):**
- Connect with a DigitalOcean token, validated live against your account
- Dashboard shell with a collapsible/resizable sidebar and native dark mode

**Roadmap:**
- **Droplets** — list, detail, power/reboot/resize/snapshot, with optimistic UI
- **Firewalls** — including per-rule **notes** (the thing the official console can't do)
- **Batch / bulk editing** — tag, power, destroy many resources at once
- Databases, Kubernetes, Volumes, Snapshots, Load Balancers, Domains/DNS, Reserved IPs
- Fast multi-resource search and filtering

## 🧱 Tech stack

[Nuxt 4](https://nuxt.com) (SPA) · [Nuxt UI v4](https://ui.nuxt.com) · [Tailwind CSS v4](https://tailwindcss.com) · TypeScript · [Pinia](https://pinia.vuejs.org) + [Pinia Colada](https://pinia-colada.esm.dev) · [Zod](https://zod.dev) · [date-fns](https://date-fns.org) · [bun](https://bun.sh)

## 🚀 Live demo

**https://anxuanzi.github.io/rethink-digitalocean-webui/**

You'll need your own DigitalOcean token (create one under **API → Tokens** in the control panel). Use the smallest scope that fits your needs — read-only is great for browsing.

## 🛠️ Local development

Requires [bun](https://bun.sh).

```bash
git clone https://github.com/anxuanzi/rethink-digitalocean-webui.git
cd rethink-digitalocean-webui
bun install
bun dev          # → http://localhost:3000
```

| Script | Purpose |
|---|---|
| `bun dev` | Start the dev server |
| `bun run generate` | Build the static site (`.output/public`) |
| `bun run preview` | Preview a production build locally |
| `bun lint` | Lint (ESLint) |
| `bun run typecheck` | Type-check (vue-tsc) |

## 🧭 How it works

- **SPA** (`ssr: false`) — no server runtime; the whole app is prerendered to static files.
- The token lives in a **Pinia store persisted to `localStorage`** (`useDoAuthStore`).
- A small typed client (`$doFetch`, built on `ofetch`) calls `https://api.digitalocean.com/v2` directly, attaching `Authorization: Bearer <token>` per request.
- **Pinia Colada** (`useQuery` / `useMutation`) handles caching, dedup, and optimistic updates.
- A global route middleware sends you to `/connect` until a token is set.

## 📦 Deployment (GitHub Pages)

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **One-time setup:** in the repo, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Push to `main`** — the workflow builds with bun (`bun run generate`) and deploys to Pages.

The site is served from a project subpath, so `NUXT_APP_BASE_URL` is set to `/rethink-digitalocean-webui/` in the workflow. If you use a custom domain or a user/org root site, change that to `/`.

## ⚠️ Security notes

- The token is in your browser — treat the origin like any sensitive app. Don't use it on a shared/public machine, and **Disconnect** when you're done.
- Prefer a **scoped / read-only token** unless you need write access.
- The deployed static site holds **no secrets**; every user supplies their own token at runtime.

## 🤝 Contributing

Early days — issues and PRs welcome. Please run `bun lint && bun run typecheck` before opening a PR.

## 📄 License

[MIT](LICENSE) © 2026 Tony An
