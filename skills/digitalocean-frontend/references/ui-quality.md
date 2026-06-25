# UI Quality & Design System

The quality bar for every screen in the DigitalOcean console. This is **dark-mode native**:
design both themes at the same time, lean on semantic tokens, and never ship a hard-coded color.
The console competes with the official DigitalOcean console on speed and clarity, so loading,
empty, and error states are first-class — not afterthoughts.

For the broader design system (layout recipes, stat cards, status badges, icon-per-concept map,
consistency checklist), see [design-patterns.md](design-patterns.md). For the data-fetching and
optimistic-UI patterns that feed these states, see [patterns.md](patterns.md).

## Table of Contents
- [Design System](#design-system)
- [Semantic Color Tokens (use these first)](#semantic-color-tokens-use-these-first)
- [UI Checklist (Every Implementation)](#ui-checklist-every-implementation)
- [Dark Mode Rules](#dark-mode-rules)
- [Empty States](#empty-states)
- [Error States](#error-states)
- [Loading States](#loading-states)
- [Interactive Element Patterns](#interactive-element-patterns)

## Design System

- **Vibe**: Clean, modern, professional SaaS — inspired by the Nuxt UI Dashboard template, with
  Linear / Stripe / Vercel-level clarity. DigitalOcean's identity stays recognizable; the UX gets
  the polish the official console lacks.
- **Stack**: Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4. Components must be Nuxt UI v4 idiomatic
  (`UButton :loading`, `USkeleton`, `UBadge variant="subtle"`, `UTable`, …).
- **Icons**: Iconify-based. Use `i-lucide-*` (Lucide) for UI icons and `i-simple-icons-*` for brand
  logos. Same concept = same icon, everywhere (see the icon map in
  [design-patterns.md](design-patterns.md)).
- **Color**: The Nuxt UI `primary` is anchored on the custom **`ocean`** scale (DigitalOcean blue),
  with `slate` as the neutral foundation. This is configured once, then accessed only through tokens:

```ts
// app/app.config.ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'ocean',   // custom DigitalOcean-blue scale (defined in app/assets/css/main.css)
      neutral: 'slate'    // calm gray foundation
    }
  }
})
```

Because `primary` maps to `ocean`, you reference DigitalOcean blue as `text-primary`,
`bg-primary`, `bg-primary/10`, `ring-primary`, etc. — **never** a literal hex. Changing the brand
blue is a one-line edit in `main.css`; the rest of the app follows.

## Semantic Color Tokens (use these first)

Nuxt UI v4 exposes semantic, theme-aware tokens that already resolve correctly in light and dark
mode. **Reach for these before raw `gray-*` pairs** — they are the cleanest path to a dark-mode-native
UI and keep the whole console consistent.

| Token | Use for |
|---|---|
| `text-highlighted` | Primary text, headings (high contrast) |
| `text-default` | Standard body text |
| `text-muted` | Secondary / supporting text, captions |
| `text-dimmed` | De-emphasized text, placeholders |
| `bg-default` | Page / base background |
| `bg-elevated` | Cards, panels, subtle raised surfaces |
| `border-default` | Standard borders and dividers |
| `text-primary` / `bg-primary` / `bg-primary/10` | DigitalOcean-blue emphasis, selected/active states |

```vue
<!-- Semantic tokens: theme-aware by default, no dark: variants needed -->
<div class="bg-elevated border border-default rounded-lg p-4">
  <h2 class="text-highlighted font-medium">Droplet details</h2>
  <p class="text-muted text-sm">Region, size, and image for this Droplet.</p>
</div>
```

When you do drop to raw Tailwind colors (sometimes necessary for one-off cases), you **must** pair
every light class with its `dark:` variant — see [Dark Mode Rules](#dark-mode-rules).

## UI Checklist (Every Implementation)

Every screen MUST verify:

- [ ] `cursor-pointer` on ALL clickable elements (buttons, cards, links, dropdown items, table rows)
- [ ] Loading states: `<UButton :loading="isSubmitting">` for async ops (power on, resize, snapshot); `<USkeleton>` for content
- [ ] Disabled states: `<UButton :disabled="!isValid || isSubmitting">` during submission
- [ ] Hover effects: `hover:bg-elevated transition-colors duration-150` (or `hover:bg-gray-50 dark:hover:bg-gray-800`)
- [ ] Focus rings: `focus-visible:ring-2 focus-visible:ring-primary` for keyboard accessibility
- [ ] Dark mode: Test both themes — semantic tokens preferred, no hard-coded colors, always `dark:` variants on raw colors
- [ ] Empty states: Icon + message + action button when lists have no data (no Droplets, no firewall rules, no Volumes)
- [ ] Error states: Clear messaging with a Retry option (the browser calls the DO API directly — network failures happen)
- [ ] Transitions: `<Transition>` for modals/slideovers, `<TransitionGroup>` for lists
- [ ] Responsive: Proper layout on mobile and desktop

## Dark Mode Rules

The console is dark-mode native. Prefer the [semantic tokens](#semantic-color-tokens-use-these-first)
above. When you fall back to raw Tailwind colors, always use `dark:` variants — never hard-code a color.

```vue
<!-- CORRECT (semantic tokens — theme-aware automatically) -->
<div class="bg-default">
  <h2 class="text-highlighted">Firewalls</h2>
  <p class="text-muted">Rules applied to your Droplets and tags.</p>
  <div class="border border-default">
    <div class="bg-elevated">Subtle raised surface</div>
  </div>
</div>

<!-- CORRECT (raw colors — every light class has a dark: pair) -->
<div class="bg-white dark:bg-gray-900">
  <h2 class="text-gray-900 dark:text-gray-100">Firewalls</h2>
  <p class="text-gray-600 dark:text-gray-400">Rules applied to your Droplets and tags.</p>
  <div class="border border-gray-200 dark:border-gray-700">
    <div class="bg-gray-50 dark:bg-gray-800">Subtle background</div>
  </div>
</div>

<!-- WRONG -->
<div class="bg-white">               <!-- No dark variant -->
<h2 class="text-gray-900">           <!-- Invisible in dark mode -->
<div style="background: #f9fafb">    <!-- Hard-coded color -->
<span class="text-[#0069ff]">        <!-- Hard-coded brand blue — use text-primary -->
```

Common dark mode pairs (when not using semantic tokens):

| Light | Dark | Semantic equivalent |
|---|---|---|
| `bg-white` | `dark:bg-gray-900` | `bg-default` |
| `bg-gray-50` | `dark:bg-gray-800` | `bg-elevated` |
| `text-gray-900` | `dark:text-gray-100` | `text-highlighted` |
| `text-gray-600` | `dark:text-gray-400` | `text-muted` |
| `text-gray-500` | `dark:text-gray-400` | `text-dimmed` |
| `border-gray-200` | `dark:border-gray-700` | `border-default` |
| `hover:bg-gray-50` | `dark:hover:bg-gray-800` | `hover:bg-elevated` |

## Empty States

Every list/collection view must handle the empty state with an icon, a clear message, and a primary
action that gets the user unblocked. Keep the copy DigitalOcean-specific — name the resource.

```vue
<template>
  <!-- When the list has data -->
  <div v-if="droplets.length > 0">
    <!-- Droplets list -->
  </div>

  <!-- Empty state -->
  <div v-else class="text-center py-12">
    <UIcon name="i-lucide-server" class="w-12 h-12 mx-auto text-dimmed mb-4" />
    <h3 class="text-lg font-medium text-highlighted">No Droplets yet</h3>
    <p class="mt-1 text-sm text-muted">Spin up your first Droplet to get started.</p>
    <UButton class="mt-4 cursor-pointer" icon="i-lucide-plus" @click="openCreateDroplet">
      Create Droplet
    </UButton>
  </div>
</template>
```

More DO-flavored empty states (icon · heading · action):

| Context | Icon | Heading | Action |
|---|---|---|---|
| Droplets list | `i-lucide-server` | No Droplets yet | Spin up your first Droplet (`i-lucide-plus`) |
| Firewall rules | `i-lucide-shield` | No firewall rules | Add a rule (`i-lucide-plus`) |
| Volumes | `i-lucide-hard-drive` | No Volumes yet | Create a Volume (`i-lucide-plus`) |
| Databases | `i-lucide-database` | No database clusters | Create a database cluster (`i-lucide-plus`) |
| Load Balancers | `i-lucide-network` | No Load Balancers | Create a Load Balancer (`i-lucide-plus`) |
| Domains / DNS | `i-lucide-globe` | No domains added | Add a domain (`i-lucide-plus`) |
| Filtered/search result | `i-lucide-search-x` | No Droplets match your filters | Clear filters (`i-lucide-x`) |

Distinguish a **truly empty** collection (offer the create action) from a **filtered-empty** result
(offer to clear filters) — they need different copy and different actions.

## Error States

The console talks to the DigitalOcean API directly from the browser, so network reachability,
rate limits, and bad tokens are real failure modes. Always give the user a clear message and a way
to recover. Errors surface as `ofetch` `FetchError` — read `error.statusCode` / `error.data?.message`
(see [patterns.md](patterns.md) and [digitalocean-api.md](digitalocean-api.md)).

```vue
<template>
  <!-- Error state with retry -->
  <div v-if="error" class="text-center py-12">
    <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mx-auto text-error mb-4" />
    <h3 class="text-lg font-medium text-highlighted">Couldn't reach DigitalOcean</h3>
    <p class="mt-1 text-sm text-muted">{{ error.message }}</p>
    <UButton class="mt-4 cursor-pointer" variant="outline" icon="i-lucide-refresh-cw" @click="refetch">
      Retry
    </UButton>
  </div>
</template>
```

Tailor the message to the failure so the user knows what to do:

| Situation | Heading | Guidance |
|---|---|---|
| Network unreachable | Couldn't reach DigitalOcean | Check your connection, then Retry |
| `401` invalid/expired token | Your DigitalOcean token isn't working | Reconnect with a valid Personal Access Token |
| `429` rate limited | Too many requests | DigitalOcean limits requests per token — wait a moment, then Retry |
| `5xx` from the DO API | DigitalOcean returned an error | This is usually temporary — Retry shortly |

`text-error` is the semantic destructive token; `text-red-400` with a `dark:` pair also works. For
transient failures inside an otherwise-loaded view, a `useToast()` error toast is often better than
replacing the whole screen — reserve the full-screen error block for "the page has no data to show."

## Loading States

The console should feel instant. Use skeletons that mirror the real content's shape (so the layout
doesn't jump), and `:loading` on the button that triggered an async action.

### Page/Section Loading (Skeleton)

```vue
<template>
  <!-- Skeleton mirrors the Droplets dashboard: title, stat cards, table -->
  <div v-if="isPending" class="space-y-4">
    <USkeleton class="h-8 w-48" />                <!-- Page title -->
    <div class="grid grid-cols-3 gap-4">
      <USkeleton v-for="i in 3" :key="i" class="h-24" />   <!-- Stat cards -->
    </div>
    <USkeleton class="h-4 w-full" />              <!-- Table header row -->
    <USkeleton v-for="i in 6" :key="i" class="h-12 w-full" />  <!-- Table rows -->
  </div>
</template>
```

With Pinia Colada, the loading flag is `isPending` from `useQuery` (see [patterns.md](patterns.md)).
Authenticated DO data is fetched client-side (the token is client-only), so guard with
`import.meta.client` where needed.

### Button Loading

```vue
<!-- Async resource action: power on, resize, snapshot, delete -->
<UButton
  :loading="isPoweringOn"
  :disabled="isPoweringOn"
  icon="i-lucide-power"
  class="cursor-pointer"
  @click="powerOnDroplet"
>
  Power On
</UButton>
```

DigitalOcean actions (power, resize, snapshot, rebuild) are **async** — the API returns an `action`
that settles later. Pair the button `:loading` with an **optimistic update** so the resource's
status flips immediately and reconciles when the action completes
(see [patterns.md](patterns.md)).

## Interactive Element Patterns

### Clickable Card

```vue
<!-- e.g. a Droplet summary card that opens the detail view -->
<div
  role="button"
  tabindex="0"
  class="cursor-pointer rounded-lg border border-default bg-elevated p-4
         hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600
         transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary"
  @click="openDroplet(droplet)"
  @keydown.enter="openDroplet(droplet)"
>
  <!-- card content -->
</div>
```

### Clickable Table Row

```vue
<!-- Droplets table: each row opens /droplet/:id -->
<UTable
  :data="droplets"
  :columns="columns"
  class="[&_tr]:cursor-pointer"
  @select="(e: Event, row: TableRow<Droplet>) => openDroplet(row.original)"
/>
```

### Action Buttons Group

```vue
<!-- Per-row actions on a firewall rule (edit / delete) -->
<div class="flex items-center gap-2">
  <UButton
    variant="outline"
    icon="i-lucide-pencil"
    size="xs"
    class="cursor-pointer"
    @click="editRule(rule)"
  />
  <UButton
    variant="outline"
    color="error"
    icon="i-lucide-trash-2"
    size="xs"
    class="cursor-pointer"
    @click="confirmDeleteRule(rule)"
  />
</div>
```

### Status Badge

Use `UBadge variant="subtle"` for resource status so color reads as meaning, not decoration. Map
DigitalOcean's statuses to semantic colors (full status/icon map in
[design-patterns.md](design-patterns.md)):

```vue
<!-- Droplet status: new | active | off | archive -->
<UBadge
  :color="{ active: 'success', new: 'info', off: 'neutral', archive: 'warning' }[droplet.status]"
  variant="subtle"
  class="capitalize"
>
  {{ droplet.status }}
</UBadge>
```

---

**See also:** [design-patterns.md](design-patterns.md) (full design system & layout recipes) ·
[ux-principles.md](ux-principles.md) (feedback timing, cognitive load) ·
[accessibility.md](accessibility.md) (focus management, ARIA, keyboard) ·
[patterns.md](patterns.md) (data fetching, optimistic UI, toasts).
