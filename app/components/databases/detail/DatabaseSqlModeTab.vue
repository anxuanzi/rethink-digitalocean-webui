<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()

const { sqlMode, isPending } = useSqlMode(() => props.database.id)
const actions = useDatabaseActions()

const local = ref('')
watch(sqlMode, (v) => {
  local.value = v
}, { immediate: true })

const dirty = computed(() => local.value !== sqlMode.value)
const saving = ref(false)

async function save() {
  saving.value = true
  await actions.setSqlMode(props.database, local.value)
  saving.value = false
}
</script>

<template>
  <UCard variant="subtle">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-settings-2"
          class="size-4 text-muted"
        />
        <h3 class="font-semibold text-highlighted">
          SQL mode
        </h3>
      </div>
    </template>

    <p class="text-sm text-muted mb-4">
      Comma-separated SQL mode flags applied to the server.
    </p>

    <!-- Loading -->
    <div
      v-if="isPending && !sqlMode"
      class="space-y-3"
    >
      <USkeleton class="h-24 w-full rounded-lg" />
      <USkeleton class="h-9 w-24 rounded-lg" />
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <UTextarea
        v-model="local"
        :rows="4"
        class="w-full font-mono"
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
