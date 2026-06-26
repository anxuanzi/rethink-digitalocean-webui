<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

defineProps<{ database: DatabaseCluster }>()
const menu = useDatabaseMenu()
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ root: 'ring-error/30' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-4 text-error"
        />
        <h3 class="font-semibold text-highlighted">
          Danger zone
        </h3>
      </div>
    </template>

    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-medium text-highlighted">
          Destroy this cluster
        </p>
        <p class="text-sm text-muted max-w-md">
          Permanently deletes {{ database.name }} along with all of its data, users, and backups.
          This cannot be undone.
        </p>
      </div>
      <UButton
        label="Destroy cluster"
        icon="i-lucide-trash-2"
        color="error"
        variant="solid"
        @click="menu.openDestroy(database)"
      />
    </div>
  </UCard>
</template>
