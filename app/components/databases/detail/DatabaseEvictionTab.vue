<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()

const { policy, isPending } = useEvictionPolicy(() => props.database.id)
const actions = useDatabaseActions()

const items = [
  { label: 'No eviction', value: 'noeviction' },
  { label: 'All keys, LRU', value: 'allkeys_lru' },
  { label: 'All keys, LFU', value: 'allkeys_lfu' },
  { label: 'All keys, random', value: 'allkeys_random' },
  { label: 'Volatile, LRU', value: 'volatile_lru' },
  { label: 'Volatile, LFU', value: 'volatile_lfu' },
  { label: 'Volatile, random', value: 'volatile_random' },
  { label: 'Volatile, TTL', value: 'volatile_ttl' }
]

const local = ref('')
watch(policy, (v) => {
  local.value = v
}, { immediate: true })

const dirty = computed(() => local.value !== policy.value)
const saving = ref(false)

async function save() {
  saving.value = true
  await actions.setEvictionPolicy(props.database, local.value)
  saving.value = false
}
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-recycle"
          class="size-4 text-muted"
        />
        <h3 class="font-semibold text-highlighted">
          Eviction policy
        </h3>
      </div>
    </template>

    <p class="text-sm text-muted mb-4">
      Controls which keys are removed when the cluster reaches its memory limit.
    </p>

    <!-- Loading -->
    <div
      v-if="isPending && !policy"
      class="space-y-3"
    >
      <USkeleton class="h-10 w-full sm:w-80 rounded-lg" />
      <USkeleton class="h-9 w-24 rounded-lg" />
    </div>

    <div
      v-else
      class="flex flex-wrap items-end gap-3"
    >
      <USelect
        v-model="local"
        :items="items"
        value-key="value"
        class="w-full sm:w-80"
      />
      <UButton
        label="Save"
        :loading="saving"
        :disabled="!dirty"
        @click="save"
      />
    </div>
  </UCard>
</template>
