<script setup lang="ts">
import type { DatabaseCluster } from '~/types/database'

const props = defineProps<{ database: DatabaseCluster }>()

const { indexes, isPending } = useDatabaseIndexes(() => props.database.id)
const actions = useDatabaseActions()

const pendingDelete = ref<string | null>(null)
const confirmOpen = computed({
  get: () => !!pendingDelete.value,
  set: (value) => {
    if (!value) pendingDelete.value = null
  }
})
const submitting = ref(false)

async function confirmDelete() {
  if (!pendingDelete.value) return
  submitting.value = true
  const ok = await actions.removeIndex(props.database, pendingDelete.value)
  submitting.value = false
  if (ok) pendingDelete.value = null
}

function formatBytes(n?: number) {
  if (!n) return '—'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < u.length - 1) {
    v = v / 1024
    i = i + 1
  }
  return `${v.toFixed(1)} ${u[i]}`
}
</script>

<template>
  <UCard
    variant="subtle"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-search"
          class="size-4 text-muted"
        />
        <h3 class="font-semibold text-highlighted">
          Indexes
        </h3>
        <UBadge
          v-if="!isPending"
          color="neutral"
          variant="subtle"
          size="xs"
        >
          {{ indexes.length }}
        </UBadge>
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isPending && !indexes.length"
      class="divide-y divide-default"
    >
      <div
        v-for="i in 2"
        :key="i"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <USkeleton class="size-8 rounded-lg" />
        <USkeleton class="h-4 w-40 flex-1" />
      </div>
    </div>

    <ul
      v-else-if="indexes.length"
      class="divide-y divide-default"
    >
      <li
        v-for="idx in indexes"
        :key="idx.index_name"
        class="flex items-center gap-3 px-4 py-3 sm:px-5"
      >
        <div class="size-8 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <UIcon
            name="i-lucide-search"
            class="size-4 text-muted"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="font-mono text-sm text-highlighted truncate">
              {{ idx.index_name }}
            </p>
            <UBadge
              variant="subtle"
              size="xs"
              :color="idx.health === 'green' ? 'success' : idx.health === 'yellow' ? 'warning' : idx.health === 'red' ? 'error' : 'neutral'"
            >
              {{ idx.health ?? 'unknown' }}
            </UBadge>
          </div>
          <p class="text-muted text-xs">
            {{ idx.docs ?? 0 }} docs · {{ formatBytes(idx.size) }}
          </p>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Delete index ${idx.index_name}`"
          @click="pendingDelete = idx.index_name"
        />
      </li>
    </ul>

    <div
      v-else
      class="px-6 py-10 text-center text-sm text-muted"
    >
      No indexes
    </div>
  </UCard>

  <!-- Confirm delete -->
  <UModal
    v-model:open="confirmOpen"
    title="Delete index"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="`Delete “${pendingDelete}”?`"
        description="Every document in this index will be permanently removed. This cannot be undone."
      />
    </template>
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="confirmOpen = false"
      />
      <UButton
        label="Delete index"
        color="error"
        :loading="submitting"
        @click="confirmDelete"
      />
    </template>
  </UModal>
</template>
