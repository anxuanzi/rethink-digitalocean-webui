# Code Patterns

UI and composition patterns for the console. The DigitalOcean data layer itself (client-only token,
`$doFetch` calling the DO API directly, Pinia Colada queries/mutations, async actions) is in
[digitalocean-api.md](digitalocean-api.md) — this file covers how those wire into components, forms,
and feedback.

## Table of Contents
- [Optimistic UI (CRITICAL)](#optimistic-ui-critical)
- [Composable Structure](#composable-structure)
- [Form Validation (Zod + UForm)](#form-validation-zod--uform)
- [Toast Notifications](#toast-notifications)
- [Date & Time Handling (ISO-8601)](#date--time-handling-iso-8601)
- [Component Patterns](#component-patterns)

## Optimistic UI (CRITICAL)

DigitalOcean operations are often **asynchronous** (power, resize, snapshot, rebuild return an
`action` that settles later) and lists are eventually consistent. Every mutation MUST feel instant:
reflect the intended state immediately, reconcile when the server confirms. We implement this with
**Pinia Colada mutations** — `onMutate` (optimistic patch) → `onError` (rollback) → `onSettled`
(invalidate). The full, copy-pasteable pattern lives in
[digitalocean-api.md → Writes with Pinia Colada](digitalocean-api.md#writes-with-pinia-colada-usemutation).

### Visual feedback for in-flight state

Pair the optimistic cache patch with a clear visual cue so the user knows an async action is running:

```vue
<script setup lang="ts">
// `isLoading` comes from useMutation; mark the row while a DO action is in-flight.
const { mutate: powerOff, isLoading } = useMutation({ /* … */ })
</script>

<template>
  <div :class="{ 'opacity-60 pointer-events-none': isLoading }">
    <UBadge v-if="isLoading" color="warning" variant="subtle" size="xs" class="gap-1">
      <UIcon name="i-lucide-loader-2" class="size-3 animate-spin" />
      Powering off…
    </UBadge>
    {{ droplet.name }}
  </div>
</template>
```

For long actions, poll `waitForAction(actionId)` (see digitalocean-api.md) in the background and
`invalidateQueries` when it completes — the badge clears itself once real state returns.

## Composable Structure

Wrap a resource's queries + mutations in one composable so pages stay declarative. Use the typed API
modules and query-key factories from [digitalocean-api.md](digitalocean-api.md).

```ts
// app/composables/useDroplets.ts (auto-imported)
export function useDroplets(page: Ref<number>) {
  const api = useDoApi()
  const queryCache = useQueryCache()
  const toast = useToast()

  // --- Read ---
  const { state, asyncStatus, refresh } = useQuery({
    key: () => dropletKeys.list(page.value),   // reactive → refetches on page change
    query: () => api.droplets.list(page.value, 50),
  })

  const droplets = computed(() => state.value.data?.droplets ?? [])
  const total = computed(() => state.value.data?.meta.total ?? 0)
  const isPending = computed(() => asyncStatus.value === 'loading')

  // --- Write (optimistic delete) ---
  const { mutate: destroy } = useMutation({
    mutation: (id: number) => api.droplets.remove(id),
    onMutate(id) {
      const key = dropletKeys.list(page.value)
      const previous = queryCache.getQueryData<DropletsResponse>(key)
      if (previous) {
        queryCache.setQueryData(key, {
          ...previous,
          droplets: previous.droplets.filter(d => d.id !== id),
        })
      }
      return { previous, key }
    },
    onError(_e, _id, { previous, key }) {
      if (previous) queryCache.setQueryData(key, previous)
      toast.add({ title: 'Delete failed', color: 'error', icon: 'i-lucide-alert-circle' })
    },
    onSettled() {
      queryCache.invalidateQueries({ key: dropletKeys.root })
    },
  })

  return { droplets, total, isPending, refresh, destroy }
}
```

## Form Validation (Zod + UForm)

`UForm` validates a reactive `state` against a Zod `schema`. The `UFormField` `name` MUST match the
schema key for errors to render on the right field.

```vue
<template>
  <UForm :state="state" :schema="schema" class="space-y-4" @submit="onSubmit">
    <UFormField label="Droplet name" name="name" required>
      <UInput v-model="state.name" placeholder="e.g. web-prod-01" />
    </UFormField>

    <UFormField label="Region" name="region" required>
      <USelectMenu v-model="state.region" :items="regions" value-key="slug" label-key="name" />
    </UFormField>

    <UButton type="submit" :loading="isSubmitting" :disabled="isSubmitting">
      Create Droplet
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
import { z } from 'zod'

const schema = z.object({
  // DigitalOcean Droplet names: lowercase letters, digits, dashes/dots.
  name: z.string().min(1, 'Name is required')
    .regex(/^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/, 'Lowercase letters, digits, dashes only'),
  region: z.string().min(1, 'Pick a region'),
})

type Schema = z.output<typeof schema>
const state = reactive<Partial<Schema>>({ name: '', region: '' })
const isSubmitting = ref(false)

async function onSubmit() {
  isSubmitting.value = true
  try {
    // call a create mutation here
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

**Firewall rule notes** (a flagship feature this console adds over the official one): since the
DigitalOcean API has no field for per-rule notes, store them in a client map keyed by a stable rule
signature (`protocol:ports:sources`), persisted via Pinia. Validate the note with Zod
(`z.string().max(140)`) and render it next to the rule. Document the storage choice in code comments.

## Toast Notifications

```ts
const toast = useToast()

// Semantic colors: 'success' | 'error' | 'warning' | 'info' | 'neutral'
toast.add({ title: 'Droplet created', description: 'web-prod-01 is spinning up', color: 'success', icon: 'i-lucide-check-circle' })
toast.add({ title: 'Action failed', description: err.data?.message, color: 'error', icon: 'i-lucide-alert-circle' })
toast.add({ title: 'Rate limited', description: 'Slowing down — retrying shortly', color: 'warning', icon: 'i-lucide-alert-triangle' })
```

Keep wording specific and action-oriented ("Droplet created", not "Success"). See
[ux-principles.md](ux-principles.md) for content-design rules.

## Date & Time Handling (ISO-8601)

DigitalOcean returns **ISO-8601 strings** (e.g. `"2020-07-21T18:37:44Z"`) — not unix milliseconds.
Use **date-fns**. Centralize formatting in `app/utils/datetime.ts` (auto-imported) for consistency.

```ts
// app/utils/datetime.ts
import { parseISO, format, formatDistanceToNow, isValid } from 'date-fns'

export function shortDate(iso?: string | null) {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'MMM d, yyyy') : '—'
}

export function relativeTime(iso?: string | null) {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? `${formatDistanceToNow(d)} ago` : '—'
}
```

```vue
<!-- WRONG — raw ISO string -->
<span>{{ droplet.created_at }}</span>            <!-- "2020-07-21T18:37:44Z" -->

<!-- CORRECT — formatted via util -->
<span>{{ shortDate(droplet.created_at) }}</span>     <!-- "Jul 21, 2020" -->
<span>{{ relativeTime(droplet.created_at) }}</span>  <!-- "5 years ago" -->
```

Use an em-dash (`—`) for missing values, never blank or "N/A".

## Component Patterns

### Dropdown Menu Items — `onSelect`, NOT `click`

```ts
import type { DropdownMenuItem } from '@nuxt/ui'

const rowActions = (droplet: Droplet): DropdownMenuItem[][] => [[
  { label: 'Power off', icon: 'i-lucide-power', onSelect: () => powerOff(droplet.id) },
  { label: 'Resize', icon: 'i-lucide-scaling', onSelect: () => openResize(droplet) },
], [
  { label: 'Destroy', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => confirmDestroy(droplet) },
]]
```

### Table with row selection (enables batch editing)

Selection powers the **bulk actions** this console is built around (batch tag, batch power, batch
destroy). See the contextual action bar in [design-patterns.md](design-patterns.md).

```vue
<UTable
  v-model:row-selection="rowSelection"
  :data="droplets"
  :columns="columns"
  :loading="isPending"
  @select="(e: Event, row: TableRow<Droplet>) => navigateTo(`/droplet/${row.original.id}`)"
/>
```

### Modal / Slideover via the overlay API

```ts
const overlay = useOverlay()

async function openResize(droplet: Droplet) {
  const modal = overlay.create(ResizeDropletModal, { props: { droplet } })
  await modal.open()
}
```

Use a **slideover** for entity detail/edit and a **modal** for short create/confirm flows — see the
component-selection guide in [design-patterns.md](design-patterns.md).
