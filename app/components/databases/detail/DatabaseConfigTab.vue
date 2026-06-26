<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

/**
 * Generic engine-config editor. `/config` returns a flat-ish bag of tunables whose keys differ per
 * engine (Postgres autovacuum knobs, Redis maxmemory policy, …), so we can't hard-code a form —
 * we render whatever keys come back and pick a control from each value's runtime type.
 *
 * Only primitive (string | number | boolean) keys are editable; object/array values are surfaced
 * read-only (those are managed sub-structures we shouldn't blindly round-trip). On save we send ONLY
 * the keys that actually changed, so we never clobber settings we merely displayed.
 */
const props = defineProps<{ database: DatabaseCluster }>()

const { config, isPending, refresh } = useDatabaseConfig(() => props.database.id)
const actions = useDatabaseActions()

// Local editable copy, reconciled whenever the server config changes (initial load + after save).
const local = ref<Record<string, unknown>>({})
watch(config, (c) => {
  local.value = { ...c }
}, { immediate: true })

const search = ref('')
const entries = computed(() =>
  Object.keys(local.value)
    .filter(k => k.toLowerCase().includes(search.value.trim().toLowerCase()))
    .sort()
)

// Dirty detection over editable primitive keys only. Object/array values are read-only (their
// identity changes on every refetch, which would falsely read as "changed"), and primitives are
// compared by string so a number that round-trips through an input never registers as an edit.
const changed = computed(() =>
  Object.keys(local.value).filter((k) => {
    const server = config.value[k]
    if (server !== null && typeof server === 'object') return false
    return String(local.value[k]) !== String(server)
  })
)
const dirty = computed(() => changed.value.length > 0)

const saving = ref(false)
async function save() {
  saving.value = true
  // Send only changed keys so we don't round-trip values we merely rendered.
  const patch: Record<string, unknown> = {}
  for (const k of changed.value) patch[k] = local.value[k]
  const ok = await actions.updateConfig(props.database, patch)
  saving.value = false
  if (ok) refresh()
}

function kind(v: unknown) {
  return typeof v === 'boolean' ? 'boolean' : typeof v === 'number' ? 'number' : typeof v === 'string' ? 'string' : 'other'
}
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-sliders-horizontal"
            class="size-4 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Advanced configuration
          </h3>
        </div>
        <UButton
          v-if="dirty"
          size="sm"
          label="Save changes"
          :loading="saving"
          @click="save"
        />
      </div>
    </template>

    <p class="text-sm text-muted mb-4">
      Engine-specific tunables for this cluster. Object values are managed by DigitalOcean and shown
      read-only.
    </p>

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Filter settings"
      class="w-full mb-4"
    />

    <!-- Loading -->
    <div
      v-if="isPending && !Object.keys(local).length"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 6"
        :key="i"
        class="h-10 rounded-lg"
      />
    </div>

    <!-- Empty -->
    <p
      v-else-if="!entries.length"
      class="py-8 text-center text-sm text-muted"
    >
      {{ search.trim() ? 'No settings match your filter.' : 'This engine exposes no configurable settings.' }}
    </p>

    <!-- Settings -->
    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="key in entries"
        :key="key"
        class="flex items-center justify-between gap-4 py-2.5"
      >
        <span class="font-mono text-sm text-highlighted min-w-0 truncate">{{ key }}</span>

        <div class="shrink-0">
          <USwitch
            v-if="kind(local[key]) === 'boolean'"
            :model-value="local[key] as boolean"
            @update:model-value="v => local[key] = v"
          />
          <UInput
            v-else-if="kind(local[key]) === 'number'"
            :model-value="local[key] as number"
            type="number"
            size="sm"
            class="w-40"
            @update:model-value="v => local[key] = Number(v)"
          />
          <UInput
            v-else-if="kind(local[key]) === 'string'"
            :model-value="local[key] as string"
            size="sm"
            class="w-56"
            @update:model-value="v => local[key] = v"
          />
          <span
            v-else
            class="text-xs text-dimmed font-mono max-w-56 truncate"
          >{{ JSON.stringify(local[key]) }}</span>
        </div>
      </li>
    </ul>
  </UCard>
</template>
