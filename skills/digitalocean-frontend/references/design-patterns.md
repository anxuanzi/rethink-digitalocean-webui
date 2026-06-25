# Design Patterns

Design reference for building a clean, fast, professional DigitalOcean management console.
Identity: **DigitalOcean brand + premium UX** — keep DigitalOcean's recognizable blue so it feels
familiar, but apply Linear/Stripe/Vercel-level polish to fix the slowness and clutter of the
official console. Reference vibe: the Nuxt UI Dashboard template.

## Table of Contents
- [Design Philosophy](#design-philosophy)
- [DigitalOcean Brand & Theme Setup](#digitalocean-brand--theme-setup)
- [Layout Composition](#layout-composition)
- [Visual Hierarchy](#visual-hierarchy)
- [Page Recipes](#page-recipes)
- [Component Composition](#component-composition)
- [Color & Depth](#color--depth)
- [Micro-Interactions & Motion](#micro-interactions--motion)
- [Professional Polish](#professional-polish)
- [Design Consistency System](#design-consistency-system)
- [Anti-Patterns (What NOT to Do)](#anti-patterns-what-not-to-do)

## Design Philosophy

**Core principles — every design decision should serve these:**

1. **Breathing room**: Generous whitespace > cramped density. The official console crams too much.
2. **Quiet confidence**: Subtle depth, muted tones, restrained decoration. Avoid visual noise.
3. **Clear hierarchy**: One focal point per section. Guide the eye with size, weight, and color.
4. **Purposeful color**: Color means something — resource status, emphasis, interaction. Never decorative.
5. **Consistent rhythm**: Spacing, sizing, and radius follow a predictable scale.
6. **Content-first**: UI chrome fades into the background. Resources and actions take center stage.
7. **Speed is a feature**: Optimistic UI, skeletons, cached navigation — never make the user wait.

**The aesthetic**: Dark-friendly, monochromatic foundations with selective DigitalOcean-blue pops.
Refined typography, generous padding, subtle borders over heavy shadows, transparency-based tinting.

## DigitalOcean Brand & Theme Setup

Anchor Nuxt UI's `primary` on a custom **DigitalOcean-blue ("ocean")** scale and use `slate` as the
neutral. Design dark-mode-native.

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  --font-sans: 'Inter', sans-serif;

  /* DigitalOcean blue (anchor 500 = #0069FF — confirm the canonical brand hex) */
  --color-ocean-50:  #e6f0ff;
  --color-ocean-100: #cce0ff;
  --color-ocean-200: #99c2ff;
  --color-ocean-300: #66a3ff;
  --color-ocean-400: #3385ff;
  --color-ocean-500: #0069ff;
  --color-ocean-600: #0054cc;
  --color-ocean-700: #003f99;
  --color-ocean-800: #002a66;
  --color-ocean-900: #001533;
  --color-ocean-950: #000b1a;
}

/* Calm, deep dark theme (DigitalOcean leans dark) */
.dark {
  --ui-bg:          var(--ui-color-neutral-950);
  --ui-bg-muted:    var(--ui-color-neutral-900);
  --ui-bg-elevated: var(--ui-color-neutral-900);
  --ui-bg-accented: var(--ui-color-neutral-800);
}
```

```ts
// app/app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'ocean',   // custom DigitalOcean-blue scale
      neutral: 'slate',
    },
  },
})
```

Always use semantic tokens (`text-highlighted`, `text-muted`, `bg-elevated`, `border-default`,
`text-primary`, `bg-primary/10`) — never hard-coded hex in components.

## Layout Composition

### App Shell

```vue
<!-- app/layouts/default.vue -->
<template>
  <UDashboardGroup storage="local" unit="rem">
    <UDashboardSidebar id="default" collapsible resizable>
      <template #header="{ collapsed }">
        <AppLogo :collapsed="collapsed" />            <!-- DigitalOcean wordmark / anchor -->
      </template>

      <UNavigationMenu :items="mainNav" orientation="vertical" />
      <UNavigationMenu :items="bottomNav" orientation="vertical" class="mt-auto" />

      <template #footer="{ collapsed }">
        <AccountMenu :collapsed="collapsed" />        <!-- account + disconnect token -->
      </template>
    </UDashboardSidebar>

    <slot />   <!-- the page (NuxtPage renders here via the layout) -->
  </UDashboardGroup>
</template>
```

Nav is grouped by DigitalOcean's mental model: **Manage** (Droplets, Kubernetes, Databases),
**Networking** (Firewalls, Load Balancers, VPCs, Domains, Reserved IPs), **Storage** (Volumes,
Snapshots, Images, Spaces), **Account** (Billing, API/Tokens, Settings).

### Page Skeleton (every page)

Every page follows a 3-zone structure inside `UDashboardPanel`:

```
+--------------------------------------------------+
| NAVBAR: Title + breadcrumb + sidebar collapse     |
+--------------------------------------------------+
| TOOLBAR: Search/filters (left) | Actions (right)  |
+--------------------------------------------------+
| BODY:                                              |
|  - Stat cards row (optional)                       |
|  - Primary content (table / cards / form)          |
|  - Modals / slideovers (overlay)                   |
+--------------------------------------------------+
```

```vue
<UDashboardPanel id="droplets">
  <template #header>
    <UDashboardNavbar title="Droplets">
      <template #leading><UDashboardSidebarCollapse /></template>
    </UDashboardNavbar>

    <UDashboardToolbar>
      <template #left><!-- search, region/status filters --></template>
      <template #right><!-- primary action / bulk actions --></template>
    </UDashboardToolbar>
  </template>

  <template #body><!-- stats + table --></template>
</UDashboardPanel>
```

### Settings / Form Pages (centered)

```vue
<template #body>
  <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
    <!-- form sections with generous spacing -->
  </div>
</template>
```

## Visual Hierarchy

### Typography Scale

| Level | Usage | Classes |
|-------|-------|---------|
| Page title | Navbar | Handled by `UDashboardNavbar` |
| Section heading | Cards, form groups | `text-lg font-semibold text-highlighted` |
| Sub-heading | Card titles | `text-sm font-medium text-highlighted` |
| Body text | Descriptions | `text-sm text-muted` |
| Label | Captions | `text-xs font-medium text-muted uppercase tracking-wide` |
| Stat number | KPI values | `text-2xl font-semibold text-highlighted` |
| Mono | IPs, IDs, sizes | `font-mono text-sm` |

IP addresses, Droplet IDs, region slugs, and sizes should always be `font-mono` for scannability.

### Spacing Rhythm

| Context | Spacing | Classes |
|---------|---------|---------|
| Between form fields | 16px | `space-y-4` / `gap-4` |
| Between form sections | 24px | `space-y-6` / `gap-6` |
| Between page sections | 24-48px | `gap-6 sm:gap-8 lg:gap-12` |
| Card padding | 16px | `p-4` |
| Icon-to-text gap | 8-12px | `gap-2` / `gap-3` |

### Information Density Zones

- **High density**: resource tables — tighter rows (`py-3`), compact badges, truncated names.
- **Medium density**: cards, toolbars — standard padding.
- **Low density**: empty states, the dashboard, settings — generous whitespace, centered.

## Page Recipes

### Recipe 1: Resource List (Table) — e.g. Droplets

```
+--------------------------------------------------+
| Navbar: "Droplets"                                 |
+--------------------------------------------------+
| Toolbar: [Search] [Region ▾] [Status ▾] | [+ Create]|
+--------------------------------------------------+
| Stats: [ Total | Active | Off | Monthly $ ]        |
+--------------------------------------------------+
| Table:                                             |
|  ☐  Name / IP        Status   Region  Size  •••     |
|  ☐  web-prod-01      Active   nyc1    s-2   •••     |
|  ☐  db-staging       Off      sfo3    s-4   •••     |
+--------------------------------------------------+
| Pagination (meta.total / per_page)                 |
+--------------------------------------------------+
```

**Key patterns:** stats row above the table; search + filters left, primary action right;
**bulk-action bar replaces the create button when rows are selected** (the batch-editing feature);
row click → Droplet detail.

### Recipe 2: Resource Cards (grid) — e.g. Databases, Projects

```
| Toolbar: [Search]                       | [+ Create] |
| +------------------+ +------------------+             |
| | pg-cluster-1     | | redis-cache      |             |
| | PostgreSQL 16    | | Redis 7          |             |
| | nyc1 · 2 nodes   | | sfo3 · 1 node    |             |
| +------------------+ +------------------+             |
```

Cards in `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`, each with border, rounded, hover.

### Recipe 3: Dashboard Overview

```
| Navbar: "Dashboard"                                |
| Stats: [Droplets] [Databases] [Month-to-date $] [Open alerts] |
| Two-column: [ Recent activity / Actions log ] [ Quick actions ] |
```

Pull month-to-date spend from `/v2/customers/my/balance`, recent actions from `/v2/actions`.

### Recipe 4: Settings / Detail Sections

Centered `max-w-2xl`, sections separated by `<USeparator/>`, a **Danger Zone** at the bottom for
destructive actions (Destroy Droplet, Delete cluster). Use the floating-save pattern only for
batched forms; keep toggles instant.

### Recipe 5: Detail Slideover

Open a Droplet/Firewall from its list in a right-side `USlideover` for quick inspect/edit without
losing the list context. Use a full page (`/droplet/:id`) for deep detail (graphs, backups, networking).

## Component Composition

### Stat Card (KPI)

```vue
<div class="bg-elevated/50 rounded-lg p-4 border border-default">
  <div class="flex items-center gap-3">
    <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <UIcon name="i-lucide-server" class="size-5 text-primary" />
    </div>
    <div>
      <p class="text-2xl font-semibold text-highlighted">24</p>
      <p class="text-xs text-muted">Active Droplets</p>
    </div>
  </div>
</div>
```

Color tints by meaning: `bg-primary/10` (default), `bg-success/10` (active/healthy),
`bg-warning/10` (pending/resizing), `bg-error/10` (off/errored).

### Contextual Action Bar (batch editing)

This is the centerpiece feature the official console lacks. When rows are selected, swap the primary
action for bulk operations:

```vue
<template #right>
  <div v-if="selectedCount > 0" class="flex items-center gap-2">
    <UBadge color="primary" variant="subtle">{{ selectedCount }} selected</UBadge>
    <UDropdownMenu :items="bulkActions">
      <UButton color="neutral" variant="outline" icon="i-lucide-chevron-down" trailing>
        Bulk actions
      </UButton>
    </UDropdownMenu>
    <UButton color="neutral" variant="ghost" size="sm" @click="clearSelection">Clear</UButton>
  </div>

  <UButton v-else icon="i-lucide-plus" label="Create Droplet" class="cursor-pointer" @click="openCreate" />
</template>
```

Bulk actions for Droplets: tag, power on/off, snapshot, destroy. Each fans out the per-resource
action with optimistic UI + a single summary toast ("Powering off 3 Droplets…").

### Table Cell Compositions

**Identity cell (name + IP):**
```ts
cell: ({ row }) => h('div', { class: 'flex items-center gap-3 min-w-0' }, [
  h(UIcon, { name: 'i-lucide-server', class: 'size-5 text-muted shrink-0' }),
  h('div', { class: 'min-w-0' }, [
    h('div', { class: 'font-medium text-highlighted truncate' }, row.original.name),
    h('div', { class: 'text-sm text-muted font-mono truncate' }, publicIp(row.original) ?? '—'),
  ]),
])
```

**Status badge with icon:**
```ts
cell: ({ row }) => {
  const s = dropletStatusConfig[row.original.status] // { color, icon, label }
  return h(UBadge, { color: s.color, variant: 'subtle' }, () =>
    h('span', { class: 'flex items-center gap-1.5' }, [h(UIcon, { name: s.icon, class: 'size-3.5' }), s.label]))
}
```

**Tag list with overflow (+N):** show first tag + `+N` neutral badge.

## Color & Depth

### Semantic Color Usage

| Color | Usage | Tint / Text |
|-------|-------|-------------|
| `primary` (ocean) | CTAs, selections, active state | `bg-primary/10` · `text-primary` |
| `success` (green) | Active / healthy / completed | `bg-success/10` · `text-success` |
| `warning` (amber) | Pending / resizing / in-progress | `bg-warning/10` · `text-warning` |
| `error` (red) | Off / errored / destructive | `bg-error/10` · `text-error` |
| `info` (blue) | Informational notes | `bg-info/10` · `text-info` |
| `neutral` (slate) | Default, disabled, secondary | `bg-elevated/50` · `text-muted` |

### Depth Without Heavy Shadows

```vue
<!-- PREFERRED: border + tinted background -->
<div class="bg-elevated/50 rounded-lg border border-default p-4">
<!-- Slight lift when needed -->
<div class="bg-elevated rounded-lg border border-default shadow-sm p-4">
<!-- AVOID: shadow-lg / shadow-xl everywhere -->
```

## Micro-Interactions & Motion

```vue
<!-- Clickable row/card -->
class="cursor-pointer hover:bg-elevated/50 transition-colors duration-150"

<!-- Spinner on a resource mid-action -->
<UIcon v-if="isLoading" name="i-lucide-loader-2" class="size-4 animate-spin text-primary" />
```

Skeletons must mirror the content shape (table rows, stat cards) — never a generic centered spinner.

```vue
<div v-if="isPending" class="divide-y divide-default">
  <div v-for="i in 6" :key="i" class="flex items-center gap-4 p-4">
    <USkeleton class="size-9 rounded-lg" />
    <div class="flex-1 space-y-2"><USkeleton class="h-4 w-48" /><USkeleton class="h-3 w-32" /></div>
    <USkeleton class="h-6 w-16 rounded-full" />
  </div>
</div>
```

## Professional Polish

- **Border radius**: `rounded-lg` for containers/icon-tiles, `rounded-full` for avatars/badges.
- **Whitespace**: never let content touch container edges (min `p-4`); empty space is a feature.
- **Badges**: status = `variant="subtle"` + semantic color + icon; counts = neutral subtle; IDs/IPs = `font-mono`.
- **Empty cells**: em-dash `—`, never blank or "N/A".
- **Placeholders**: realistic — `placeholder="e.g. web-prod-01"`, `placeholder="Search Droplets…"`.

## Design Consistency System

Consistency is the single biggest driver of perceived quality. Same concept = same icon, component,
and interaction everywhere.

### Consistency Rules

| Rule | Standard |
|---|---|
| Border radius | `rounded-lg` containers; `rounded-full` avatars/badges |
| Icon size | `size-4` in text, `size-5` in buttons/tiles, `size-12` in empty states, `size-3` in small badges |
| Icon source | always `i-lucide-*` (brand logos: `i-simple-icons-*`); never mix sets |
| Status | `UBadge variant="subtle"` + icon + label; never color alone |
| Empty values | em-dash `—` |
| Destructive | `color="error"` + confirmation modal |
| Detail view | `USlideover` (quick) or detail page (deep); never a modal |
| Loading | `USkeleton` for content, `:loading` for buttons |

### DigitalOcean Resource Icons (same icon for a resource everywhere)

| Resource | Icon |
|---|---|
| Droplet | `i-lucide-server` |
| Firewall | `i-lucide-shield` |
| Volume (block storage) | `i-lucide-hard-drive` |
| Snapshot | `i-lucide-camera` |
| Image | `i-lucide-disc` |
| Database | `i-lucide-database` |
| Kubernetes | `i-lucide-ship-wheel` |
| Load Balancer | `i-lucide-scale` |
| VPC | `i-lucide-network` |
| Domain / DNS | `i-lucide-globe` |
| Reserved IP | `i-lucide-map-pin` |
| Spaces (object storage) | `i-lucide-box` |
| Container Registry | `i-lucide-container` |
| Project | `i-lucide-folder` |
| Tag | `i-lucide-tag` |
| SSH Key | `i-lucide-key-round` |
| Region | `i-lucide-map` |
| Billing | `i-lucide-credit-card` |
| Monitoring / Alerts | `i-lucide-activity` |
| Account | `i-lucide-user` |
| API Token | `i-lucide-key` |

### Action & Status Icons

| Concept | Icon |
|---|---|
| Create | `i-lucide-plus` |
| Edit | `i-lucide-pencil` |
| Delete / Destroy | `i-lucide-trash-2` (always `color="error"`) |
| Power | `i-lucide-power` |
| Resize | `i-lucide-scaling` |
| Reboot | `i-lucide-rotate-cw` |
| Search | `i-lucide-search` |
| Filter | `i-lucide-filter` |
| Settings | `i-lucide-settings` |
| Copy | `i-lucide-copy` |
| Refresh | `i-lucide-refresh-cw` |
| Success | `i-lucide-check-circle` |
| Error | `i-lucide-alert-circle` |
| Warning | `i-lucide-alert-triangle` |
| Info | `i-lucide-info` |
| More actions | `i-lucide-more-horizontal` |
| External link | `i-lucide-external-link` |

### Component Selection Guide

| Need | Use | Don't Use |
|---|---|---|
| Inspect one resource from a list | `USlideover` | `UModal` (too interruptive) |
| Short create/confirm (< 5 fields) | `UModal` | full page |
| Long create (e.g. new Droplet) | dedicated page (`/droplets/new`) | cramped modal |
| Destructive confirm | `UModal` + warning | `window.confirm()` |
| Quick toggle | inline `USwitch` | modal |
| Resource list (> 5) | `UTable` (selectable for batch) | card grid |
| Visual items (< 20) | card grid | table |
| Ephemeral feedback | `toast.add()` | inline `UAlert` |
| Persistent message | `UAlert` | toast |

### Cross-Page Consistency Checklist

- [ ] Page uses `UDashboardPanel` (`#header` navbar + toolbar, `#body`)
- [ ] `UDashboardSidebarCollapse` in the navbar `#leading` slot
- [ ] Primary action in toolbar `#right`; search/filters in `#left`
- [ ] Selectable tables expose the bulk-action bar on selection
- [ ] Resource icons match the table above
- [ ] Status uses `UBadge variant="subtle"` + icon (never color alone)
- [ ] Empty/error states follow the icon + title + description + CTA pattern (see [ui-quality.md](ui-quality.md))
- [ ] Loading uses `USkeleton` mirroring content
- [ ] Dates formatted via the date-fns utils (see [patterns.md](patterns.md))
- [ ] Only semantic color tokens (no hard-coded hex)

## Anti-Patterns (What NOT to Do)

**Visual clutter** — multiple focal points; > 2-3 colors at once (excl. neutrals); decoration with no
purpose; dense text without breaks. (This is what we're fixing about the official console.)

**Generic AI aesthetics** — gradient card backgrounds; everything `rounded-3xl`; hero illustrations
in admin pages; emoji in professional UI; animated/particle backgrounds.

**Spacing mistakes** — inconsistent padding; content touching edges; uniform spacing that flattens
hierarchy; giant gaps between related elements.

**Color mistakes** — hard-coded hex instead of tokens; saturated colors over large areas (use `/10`
tints); red for non-errors / green for non-success.

**Component misuse** — `UCard` wrapping everything; nested cards; modal where a slideover belongs;
full-width tables on settings pages (use `max-w-2xl`).
